import { Room, Client, matchMaker } from '@colyseus/core';
import { LobbyState, PlayerSchema, EnemySchema, ItemSchema } from '../../infrastructure/colyseus/LobbySchema.js';
import { generateUniqueCode } from '../../domain/entities/RoomCode.js';
import { verifyToken } from '../../infrastructure/auth/jwtRoom.js';
import { GameSessionRepository } from '../../infrastructure/repositories/GameSessionRepository.js';
import type { GameSession, PlayerResult } from '../../domain/entities/GameSession.js';
import type { PlayerInput } from '../../domain/entities/PlayerInput.js';
import { scaleBossStats } from '../../domain/entities/DifficultyScaling.js';
import type { ScaledBossStats } from '../../domain/entities/DifficultyScaling.js';
import { CLASS_STATS, DEFAULT_CLASS_STATS } from '../../domain/entities/ClassDefs.js';
import { ALL_SKILL_IDS } from '../../domain/entities/SkillPools.js';
import { drawSkillOptions } from '../../domain/entities/SkillDraw.js';

const BOT_NAMES = ['勇者Bot', '鐵壁Bot', '治癒Bot', '疾風Bot'];
const TOTAL_ROUNDS = 3;
const SELECTION_TIMEOUT_MS = 30_000;
const GAME_OVER_RESULT_DELAY_MS = 3_000;

export class GameRoom extends Room<{ state: LobbyState; metadata: { roomCode: string } }> {
  maxClients = 4;

  private sessionRepo = new GameSessionRepository();
  private gameSession: GameSession | null = null;
  private sessionStartedAt = 0;
  private inputBuffer = new Map<string, PlayerInput>();
  private currentBossStats: ScaledBossStats | null = null;
  private attackCooldowns = new Map<string, number>();  // sessionId → ms remaining
  private survivalTimeLeftMs = 0;

  async onCreate(_options: unknown) {
    this.setState(new LobbyState());
    this.setPatchRate(60);

    const code = generateUniqueCode((c) => this.isCodeActive(c));
    this.state.roomCode = code;
    this.setMetadata({ roomCode: code });

    this.onMessage('SELECT_CLASS', (client, message: { playerClass: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isBot) return;
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
      this.state.players.set(bot.id, bot);
    });

    this.onMessage('REMOVE_BOT', (client, message: { botId: string }) => {
      const requester = this.state.players.get(client.sessionId);
      if (!requester?.isHost) return;

      const target = this.state.players.get(message.botId);
      if (!target?.isBot) return;
      this.state.players.delete(message.botId);
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

    // Triggered by boss HP logic in task 10
    this.onMessage('BOSS_DEFEATED', (_client, _message: unknown) => {
      if (this.state.gameState !== 'BOSS_BATTLE') return;
      this.state.gameState = 'POST_BOSS_SELECTION';
      this.clock.setTimeout(() => {
        if (this.state.gameState === 'POST_BOSS_SELECTION') {
          this.advanceAfterPostBoss();
        }
      }, SELECTION_TIMEOUT_MS);
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
      displayName: leaving.displayName,
      selectedClass: leaving.selectedClass,
      isDown: leaving.isDown,
      x: leaving.x,
      y: leaving.y,
    };

    this.clock.setTimeout(() => {
      this.state.players.delete(client.sessionId);

      const bot = new PlayerSchema();
      bot.id = `bot_${crypto.randomUUID()}`;
      bot.displayName = `${snapshot.displayName}(Bot)`;
      bot.isBot = true;
      bot.selectedClass = snapshot.selectedClass;
      bot.isDown = snapshot.isDown;
      bot.x = snapshot.x;
      bot.y = snapshot.y;
      bot.isReady = true;
      // HP, skills, and equipment will be inherited here once those systems exist (tasks 7–9)
      this.state.players.set(bot.id, bot);

      this.checkAllDowned();
    }, 3_000);
  }

  onDispose() {}

  private enterBossBattle(): void {
    // Base stats are defined per-boss in task 10; placeholders used until then
    const BASE_HP = 1000;
    const BASE_DAMAGE = 50;
    this.currentBossStats = scaleBossStats(BASE_HP, BASE_DAMAGE, this.playerCount());
    this.state.gameState = 'BOSS_BATTLE';
  }

  private tick(): void {
    if (this.state.gameState !== 'SURVIVAL_PHASE' && this.state.gameState !== 'BOSS_BATTLE') return;
    this.processMovement();
    this.processAutoAttack();
    if (this.state.gameState === 'SURVIVAL_PHASE') this.tickSurvivalTimer();
    // Bot AI will be added in task 11
    this.inputBuffer.clear();
  }

  private tickSurvivalTimer(): void {
    this.survivalTimeLeftMs -= 60;
    const seconds = Math.ceil(this.survivalTimeLeftMs / 1000);
    if (this.state.survivalTimeLeft !== seconds) {
      this.state.survivalTimeLeft = Math.max(0, seconds);
    }
    if (this.survivalTimeLeftMs <= 0) {
      this.state.gameState = 'PRE_BOSS_SELECTION';
      this.clock.setTimeout(() => {
        if (this.state.gameState === 'PRE_BOSS_SELECTION') {
          this.enterBossBattle();
        }
      }, SELECTION_TIMEOUT_MS);
    }
  }

  private restoreHp(sessionId: string, amount: number): void {
    const player = this.state.players.get(sessionId);
    if (!player || player.isDown) return;
    const healBonus = (CLASS_STATS[player.selectedClass] ?? DEFAULT_CLASS_STATS).healBonus;
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

      const client = this.clients.find((c) => c.sessionId === sessionId);
      if (client) this.send(client, 'LEVEL_UP', { level: player.level, options });
    }
  }

  // Predefined spawn node pool — positions are fixed on the placeholder map.
  // task 15.2 (real tilemap) will update these to match actual map layout.
  private static readonly SPAWN_NODES = [
    { x: 150, y: 120 }, { x: 300, y: 120 }, { x: 500, y: 120 }, { x: 650, y: 120 },
    { x: 150, y: 300 }, { x: 300, y: 300 }, { x: 500, y: 300 }, { x: 650, y: 300 },
    { x: 150, y: 480 }, { x: 300, y: 480 }, { x: 500, y: 480 }, { x: 650, y: 480 },
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
      this.state.items.set(item.id, item);
    });
  }

  private spawnInitialEnemies(): void {
    // Placeholder spawn positions — task 7.6 randomises from a node pool
    const spawnPoints = [
      { x: 200, y: 150 }, { x: 600, y: 150 },
      { x: 200, y: 450 }, { x: 600, y: 450 },
      { x: 400, y: 300 },
    ];
    for (const pos of spawnPoints) {
      const enemy = new EnemySchema();
      enemy.id = crypto.randomUUID();
      enemy.type = 'basic';
      enemy.x = pos.x;
      enemy.y = pos.y;
      enemy.maxHp = 80;
      enemy.hp    = 80;
      this.state.enemies.set(enemy.id, enemy);
    }
  }

  private processAutoAttack(): void {
    const ATTACK_RANGE    = 80;     // pixels
    const ATTACK_COOLDOWN = 500;    // ms between attacks

    for (const [sessionId, player] of this.state.players) {
      if (player.isDown || player.isDisconnected) continue;

      const cooldown = this.attackCooldowns.get(sessionId) ?? 0;
      if (cooldown > 0) {
        this.attackCooldowns.set(sessionId, cooldown - 60);
        continue;
      }

      // Find nearest enemy within range
      let nearestId: string | null = null;
      let nearestDist = Infinity;
      for (const [id, enemy] of this.state.enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ATTACK_RANGE && dist < nearestDist) {
          nearestDist = dist;
          nearestId = id;
        }
      }

      if (!nearestId) continue;

      const target = this.state.enemies.get(nearestId)!;
      const attackDamage = (CLASS_STATS[player.selectedClass] ?? DEFAULT_CLASS_STATS).attackDamage;
      target.hp -= attackDamage;
      this.attackCooldowns.set(sessionId, ATTACK_COOLDOWN);

      if (target.hp <= 0) {
        const xpReward = target.type === 'elite' ? 50 : 20;
        const hpRestore = target.type === 'elite' ? 10 : 3;
        this.state.enemies.delete(nearestId);
        this.attackCooldowns.delete(nearestId);
        this.grantXp(sessionId, xpReward);
        this.restoreHp(sessionId, hpRestore);
      }
    }
  }

  private applyClassStats(): void {
    for (const [, player] of this.state.players) {
      const stats = CLASS_STATS[player.selectedClass] ?? DEFAULT_CLASS_STATS;
      player.maxHp = stats.maxHp;
      player.hp    = stats.maxHp;
    }
  }

  private processMovement(): void {
    const DT = 60 / 1000;    // seconds per tick (60ms)

    const minX = 32 + 12;       // wall thickness + half sprite width
    const maxX = 800 - 32 - 12;
    const minY = 32 + 12;
    const maxY = 600 - 32 - 12;

    for (const [sessionId, input] of this.inputBuffer) {
      const player = this.state.players.get(sessionId);
      if (!player || player.isDown || player.isDisconnected) continue;

      const speed = (CLASS_STATS[player.selectedClass] ?? DEFAULT_CLASS_STATS).speed;
      let { x, y } = player;
      x += input.dx * speed * DT;
      y += input.dy * speed * DT;

      player.x = Math.max(minX, Math.min(maxX, x));
      player.y = Math.max(minY, Math.min(maxY, y));
    }
  }

  // Called by server combat logic (tasks 6+) when a player's HP reaches zero
  downPlayer(sessionId: string): void {
    const player = this.state.players.get(sessionId);
    if (!player || player.isDown) return;
    player.isDown = true;
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

    if (!this.gameSession) return;

    const now = Date.now();
    this.gameSession.endedAt = new Date(now);
    this.gameSession.round = this.state.currentRound;

    await this.sessionRepo.save(this.gameSession);

    const clearTime = cleared ? now - this.sessionStartedAt : null;
    const results: PlayerResult[] = [];

    for (const [, p] of this.state.players) {
      results.push({
        userId: p.id,
        displayName: p.displayName,
        isGuest: p.isGuest,
        playerClass: (p.selectedClass as 'TANK' | 'DAMAGE' | 'SUPPORT') || 'DAMAGE',
        totalDamage: 0,       // populated by combat system (task 6+)
        survivalTime: now - this.sessionStartedAt,
        cleared,
        clearTime,
      });
    }

    await this.sessionRepo.saveResults(this.gameSession.id, results);
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

  private isCodeActive(code: string): boolean {
    const rooms = matchMaker.query({ metadata: { roomCode: code } });
    return Array.isArray(rooms) && rooms.length > 0;
  }
}
