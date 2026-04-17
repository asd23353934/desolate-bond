import { Room, Client, matchMaker } from '@colyseus/core';
import { LobbyState, PlayerSchema, EnemySchema, ItemSchema, ProjectileSchema } from '../../infrastructure/colyseus/LobbySchema.js';
import { generateUniqueCode } from '../../domain/entities/RoomCode.js';
import { verifyToken } from '../../infrastructure/auth/jwtRoom.js';
import { GameSessionRepository } from '../../infrastructure/repositories/GameSessionRepository.js';
import type { GameSession, PlayerResult } from '../../domain/entities/GameSession.js';
import type { PlayerInput } from '../../domain/entities/PlayerInput.js';
import { scaleBossStats } from '../../domain/entities/DifficultyScaling.js';
import type { ScaledBossStats } from '../../domain/entities/DifficultyScaling.js';
import { CLASS_STATS, DEFAULT_CLASS_STATS } from '../../domain/entities/ClassDefs.js';
import { ALL_SKILL_IDS, COOPERATIVE_SKILLS, STAT_BOOST_IDS } from '../../domain/entities/SkillPools.js';
import { drawSkillOptions, MAX_SKILL_LEVEL, MAX_WEAPON_LEVEL } from '../../domain/entities/SkillDraw.js';
import {
  EQUIPMENT_DEFS, WEAPON_DEF_IDS, PASSIVE_DEF_IDS, scaleModifiers, canClassEquip,
} from '../../domain/entities/EquipmentDefs.js';
import { BOSS_DEFS, BOSS_BY_ROUND } from '../../domain/entities/BossDefs.js';
import { BotController } from '../../domain/entities/BotController.js';

const BOT_NAMES = ['勇者Bot', '鐵壁Bot', '治癒Bot', '疾風Bot'];
const TOTAL_ROUNDS = 3;
const SELECTION_TIMEOUT_MS = 30_000;
const GAME_OVER_RESULT_DELAY_MS = 800;

export class GameRoom extends Room<LobbyState> {
  maxClients = 4;

  private sessionRepo = new GameSessionRepository();
  private gameSession: GameSession | null = null;
  private sessionStartedAt = 0;
  private inputBuffer = new Map<string, PlayerInput>();
  private currentBossStats: ScaledBossStats | null = null;
  private readonly DT = 60 / 1000;  // seconds per tick (matches setSimulationInterval 60ms)
  private regenAccum = new Map<string, number>();  // sessionId → accumulated fractional HP
  private attackCooldowns = new Map<string, number>();       // sessionId → ms remaining
  private coopSkillCooldowns = new Map<string, number>();     // `${sessionId}:${skillId}` → ms remaining
  private bossPatternCooldowns = new Map<string, number>();   // patternType → ms remaining
  private preBossSelections = new Map<string, boolean>();     // sessionId → hasSelected
  private postBossSelections = new Map<string, boolean>();    // sessionId → hasSelected
  private postBossOptions = new Map<string, string[]>();      // sessionId → 被 offer 的 3 個 rewardId（白名單）
  private botControllers = new Map<string, BotController>(); // botId → controller
  // 12.3: rescue progress per rescuer; reset if rescuer takes damage
  private rescueProgress = new Map<string, { targetId: string; ms: number }>();
  private survivalTimeLeftMs = 0;
  private xpTrickleAccum = 0;
  private lastDownedAt = new Map<string, number>();
  // Level-up queuing: prevents concurrent LEVEL_UP messages overwriting each other
  private awaitingLevelUpIds = new Set<string>();       // players currently viewing level-up UI
  private pendingLevelUpCounts = new Map<string, number>(); // extra level-ups queued behind current
  private pendingPreBossOfferIds = new Set<string>();   // players whose pre-boss offer waits until level-ups done
  private preBossSelectionStartedAt = 0;
  // Weapon pattern helpers
  private playerProjectileIds = new Set<string>();         // projectiles fired by players
  private prevPlayerPositions = new Map<string, { x: number; y: number }>(); // for FORTIFY
  private enemySlowUntil = new Map<string, number>();      // enemyId → Date.now() timestamp (STAFF slow)
  private shieldProjectiles = new Map<string, { phase: 'out' | 'back'; startX: number; startY: number; maxRange: number; hitEnemies: Set<string> }>();
  private orbitalProjectiles = new Map<string, { ownerId: string; angleOffset: number; spawnMs: number; ttlMs: number; radius: number; spinRate: number; hitHistory: Map<string, number> }>();

  async onCreate(_options: unknown) {
    this.setState(new LobbyState());
    this.setPatchRate(60);

    const code = generateUniqueCode((c) => this.isCodeActive(c));
    this.state.roomCode = code;
    this.setMetadata({ roomCode: code });

    this.onMessage('SELECT_CLASS', (client, message: { playerClass: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isBot) return;
      if (this.state.gameState !== 'LOBBY') return;  // 8.5: locked after game start
      const valid = ['TANK', 'DAMAGE', 'SUPPORT'];
      if (!valid.includes(message.playerClass)) return;
      player.selectedClass = message.playerClass;
    });

    this.onMessage('ADD_BOT', (client, message: { playerClass?: string }) => {
      const requester = this.state.players.get(client.sessionId);
      if (!requester?.isHost) return;

      const botCount = this.botCount();
      const humanCount = this.humanCount();
      if (botCount >= 3 || humanCount + botCount >= 4) return;

      const validClasses = ['TANK', 'DAMAGE', 'SUPPORT'];
      const botClass = validClasses.includes(message?.playerClass ?? '') ? message.playerClass! : this.randomClass();

      const bot = new PlayerSchema();
      bot.id = `bot_${crypto.randomUUID()}`;
      bot.displayName = BOT_NAMES[botCount] ?? `Bot ${botCount + 1}`;
      bot.isBot = true;
      bot.selectedClass = botClass;
      bot.isReady = true;
      bot.x = 800 + (botCount % 2 === 0 ? 80 : -80);
      bot.y = 600 + (botCount < 2 ? 80 : -80);
      this.state.players.set(bot.id, bot);
      this.botControllers.set(bot.id, new BotController());  // 11.1
    });

    this.onMessage('REMOVE_BOT', (client, message: { botId: string }) => {
      const requester = this.state.players.get(client.sessionId);
      if (!requester?.isHost) return;

      const target = this.state.players.get(message.botId);
      if (!target?.isBot) return;
      this.state.players.delete(message.botId);
      this.botControllers.delete(message.botId);
    });

    this.onMessage('START_GAME', async (client, _message: unknown) => {
      const requester = this.state.players.get(client.sessionId);
      if (!requester?.isHost) return;
      if (this.state.gameState !== 'LOBBY') return;

      const notReady = this.unreadyHumans();
      if (notReady.length > 0) {
        this.send(client, 'START_BLOCKED', { notReady });
        return;
      }

      this.gameSession = await this.sessionRepo.create(this.roomId, this.playerCount());
      this.sessionStartedAt = Date.now();
      this.state.currentRound = 1;
      this.applyClassStats();
      this.spawnInitialEnemies();
      this.spawnItems();
      this.startEliteSpawnTimer();
      this.startSurvivalPhase();
    });

    // SURVIVAL_PHASE_END is now triggered automatically by the server countdown (task 7.9)

    this.onMessage('RETURN_TO_LOBBY', (client, _msg: unknown) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isBot) return;
      if (this.state.gameState !== 'RESULT' && this.state.gameState !== 'GAME_OVER') return;
      this.resetToLobby();
    });

    this.onMessage('SELECT_SKILL', (client, message: { skillId: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isBot) return;
      if (!this.isValidSkillId(message.skillId)) return;
      this.applySkillSelection(player, message.skillId);
      this.awaitingLevelUpIds.delete(client.sessionId);
      this.dequeueNextLevelUp(client.sessionId);
    });

    this.onMessage('PLAYER_INPUT', (client, message: unknown) => {
      if (this.state.gameState !== 'SURVIVAL_PHASE' && this.state.gameState !== 'BOSS_BATTLE') return;
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isBot || player.isDown) return;
      if (!message || typeof message !== 'object') return;
      const { dx, dy, rescue } = message as { dx?: unknown; dy?: unknown; rescue?: unknown };
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
      this.inputBuffer.set(client.sessionId, {
        dx: Math.sign(dx as number),
        dy: Math.sign(dy as number),
        rescue: rescue === true,
      });
    });

    this.setSimulationInterval(() => this.tick(), 60);

    // 10.3: Player confirms skill selection during PRE_BOSS_SELECTION
    this.onMessage('SELECT_PRE_BOSS_SKILL', (client, message: { skillId: string }) => {
      if (this.state.gameState !== 'PRE_BOSS_SELECTION') return;
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isBot) return;
      if (!this.isValidSkillId(message.skillId)) return;
      if (!this.preBossSelections.has(client.sessionId)) return;  // not offered options

      this.applySkillSelection(player, message.skillId);
      this.preBossSelections.set(client.sessionId, true);
      this.broadcastPreBossWaiting();
      this.checkPreBossAllSelected();
    });

    // 10.4: Player confirms reward selection during POST_BOSS_SELECTION
    this.onMessage('SELECT_REWARD', (client, message: unknown) => {
      if (this.state.gameState !== 'POST_BOSS_SELECTION') return;
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isBot) return;
      if (!this.postBossSelections.has(client.sessionId)) return;
      if (this.postBossSelections.get(client.sessionId) === true) return;  // 已選過

      const rewardId = typeof message === 'object' && message !== null
        ? (message as { rewardId?: unknown }).rewardId
        : undefined;
      if (typeof rewardId !== 'string') return;

      // 白名單：rewardId 必須是本回合實際 offer 給此玩家的選項之一
      const offered = this.postBossOptions.get(client.sessionId);
      if (!offered || !offered.includes(rewardId)) return;

      // applyReward 會驗證武器/被動重複與槽位；失敗不標記 selected，玩家可再嘗試或超時自動
      if (!this.applyReward(client.sessionId, rewardId)) return;

      this.postBossSelections.set(client.sessionId, true);
      this.postBossOptions.delete(client.sessionId);
      this.checkPostBossAllSelected();
    });

    // 12.2: Downed player sends rescue ping — broadcast position indicator to active teammates
    this.onMessage('RESCUE_PING', (client, _message: unknown) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.isDown) return;
      this.broadcast('RESCUE_INDICATOR', { x: player.x, y: player.y, fromId: client.sessionId }, { except: client });
    });

    // 12.4: Downed player cycles to next active teammate's viewpoint
    this.onMessage('CYCLE_VIEW', (client, _message: unknown) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.isDown) return;
      const activeIds: string[] = [];
      for (const [id, p] of this.state.players) {
        if (!p.isDown && !p.isDisconnected) activeIds.push(id);
      }
      if (activeIds.length === 0) return;
      const currentIdx = activeIds.indexOf(player.spectatingId);
      player.spectatingId = activeIds[(currentIdx + 1) % activeIds.length]!;
    });
  }

  async onAuth(_client: Client, options: { token?: string }) {
    if (!options.token) throw new Error('UNAUTHORIZED');
    return verifyToken(options.token);
  }

  onJoin(client: Client, _options: unknown, auth: { sub: string; displayName?: string; username?: string; isGuest?: boolean }) {
    const player = new PlayerSchema();
    player.id = auth.sub;
    player.displayName = auth.username ?? auth.displayName ?? auth.sub;
    player.isGuest = auth.isGuest ?? false;
    player.isHost = this.humanCount() === 0;
    player.isBot = false;
    player.hp = 100;
    player.maxHp = 100;
    // Spawn near world center (800, 600) with slight offset per player index
    const idx = this.humanCount();
    player.x = 800 + (idx % 2 === 0 ? -60 : 60);
    player.y = 600 + (idx < 2 ? -40 : 40);
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client) {
    const leaving = this.state.players.get(client.sessionId);
    const activeGame = this.state.gameState !== 'LOBBY'
      && this.state.gameState !== 'RESULT'
      && this.state.gameState !== 'GAME_OVER';

    if (!leaving || leaving.isBot || !activeGame) {
      this.state.players.delete(client.sessionId);
      this.reassignHost();
      return;
    }

    // Active game: mark as disconnected and replace with Bot after 3 seconds
    leaving.isDisconnected = true;
    this.reassignHost();

    const snapshot = {
      displayName:   leaving.displayName,
      selectedClass: leaving.selectedClass,
      isDown:        leaving.isDown,
      x:             leaving.x,
      y:             leaving.y,
      hp:            leaving.hp,
      maxHp:         leaving.maxHp,
      xp:            leaving.xp,
      level:         leaving.level,
      skillIds:      leaving.skillIds.toArray(),
      weaponId:      leaving.weaponId,
      weaponLevel:   leaving.weaponLevel,
      weapon2Id:     leaving.weapon2Id,
      weapon2Level:  leaving.weapon2Level,
      weapon3Id:     leaving.weapon3Id,
      weapon3Level:  leaving.weapon3Level,
      weapon4Id:     leaving.weapon4Id,
      weapon4Level:  leaving.weapon4Level,
      weapon5Id:     leaving.weapon5Id,
      weapon5Level:  leaving.weapon5Level,
      passiveIds:    leaving.passiveIds.toArray(),
      passiveLevels: leaving.passiveLevels.toArray(),
    };

    this.clock.setTimeout(() => {
      this.state.players.delete(client.sessionId);

      const bot = new PlayerSchema();
      bot.id = `bot_${crypto.randomUUID()}`;
      bot.displayName = `${snapshot.displayName}(Bot)`;
      bot.isBot = true;
      bot.selectedClass = snapshot.selectedClass;
      bot.isDown        = snapshot.isDown;
      bot.x             = snapshot.x;
      bot.y             = snapshot.y;
      bot.hp            = snapshot.hp;
      bot.maxHp         = snapshot.maxHp;
      bot.xp            = snapshot.xp;
      bot.level         = snapshot.level;
      bot.isReady = true;
      // 6.4: inherit full state — skills and equipment (tasks 8–9)
      snapshot.skillIds.forEach(id => bot.skillIds.push(id));
      bot.weaponId    = snapshot.weaponId;
      bot.weaponLevel = snapshot.weaponLevel;
      bot.weapon2Id    = snapshot.weapon2Id;
      bot.weapon2Level = snapshot.weapon2Level;
      bot.weapon3Id    = snapshot.weapon3Id;
      bot.weapon3Level = snapshot.weapon3Level;
      bot.weapon4Id    = snapshot.weapon4Id;
      bot.weapon4Level = snapshot.weapon4Level;
      bot.weapon5Id    = snapshot.weapon5Id;
      bot.weapon5Level = snapshot.weapon5Level;
      snapshot.passiveIds.forEach(id => bot.passiveIds.push(id));
      snapshot.passiveLevels.forEach(lvl => bot.passiveLevels.push(lvl));
      this.state.players.set(bot.id, bot);
      this.botControllers.set(bot.id, new BotController());

      this.checkAllDowned();
    }, 3_000);
  }

  onDispose() {}

  /** 10.1/10.5: Spawn the round-appropriate boss with player-count-scaled stats. */
  private enterBossBattle(): void {
    const defId = BOSS_BY_ROUND[this.state.currentRound] ?? 'GOLEM';
    const def = BOSS_DEFS[defId]!;

    this.currentBossStats = scaleBossStats(def.baseHp, def.baseDamage, this.playerCount());
    this.bossPatternCooldowns.clear();

    const boss = this.state.boss;
    boss.id    = crypto.randomUUID();
    boss.defId = defId;
    boss.x     = 800;  // center spawn (world 1600×1200) — task 15 will adjust to tilemap
    boss.y     = 600;  // center spawn (world 1600×1200)
    boss.hp    = this.currentBossStats.maxHp;
    boss.maxHp = this.currentBossStats.maxHp;
    boss.phase = 1;

    this.state.gameState = 'BOSS_BATTLE';
    this.broadcast('BOSS_SPAWNED', { defId, round: this.state.currentRound });
  }

  /** 10.3: Begin PRE_BOSS_SELECTION — offer skill options to each human player. */
  private startPreBossSelection(): void {
    this.state.gameState = 'PRE_BOSS_SELECTION';
    this.preBossSelections.clear();
    this.pendingPreBossOfferIds.clear();
    this.preBossSelectionStartedAt = Date.now();
    // Clear all enemies and projectiles before boss battle to reduce state patch size
    this.state.enemies.clear();
    this.state.projectiles.clear();
    this.playerProjectileIds.clear();
    this.shieldProjectiles.clear();
    this.orbitalProjectiles.clear();
    this.enemySlowUntil.clear();

    for (const [sessionId, player] of this.state.players) {
      if (player.isBot) {
        // Bots auto-select immediately
        const opts = this.drawPlayerSkillOptions(player);
        if (opts.length > 0) this.applySkillSelection(player, opts[Math.floor(Math.random() * opts.length)]!);
        continue;
      }
      // Player mid-level-up: defer pre-boss offer until they finish selecting
      if (this.awaitingLevelUpIds.has(sessionId) || (this.pendingLevelUpCounts.get(sessionId) ?? 0) > 0) {
        this.pendingPreBossOfferIds.add(sessionId);
        this.preBossSelections.set(sessionId, false);  // mark as pending in tracker
        continue;
      }
      this.sendPreBossOffer(sessionId);
    }

    // Broadcast initial waiting status to all players
    this.broadcastPreBossWaiting(SELECTION_TIMEOUT_MS);

    this.clock.setTimeout(() => {
      if (this.state.gameState !== 'PRE_BOSS_SELECTION') return;
      // Auto-assign for players who did not select (including pending pre-boss offers)
      this.autoAssignPreBossSkills();
      this.enterBossBattle();
    }, SELECTION_TIMEOUT_MS);
  }

  /** Send pre-boss skill offer to a specific player. */
  private sendPreBossOffer(sessionId: string): void {
    const player = this.state.players.get(sessionId);
    if (!player || player.isBot) return;
    const options = this.drawPlayerSkillOptions(player);
    if (options.length === 0) {
      this.preBossSelections.set(sessionId, true);
      this.broadcastPreBossWaiting();
      this.checkPreBossAllSelected();
      return;
    }
    const ownedLevels = this.buildOwnedLevels(player);
    this.preBossSelections.set(sessionId, false);
    const client = this.clients.find(c => c.sessionId === sessionId);
    if (client) this.send(client, 'PRE_BOSS_SKILL_OPTIONS', {
      options, ownedLevels,
      weaponId: player.weaponId,   weaponLevel: player.weaponLevel,
      weapon2Id: player.weapon2Id, weapon2Level: player.weapon2Level,
      weapon3Id: player.weapon3Id, weapon3Level: player.weapon3Level,
      weapon4Id: player.weapon4Id, weapon4Level: player.weapon4Level,
      weapon5Id: player.weapon5Id, weapon5Level: player.weapon5Level,
    });
  }

  private autoAssignPreBossSkills(): void {
    // Auto-assign any players still mid-level-up (their pending level-ups + the current one)
    for (const sessionId of [...this.awaitingLevelUpIds, ...this.pendingPreBossOfferIds]) {
      this.autoAssignLevelUps(sessionId);
    }
    this.pendingPreBossOfferIds.clear();

    // Auto-assign unselected pre-boss skill options
    for (const [sessionId, selected] of this.preBossSelections) {
      if (selected) continue;
      const player = this.state.players.get(sessionId);
      if (!player) continue;
      const options = this.drawPlayerSkillOptions(player);
      if (options.length > 0) this.applySkillSelection(player, options[Math.floor(Math.random() * options.length)]!);
    }
  }

  /** Broadcast current pre-boss waiting status to all players. */
  private broadcastPreBossWaiting(timeLeft?: number): void {
    const waitingNames = [...this.preBossSelections.entries()]
      .filter(([, done]) => !done)
      .map(([sid]) => this.state.players.get(sid)?.displayName ?? '');
    const ms = timeLeft ?? Math.max(0, SELECTION_TIMEOUT_MS - (Date.now() - this.preBossSelectionStartedAt));
    this.broadcast('PRE_BOSS_WAITING', { waitingNames, timeLeft: ms });
  }

  /** Send the next queued level-up to the player if any are pending.
   *  After all level-ups are done, delivers a pending pre-boss offer if applicable. */
  private dequeueNextLevelUp(sessionId: string): void {
    const pending = this.pendingLevelUpCounts.get(sessionId) ?? 0;
    if (pending > 0) {
      const player = this.state.players.get(sessionId);
      if (!player) return;
      const client = this.clients.find(c => c.sessionId === sessionId);
      if (!client) return;
      this.pendingLevelUpCounts.set(sessionId, pending - 1);
      this.awaitingLevelUpIds.add(sessionId);
      this.sendLevelUpMessage(client, player);
      return;
    }
    // All level-ups done — check if a pre-boss offer is waiting
    if (this.state.gameState === 'PRE_BOSS_SELECTION' && this.pendingPreBossOfferIds.has(sessionId)) {
      this.pendingPreBossOfferIds.delete(sessionId);
      this.sendPreBossOffer(sessionId);
      this.broadcastPreBossWaiting();
    }
  }

  /** Build and send a LEVEL_UP message to a client based on current player state. */
  private sendLevelUpMessage(client: Client, player: PlayerSchema): void {
    const options = this.drawPlayerSkillOptions(player);
    if (options.length === 0) {
      this.awaitingLevelUpIds.delete(client.sessionId);
      this.dequeueNextLevelUp(client.sessionId);
      return;
    }
    this.send(client, 'LEVEL_UP', {
      level: player.level,
      options,
      ownedLevels: this.buildOwnedLevels(player),
      weaponId: player.weaponId,
      weaponLevel: player.weaponLevel,
      weapon2Id: player.weapon2Id,
      weapon2Level: player.weapon2Level,
      weapon3Id: player.weapon3Id,
      weapon3Level: player.weapon3Level,
      weapon4Id: player.weapon4Id,
      weapon4Level: player.weapon4Level,
      weapon5Id: player.weapon5Id,
      weapon5Level: player.weapon5Level,
    });
  }

  /** Auto-assign current + all queued level-ups for a player (used before phase transitions). */
  private autoAssignLevelUps(sessionId: string): void {
    const player = this.state.players.get(sessionId);
    if (!player || player.isBot) {
      this.awaitingLevelUpIds.delete(sessionId);
      this.pendingLevelUpCounts.delete(sessionId);
      return;
    }
    // Auto-assign the currently-shown selection
    if (this.awaitingLevelUpIds.has(sessionId)) {
      this.awaitingLevelUpIds.delete(sessionId);
      const opts = this.drawPlayerSkillOptions(player);
      if (opts.length > 0) this.applySkillSelection(player, opts[Math.floor(Math.random() * opts.length)]!);
    }
    // Auto-assign all queued pending level-ups
    const pending = this.pendingLevelUpCounts.get(sessionId) ?? 0;
    for (let i = 0; i < pending; i++) {
      const opts = this.drawPlayerSkillOptions(player);
      if (opts.length > 0) this.applySkillSelection(player, opts[Math.floor(Math.random() * opts.length)]!);
    }
    this.pendingLevelUpCounts.delete(sessionId);
  }

  /** 12.3: Proximity-based rescue — any active player near a downed teammate auto-revives them. */
  private processRescue(): void {
    const RESCUE_HITBOX_RADIUS = 40;   // px — slightly larger so it feels natural
    const RESCUE_DURATION_MS   = 2000; // ms to complete rescue
    const REVIVE_HP_FRACTION   = 0.3;  // restored HP = 30% of maxHp

    const activeRescuerIds = new Set<string>();

    for (const [rescuerId, rescuer] of this.state.players) {
      if (rescuer.isDown || rescuer.isDisconnected) continue;

      // Find nearest downed player in proximity range
      let nearestDownedId: string | null = null;
      let nearestDistSq = Infinity;
      for (const [targetId, target] of this.state.players) {
        if (!target.isDown || targetId === rescuerId) continue;
        const dx = target.x - rescuer.x;
        const dy = target.y - rescuer.y;
        const distSq = dx * dx + dy * dy;
        if (distSq <= RESCUE_HITBOX_RADIUS * RESCUE_HITBOX_RADIUS && distSq < nearestDistSq) {
          nearestDistSq = distSq;
          nearestDownedId = targetId;
        }
      }

      if (!nearestDownedId) {
        this.rescueProgress.delete(rescuerId);
        continue;
      }

      activeRescuerIds.add(rescuerId);
      const current = this.rescueProgress.get(rescuerId);
      if (current && current.targetId !== nearestDownedId) {
        this.rescueProgress.delete(rescuerId);
      }

      const progress = this.rescueProgress.get(rescuerId) ?? { targetId: nearestDownedId, ms: 0 };
      const reviveBoostLv = this.getSkillLevel(rescuer, 'REVIVE_BOOST');
      progress.ms += 60 * (1 + reviveBoostLv * 0.5); // +50% speed per level

      if (progress.ms >= RESCUE_DURATION_MS) {
        this.rescueProgress.delete(rescuerId);
        const target = this.state.players.get(nearestDownedId)!;
        target.isDown = false;
        target.spectatingId = '';
        target.hp = Math.max(1, Math.round(target.maxHp * REVIVE_HP_FRACTION));
        rescuer.rescueCount += 1;
        this.broadcast('PLAYER_REVIVED', { targetId: nearestDownedId, rescuerId });
      } else {
        this.rescueProgress.set(rescuerId, { ...progress, targetId: nearestDownedId });
        // Broadcast progress to all clients so they can show bar above the downed player
        this.broadcast('RESCUE_PROGRESS', {
          targetId: nearestDownedId,
          rescuerId,
          progress: progress.ms / RESCUE_DURATION_MS,
        });
      }
    }

    // Clear progress for rescuers who stepped away — broadcast 0 to reset client bar
    for (const [rescuerId, prog] of this.rescueProgress) {
      if (!activeRescuerIds.has(rescuerId)) {
        this.broadcast('RESCUE_PROGRESS', { targetId: prog.targetId, rescuerId, progress: 0 });
        this.rescueProgress.delete(rescuerId);
      }
    }
  }

  /** 11.1: Generate PlayerInput for each bot and add to inputBuffer (identical to human input path). */
  private processBotAI(): void {
    const boss = this.state.boss;
    const bossX = boss.id ? boss.x : null;
    const bossY = boss.id ? boss.y : null;

    const enemyPositions = [...this.state.enemies.values()].map(e => ({ x: e.x, y: e.y }));
    const projectiles = [...this.state.projectiles.values()].map(p => ({ x: p.x, y: p.y, angle: p.angle }));
    const downedTeammates: Array<{ x: number; y: number }> = [];

    // Human anchor positions for bot orbit
    const humanPositions: Array<{ x: number; y: number }> = [];
    for (const [, p] of this.state.players) {
      if (!p.isBot && !p.isDown && !p.isDisconnected) humanPositions.push({ x: p.x, y: p.y });
    }

    let botIndex = 0;
    for (const [botId, player] of this.state.players) {
      if (!player.isBot || player.isDisconnected) continue;

      downedTeammates.length = 0;
      for (const [otherId, other] of this.state.players) {
        if (otherId !== botId && other.isDown && !other.isDisconnected) {
          downedTeammates.push({ x: other.x, y: other.y });
        }
      }

      let controller = this.botControllers.get(botId);
      if (!controller) {
        controller = new BotController();
        this.botControllers.set(botId, controller);
      }

      const input = controller.tick({
        botX: player.x,
        botY: player.y,
        botIndex: botIndex++,
        bossX,
        bossY,
        enemyPositions,
        projectiles,
        downedTeammates: [...downedTeammates],
        humanPositions,
      });

      if (!player.isDown) {
        this.inputBuffer.set(botId, input);
      }
    }
  }

  private checkPreBossAllSelected(): void {
    const allDone = [...this.preBossSelections.values()].every(v => v);
    if (allDone) {
      this.enterBossBattle();
    }
  }

  /** 10.2/10.5/10.6: Process boss movement, attacks, and phase transition each tick. */
  private processBoss(): void {
    const boss = this.state.boss;
    if (!boss.id || boss.hp <= 0) return;

    const def = BOSS_DEFS[boss.defId];
    if (!def) return;

    const patterns = boss.phase === 2 ? def.phase2Patterns : def.phase1Patterns;
    const moveSpeed = boss.phase === 2 ? def.moveSpeedPhase2 : def.moveSpeedPhase1;

    // 10.2: Phase 2 transition at ≤50% HP
    if (boss.phase === 1 && boss.hp <= boss.maxHp / 2) {
      boss.phase = 2;
      this.broadcast('BOSS_PHASE_CHANGE', { phase: 2, defId: boss.defId });
    }

    // Move boss toward nearest non-downed player
    let nearestX = boss.x;
    let nearestY = boss.y;
    let nearestDist = Infinity;
    for (const [, player] of this.state.players) {
      if (player.isDown || player.isDisconnected) continue;
      const dx = player.x - boss.x;
      const dy = player.y - boss.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) { nearestDist = dist; nearestX = player.x; nearestY = player.y; }
    }
    if (nearestDist > 5) {
      const angle = Math.atan2(nearestY - boss.y, nearestX - boss.x);
      boss.x += Math.cos(angle) * moveSpeed * this.DT;
      boss.y += Math.sin(angle) * moveSpeed * this.DT;
    }

    // Execute attack patterns
    for (const pattern of patterns) {
      const key = pattern.type;
      const cd = this.bossPatternCooldowns.get(key) ?? 0;
      if (cd > 0) {
        this.bossPatternCooldowns.set(key, cd - 60);
        continue;
      }

      const scaledDamage = Math.round(
        pattern.damage * (this.currentBossStats?.damage ?? 1),
      );

      if (pattern.type === 'MELEE') {
        for (const [sessionId, player] of this.state.players) {
          if (player.isDown || player.isDisconnected) continue;
          const dx = player.x - boss.x;
          const dy = player.y - boss.y;
          if (dx * dx + dy * dy <= pattern.range * pattern.range) {
            this.damagePlayer(sessionId, scaledDamage);
          }
        }
        this.bossPatternCooldowns.set(key, pattern.cooldownMs);

      } else if (pattern.type === 'AREA') {
        for (const [sessionId, player] of this.state.players) {
          if (player.isDown || player.isDisconnected) continue;
          const dx = player.x - boss.x;
          const dy = player.y - boss.y;
          if (dx * dx + dy * dy <= (pattern.radius ?? pattern.range) ** 2) {
            this.damagePlayer(sessionId, scaledDamage);
          }
        }
        this.broadcast('BOSS_AREA_ATTACK', { x: boss.x, y: boss.y, radius: pattern.radius ?? pattern.range });
        this.bossPatternCooldowns.set(key, pattern.cooldownMs);

      } else if (pattern.type === 'PROJECTILE' || pattern.type === 'CHARGE') {
        // Aim at nearest player; projectile hits handled client-side visually,
        // server applies damage when player is within range at fire time (simplified)
        if (nearestDist <= pattern.range) {
          const angle = Math.atan2(nearestY - boss.y, nearestX - boss.x);
          const proj = new ProjectileSchema();
          proj.id    = crypto.randomUUID();
          proj.x     = boss.x;
          proj.y     = boss.y;
          proj.angle = angle;
          this.state.projectiles.set(proj.id, proj);
          // Remove projectile after travel time; deal damage if player still in path
          const travelMs = Math.ceil((pattern.range / (pattern.speed ?? 200)) * 1000);
          this.clock.setTimeout(() => {
            this.state.projectiles.delete(proj.id);
            // Damage players near the endpoint
            const endX = boss.x + Math.cos(angle) * pattern.range;
            const endY = boss.y + Math.sin(angle) * pattern.range;
            for (const [sessionId, player] of this.state.players) {
              if (player.isDown || player.isDisconnected) continue;
              const dx = player.x - endX;
              const dy = player.y - endY;
              if (dx * dx + dy * dy <= 30 * 30) {
                this.damagePlayer(sessionId, scaledDamage);
              }
            }
          }, travelMs);
        }
        this.bossPatternCooldowns.set(key, pattern.cooldownMs);
      }
    }
  }

  /** Reduce player HP with full skill mitigation chain (DODGE → BARRIER → TOUGH → SHIELD). */
  private damagePlayer(sessionId: string, rawAmount: number): void {
    const player = this.state.players.get(sessionId);
    if (!player || player.isDown || player.isDisconnected) return;

    // DODGE: full evasion (15% per level)
    const dodgeLv = this.getSkillLevel(player, 'DODGE');
    if (dodgeLv > 0 && Math.random() < dodgeLv * 0.15) return;

    // BARRIER: 20% per level chance to halve incoming damage
    const barrierLv = this.getSkillLevel(player, 'BARRIER');
    let amount = rawAmount;
    if (barrierLv > 0 && Math.random() < barrierLv * 0.20) amount = Math.ceil(amount / 2);

    // TOUGH: flat reduction 10% per level
    const toughLv = this.getSkillLevel(player, 'TOUGH');
    if (toughLv > 0) amount = Math.max(1, Math.round(amount * (1 - toughLv * 0.10)));

    // SHIELD: shieldHp absorbs first
    if (player.shieldHp > 0) {
      const absorbed = Math.min(player.shieldHp, amount);
      player.shieldHp -= absorbed;
      amount -= absorbed;
      if (amount <= 0) { this.rescueProgress.delete(sessionId); return; }
    }

    player.hp = Math.max(0, player.hp - amount);
    player.totalDamageTaken += amount;
    this.rescueProgress.delete(sessionId);

    // Notify client for SFX
    const client = this.clients.find(c => c.sessionId === sessionId);
    if (client) this.send(client, 'PLAYER_HURT', {});

    if (player.hp <= 0) this.downPlayer(sessionId);
  }

  /** 10.4: Begin POST_BOSS_SELECTION — offer 3 reward options to each human player. */
  private startPostBossSelection(): void {
    this.state.boss.id = '';  // clear boss
    this.state.gameState = 'POST_BOSS_SELECTION';
    this.postBossSelections.clear();
    this.postBossOptions.clear();

    for (const [sessionId, player] of this.state.players) {
      const availablePool = this.availableRewardPool(player);

      if (player.isBot) {
        // 11.6: Bot auto-selects a random available reward immediately
        if (availablePool.length > 0) {
          const reward = availablePool[Math.floor(Math.random() * availablePool.length)]!;
          this.applyReward(sessionId, reward);
        }
        continue;
      }

      // Pick up to 3 random distinct options from the *available* pool (排除已擁有的武器/被動)
      const shuffled = [...availablePool].sort(() => Math.random() - 0.5);
      const options = shuffled.slice(0, 3);
      this.postBossSelections.set(sessionId, false);
      this.postBossOptions.set(sessionId, options);
      const client = this.clients.find(c => c.sessionId === sessionId);
      if (client) this.send(client, 'POST_BOSS_REWARD_OPTIONS', { options });
    }

    this.clock.setTimeout(() => {
      if (this.state.gameState !== 'POST_BOSS_SELECTION') return;
      // Auto-assign random available passive for non-selecting players
      for (const [sessionId, selected] of this.postBossSelections) {
        if (selected) continue;
        const player = this.state.players.get(sessionId);
        if (!player) continue;
        const owned = new Set(player.passiveIds.toArray());
        const pool = PASSIVE_DEF_IDS.filter(id => !owned.has(id)).map(id => `PASSIVE:${id}`);
        if (pool.length === 0) continue;
        const reward = pool[Math.floor(Math.random() * pool.length)]!;
        this.applyReward(sessionId, reward);
      }
      this.advanceAfterPostBoss();
    }, SELECTION_TIMEOUT_MS);
  }

  /** 回傳該玩家此刻仍可獲取的獎勵清單（排除已擁有武器、已擁有被動、已滿槽者）。 */
  private availableRewardPool(player: PlayerSchema): string[] {
    const pool: string[] = [];
    const ownedWeapons = new Set(
      [player.weaponId, player.weapon2Id, player.weapon3Id, player.weapon4Id, player.weapon5Id].filter(w => w) as string[],
    );
    const weaponSlotsFull = !!(player.weaponId && player.weapon2Id && player.weapon3Id && player.weapon4Id && player.weapon5Id);
    if (!weaponSlotsFull) {
      for (const id of WEAPON_DEF_IDS) {
        const def = EQUIPMENT_DEFS[id];
        if (!def || !canClassEquip(def, player.selectedClass)) continue;
        if (!ownedWeapons.has(id)) pool.push(`WEAPON:${id}`);
      }
    }
    if (player.passiveIds.length < 4) {
      const ownedPassives = new Set(player.passiveIds.toArray());
      for (const id of PASSIVE_DEF_IDS) {
        if (!ownedPassives.has(id)) pool.push(`PASSIVE:${id}`);
      }
    }
    return pool;
  }

  /** 套用獎勵到玩家。成功回 true；若重複或槽位已滿回 false，呼叫端應據此決定是否標記 selected。 */
  private applyReward(sessionId: string, rewardId: string): boolean {
    const player = this.state.players.get(sessionId);
    if (!player) return false;

    const [type, defId] = rewardId.split(':') as [string, string];
    if (!type || !defId) return false;

    if (type === 'WEAPON') {
      // 拒絕非本職業武器
      const def = EQUIPMENT_DEFS[defId];
      if (!def || !canClassEquip(def, player.selectedClass)) return false;
      // 拒絕重複武器（任一 slot 已持有相同 defId）
      if (
        player.weaponId === defId || player.weapon2Id === defId || player.weapon3Id === defId ||
        player.weapon4Id === defId || player.weapon5Id === defId
      ) {
        return false;
      }
      if (!player.weaponId) {
        player.weaponId    = defId;
        player.weaponLevel = 0;
      } else if (!player.weapon2Id) {
        player.weapon2Id    = defId;
        player.weapon2Level = 0;
      } else if (!player.weapon3Id) {
        player.weapon3Id    = defId;
        player.weapon3Level = 0;
      } else if (!player.weapon4Id) {
        player.weapon4Id    = defId;
        player.weapon4Level = 0;
      } else if (!player.weapon5Id) {
        player.weapon5Id    = defId;
        player.weapon5Level = 0;
      } else {
        return false;  // 5 槽全滿
      }
      player.maxHp = this.getEffectiveStats(player).maxHp;
      return true;
    }

    if (type === 'PASSIVE') {
      // 拒絕重複被動
      if (player.passiveIds.toArray().includes(defId)) return false;
      if (player.passiveIds.length >= 4) return false;
      player.passiveIds.push(defId);
      player.passiveLevels.push(0);
      player.maxHp = this.getEffectiveStats(player).maxHp;
      return true;
    }

    return false;
  }

  private checkPostBossAllSelected(): void {
    const allDone = [...this.postBossSelections.values()].every(v => v);
    if (allDone) this.advanceAfterPostBoss();
  }

  private tick(): void {
    if (this.state.gameState !== 'SURVIVAL_PHASE' && this.state.gameState !== 'BOSS_BATTLE') return;
    this.processBotAI();       // 11.1: generate bot inputs before movement
    this.processMovement();
    this.processEnemyAI();     // move enemies toward nearest player
    this.processProjectiles(); // move ranged-enemy projectiles and check collision
    this.processRescue();      // 12.3: rescue mechanic
    this.processItemPickup();  // 9.2: auto-pickup on overlap
    this.processAutoAttack();
    this.processCoopSkills();
    if (this.state.gameState === 'SURVIVAL_PHASE') this.tickSurvivalTimer();
    if (this.state.gameState === 'BOSS_BATTLE') this.processBoss();
    this.inputBuffer.clear();
  }

  private tickSurvivalTimer(): void {
    this.survivalTimeLeftMs -= 60;
    const seconds = Math.ceil(this.survivalTimeLeftMs / 1000);
    if (this.state.survivalTimeLeft !== seconds) {
      this.state.survivalTimeLeft = Math.max(0, seconds);
    }

    // Survival XP trickle: 2 XP every 3 seconds to all alive players
    this.xpTrickleAccum += 60;
    if (this.xpTrickleAccum >= 3000) {
      this.xpTrickleAccum = 0;
      for (const [sid, p] of this.state.players) {
        if (!p.isDown && !p.isDisconnected) this.grantXp(sid, 2);
      }
    }

    if (this.survivalTimeLeftMs <= 0) {
      this.startPreBossSelection();  // 10.3: sends skill options before entering boss battle
    }
  }

  private restoreHp(sessionId: string, amount: number): void {
    const player = this.state.players.get(sessionId);
    if (!player || player.isDown) return;
    const healBonus = this.getEffectiveStats(player).healBonus;  // 9.4: includes equipment bonus
    player.hp = Math.min(player.maxHp, player.hp + Math.round(amount * healBonus));
  }

  /** Returns current level (1–MAX) of a skill for a player; 0 if not owned. */
  private getSkillLevel(player: PlayerSchema, skillId: string): number {
    const idx = player.skillIds.toArray().indexOf(skillId);
    return idx >= 0 ? (player.skillLevels[idx] ?? 1) : 0;
  }

  /** Grant a skill or upgrade it if already owned. Handles new-skill init + HEAL instant HP. */
  private applySkillSelection(player: PlayerSchema, skillId: string): void {
    // Class-aware acquisition guard shared by all slot branches
    const isAcquirable = (wid: string): boolean => {
      const def = EQUIPMENT_DEFS[wid];
      return !!def && WEAPON_DEF_IDS.includes(wid) && canClassEquip(def, player.selectedClass);
    };
    // Slot-2 weapon acquisition: "W2:SWORD" etc.
    if (skillId.startsWith('W2:')) {
      const wid = skillId.slice(3);
      if (isAcquirable(wid) && player.weaponId && !player.weapon2Id) {
        player.weapon2Id = wid;
        player.weapon2Level = 0;
        player.maxHp = this.getEffectiveStats(player).maxHp;
      }
      return;
    }
    // Slot-3 weapon acquisition: "W3:SWORD" etc.
    if (skillId.startsWith('W3:')) {
      const wid = skillId.slice(3);
      if (isAcquirable(wid) && player.weaponId && player.weapon2Id && !player.weapon3Id) {
        player.weapon3Id = wid;
        player.weapon3Level = 0;
        player.maxHp = this.getEffectiveStats(player).maxHp;
      }
      return;
    }
    // Slot-4 weapon acquisition
    if (skillId.startsWith('W4:')) {
      const wid = skillId.slice(3);
      if (isAcquirable(wid) && player.weaponId && player.weapon2Id && player.weapon3Id && !player.weapon4Id) {
        player.weapon4Id = wid;
        player.weapon4Level = 0;
        player.maxHp = this.getEffectiveStats(player).maxHp;
      }
      return;
    }
    // Slot-5 weapon acquisition
    if (skillId.startsWith('W5:')) {
      const wid = skillId.slice(3);
      if (isAcquirable(wid) && player.weaponId && player.weapon2Id && player.weapon3Id && player.weapon4Id && !player.weapon5Id) {
        player.weapon5Id = wid;
        player.weapon5Level = 0;
        player.maxHp = this.getEffectiveStats(player).maxHp;
      }
      return;
    }
    // Slot-2 weapon upgrade
    if (skillId === 'WEAPON2_LEVEL') {
      if (player.weapon2Id && player.weapon2Level < MAX_WEAPON_LEVEL) {
        player.weapon2Level += 1;
        player.maxHp = this.getEffectiveStats(player).maxHp;
      }
      return;
    }
    // Slot-3 weapon upgrade
    if (skillId === 'WEAPON3_LEVEL') {
      if (player.weapon3Id && player.weapon3Level < MAX_WEAPON_LEVEL) {
        player.weapon3Level += 1;
        player.maxHp = this.getEffectiveStats(player).maxHp;
      }
      return;
    }
    // Slot-4 weapon upgrade
    if (skillId === 'WEAPON4_LEVEL') {
      if (player.weapon4Id && player.weapon4Level < MAX_WEAPON_LEVEL) {
        player.weapon4Level += 1;
        player.maxHp = this.getEffectiveStats(player).maxHp;
      }
      return;
    }
    // Slot-5 weapon upgrade
    if (skillId === 'WEAPON5_LEVEL') {
      if (player.weapon5Id && player.weapon5Level < MAX_WEAPON_LEVEL) {
        player.weapon5Level += 1;
        player.maxHp = this.getEffectiveStats(player).maxHp;
      }
      return;
    }
    // Slot-1 weapon acquisition — player selects a weapon for the first time
    if (WEAPON_DEF_IDS.includes(skillId)) {
      if (!isAcquirable(skillId)) return;
      player.weaponId = skillId;
      player.weaponLevel = 0;
      player.maxHp = this.getEffectiveStats(player).maxHp;
      return;
    }
    // Slot-1 weapon upgrade
    if (skillId === 'WEAPON_LEVEL') {
      if (player.weaponId && player.weaponLevel < MAX_WEAPON_LEVEL) {
        player.weaponLevel += 1;
        player.maxHp = this.getEffectiveStats(player).maxHp;
      }
      return;
    }

    const ids    = player.skillIds.toArray();
    const levels = player.skillLevels.toArray();
    const idx    = ids.indexOf(skillId);
    const isStatBoost = (STAT_BOOST_IDS as readonly string[]).includes(skillId);
    if (idx >= 0) {
      // Upgrade existing skill (stat boosts have no cap)
      const cur = levels[idx] ?? 1;
      if (isStatBoost || cur < MAX_SKILL_LEVEL) player.skillLevels[idx] = cur + 1;
    } else {
      // New skill — need a free slot (expanded to 8, stat boosts share the pool)
      if (player.skillIds.length >= 8) return;
      player.skillIds.push(skillId);
      player.skillLevels.push(1);
    }
    // HEAL: instant HP restore on acquire/upgrade
    if (skillId === 'HEAL') {
      const lv = this.getSkillLevel(player, 'HEAL');
      player.hp = Math.min(player.maxHp, player.hp + 20 * lv);
    }
    // Recalculate maxHp when a stat-affecting skill is gained
    player.maxHp = this.getEffectiveStats(player).maxHp;
  }

  /** Draws skill options for a player, including all five weapon slots. */
  private drawPlayerSkillOptions(player: PlayerSchema, count = 3): string[] {
    const hasAllSlots = player.weaponId && player.weapon2Id && player.weapon3Id && player.weapon4Id && player.weapon5Id;
    const availableWeapons = hasAllSlots
      ? []
      : WEAPON_DEF_IDS.filter(id => {
          const def = EQUIPMENT_DEFS[id];
          return def && canClassEquip(def, player.selectedClass);
        });
    return drawSkillOptions(
      player.selectedClass,
      player.skillIds.toArray(),
      player.skillLevels.toArray(),
      count,
      player.weaponId,
      player.weaponLevel,
      availableWeapons,
      player.weapon2Id,
      player.weapon2Level,
      player.weapon3Id,
      player.weapon3Level,
      player.weapon4Id,
      player.weapon4Level,
      player.weapon5Id,
      player.weapon5Level,
    );
  }

  /** Returns true if skillId is a valid selection option (skill, weapon acquire, or weapon upgrade). */
  private isValidSkillId(skillId: string): boolean {
    if (ALL_SKILL_IDS.has(skillId)) return true;
    if (WEAPON_DEF_IDS.includes(skillId)) return true;
    if (skillId === 'WEAPON_LEVEL' || skillId === 'WEAPON2_LEVEL' || skillId === 'WEAPON3_LEVEL' ||
        skillId === 'WEAPON4_LEVEL' || skillId === 'WEAPON5_LEVEL') return true;
    if (skillId.startsWith('W2:') && WEAPON_DEF_IDS.includes(skillId.slice(3))) return true;
    if (skillId.startsWith('W3:') && WEAPON_DEF_IDS.includes(skillId.slice(3))) return true;
    if (skillId.startsWith('W4:') && WEAPON_DEF_IDS.includes(skillId.slice(3))) return true;
    if (skillId.startsWith('W5:') && WEAPON_DEF_IDS.includes(skillId.slice(3))) return true;
    return false;
  }

  /** Build ownedLevels map to send to client (skillId → current level). */
  private buildOwnedLevels(player: PlayerSchema): Record<string, number> {
    const result: Record<string, number> = {};
    player.skillIds.toArray().forEach((id, i) => {
      result[id] = player.skillLevels[i] ?? 1;
    });
    return result;
  }

  /** Grant kill XP to the killer and share 50% with active teammates within 300 px. */
  private shareKillXp(killerId: string, xpReward: number): void {
    this.grantXp(killerId, xpReward);
    const killer = this.state.players.get(killerId);
    if (!killer) return;
    const SHARE_RADIUS_SQ = 300 * 300;
    for (const [sid, p] of this.state.players) {
      if (sid === killerId || p.isDown || p.isDisconnected) continue;
      const dx = p.x - killer.x;
      const dy = p.y - killer.y;
      if (dx * dx + dy * dy <= SHARE_RADIUS_SQ) {
        this.grantXp(sid, Math.floor(xpReward * 0.5));
      }
    }
  }

  private grantXp(sessionId: string, amount: number): void {
    const player = this.state.players.get(sessionId);
    if (!player) return;

    player.xp += amount;
    // Gentle cumulative growth: ~80 at lv1, ~107 at lv5, ~143 at lv10, ~257 at lv20, ~460 at lv30
    const threshold = Math.floor(80 * Math.pow(1.06, player.level - 1));

    if (player.xp >= threshold) {
      player.xp -= threshold;
      player.level += 1;

      if (player.isBot) {
        const options = this.drawPlayerSkillOptions(player);
        if (options.length > 0) this.applySkillSelection(player, options[Math.floor(Math.random() * options.length)]!);
        return;
      }

      const client = this.clients.find((c) => c.sessionId === sessionId);
      if (!client) return;

      if (this.awaitingLevelUpIds.has(sessionId)) {
        // Player is already viewing a skill selection — queue this level-up
        this.pendingLevelUpCounts.set(sessionId, (this.pendingLevelUpCounts.get(sessionId) ?? 0) + 1);
      } else {
        this.awaitingLevelUpIds.add(sessionId);
        this.sendLevelUpMessage(client, player);
      }
    }
  }

  // Enemies spawn from outside the map edges and walk inward.
  // World: 1600×1200.  Spawn positions are just beyond each edge.
  private static randomEdgeSpawn(): { x: number; y: number } {
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: return { x: 80 + Math.random() * 1440, y: -30 };           // top
      case 1: return { x: 80 + Math.random() * 1440, y: 1230 };          // bottom
      case 2: return { x: -30,  y: 80 + Math.random() * 1040 };          // left
      default: return { x: 1630, y: 80 + Math.random() * 1040 };         // right
    }
  }

  // Legacy pool kept for any code that still references SPAWN_NODES directly.
  private static readonly SPAWN_NODES = [
    { x: 200, y: 160 }, { x: 500, y: 160 }, { x: 800, y: 160 }, { x: 1100, y: 160 }, { x: 1400, y: 160 },
    { x: 200, y: 400 }, { x: 500, y: 400 }, { x: 800, y: 400 }, { x: 1100, y: 400 }, { x: 1400, y: 400 },
    { x: 200, y: 640 }, { x: 500, y: 640 }, { x: 800, y: 640 }, { x: 1100, y: 640 }, { x: 1400, y: 640 },
    { x: 200, y: 880 }, { x: 500, y: 880 }, { x: 800, y: 880 }, { x: 1100, y: 880 }, { x: 1400, y: 880 },
    { x: 200, y: 1040 },{ x: 500, y: 1040 },{ x: 800, y: 1040 },{ x: 1100, y: 1040 },{ x: 1400, y: 1040 },
  ];

  private startSurvivalPhase(): void {
    const SURVIVAL_DURATION_MS = 3 * 60 * 1000;  // 3 minutes (design doc suggestion)
    this.survivalTimeLeftMs = SURVIVAL_DURATION_MS;
    this.xpTrickleAccum = 0;
    this.state.survivalTimeLeft = SURVIVAL_DURATION_MS / 1000;
    this.state.gameState = 'SURVIVAL_PHASE';
  }

  private startEliteSpawnTimer(): void {
    const ELITE_INTERVAL_MS = 90_000;
    this.clock.setInterval(() => {
      if (this.state.gameState !== 'SURVIVAL_PHASE') return;
      this.spawnEliteEnemy();
    }, ELITE_INTERVAL_MS);
  }

  private spawnEliteEnemy(): void {
    const pos = GameRoom.randomEdgeSpawn();
    const elite = new EnemySchema();
    elite.id    = crypto.randomUUID();
    elite.type  = 'elite';
    elite.x     = pos.x;
    elite.y     = pos.y;
    const eliteHp = 400 + (this.state.currentRound - 1) * 120;  // R1:400, R2:520, R3:640…
    elite.maxHp = eliteHp;
    elite.hp    = eliteHp;
    this.state.enemies.set(elite.id, elite);
  }

  private spawnItems(): void {
    const ITEM_TYPES: Array<ItemSchema['type']> = [
      'HEALTH_PACK', 'HEALTH_PACK',
      'WEAPON', 'WEAPON',
      'PASSIVE', 'PASSIVE',
      'UPGRADE_STONE',
    ];

    // Shuffle node pool and assign one node per item (no overlap)
    const nodes = [...GameRoom.SPAWN_NODES].sort(() => Math.random() - 0.5);

    ITEM_TYPES.forEach((type, i) => {
      const node = nodes[i];
      if (!node) return;
      const item = new ItemSchema();
      item.id   = crypto.randomUUID();
      item.type = type;
      item.x    = node.x;
      item.y    = node.y;
      // Assign a random definition ID for equipment items (9.1/6.6: clients look up stats by defId)
      if (type === 'WEAPON') {
        item.defId = WEAPON_DEF_IDS[Math.floor(Math.random() * WEAPON_DEF_IDS.length)]!;
      } else if (type === 'PASSIVE') {
        item.defId = PASSIVE_DEF_IDS[Math.floor(Math.random() * PASSIVE_DEF_IDS.length)]!;
      }
      this.state.items.set(item.id, item);
    });
  }

  /** 9.4: Returns effective stats for a player after applying class base + equipment + skill bonuses. */
  private getEffectiveStats(player: PlayerSchema): {
    maxHp: number; attackDamage: number; speed: number; healBonus: number; attackRange: number;
  } {
    const base = CLASS_STATS[player.selectedClass] ?? DEFAULT_CLASS_STATS;

    // Class-based attack range: DAMAGE and SUPPORT are ranged, TANK is melee
    let baseRange = 80;
    if (player.selectedClass === 'DAMAGE')  baseRange = 200;
    if (player.selectedClass === 'SUPPORT') baseRange = 220;

    const result = { ...base, attackRange: baseRange };

    // Skill bonuses — all scale with level (lv=0 means not owned)
    const lv = (id: string) => this.getSkillLevel(player, id);
    if (lv('IRON_SKIN'))  result.maxHp        += 40  * lv('IRON_SKIN');
    if (lv('POWER_UP'))   result.attackDamage += 5   * lv('POWER_UP');
    if (lv('SWIFT_FEET')) { result.speed += 30 * lv('SWIFT_FEET'); result.attackDamage -= 3 * lv('SWIFT_FEET'); }
    if (lv('SPEED_UP'))   result.speed        += 20  * lv('SPEED_UP');
    if (lv('HEAL'))       result.healBonus    += 0.2 * lv('HEAL');
    // Repeatable stat boosts (active after all other skills/weapons are maxed)
    if (lv('STAT_HP'))    result.maxHp        += 15  * lv('STAT_HP');
    if (lv('STAT_ATK'))   result.attackDamage += 3   * lv('STAT_ATK');
    if (lv('STAT_SPD'))   result.speed        += 10  * lv('STAT_SPD');
    // TOUGH, DODGE, BARRIER handled in damagePlayer; SHIELD via shieldHp; FORTIFY per-tick; TAUNT in AI

    const weaponSlots: Array<[string, number]> = [
      [player.weaponId,  player.weaponLevel],
      [player.weapon2Id, player.weapon2Level],
      [player.weapon3Id, player.weapon3Level],
      [player.weapon4Id, player.weapon4Level],
      [player.weapon5Id, player.weapon5Level],
    ];
    for (const [wid, wLv] of weaponSlots) {
      if (!wid || !EQUIPMENT_DEFS[wid]) continue;
      const mods = scaleModifiers(EQUIPMENT_DEFS[wid]!.modifiers, wLv);
      result.maxHp        += mods.maxHp        ?? 0;
      result.attackDamage += mods.attackDamage ?? 0;
      result.speed        += mods.speed        ?? 0;
      result.healBonus    += mods.healBonus    ?? 0;
      result.attackRange  += mods.attackRange  ?? 0;
    }

    for (let i = 0; i < player.passiveIds.length; i++) {
      const defId = player.passiveIds[i];
      const level = player.passiveLevels[i] ?? 0;
      if (!defId || !EQUIPMENT_DEFS[defId]) continue;
      const mods = scaleModifiers(EQUIPMENT_DEFS[defId]!.modifiers, level);
      result.maxHp        += mods.maxHp        ?? 0;
      result.attackDamage += mods.attackDamage ?? 0;
      result.speed        += mods.speed        ?? 0;
      result.healBonus    += mods.healBonus    ?? 0;
      result.attackRange  += mods.attackRange  ?? 0;
    }

    return result;
  }

  /** 9.3: Upgrades the highest-level item in inventory. Tie-break: weapon (slot 0) before passives. */
  private applyUpgradeStone(player: PlayerSchema): void {
    let bestLevel = -1;
    let bestSlot = -1;  // -1 = none; 0 = weapon; 1..4 = passiveIds[slot-1]

    if (player.weaponId) {
      if (player.weaponLevel > bestLevel) { bestLevel = player.weaponLevel; bestSlot = 0; }
    }
    for (let i = 0; i < player.passiveIds.length; i++) {
      const lvl = player.passiveLevels[i] ?? 0;
      if (lvl > bestLevel) { bestLevel = lvl; bestSlot = i + 1; }
    }

    if (bestSlot === 0) {
      player.weaponLevel += 1;
    } else if (bestSlot > 0) {
      const idx = bestSlot - 1;
      player.passiveLevels[idx] = (player.passiveLevels[idx] ?? 0) + 1;
    }
    // If no items, stone is consumed with no effect
  }

  /** 9.2: Check every active player against every map item; auto-pickup on overlap. */
  private processItemPickup(): void {
    const PICKUP_RADIUS = 20;  // pixels

    for (const [sessionId, player] of this.state.players) {
      if (player.isDown || player.isDisconnected) continue;

      for (const [itemId, item] of this.state.items) {
        const dx = item.x - player.x;
        const dy = item.y - player.y;
        if (dx * dx + dy * dy > PICKUP_RADIUS * PICKUP_RADIUS) continue;

        // Overlapping — attempt pickup
        if (item.type === 'HEALTH_PACK') {
          this.restoreHp(sessionId, 30);
          this.state.items.delete(itemId);

        } else if (item.type === 'WEAPON') {
          // Skip pickup when weapon isn't equippable by this class — item stays on ground
          const def = EQUIPMENT_DEFS[item.defId];
          if (!def || !canClassEquip(def, player.selectedClass)) continue;
          // 9.2: always replace existing weapon
          player.weaponId    = item.defId;
          player.weaponLevel = 0;  // new pickup starts at base level
          this.state.items.delete(itemId);
          // 9.4: update maxHp if it changed (don't touch current hp)
          player.maxHp = this.getEffectiveStats(player).maxHp;

        } else if (item.type === 'PASSIVE') {
          // 9.2: blocked when all 4 passive slots are full
          if (player.passiveIds.length < 4) {
            player.passiveIds.push(item.defId);
            player.passiveLevels.push(0);
            this.state.items.delete(itemId);
            // 9.4: update maxHp if passive grants it
            player.maxHp = this.getEffectiveStats(player).maxHp;
          }
          // else: item stays on ground — player keeps walking past it

        } else if (item.type === 'UPGRADE_STONE') {
          this.applyUpgradeStone(player);
          this.state.items.delete(itemId);
          // 9.4: upgrade may boost stats (e.g. shield_charm maxHp increases)
          player.maxHp = this.getEffectiveStats(player).maxHp;
        }
      }
    }
  }

  /** Chase/shoot the nearest active player, apply contact damage, push-apart collision. */
  private processEnemyAI(): void {
    const round = this.state.currentRound;
    const BASIC_SPEED   = 65 + (round - 1) * 5;  // px/s; R1:65, R2:70, R3:75…
    const ELITE_SPEED   = 95 + (round - 1) * 5;
    const RANGED_SPEED  = 45 + (round - 1) * 3;
    const WALL = 32 + 10;       // world border + half-sprite
    const CONTACT_RANGE     = 20;    // px — melee contact distance
    const RANGED_ATTACK_DIST = 200;  // px — ranged enemy preferred attack distance
    const MELEE_DAMAGE       = 6;    // per 60ms tick contact (~100 DPS)
    const ELITE_DAMAGE       = 10;   // (~167 DPS)
    const RANGED_DAMAGE      = 6;
    const RANGED_PROJ_SPEED  = 300;  // px/s — enemy projectile travel speed
    const PUSH_APART_RADIUS  = 22;   // px — enemy-enemy separation

    // Collect active player positions and IDs
    const targets: { x: number; y: number; id: string }[] = [];
    for (const [id, p] of this.state.players) {
      if (!p.isDown && !p.isDisconnected) targets.push({ x: p.x, y: p.y, id });
    }

    const enemyArr = [...this.state.enemies.values()];
    const nowMs = Date.now();
    const slowMult = (eid: string): number => (this.enemySlowUntil.get(eid) ?? 0) > nowMs ? 0.6 : 1;

    for (const enemy of enemyArr) {
      const slow = slowMult(enemy.id);
      // Find nearest player
      let nearestDist = Infinity;
      let nearestTarget: { x: number; y: number; id: string } | null = null;
      for (const t of targets) {
        const d = Math.sqrt((t.x - enemy.x) ** 2 + (t.y - enemy.y) ** 2);
        if (d < nearestDist) { nearestDist = d; nearestTarget = t; }
      }
      if (!nearestTarget) continue;

      const dx = nearestTarget.x - enemy.x;
      const dy = nearestTarget.y - enemy.y;

      // Ranged enemies: keep distance and fire projectile damage when in range
      if (enemy.type === 'ranged') {
        if (nearestDist > RANGED_ATTACK_DIST + 20) {
          // Close the gap
          const inv = 1 / nearestDist;
          enemy.x = Math.max(WALL, Math.min(1600 - WALL, enemy.x + dx * inv * RANGED_SPEED * slow * this.DT));
          enemy.y = Math.max(WALL, Math.min(1200 - WALL, enemy.y + dy * inv * RANGED_SPEED * slow * this.DT));
        } else if (nearestDist < RANGED_ATTACK_DIST - 20) {
          // Back away
          const inv = 1 / nearestDist;
          enemy.x = Math.max(WALL, Math.min(1600 - WALL, enemy.x - dx * inv * RANGED_SPEED * slow * this.DT));
          enemy.y = Math.max(WALL, Math.min(1200 - WALL, enemy.y - dy * inv * RANGED_SPEED * slow * this.DT));
        }
        // Fire every ~1.5 seconds via attackCooldowns (re-use same map)
        const rCooldown = this.attackCooldowns.get(`enemy:${enemy.id}`) ?? 0;
        if (rCooldown <= 0 && nearestDist <= RANGED_ATTACK_DIST + 40) {
          this.attackCooldowns.set(`enemy:${enemy.id}`, 1500);
          // Spawn a real projectile — damage applied on collision, not instantly
          const angle = Math.atan2(dy, dx);
          const proj = new ProjectileSchema();
          proj.id     = crypto.randomUUID();
          proj.x      = enemy.x;
          proj.y      = enemy.y;
          proj.angle  = angle;
          proj.vx     = Math.cos(angle) * RANGED_PROJ_SPEED;
          proj.vy     = Math.sin(angle) * RANGED_PROJ_SPEED;
          proj.damage = RANGED_DAMAGE;
          this.state.projectiles.set(proj.id, proj);
        } else {
          this.attackCooldowns.set(`enemy:${enemy.id}`, Math.max(0, rCooldown - 60));
        }
      } else {
        // Melee movement: chase player
        if (nearestDist >= 12) {
          const inv = 1 / nearestDist;
          const speed = enemy.type === 'elite' ? ELITE_SPEED : BASIC_SPEED;
          enemy.x = Math.max(WALL, Math.min(1600 - WALL, enemy.x + dx * inv * speed * slow * this.DT));
          enemy.y = Math.max(WALL, Math.min(1200 - WALL, enemy.y + dy * inv * speed * slow * this.DT));
        }
        // Contact damage
        if (nearestDist <= CONTACT_RANGE) {
          const dmg = enemy.type === 'elite' ? ELITE_DAMAGE : MELEE_DAMAGE;
          // Throttle: use attackCooldowns keyed by enemy id
          const eCooldown = this.attackCooldowns.get(`enemy:${enemy.id}`) ?? 0;
          if (eCooldown <= 0) {
            this.attackCooldowns.set(`enemy:${enemy.id}`, 1200);
            this.damagePlayer(nearestTarget.id, dmg);
          } else {
            this.attackCooldowns.set(`enemy:${enemy.id}`, Math.max(0, eCooldown - 60));
          }
        } else {
          const eCooldown = this.attackCooldowns.get(`enemy:${enemy.id}`) ?? 0;
          if (eCooldown > 0) this.attackCooldowns.set(`enemy:${enemy.id}`, Math.max(0, eCooldown - 60));
        }
      }
    }

    // Enemy-to-enemy push-apart collision
    for (let i = 0; i < enemyArr.length; i++) {
      for (let j = i + 1; j < enemyArr.length; j++) {
        const a = enemyArr[i]!;
        const b = enemyArr[j]!;
        const dx2 = b.x - a.x;
        const dy2 = b.y - a.y;
        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (dist2 < PUSH_APART_RADIUS && dist2 > 0) {
          const push = (PUSH_APART_RADIUS - dist2) * 0.5;
          const inv2 = 1 / dist2;
          a.x -= dx2 * inv2 * push;
          a.y -= dy2 * inv2 * push;
          b.x += dx2 * inv2 * push;
          b.y += dy2 * inv2 * push;
        }
      }
    }

    // Enemy-to-player push-apart collision
    for (const enemy of enemyArr) {
      for (const [, player] of this.state.players) {
        if (player.isDown || player.isDisconnected) continue;
        const dx3 = player.x - enemy.x;
        const dy3 = player.y - enemy.y;
        const dist3 = Math.sqrt(dx3 * dx3 + dy3 * dy3);
        if (dist3 < PUSH_APART_RADIUS && dist3 > 0) {
          const push = (PUSH_APART_RADIUS - dist3) * 0.4;
          const inv3 = 1 / dist3;
          const minX = 32 + 12; const maxX = 1600 - 32 - 12;
          const minY = 32 + 12; const maxY = 1200 - 32 - 12;
          player.x = Math.max(minX, Math.min(maxX, player.x + dx3 * inv3 * push));
          player.y = Math.max(minY, Math.min(maxY, player.y + dy3 * inv3 * push));
        }
      }
    }
  }

  /** Move enemy projectiles (vx/vy != 0) and deal damage on player collision. */
  private processProjectiles(): void {
    const HIT_RADIUS_SQ = 14 * 14;  // px² — collision radius with player
    const WORLD_PAD     = -50;       // remove projectile this far outside world bounds

    const toDelete: string[] = [];

    // ORB_WEAPON satellites: orbit around owner, pass-through damage with per-enemy cooldown
    const ORB_HIT_RADIUS = 24;
    const ORB_HIT_COOLDOWN = 500;
    const now = Date.now();
    for (const [id, orbit] of this.orbitalProjectiles) {
      const proj = this.state.projectiles.get(id);
      const owner = this.state.players.get(orbit.ownerId);
      if (!proj || !owner || now - orbit.spawnMs > orbit.ttlMs) {
        toDelete.push(id);
        continue;
      }
      const elapsedSec = (now - orbit.spawnMs) / 1000;
      const angle = orbit.angleOffset + elapsedSec * orbit.spinRate;
      proj.x = owner.x + Math.cos(angle) * orbit.radius;
      proj.y = owner.y + Math.sin(angle) * orbit.radius;
      proj.angle = angle;
      for (const [eid, enemy] of this.state.enemies) {
        const dx = enemy.x - proj.x;
        const dy = enemy.y - proj.y;
        if (dx * dx + dy * dy > ORB_HIT_RADIUS * ORB_HIT_RADIUS) continue;
        const last = orbit.hitHistory.get(eid) ?? 0;
        if (now - last < ORB_HIT_COOLDOWN) continue;
        orbit.hitHistory.set(eid, now);
        this.hitEnemy(orbit.ownerId, eid, proj.damage, angle);
      }
      if (this.state.gameState === 'BOSS_BATTLE' && this.state.boss.id) {
        const dxb = this.state.boss.x - proj.x;
        const dyb = this.state.boss.y - proj.y;
        if (dxb * dxb + dyb * dyb <= (ORB_HIT_RADIUS + 14) * (ORB_HIT_RADIUS + 14)) {
          const last = orbit.hitHistory.get('boss') ?? 0;
          if (now - last >= ORB_HIT_COOLDOWN) {
            orbit.hitHistory.set('boss', now);
            this.hitBoss(orbit.ownerId, proj.damage);
          }
        }
      }
    }

    for (const [id, proj] of this.state.projectiles) {
      if (this.orbitalProjectiles.has(id)) continue;  // handled above
      if (proj.vx === 0 && proj.vy === 0) continue;  // boss projectiles handled separately

      const prevX = proj.x;
      const prevY = proj.y;
      proj.x += proj.vx * this.DT;
      proj.y += proj.vy * this.DT;

      if (proj.x < WORLD_PAD || proj.x > 1600 - WORLD_PAD ||
          proj.y < WORLD_PAD || proj.y > 1200 - WORLD_PAD) {
        toDelete.push(id);
        continue;
      }

      // SHIELD_THROW boomerang: pass-through, reverse at max range, despawn when returned
      const shield = this.shieldProjectiles.get(id);
      if (shield) {
        const enemyR = 22;
        const bossR = 36;
        if (this.state.gameState === 'BOSS_BATTLE' && this.state.boss.id) {
          if (!shield.hitEnemies.has('boss') &&
              GameRoom.segmentHitsCircle(prevX, prevY, proj.x, proj.y, this.state.boss.x, this.state.boss.y, bossR)) {
            shield.hitEnemies.add('boss');
            this.hitBoss(proj.ownerId, proj.damage);
          }
        }
        for (const [eid, enemy] of this.state.enemies) {
          if (shield.hitEnemies.has(eid)) continue;
          if (GameRoom.segmentHitsCircle(prevX, prevY, proj.x, proj.y, enemy.x, enemy.y, enemyR)) {
            shield.hitEnemies.add(eid);
            this.hitEnemy(proj.ownerId, eid, proj.damage, proj.angle);
          }
        }
        if (shield.phase === 'out') {
          const dsx = proj.x - shield.startX;
          const dsy = proj.y - shield.startY;
          if (dsx * dsx + dsy * dsy >= shield.maxRange * shield.maxRange) {
            shield.phase = 'back';
            shield.hitEnemies.clear();  // re-hit on return for double pass damage
          }
        } else {
          const owner = this.state.players.get(proj.ownerId);
          if (owner) {
            const dx = owner.x - proj.x;
            const dy = owner.y - proj.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < 30 * 30) {
              toDelete.push(id);
              continue;
            }
            const dist = Math.sqrt(distSq) || 1;
            proj.vx = (dx / dist) * 420;
            proj.vy = (dy / dist) * 420;
            proj.angle = Math.atan2(dy, dx);
          } else {
            toDelete.push(id);
            continue;
          }
        }
        continue;
      }

      // Player projectiles — swept collision (segment prevPos→pos vs target circle) prevents tunneling on fast arrows
      if (this.playerProjectileIds.has(id)) {
        const enemyR = 22;  // enemy hit radius
        const bossR  = 36;  // boss hit radius
        const isCannon = proj.kind === 'CANNON';
        let hit = false;
        let hitX = proj.x;
        let hitY = proj.y;
        if (this.state.gameState === 'BOSS_BATTLE' && this.state.boss.id) {
          if (GameRoom.segmentHitsCircle(prevX, prevY, proj.x, proj.y, this.state.boss.x, this.state.boss.y, bossR)) {
            hitX = this.state.boss.x; hitY = this.state.boss.y;
            if (isCannon) this.cannonExplode(proj.ownerId, hitX, hitY, proj.damage);
            else this.hitBoss(proj.ownerId, proj.damage);
            hit = true;
            if (this.state.boss.hp <= 0) this.startPostBossSelection();
          }
        }
        if (!hit) {
          for (const [eid, enemy] of this.state.enemies) {
            if (GameRoom.segmentHitsCircle(prevX, prevY, proj.x, proj.y, enemy.x, enemy.y, enemyR)) {
              hitX = enemy.x; hitY = enemy.y;
              if (isCannon) this.cannonExplode(proj.ownerId, hitX, hitY, proj.damage);
              else this.hitEnemy(proj.ownerId, eid, proj.damage, proj.angle);
              hit = true;
              break;
            }
          }
        }
        if (hit) { toDelete.push(id); this.playerProjectileIds.delete(id); }
        continue;
      }

      // Enemy/boss projectiles — check player collision
      for (const [sessionId, player] of this.state.players) {
        if (player.isDown || player.isDisconnected) continue;
        const dx = player.x - proj.x;
        const dy = player.y - proj.y;
        if (dx * dx + dy * dy <= HIT_RADIUS_SQ) {
          this.damagePlayer(sessionId, proj.damage);
          toDelete.push(id);
          break;
        }
      }
    }
    for (const id of toDelete) {
      this.state.projectiles.delete(id);
      this.playerProjectileIds.delete(id);
      this.shieldProjectiles.delete(id);
      this.orbitalProjectiles.delete(id);
    }
  }

  private spawnInitialEnemies(): void {
    const round = this.state.currentRound;
    // Count scales: 20 at round 1 → +5 per round (25, 30, …)
    const COUNT = 20 + (round - 1) * 5;
    // HP scales: basic 180 at R1 → +40/round; ranged 110 → +25/round
    // (enemies must survive long enough at 65 px/s to close a 280px weapon range)
    const basicHp  = 180 + (round - 1) * 40;
    const rangedHp = 110 + (round - 1) * 25;
    for (let i = 0; i < COUNT; i++) {
      const pos = GameRoom.randomEdgeSpawn();
      const enemy = new EnemySchema();
      enemy.id   = crypto.randomUUID();
      // Every 4th enemy is a ranged type
      enemy.type = (i % 4 === 3) ? 'ranged' : 'basic';
      enemy.x    = pos.x;
      enemy.y    = pos.y;
      enemy.maxHp = enemy.type === 'ranged' ? rangedHp : basicHp;
      enemy.hp    = enemy.maxHp;
      this.state.enemies.set(enemy.id, enemy);
    }
  }

  private processAutoAttack(): void {
    // Weapon-specific cooldowns (ms)
    const COOLDOWN: Record<string, number> = {
      '': 500, SWORD: 600, BOW: 700, WAND: 800,
      HAMMER: 1100, SHIELD_THROW: 1000, DAGGER: 400, CANNON: 1400, STAFF: 1200, ORB_WEAPON: 1500,
    };

    for (const [sessionId, player] of this.state.players) {
      if (player.isDown || player.isDisconnected) continue;

      // --- Passive per-tick regen ---
      // REGEN: +2 HP/sec per level; STAT_REGEN: +0.5 HP/sec per stack
      const regenLv = this.getSkillLevel(player, 'REGEN');
      const statRegenLv = this.getSkillLevel(player, 'STAT_REGEN');
      const totalRegen = 2 * regenLv + 0.5 * statRegenLv;
      if (totalRegen > 0) {
        const accum = (this.regenAccum.get(sessionId) ?? 0) + totalRegen * this.DT;
        const whole = Math.floor(accum);
        this.regenAccum.set(sessionId, accum - whole);
        if (whole > 0) player.hp = Math.min(player.maxHp, player.hp + whole);
      }

      // FORTIFY: +3 HP/sec per level when stationary
      const fortifyLv = this.getSkillLevel(player, 'FORTIFY');
      if (fortifyLv > 0) {
        const prev = this.prevPlayerPositions.get(sessionId);
        const stationary = prev && Math.abs(prev.x - player.x) < 2 && Math.abs(prev.y - player.y) < 2;
        if (stationary) {
          const facc = (this.regenAccum.get(`f:${sessionId}`) ?? 0) + 3 * fortifyLv * this.DT;
          const fw = Math.floor(facc);
          this.regenAccum.set(`f:${sessionId}`, facc - fw);
          if (fw > 0) player.hp = Math.min(player.maxHp, player.hp + fw);
        }
      }
      this.prevPlayerPositions.set(sessionId, { x: player.x, y: player.y });

      // SHIELD: regenerate shield HP at 5/sec up to (30 * level)
      const shieldLv = this.getSkillLevel(player, 'SHIELD');
      if (shieldLv > 0) {
        const maxShield = shieldLv * 30;
        if (player.shieldHp < maxShield) {
          const sacc = (this.regenAccum.get(`s:${sessionId}`) ?? 0) + 5 * this.DT;
          const sw = Math.floor(sacc);
          this.regenAccum.set(`s:${sessionId}`, sacc - sw);
          if (sw > 0) player.shieldHp = Math.min(maxShield, player.shieldHp + sw);
        }
      }

      // --- Attack cooldown ---
      const cooldown = this.attackCooldowns.get(sessionId) ?? 0;
      if (cooldown > 0) {
        this.attackCooldowns.set(sessionId, cooldown - 60);
        continue;
      }

      const stats = this.getEffectiveStats(player);
      const auraMult = this.getAuraMultiplier(sessionId);
      let attackDamage = Math.round(stats.attackDamage * auraMult);

      // CRITICAL: (20% + level*5%) chance to deal (1.5 + level*0.25)x damage
      const critLv = this.getSkillLevel(player, 'CRITICAL');
      if (critLv > 0 && Math.random() < 0.20 + critLv * 0.05) {
        attackDamage = Math.round(attackDamage * (1.5 + critLv * 0.25));
      }
      // BERSERKER: bonus damage up to (40 + level*20)% at 0 HP
      const berserkerLv = this.getSkillLevel(player, 'BERSERKER');
      if (berserkerLv > 0) {
        const missingRatio = 1 - player.hp / Math.max(1, player.maxHp);
        attackDamage = Math.round(attackDamage * (1 + (0.40 + berserkerLv * 0.20) * missingRatio));
      }

      const multiStrikeLv = this.getSkillLevel(player, 'MULTI_STRIKE');
      // All equipped weapon slots (id, level), skipping empty
      const slots: Array<{ wid: string; wLv: number; isFirst: boolean }> = [];
      const pushSlot = (wid: string, wLv: number) => { if (wid) slots.push({ wid, wLv, isFirst: slots.length === 0 }); };
      pushSlot(player.weaponId,  player.weaponLevel);
      pushSlot(player.weapon2Id, player.weapon2Level);
      pushSlot(player.weapon3Id, player.weapon3Level);
      pushSlot(player.weapon4Id, player.weapon4Level);
      pushSlot(player.weapon5Id, player.weapon5Level);

      // Cooldown determined by the fastest weapon equipped
      let attackCooldown = Math.max(200, Math.round((COOLDOWN[''] ?? 500)));
      if (slots.length > 0) {
        attackCooldown = Math.min(
          ...slots.map(s => Math.max(200, Math.round((COOLDOWN[s.wid] ?? 500) * (1 - s.wLv * 0.08)))),
        );
      }

      // ===================== BOSS BATTLE =====================
      if (this.state.gameState === 'BOSS_BATTLE') {
        const boss = this.state.boss;
        if (!boss.id || boss.hp <= 0) continue;

        let anyFired = false;
        for (const s of slots) {
          if (this.fireWeaponAtBoss(sessionId, player, s.wid, s.wLv, attackDamage, s.isFirst ? multiStrikeLv : 0, stats)) anyFired = true;
        }
        if (!anyFired) continue;

        this.attackCooldowns.set(sessionId, attackCooldown);
        if (this.state.boss.hp <= 0 && this.state.gameState === 'BOSS_BATTLE') this.startPostBossSelection();
        continue;
      }

      // ===================== SURVIVAL PHASE =====================
      // Find nearest enemy using the longest weapon range across all equipped slots
      const weaponSearchRange = (wid: string, lv: number) =>
        wid === 'WAND' ? 380 + lv * 20
        : wid === 'BOW' ? 360 + lv * 20
        : wid === 'SWORD' ? 150 + lv * 20
        : wid === 'HAMMER' ? 180 + lv * 20
        : wid === 'DAGGER' ? 140 + lv * 10
        : wid === 'CANNON' ? 420 + lv * 20
        : wid === 'STAFF' ? 220 + lv * 20
        : wid === 'SHIELD_THROW' ? 300 + lv * 20
        : wid === 'ORB_WEAPON' ? 160
        : stats.attackRange;
      const SEARCH_RANGE = slots.length > 0
        ? Math.max(...slots.map(s => weaponSearchRange(s.wid, s.wLv)))
        : stats.attackRange;

      let nearestId: string | null = null;
      let nearestDist = Infinity;
      for (const [id, enemy] of this.state.enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < SEARCH_RANGE && dist < nearestDist) { nearestDist = dist; nearestId = id; }
      }
      if (!nearestId) continue;

      const nearestEnemy = this.state.enemies.get(nearestId)!;
      const aimAngle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x);

      let anyFired = false;
      for (const s of slots) {
        if (this.fireWeaponAtEnemies(sessionId, player, s.wid, s.wLv, attackDamage, s.isFirst ? multiStrikeLv : 0, stats, nearestId, nearestEnemy, aimAngle)) anyFired = true;
      }
      if (!anyFired) continue;

      this.attackCooldowns.set(sessionId, attackCooldown);
    }
  }

  /** Fire a single weapon pattern at the boss. Returns true if weapon was in range and fired. */
  private fireWeaponAtBoss(
    sessionId: string, player: PlayerSchema, weapon: string, wLv: number,
    attackDamage: number, multiStrikeLv: number,
    stats: { attackRange: number },
  ): boolean {
    const boss = this.state.boss;
    const dx = boss.x - player.x;
    const dy = boss.y - player.y;
    if (weapon === 'WAND') {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 400) return false;
      const baseAngle = Math.atan2(dy, dx);
      const projCount = 1 + Math.floor(wLv / 2);
      const spread = 0.22;
      const halfSpread = ((projCount - 1) / 2) * spread;
      for (let p = 0; p < projCount; p++) {
        this.firePlayerProjectile(sessionId, player.x, player.y, baseAngle - halfSpread + p * spread, attackDamage, 'ORB', 320);
      }
      if (multiStrikeLv > 0) this.firePlayerProjectile(sessionId, player.x, player.y, baseAngle + 0.35, Math.round(attackDamage * 0.6), 'ORB', 320);
      return true;
    }
    if (weapon === 'BOW') {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const bowRange = 360 + wLv * 20;
      if (dist > bowRange) return false;
      const baseAngle = Math.atan2(dy, dx);
      const arrowCount = wLv >= 4 ? 3 : wLv >= 2 ? 2 : 1;
      const spread = 0.12;
      const halfSpread = ((arrowCount - 1) / 2) * spread;
      for (let a = 0; a < arrowCount; a++) {
        this.firePlayerProjectile(sessionId, player.x, player.y, baseAngle - halfSpread + a * spread, attackDamage, 'ARROW', 500);
      }
      if (multiStrikeLv > 0) this.firePlayerProjectile(sessionId, player.x, player.y, baseAngle + 0.25, Math.round(attackDamage * 0.6), 'ARROW', 500);
      return true;
    }
    if (weapon === 'HAMMER') {
      const radius = 180 + wLv * 20;
      if (dx * dx + dy * dy > radius * radius) return false;
      this.fireHammerShockwave(sessionId, player, wLv, attackDamage, multiStrikeLv);
      return true;
    }
    if (weapon === 'DAGGER') {
      const range = 140 + wLv * 10;
      if (dx * dx + dy * dy > range * range) return false;
      const baseAngle = Math.atan2(dy, dx);
      this.hitBoss(sessionId, attackDamage);
      if (multiStrikeLv > 0) this.hitBoss(sessionId, Math.round(attackDamage * (0.3 + multiStrikeLv * 0.2)));
      this.broadcast('DAGGER_FX', { x: player.x, y: player.y, targets: [{ x: boss.x, y: boss.y }], angle: baseAngle });
      return true;
    }
    if (weapon === 'CANNON') {
      const cannonRange = 420 + wLv * 20;
      if (dx * dx + dy * dy > cannonRange * cannonRange) return false;
      const baseAngle = Math.atan2(dy, dx);
      this.firePlayerProjectile(sessionId, player.x, player.y, baseAngle, attackDamage, 'CANNON', 200);
      if (multiStrikeLv > 0) this.firePlayerProjectile(sessionId, player.x, player.y, baseAngle + 0.2, Math.round(attackDamage * 0.6), 'CANNON', 200);
      return true;
    }
    if (weapon === 'STAFF') {
      const radius = 220 + wLv * 20;
      if (dx * dx + dy * dy > radius * radius) return false;
      this.fireStaffPulse(sessionId, player, wLv, attackDamage, multiStrikeLv);
      return true;
    }
    if (weapon === 'SHIELD_THROW') {
      const shieldRange = 300 + wLv * 20;
      if (dx * dx + dy * dy > shieldRange * shieldRange) return false;
      const baseAngle = Math.atan2(dy, dx);
      this.fireShieldBoomerang(sessionId, player, baseAngle, attackDamage, shieldRange);
      if (multiStrikeLv > 0) this.fireShieldBoomerang(sessionId, player, baseAngle + 0.25, Math.round(attackDamage * 0.6), shieldRange);
      return true;
    }
    if (weapon === 'ORB_WEAPON') {
      this.fireOrbitals(sessionId, player, wLv, attackDamage, multiStrikeLv);
      return true;
    }
    const swordRange = 150 + wLv * 20;
    const bossRange = weapon === 'SWORD' ? swordRange : stats.attackRange;
    if (dx * dx + dy * dy > bossRange * bossRange) return false;
    this.hitBoss(sessionId, attackDamage);
    if (multiStrikeLv > 0) this.hitBoss(sessionId, Math.round(attackDamage * (0.3 + multiStrikeLv * 0.2)));
    return true;
  }

  /** Fire a single weapon pattern at enemies. Returns true if weapon was in range and fired. */
  private fireWeaponAtEnemies(
    sessionId: string, player: PlayerSchema, weapon: string, wLv: number,
    attackDamage: number, multiStrikeLv: number,
    stats: { attackRange: number },
    nearestId: string, nearestEnemy: EnemySchema, aimAngle: number,
  ): boolean {
    if (weapon === 'WAND') {
      const wRange = 380 + wLv * 20;
      const dx = nearestEnemy.x - player.x;
      const dy = nearestEnemy.y - player.y;
      if (dx * dx + dy * dy > wRange * wRange) return false;
      const projCount = 1 + Math.floor(wLv / 2);
      const spread = 0.22;
      const halfSpread = ((projCount - 1) / 2) * spread;
      for (let p = 0; p < projCount; p++) {
        this.firePlayerProjectile(sessionId, player.x, player.y, aimAngle - halfSpread + p * spread, attackDamage, 'ORB', 320);
      }
      if (multiStrikeLv > 0) this.firePlayerProjectile(sessionId, player.x, player.y, aimAngle + 0.35, Math.round(attackDamage * 0.6), 'ORB', 320);
      return true;
    }
    if (weapon === 'BOW') {
      const bowRange = 360 + wLv * 20;
      const dx = nearestEnemy.x - player.x;
      const dy = nearestEnemy.y - player.y;
      if (dx * dx + dy * dy > bowRange * bowRange) return false;
      const arrowCount = wLv >= 4 ? 3 : wLv >= 2 ? 2 : 1;
      const spread = 0.12;
      const halfSpread = ((arrowCount - 1) / 2) * spread;
      for (let a = 0; a < arrowCount; a++) {
        this.firePlayerProjectile(sessionId, player.x, player.y, aimAngle - halfSpread + a * spread, attackDamage, 'ARROW', 500);
      }
      if (multiStrikeLv > 0) this.firePlayerProjectile(sessionId, player.x, player.y, aimAngle + 0.25, Math.round(attackDamage * 0.6), 'ARROW', 500);
      return true;
    }
    if (weapon === 'SWORD') {
      const sRange = 150 + wLv * 20;
      const arcHalf = ((Math.PI / 3) + wLv * (Math.PI / 18)) * (1 + multiStrikeLv * 0.25);
      let fired = false;
      for (const [id, enemy] of this.state.enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > sRange) continue;
        let diff = Math.atan2(dy, dx) - aimAngle;
        while (diff >  Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        if (Math.abs(diff) <= arcHalf) { this.hitEnemy(sessionId, id, attackDamage, aimAngle); fired = true; }
      }
      return fired;
    }
    if (weapon === 'HAMMER') {
      const radius = 180 + wLv * 20;
      const dx0 = nearestEnemy.x - player.x;
      const dy0 = nearestEnemy.y - player.y;
      if (dx0 * dx0 + dy0 * dy0 > radius * radius) return false;
      this.fireHammerShockwave(sessionId, player, wLv, attackDamage, multiStrikeLv);
      return true;
    }
    if (weapon === 'DAGGER') {
      const range = 140 + wLv * 10;
      const dx0 = nearestEnemy.x - player.x;
      const dy0 = nearestEnemy.y - player.y;
      if (dx0 * dx0 + dy0 * dy0 > range * range) return false;
      const maxTargets = 2 + Math.floor(wLv / 2) + (multiStrikeLv > 0 ? 1 : 0);
      const candidates: Array<{ id: string; x: number; y: number; dist: number }> = [];
      for (const [id, enemy] of this.state.enemies) {
        const ex = enemy.x - player.x;
        const ey = enemy.y - player.y;
        const d = ex * ex + ey * ey;
        if (d > range * range) continue;
        candidates.push({ id, x: enemy.x, y: enemy.y, dist: d });
      }
      candidates.sort((a, b) => a.dist - b.dist);
      const picks = candidates.slice(0, maxTargets);
      for (const t of picks) this.hitEnemy(sessionId, t.id, attackDamage, aimAngle);
      this.broadcast('DAGGER_FX', { x: player.x, y: player.y, targets: picks.map(t => ({ x: t.x, y: t.y })), angle: aimAngle });
      return picks.length > 0;
    }
    if (weapon === 'CANNON') {
      const cRange = 420 + wLv * 20;
      const dx0 = nearestEnemy.x - player.x;
      const dy0 = nearestEnemy.y - player.y;
      if (dx0 * dx0 + dy0 * dy0 > cRange * cRange) return false;
      this.firePlayerProjectile(sessionId, player.x, player.y, aimAngle, attackDamage, 'CANNON', 200);
      if (multiStrikeLv > 0) this.firePlayerProjectile(sessionId, player.x, player.y, aimAngle + 0.2, Math.round(attackDamage * 0.6), 'CANNON', 200);
      return true;
    }
    if (weapon === 'STAFF') {
      const radius = 220 + wLv * 20;
      const dx0 = nearestEnemy.x - player.x;
      const dy0 = nearestEnemy.y - player.y;
      if (dx0 * dx0 + dy0 * dy0 > radius * radius) return false;
      this.fireStaffPulse(sessionId, player, wLv, attackDamage, multiStrikeLv);
      return true;
    }
    if (weapon === 'SHIELD_THROW') {
      const shieldRange = 300 + wLv * 20;
      const dx0 = nearestEnemy.x - player.x;
      const dy0 = nearestEnemy.y - player.y;
      if (dx0 * dx0 + dy0 * dy0 > shieldRange * shieldRange) return false;
      this.fireShieldBoomerang(sessionId, player, aimAngle, attackDamage, shieldRange);
      if (multiStrikeLv > 0) this.fireShieldBoomerang(sessionId, player, aimAngle + 0.25, Math.round(attackDamage * 0.6), shieldRange);
      return true;
    }
    if (weapon === 'ORB_WEAPON') {
      this.fireOrbitals(sessionId, player, wLv, attackDamage, multiStrikeLv);
      return true;
    }
    // Default (no weapon): single-target melee
    const dx = nearestEnemy.x - player.x;
    const dy = nearestEnemy.y - player.y;
    if (dx * dx + dy * dy > stats.attackRange * stats.attackRange) return false;
    this.hitEnemy(sessionId, nearestId, attackDamage, aimAngle);
    if (multiStrikeLv > 0) {
      let secondId: string | null = null;
      let secondDist = Infinity;
      for (const [id, enemy] of this.state.enemies) {
        if (id === nearestId) continue;
        const ex = enemy.x - player.x;
        const ey = enemy.y - player.y;
        const dist = Math.sqrt(ex * ex + ey * ey);
        if (dist < stats.attackRange && dist < secondDist) { secondDist = dist; secondId = id; }
      }
      if (secondId) this.hitEnemy(sessionId, secondId, Math.round(attackDamage * (0.3 + multiStrikeLv * 0.2)), aimAngle);
    }
    return true;
  }

  /** Deals damage to a single enemy and handles kill/XP/respawn logic. */
  private hitEnemy(sessionId: string, enemyId: string, damage: number, _aimAngle: number): void {
    const player = this.state.players.get(sessionId);
    const enemy  = this.state.enemies.get(enemyId);
    if (!player || !enemy) return;

    enemy.hp          -= damage;
    player.totalDamage += damage;
    if (this.getSkillLevel(player, 'LIFESTEAL') > 0) this.restoreHp(sessionId, Math.round(damage * 0.2));

    if (enemy.hp <= 0) {
      player.killCount += 1;
      const wasElite = enemy.type === 'elite';
      this.state.enemies.delete(enemyId);
      this.attackCooldowns.delete(enemyId);
      this.enemySlowUntil.delete(enemyId);
      this.shareKillXp(sessionId, wasElite ? 50 : 30);
      this.restoreHp(sessionId, wasElite ? 10 : 3);
      if (!wasElite && this.state.gameState === 'SURVIVAL_PHASE') {
        const respawnHp = 180 + (this.state.currentRound - 1) * 40;
        this.clock.setTimeout(() => {
          if (this.state.gameState !== 'SURVIVAL_PHASE') return;
          const pos = GameRoom.randomEdgeSpawn();
          const e = new EnemySchema();
          e.id = crypto.randomUUID(); e.type = 'basic';
          e.x = pos.x; e.y = pos.y; e.maxHp = respawnHp; e.hp = respawnHp;
          this.state.enemies.set(e.id, e);
        }, 8_000);
      }
    }
  }

  /** Deals damage to the boss and handles lifesteal. */
  private hitBoss(sessionId: string, damage: number): void {
    const player = this.state.players.get(sessionId);
    const boss   = this.state.boss;
    if (!player || !boss.id || boss.hp <= 0) return;
    boss.hp = Math.max(0, boss.hp - damage);
    player.totalDamage += damage;
    this.grantXp(sessionId, Math.max(1, Math.floor(damage * 0.2)));
    if (this.getSkillLevel(player, 'LIFESTEAL') > 0) this.restoreHp(sessionId, Math.round(damage * 0.2));
  }

  /** True if line segment (ax,ay)→(bx,by) intersects circle at (cx,cy) radius r. */
  private static segmentHitsCircle(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, r: number): boolean {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) {
      const ex = cx - ax;
      const ey = cy - ay;
      return ex * ex + ey * ey <= r * r;
    }
    const t = Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / lenSq));
    const px = ax + t * dx - cx;
    const py = ay + t * dy - cy;
    return px * px + py * py <= r * r;
  }

  /** HAMMER shockwave: AOE damage + knockback on all enemies in radius. */
  private fireHammerShockwave(sessionId: string, player: PlayerSchema, wLv: number, attackDamage: number, multiStrikeLv: number): void {
    const radius  = 180 + wLv * 20;
    const knockback = 80 + wLv * 10;
    const dmgMult = 1 + multiStrikeLv * 0.25;
    const dmg = Math.round(attackDamage * dmgMult);
    for (const [id, enemy] of this.state.enemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > radius * radius) continue;
      const dist = Math.sqrt(distSq) || 1;
      const nx = dx / dist;
      const ny = dy / dist;
      enemy.x = Math.max(20, Math.min(1580, enemy.x + nx * knockback));
      enemy.y = Math.max(20, Math.min(1180, enemy.y + ny * knockback));
      this.hitEnemy(sessionId, id, dmg, Math.atan2(dy, dx));
    }
    if (this.state.gameState === 'BOSS_BATTLE' && this.state.boss.id) {
      const dxb = this.state.boss.x - player.x;
      const dyb = this.state.boss.y - player.y;
      if (dxb * dxb + dyb * dyb <= radius * radius) this.hitBoss(sessionId, dmg);
    }
    this.broadcast('HAMMER_FX', { x: player.x, y: player.y, radius });
  }

  /** STAFF pulse: heal teammates + slow+damage enemies in radius. */
  private fireStaffPulse(sessionId: string, player: PlayerSchema, wLv: number, attackDamage: number, multiStrikeLv: number): void {
    const radius = 220 + wLv * 20;
    const healBonus = this.getEffectiveStats(player).healBonus;
    const healAmount = Math.round((5 + wLv * 2) * (1 + healBonus));
    const dmg = Math.round(attackDamage * (0.5 + multiStrikeLv * 0.15));
    const slowUntil = Date.now() + 1500;

    for (const [, mate] of this.state.players) {
      if (mate.isDown || mate.isDisconnected) continue;
      const dx = mate.x - player.x;
      const dy = mate.y - player.y;
      if (dx * dx + dy * dy > radius * radius) continue;
      mate.hp = Math.min(mate.maxHp, mate.hp + healAmount);
    }
    for (const [eid, enemy] of this.state.enemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      if (dx * dx + dy * dy > radius * radius) continue;
      this.enemySlowUntil.set(eid, slowUntil);
      this.hitEnemy(sessionId, eid, dmg, Math.atan2(dy, dx));
    }
    if (this.state.gameState === 'BOSS_BATTLE' && this.state.boss.id) {
      const dxb = this.state.boss.x - player.x;
      const dyb = this.state.boss.y - player.y;
      if (dxb * dxb + dyb * dyb <= radius * radius) this.hitBoss(sessionId, dmg);
    }
    this.broadcast('STAFF_FX', { x: player.x, y: player.y, radius });
  }

  /** SHIELD_THROW boomerang: projectile passes through enemies, reverses at maxRange, returns to owner. */
  private fireShieldBoomerang(sessionId: string, player: PlayerSchema, angle: number, damage: number, maxRange: number): void {
    const proj = new ProjectileSchema();
    proj.id      = crypto.randomUUID();
    proj.ownerId = sessionId;
    proj.x       = player.x;
    proj.y       = player.y;
    proj.angle   = angle;
    proj.vx      = Math.cos(angle) * 380;
    proj.vy      = Math.sin(angle) * 380;
    proj.damage  = damage;
    proj.kind    = 'SHIELD';
    this.state.projectiles.set(proj.id, proj);
    this.playerProjectileIds.add(proj.id);
    this.shieldProjectiles.set(proj.id, {
      phase: 'out', startX: player.x, startY: player.y, maxRange, hitEnemies: new Set(),
    });
  }

  /** ORB_WEAPON: spawn orbiting satellites around the player with a TTL. */
  private fireOrbitals(sessionId: string, player: PlayerSchema, wLv: number, attackDamage: number, multiStrikeLv: number): void {
    const count = 1 + Math.floor(wLv / 2) + (multiStrikeLv > 0 ? 1 : 0);
    const ttlMs = 2000;
    const radius = 70;
    const spinRate = 3.5;  // rad/s
    const now = Date.now();
    for (let i = 0; i < count; i++) {
      const angleOffset = (i / count) * Math.PI * 2;
      const proj = new ProjectileSchema();
      proj.id      = crypto.randomUUID();
      proj.ownerId = sessionId;
      proj.x       = player.x + Math.cos(angleOffset) * radius;
      proj.y       = player.y + Math.sin(angleOffset) * radius;
      proj.angle   = angleOffset;
      proj.vx      = 0;
      proj.vy      = 0;
      proj.damage  = attackDamage;
      proj.kind    = 'SATELLITE';
      this.state.projectiles.set(proj.id, proj);
      this.playerProjectileIds.add(proj.id);
      this.orbitalProjectiles.set(proj.id, {
        ownerId: sessionId, angleOffset, spawnMs: now, ttlMs, radius, spinRate, hitHistory: new Map(),
      });
    }
  }

  /** CANNON explosion: AOE damage around impact point. */
  private cannonExplode(ownerId: string, x: number, y: number, damage: number): void {
    const radius = 70;
    for (const [eid, enemy] of this.state.enemies) {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      if (dx * dx + dy * dy <= radius * radius) this.hitEnemy(ownerId, eid, damage, Math.atan2(dy, dx));
    }
    if (this.state.gameState === 'BOSS_BATTLE' && this.state.boss.id) {
      const dxb = this.state.boss.x - x;
      const dyb = this.state.boss.y - y;
      if (dxb * dxb + dyb * dyb <= radius * radius) this.hitBoss(ownerId, damage);
    }
    this.broadcast('EXPLOSION_FX', { x, y, radius });
  }

  /** Fires a player-owned projectile. Tracked in playerProjectileIds for collision.
   *  kind: 'ORB' (WAND, 320 default) | 'ARROW' (BOW, 500) | 'CANNON' (CANNON, 200, explodes on hit). */
  private firePlayerProjectile(
    sessionId: string, x: number, y: number, angle: number, damage: number,
    kind: string = 'ORB', speed: number = 320,
  ): void {
    const proj = new ProjectileSchema();
    proj.id      = crypto.randomUUID();
    proj.ownerId = sessionId;
    proj.x       = x;
    proj.y       = y;
    proj.angle   = angle;
    proj.vx      = Math.cos(angle) * speed;
    proj.vy      = Math.sin(angle) * speed;
    proj.damage  = damage;
    proj.kind    = kind;
    this.state.projectiles.set(proj.id, proj);
    this.playerProjectileIds.add(proj.id);
  }

  /** 8.4: TEAM_HEAL ticks HP onto nearby teammates; AURA is applied per-hit in processAutoAttack. */
  private processCoopSkills(): void {
    const TICK_MS = 60;

    for (const [sourceId, source] of this.state.players) {
      if (source.isDown || source.isDisconnected) continue;
      if (source.selectedClass !== 'SUPPORT') continue;

      const skills = source.skillIds.toArray();
      if (!skills.includes('TEAM_HEAL')) continue;

      const def = COOPERATIVE_SKILLS['TEAM_HEAL']!;
      const key = `${sourceId}:TEAM_HEAL`;
      const remaining = this.coopSkillCooldowns.get(key) ?? 0;

      if (remaining > 0) {
        this.coopSkillCooldowns.set(key, remaining - TICK_MS);
        continue;
      }

      this.coopSkillCooldowns.set(key, def.cooldownMs!);
      for (const [targetId, target] of this.state.players) {
        if (targetId === sourceId || target.isDown || target.isDisconnected) continue;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        if (Math.sqrt(dx * dx + dy * dy) <= def.range) {
          this.restoreHp(targetId, def.value);
        }
      }
    }
  }

  /** 8.4: Returns AURA attack multiplier from any nearby Support teammate with AURA. */
  private getAuraMultiplier(sessionId: string): number {
    const player = this.state.players.get(sessionId);
    if (!player) return 1.0;

    const def = COOPERATIVE_SKILLS['AURA']!;
    for (const [sourceId, source] of this.state.players) {
      if (sourceId === sessionId || source.isDown || source.isDisconnected) continue;
      if (source.selectedClass !== 'SUPPORT') continue;
      if (!source.skillIds.toArray().includes('AURA')) continue;
      const dx = source.x - player.x;
      const dy = source.y - player.y;
      if (Math.sqrt(dx * dx + dy * dy) <= def.range) return def.value;
    }
    return 1.0;
  }

  private applyClassStats(): void {
    const CLASS_STARTING_WEAPON: Record<string, string> = {
      TANK:    'SWORD',
      DAMAGE:  'BOW',
      SUPPORT: 'WAND',
    };
    for (const [, player] of this.state.players) {
      // Grant starting weapon based on class (slot 1, level 0)
      if (!player.weaponId) {
        player.weaponId    = CLASS_STARTING_WEAPON[player.selectedClass] ?? 'SWORD';
        player.weaponLevel = 0;
      }
      const stats = this.getEffectiveStats(player);
      player.maxHp = stats.maxHp;
      player.hp    = stats.maxHp;
    }
  }

  private processMovement(): void {
    const minX = 32 + 12;        // wall thickness + half sprite width
    const maxX = 1600 - 32 - 12; // world width 1600
    const minY = 32 + 12;
    const maxY = 1200 - 32 - 12; // world height 1200

    for (const [sessionId, input] of this.inputBuffer) {
      const player = this.state.players.get(sessionId);
      if (!player || player.isDown || player.isDisconnected) continue;

      const speed = this.getEffectiveStats(player).speed;  // 9.4: includes equipment speed bonuses
      let { x, y } = player;
      x += input.dx * speed * this.DT;
      y += input.dy * speed * this.DT;

      player.x = Math.max(minX, Math.min(maxX, x));
      player.y = Math.max(minY, Math.min(maxY, y));
    }

    // Player-player push-apart collision
    const activePlayers = [...this.state.players.entries()]
      .filter(([, p]) => !p.isDown && !p.isDisconnected);
    const PLAYER_PUSH_RADIUS = 22;
    for (let i = 0; i < activePlayers.length; i++) {
      for (let j = i + 1; j < activePlayers.length; j++) {
        const [, a] = activePlayers[i]!;
        const [, b] = activePlayers[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < PLAYER_PUSH_RADIUS && dist > 0) {
          const push = (PLAYER_PUSH_RADIUS - dist) * 0.5;
          const inv = 1 / dist;
          a.x = Math.max(minX, Math.min(maxX, a.x - dx * inv * push));
          a.y = Math.max(minY, Math.min(maxY, a.y - dy * inv * push));
          b.x = Math.max(minX, Math.min(maxX, b.x + dx * inv * push));
          b.y = Math.max(minY, Math.min(maxY, b.y + dy * inv * push));
        }
      }
    }
  }

  // 12.1: Called when HP reaches zero — transitions player to DOWNED state
  downPlayer(sessionId: string): void {
    const player = this.state.players.get(sessionId);
    if (!player || player.isDown) return;
    player.isDown = true;
    player.downCount += 1;  // 13.1
    this.lastDownedAt.set(sessionId, Date.now());  // record timestamp for survival time
    // 12.4: auto-assign first active teammate as initial spectate target
    for (const [id, p] of this.state.players) {
      if (id !== sessionId && !p.isDown && !p.isDisconnected) {
        player.spectatingId = id;
        break;
      }
    }
    this.checkAllDowned();
  }

  // Called by server combat logic (tasks 6+) when a player is rescued
  revivePlayer(sessionId: string): void {
    const player = this.state.players.get(sessionId);
    if (!player) return;
    player.isDown = false;
  }

  private checkAllDowned(): void {
    if (this.state.gameState === 'LOBBY' || this.state.gameState === 'RESULT' || this.state.gameState === 'GAME_OVER') return;
    if (this.playerCount() === 0) return;

    const allDown = this.allPlayersDown();
    if (!allDown) return;

    this.state.gameState = 'GAME_OVER';
    this.clock.setTimeout(() => {
      // 若延遲期間已 resetToLobby 或其他狀態切換，不覆蓋到 RESULT
      if (this.state.gameState !== 'GAME_OVER') return;
      void this.transitionToResult(false);
    }, GAME_OVER_RESULT_DELAY_MS);
  }

  private advanceAfterPostBoss(): void {
    if (this.state.currentRound < TOTAL_ROUNDS) {
      this.state.currentRound += 1;
      this.spawnInitialEnemies();
      this.startSurvivalPhase();
    } else {
      void this.transitionToResult(true);
    }
  }

  private async transitionToResult(cleared: boolean): Promise<void> {
    this.state.gameState = 'RESULT';

    const now = Date.now();
    const clearTime = cleared ? now - this.sessionStartedAt : null;
    const sessionDurationMs = now - this.sessionStartedAt;
    const results: PlayerResult[] = [];

    for (const [sessionId, p] of this.state.players) {
      // Per-player survival: from session start to their last death; full time if never downed
      const downedAt = this.lastDownedAt.get(sessionId);
      const survivalMs = downedAt != null ? downedAt - this.sessionStartedAt : sessionDurationMs;
      results.push({
        userId: p.id,
        displayName: p.displayName,
        isGuest: p.isGuest,
        playerClass: (p.selectedClass as 'TANK' | 'DAMAGE' | 'SUPPORT') || 'DAMAGE',
        totalDamage:     p.totalDamage,
        survivalTime:    Math.round(survivalMs / 1000),
        cleared,
        clearTime,
      });
    }

    try {
      if (this.gameSession) {
        this.gameSession.endedAt = new Date(now);
        this.gameSession.round = this.state.currentRound;
        await this.sessionRepo.save(this.gameSession);
        await this.sessionRepo.saveResults(this.gameSession.id, results);
      }
    } catch (err) {
      console.error('[GameRoom] transitionToResult: DB save failed', err);
    }

    // 13.5: Broadcast per-player stats for the results screen
    this.broadcast('SESSION_RESULT', {
      cleared,
      round: this.state.currentRound,
      clearTimeMs: clearTime,
      players: results.map(r => ({
        displayName:     r.displayName,
        isGuest:         r.isGuest,
        playerClass:     r.playerClass,
        totalDamage:     r.totalDamage,
        survivalTimeSec: r.survivalTime,
      })),
    });
  }

  private reassignHost(): void {
    if (this.humanCount() > 0) {
      for (const [, p] of this.state.players) {
        if (!p.isBot && !p.isDisconnected) { p.isHost = true; break; }
      }
    }
  }

  private allPlayersDown(): boolean {
    for (const [, p] of this.state.players) {
      if (p.isDisconnected) continue;  // pending bot replacement, skip
      if (!p.isDown) return false;
    }
    return true;
  }

  private unreadyHumans(): string[] {
    const names: string[] = [];
    for (const [, p] of this.state.players) {
      if (!p.isBot && !p.selectedClass) names.push(p.displayName);
    }
    return names;
  }

  private humanCount(): number {
    let count = 0;
    for (const [, p] of this.state.players) { if (!p.isBot) count++; }
    return count;
  }

  private botCount(): number {
    let count = 0;
    for (const [, p] of this.state.players) { if (p.isBot) count++; }
    return count;
  }

  private playerCount(): number {
    let count = 0;
    for (const [,] of this.state.players) { count++; }
    return count;
  }

  private randomClass(): string {
    const classes = ['TANK', 'DAMAGE', 'SUPPORT'];
    return classes[Math.floor(Math.random() * classes.length)]!;
  }

  private resetToLobby(): void {
    this.state.gameState = 'LOBBY';
    this.state.currentRound = 0;
    this.state.survivalTimeLeft = 0;
    this.survivalTimeLeftMs = 0;
    this.currentBossStats = null;
    this.gameSession = null;
    this.sessionStartedAt = 0;

    // Clear game objects
    this.state.enemies.clear();
    this.state.items.clear();
    this.state.projectiles.clear();
    this.state.boss.id = '';
    this.state.boss.hp = 0;
    this.state.boss.maxHp = 0;

    // Clear internal state
    this.attackCooldowns.clear();
    this.coopSkillCooldowns.clear();
    this.regenAccum.clear();
    this.bossPatternCooldowns.clear();
    this.rescueProgress.clear();
    this.preBossSelections.clear();
    this.postBossSelections.clear();
    this.postBossOptions.clear();
    this.lastDownedAt.clear();
    this.inputBuffer.clear();
    this.playerProjectileIds.clear();
    this.shieldProjectiles.clear();
    this.orbitalProjectiles.clear();
    this.enemySlowUntil.clear();

    // Reset each player to lobby state
    for (const [, player] of this.state.players) {
      player.hp = 0;
      player.maxHp = 0;
      player.xp = 0;
      player.level = 1;
      player.skillIds.splice(0, player.skillIds.length);
      player.weaponId = '';
      player.weaponLevel = 0;
      player.weapon2Id = '';
      player.weapon2Level = 0;
      player.weapon3Id = '';
      player.weapon3Level = 0;
      player.weapon4Id = '';
      player.weapon4Level = 0;
      player.weapon5Id = '';
      player.weapon5Level = 0;
      player.passiveIds.splice(0, player.passiveIds.length);
      player.passiveLevels.splice(0, player.passiveLevels.length);
      player.isDown = false;
      player.spectatingId = '';
      player.isReady = player.isBot;  // bots are always ready; humans must confirm again
      player.totalDamage = 0;
      player.totalDamageTaken = 0;
      player.killCount = 0;
      player.downCount = 0;
      player.rescueCount = 0;
      if (player.isBot) player.selectedClass = this.randomClass();
    }
  }

  private isCodeActive(code: string): boolean {
    const rooms = matchMaker.query({ metadata: { roomCode: code } });
    return Array.isArray(rooms) && rooms.length > 0;
  }
}
