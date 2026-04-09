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
import { ALL_SKILL_IDS, COOPERATIVE_SKILLS } from '../../domain/entities/SkillPools.js';
import { drawSkillOptions } from '../../domain/entities/SkillDraw.js';
import {
  EQUIPMENT_DEFS, WEAPON_DEF_IDS, PASSIVE_DEF_IDS, scaleModifiers,
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
  private botControllers = new Map<string, BotController>(); // botId → controller
  // 12.3: rescue progress per rescuer; reset if rescuer takes damage
  private rescueProgress = new Map<string, { targetId: string; ms: number }>();
  private survivalTimeLeftMs = 0;
  // Per-player survival tracking: timestamp of last time they were downed (0 = never downed)
  private lastDownedAt = new Map<string, number>();

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

    this.onMessage('ADD_BOT', (client, _message: unknown) => {
      const requester = this.state.players.get(client.sessionId);
      if (!requester?.isHost) return;

      const botCount = this.botCount();
      const humanCount = this.humanCount();
      if (botCount >= 3 || humanCount + botCount >= 4) return;

      const bot = new PlayerSchema();
      bot.id = `bot_${crypto.randomUUID()}`;
      bot.displayName = BOT_NAMES[botCount] ?? `Bot ${botCount + 1}`;
      bot.isBot = true;
      bot.selectedClass = this.randomClass();
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
      if (player.skillIds.length >= 6) return;
      if (!ALL_SKILL_IDS.has(message.skillId)) return;
      if (player.skillIds.toArray().includes(message.skillId)) return;
      player.skillIds.push(message.skillId);
    });

    this.onMessage('PLAYER_INPUT', (client, message: PlayerInput) => {
      if (this.state.gameState !== 'SURVIVAL_PHASE' && this.state.gameState !== 'BOSS_BATTLE') return;
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isBot || player.isDown) return;
      this.inputBuffer.set(client.sessionId, {
        dx: Math.sign(message.dx),
        dy: Math.sign(message.dy),
        rescue: !!message.rescue,
      });
    });

    this.setSimulationInterval(() => this.tick(), 60);

    // 10.3: Player confirms skill selection during PRE_BOSS_SELECTION
    this.onMessage('SELECT_PRE_BOSS_SKILL', (client, message: { skillId: string }) => {
      if (this.state.gameState !== 'PRE_BOSS_SELECTION') return;
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isBot) return;
      if (!ALL_SKILL_IDS.has(message.skillId)) return;
      if (!this.preBossSelections.has(client.sessionId)) return;  // not offered options

      // Grant skill if player has capacity
      if (player.skillIds.length < 6 && !player.skillIds.toArray().includes(message.skillId)) {
        player.skillIds.push(message.skillId);
      }
      this.preBossSelections.set(client.sessionId, true);
      this.checkPreBossAllSelected();
    });

    // 10.4: Player confirms reward selection during POST_BOSS_SELECTION
    this.onMessage('SELECT_REWARD', (client, message: { rewardId: string }) => {
      if (this.state.gameState !== 'POST_BOSS_SELECTION') return;
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isBot) return;
      if (!this.postBossSelections.has(client.sessionId)) return;

      this.applyReward(client.sessionId, message.rewardId);
      this.postBossSelections.set(client.sessionId, true);
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
    // Clear all enemies and projectiles before boss battle to reduce state patch size
    this.state.enemies.clear();
    this.state.projectiles.clear();

    for (const [sessionId, player] of this.state.players) {
      if (player.isBot) {
        // 11.6: Bot auto-selects immediately
        if (player.skillIds.length < 6) {
          const options = drawSkillOptions(player.selectedClass, player.skillIds.toArray());
          if (options.length > 0) {
            const pick = options[Math.floor(Math.random() * options.length)]!;
            if (!player.skillIds.toArray().includes(pick)) player.skillIds.push(pick);
          }
        }
        continue;
      }
      if (player.skillIds.length >= 6) {
        // Already maxed — mark as auto-selected
        this.preBossSelections.set(sessionId, true);
        continue;
      }
      const options = drawSkillOptions(player.selectedClass, player.skillIds.toArray());
      this.preBossSelections.set(sessionId, false);
      const client = this.clients.find(c => c.sessionId === sessionId);
      if (client) this.send(client, 'PRE_BOSS_SKILL_OPTIONS', { options });
    }

    this.clock.setTimeout(() => {
      if (this.state.gameState !== 'PRE_BOSS_SELECTION') return;
      // Auto-assign for players who did not select
      this.autoAssignPreBossSkills();
      this.enterBossBattle();
    }, SELECTION_TIMEOUT_MS);
  }

  private autoAssignPreBossSkills(): void {
    for (const [sessionId, selected] of this.preBossSelections) {
      if (selected) continue;
      const player = this.state.players.get(sessionId);
      if (!player || player.skillIds.length >= 6) continue;
      const options = drawSkillOptions(player.selectedClass, player.skillIds.toArray());
      if (options.length > 0) {
        const pick = options[Math.floor(Math.random() * options.length)]!;
        if (!player.skillIds.toArray().includes(pick)) player.skillIds.push(pick);
      }
    }
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
      progress.ms += 60;

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

    // Clear progress for rescuers who stepped away
    for (const [rescuerId] of this.rescueProgress) {
      if (!activeRescuerIds.has(rescuerId)) this.rescueProgress.delete(rescuerId);
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

  /** Reduce player HP and trigger down-state or game-over if HP reaches zero. */
  private damagePlayer(sessionId: string, amount: number): void {
    const player = this.state.players.get(sessionId);
    if (!player || player.isDown || player.isDisconnected) return;
    player.hp = Math.max(0, player.hp - amount);
    player.totalDamageTaken += amount;  // 13.1
    // 12.3: taking damage cancels any in-progress rescue
    this.rescueProgress.delete(sessionId);
    if (player.hp <= 0) this.downPlayer(sessionId);
  }

  /** 10.4: Begin POST_BOSS_SELECTION — offer 3 reward options to each human player. */
  private startPostBossSelection(): void {
    this.state.boss.id = '';  // clear boss
    this.state.gameState = 'POST_BOSS_SELECTION';
    this.postBossSelections.clear();

    const rewardPool = [
      ...WEAPON_DEF_IDS.map(id => `WEAPON:${id}`),
      ...PASSIVE_DEF_IDS.map(id => `PASSIVE:${id}`),
    ];

    for (const [sessionId, player] of this.state.players) {
      if (player.isBot) {
        // 11.6: Bot auto-selects a random reward immediately
        const botPool = [...rewardPool];
        const reward = botPool[Math.floor(Math.random() * botPool.length)]!;
        this.applyReward(sessionId, reward);
        continue;
      }
      // Pick 3 random distinct rewards
      const shuffled = [...rewardPool].sort(() => Math.random() - 0.5);
      const options = shuffled.slice(0, 3);
      this.postBossSelections.set(sessionId, false);
      const client = this.clients.find(c => c.sessionId === sessionId);
      if (client) this.send(client, 'POST_BOSS_REWARD_OPTIONS', { options });
    }

    this.clock.setTimeout(() => {
      if (this.state.gameState !== 'POST_BOSS_SELECTION') return;
      // Auto-assign random reward for non-selecting players
      for (const [sessionId, selected] of this.postBossSelections) {
        if (selected) continue;
        const pool = [...PASSIVE_DEF_IDS.map(id => `PASSIVE:${id}`)];
        const reward = pool[Math.floor(Math.random() * pool.length)]!;
        this.applyReward(sessionId, reward);
      }
      this.advanceAfterPostBoss();
    }, SELECTION_TIMEOUT_MS);
  }

  private applyReward(sessionId: string, rewardId: string): void {
    const player = this.state.players.get(sessionId);
    if (!player) return;

    const [type, defId] = rewardId.split(':') as [string, string];
    if (!type || !defId) return;

    if (type === 'WEAPON') {
      player.weaponId    = defId;
      player.weaponLevel = 0;
      player.maxHp = this.getEffectiveStats(player).maxHp;
    } else if (type === 'PASSIVE') {
      if (player.passiveIds.length < 4) {
        player.passiveIds.push(defId);
        player.passiveLevels.push(0);
        player.maxHp = this.getEffectiveStats(player).maxHp;
      }
      // If full, reward is silently skipped (edge case)
    }
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

  private grantXp(sessionId: string, amount: number): void {
    const player = this.state.players.get(sessionId);
    if (!player) return;

    player.xp += amount;
    const threshold = player.level * 100;

    if (player.xp >= threshold) {
      player.xp -= threshold;
      player.level += 1;

      if (player.skillIds.length >= 6) return;

      const options = drawSkillOptions(
        player.selectedClass,
        player.skillIds.toArray(),
      );

      if (player.isBot) {
        // 11.6: Bot auto-selects a random skill immediately
        if (options.length > 0) {
          const pick = options[Math.floor(Math.random() * options.length)]!;
          if (!player.skillIds.toArray().includes(pick)) player.skillIds.push(pick);
        }
        return;
      }

      const client = this.clients.find((c) => c.sessionId === sessionId);
      if (client) this.send(client, 'LEVEL_UP', { level: player.level, options });
    }
  }

  // Predefined spawn node pool — positions are fixed on the placeholder map (1600×1200 world).
  // task 15.2 (real tilemap) will update these to match actual map layout.
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
    const nodes = GameRoom.SPAWN_NODES;
    const pos = nodes[Math.floor(Math.random() * nodes.length)]!;

    const elite = new EnemySchema();
    elite.id    = crypto.randomUUID();
    elite.type  = 'elite';
    elite.x     = pos.x;
    elite.y     = pos.y;
    elite.maxHp = 300;
    elite.hp    = 300;
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

    // Skill bonuses
    const skills = player.skillIds.toArray();
    for (const skillId of skills) {
      switch (skillId) {
        case 'IRON_SKIN':   result.maxHp        += 40;   break;  // TANK: +40 max HP
        case 'POWER_UP':    result.attackDamage += 5;    break;  // DAMAGE: +5 atk
        case 'SWIFT_FEET':  result.speed        += 30;   result.attackDamage -= 3; break;  // DAMAGE: +speed -dmg
        case 'SPEED_UP':    result.speed        += 20;   break;  // common: +speed
        case 'TOUGH':       result.maxHp        += 25;   break;  // common: +HP
        case 'SHIELD':      result.maxHp        += 30;   break;  // TANK
        case 'FORTIFY':     result.maxHp        += 20;   break;  // TANK
        case 'HEAL':        result.healBonus    += 0.2;  break;  // SUPPORT
        case 'REGEN':       /* handled per-tick in processAutoAttack */ break;
      }
    }

    if (player.weaponId && EQUIPMENT_DEFS[player.weaponId]) {
      const mods = scaleModifiers(EQUIPMENT_DEFS[player.weaponId]!.modifiers, player.weaponLevel);
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
    const BASIC_SPEED   = 55;   // px/s
    const ELITE_SPEED   = 90;
    const RANGED_SPEED  = 40;
    const WALL = 32 + 10;       // world border + half-sprite
    const CONTACT_RANGE     = 20;    // px — melee contact distance
    const RANGED_ATTACK_DIST = 180;  // px — ranged enemy preferred attack distance
    const MELEE_DAMAGE       = 5;    // per 60ms tick contact
    const ELITE_DAMAGE       = 8;
    const RANGED_DAMAGE      = 5;
    const RANGED_PROJ_SPEED  = 300;  // px/s — enemy projectile travel speed
    const PUSH_APART_RADIUS  = 22;   // px — enemy-enemy separation

    // Collect active player positions and IDs
    const targets: { x: number; y: number; id: string }[] = [];
    for (const [id, p] of this.state.players) {
      if (!p.isDown && !p.isDisconnected) targets.push({ x: p.x, y: p.y, id });
    }

    const enemyArr = [...this.state.enemies.values()];

    for (const enemy of enemyArr) {
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
          enemy.x = Math.max(WALL, Math.min(1600 - WALL, enemy.x + dx * inv * RANGED_SPEED * this.DT));
          enemy.y = Math.max(WALL, Math.min(1200 - WALL, enemy.y + dy * inv * RANGED_SPEED * this.DT));
        } else if (nearestDist < RANGED_ATTACK_DIST - 20) {
          // Back away
          const inv = 1 / nearestDist;
          enemy.x = Math.max(WALL, Math.min(1600 - WALL, enemy.x - dx * inv * RANGED_SPEED * this.DT));
          enemy.y = Math.max(WALL, Math.min(1200 - WALL, enemy.y - dy * inv * RANGED_SPEED * this.DT));
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
          enemy.x = Math.max(WALL, Math.min(1600 - WALL, enemy.x + dx * inv * speed * this.DT));
          enemy.y = Math.max(WALL, Math.min(1200 - WALL, enemy.y + dy * inv * speed * this.DT));
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
    for (const [id, proj] of this.state.projectiles) {
      if (proj.vx === 0 && proj.vy === 0) continue;  // boss projectiles handled separately

      proj.x += proj.vx * this.DT;
      proj.y += proj.vy * this.DT;

      if (proj.x < WORLD_PAD || proj.x > 1600 - WORLD_PAD ||
          proj.y < WORLD_PAD || proj.y > 1200 - WORLD_PAD) {
        toDelete.push(id);
        continue;
      }

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
    for (const id of toDelete) this.state.projectiles.delete(id);
  }

  private spawnInitialEnemies(): void {
    const spawnPoints = [
      { x: 200, y: 200 }, { x: 550, y: 180 }, { x: 900, y: 200 }, { x: 1250, y: 180 }, { x: 1500, y: 200 },
      { x: 180, y: 480 }, { x: 500, y: 500 }, { x: 800, y: 480 }, { x: 1100, y: 500 }, { x: 1420, y: 480 },
      { x: 200, y: 760 }, { x: 550, y: 780 }, { x: 900, y: 760 }, { x: 1250, y: 780 }, { x: 1500, y: 760 },
      { x: 180, y: 1040 },{ x: 500, y: 1020 },{ x: 800, y: 1040 },{ x: 1100, y: 1020 },{ x: 1420, y: 1040 },
    ];
    spawnPoints.forEach((pos, i) => {
      const enemy = new EnemySchema();
      enemy.id = crypto.randomUUID();
      // Every 4th enemy is a ranged type
      enemy.type = (i % 4 === 3) ? 'ranged' : 'basic';
      enemy.x = pos.x;
      enemy.y = pos.y;
      enemy.maxHp = enemy.type === 'ranged' ? 35 : 50;
      enemy.hp    = enemy.maxHp;
      this.state.enemies.set(enemy.id, enemy);
    });
  }

  private processAutoAttack(): void {
    const ATTACK_COOLDOWN = 500;    // ms between attacks

    for (const [sessionId, player] of this.state.players) {
      if (player.isDown || player.isDisconnected) continue;

      // REGEN: heal 2 HP/sec via fractional accumulator (prevents instant full-heal)
      if (player.skillIds.toArray().includes('REGEN')) {
        const accum = (this.regenAccum.get(sessionId) ?? 0) + 2 * this.DT;
        const whole = Math.floor(accum);
        this.regenAccum.set(sessionId, accum - whole);
        if (whole > 0) player.hp = Math.min(player.maxHp, player.hp + whole);
      }

      const cooldown = this.attackCooldowns.get(sessionId) ?? 0;
      if (cooldown > 0) {
        this.attackCooldowns.set(sessionId, cooldown - 60);
        continue;
      }

      const stats = this.getEffectiveStats(player);  // 9.4: includes equipment + skill bonuses

      const auraMult = this.getAuraMultiplier(sessionId);
      let attackDamage = Math.round(stats.attackDamage * auraMult);

      // Skill modifiers on attack
      const skills = player.skillIds.toArray();
      // CRITICAL: 25% chance to deal 2x damage
      if (skills.includes('CRITICAL') && Math.random() < 0.25) attackDamage *= 2;
      // BERSERKER: bonus damage scaling with missing HP (up to +50% at 0 HP)
      if (skills.includes('BERSERKER')) {
        const missingHpRatio = 1 - player.hp / Math.max(1, player.maxHp);
        attackDamage = Math.round(attackDamage * (1 + 0.5 * missingHpRatio));
      }

      // 10.6: In BOSS_BATTLE players attack the boss automatically (no friendly fire)
      if (this.state.gameState === 'BOSS_BATTLE') {
        const boss = this.state.boss;
        if (!boss.id || boss.hp <= 0) continue;
        const dx = boss.x - player.x;
        const dy = boss.y - player.y;
        if (dx * dx + dy * dy > stats.attackRange * stats.attackRange) continue;

        boss.hp = Math.max(0, boss.hp - attackDamage);
        player.totalDamage += attackDamage;  // 13.1

        if (skills.includes('LIFESTEAL')) {
          this.restoreHp(sessionId, Math.round(attackDamage * 0.2));
        }
        if (skills.includes('MULTI_STRIKE')) {
          const extra = Math.round(attackDamage * 0.5);
          boss.hp = Math.max(0, boss.hp - extra);
          player.totalDamage += extra;
        }

        this.attackCooldowns.set(sessionId, ATTACK_COOLDOWN);

        if (boss.hp <= 0 && this.state.gameState === 'BOSS_BATTLE') {
          this.startPostBossSelection();
        }
        continue;
      }

      // SURVIVAL_PHASE: find nearest enemy within effective range
      let nearestId: string | null = null;
      let nearestDist = Infinity;
      for (const [id, enemy] of this.state.enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < stats.attackRange && dist < nearestDist) {
          nearestDist = dist;
          nearestId = id;
        }
      }

      if (!nearestId) continue;

      const target = this.state.enemies.get(nearestId)!;
      target.hp -= attackDamage;
      player.totalDamage += attackDamage;  // 13.1
      this.attackCooldowns.set(sessionId, ATTACK_COOLDOWN);

      // LIFESTEAL: restore 20% of damage dealt as HP
      if (skills.includes('LIFESTEAL')) {
        this.restoreHp(sessionId, Math.round(attackDamage * 0.2));
      }

      // MULTI_STRIKE: hit a second random enemy for half damage
      if (skills.includes('MULTI_STRIKE')) {
        for (const [id2, enemy2] of this.state.enemies) {
          if (id2 === nearestId) continue;
          const dx2 = enemy2.x - player.x;
          const dy2 = enemy2.y - player.y;
          if (Math.sqrt(dx2 * dx2 + dy2 * dy2) < stats.attackRange) {
            enemy2.hp -= Math.round(attackDamage * 0.5);
            player.totalDamage += Math.round(attackDamage * 0.5);
            if (enemy2.hp <= 0) {
              player.killCount += 1;
              this.state.enemies.delete(id2);
              this.grantXp(sessionId, enemy2.type === 'elite' ? 50 : 30);
            }
            break;  // only one extra target
          }
        }
      }

      if (target.hp <= 0) {
        player.killCount += 1;  // 13.1
        const xpReward = target.type === 'elite' ? 50 : 30;
        const hpRestore = target.type === 'elite' ? 10 : 3;
        const wasElite  = target.type === 'elite';
        this.state.enemies.delete(nearestId);
        this.attackCooldowns.delete(nearestId);
        this.grantXp(sessionId, xpReward);
        this.restoreHp(sessionId, hpRestore);
        // Respawn a basic enemy after 8s to maintain pressure (elite: no respawn, it has its own timer)
        if (!wasElite && this.state.gameState === 'SURVIVAL_PHASE') {
          this.clock.setTimeout(() => {
            if (this.state.gameState !== 'SURVIVAL_PHASE') return;
            const node = GameRoom.SPAWN_NODES[Math.floor(Math.random() * GameRoom.SPAWN_NODES.length)]!;
            const e = new EnemySchema();
            e.id = crypto.randomUUID();
            e.type = 'basic';
            e.x = node.x; e.y = node.y;
            e.maxHp = 50; e.hp = 50;
            this.state.enemies.set(e.id, e);
          }, 8_000);
        }
      }
    }
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
    for (const [, player] of this.state.players) {
      const stats = this.getEffectiveStats(player);  // 9.4: equipment is empty at start, same as base
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
    this.lastDownedAt.clear();
    this.inputBuffer.clear();

    // Reset each player to lobby state
    for (const [, player] of this.state.players) {
      player.hp = 0;
      player.maxHp = 0;
      player.xp = 0;
      player.level = 1;
      player.skillIds.splice(0, player.skillIds.length);
      player.weaponId = '';
      player.weaponLevel = 0;
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
