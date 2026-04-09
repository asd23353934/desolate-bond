/**
 * GameScene — main Phaser 3 scene for the survival and boss phases.
 *
 * Asset conventions (tasks 15.1–15.6):
 *   public/assets/sprites/tiny-dungeon.png      — Kenney Tiny Dungeon spritesheet (16×16 tiles)
 *   public/assets/sprites/tiny-dungeon.json     — atlas JSON
 *   public/assets/tilemaps/map.json             — Tiled map (Kenney Tiny Town tileset)
 *   public/assets/sprites/tiny-town.png         — Kenney Tiny Town tileset image
 *   public/assets/sprites/ui-pack.png           — Kenney UI Pack spritesheet
 *   public/assets/sprites/ui-pack.json          — atlas JSON
 *   public/assets/sprites/fx-attack.png         — OpenGameArt attack particle sheet
 *   public/assets/sprites/fx-levelup.png        — OpenGameArt level-up effect sheet
 *   public/assets/audio/sfx-attack.ogg          — Freesound attack SFX
 *   public/assets/audio/sfx-hurt.ogg            — Freesound hurt SFX
 *   public/assets/audio/sfx-levelup.ogg         — Freesound level-up SFX
 *   public/assets/audio/sfx-rescue.ogg          — Freesound rescue SFX
 *   public/assets/audio/bgm-survival.ogg        — OpenGameArt survival BGM (loop)
 *   public/assets/audio/bgm-boss.ogg            — OpenGameArt boss BGM (loop)
 *
 * If asset files are missing at runtime the scene falls back to colored rectangle placeholders.
 */

import Phaser from 'phaser';
import type { Room } from 'colyseus.js';
import { getStateCallbacks } from 'colyseus.js';
import { RemotePlayerInterpolator, LERP_ALPHA } from '../../domain/RemotePlayerInterpolator.js';
import type { KeyBindings, GraphicsQuality } from '../../application/useGameSettings.js';

// Fallback colors when Kenney sprites are not loaded
const COLOR_LOCAL_PLAYER  = 0x4488ff;
const COLOR_REMOTE_PLAYER = 0xff8844;
const COLOR_BOT_PLAYER    = 0x88cc44;
const COLOR_ENEMY         = 0xcc3333;
const COLOR_ELITE_ENEMY   = 0xff6600;
const COLOR_HEALTH_PACK   = 0xff4444;
const COLOR_WEAPON        = 0xddaa00;
const COLOR_PASSIVE       = 0x9944cc;
const COLOR_UPGRADE_STONE = 0x44cccc;
const COLOR_FLOOR         = 0x2a4a2a;
const COLOR_WALL          = 0x555555;
const COLOR_BOSS          = 0xaa0000;

const WORLD_WIDTH     = 1600;
const WORLD_HEIGHT    = 1200;
const SCREEN_WIDTH    = 800;   // Phaser canvas width (viewport)
const SCREEN_HEIGHT   = 600;   // Phaser canvas height (viewport)
const WALL_THICKNESS  = 32;
const HUD_DEPTH       = 10;

export class GameScene extends Phaser.Scene {
  private room!: Room;
  private localSessionId!: string;
  private keyBindings!: KeyBindings;
  private graphicsQuality!: GraphicsQuality;
  private showDamageNumbers!: boolean;
  private volume!: number;

  private assetsLoaded = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private $!: (instance: any) => any;

  // Sprites
  private localSprite?: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  private remoteSprites       = new Map<string, Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image>();
  private remoteInterpolators = new Map<string, RemotePlayerInterpolator>();
  private enemySprites        = new Map<string, Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image>();
  private itemSprites         = new Map<string, Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image>();
  private bossSprite?: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  private bossHpBar?: { bg: Phaser.GameObjects.Rectangle; fill: Phaser.GameObjects.Rectangle };

  // HUD elements (task 15.3)
  private hudHpText?: Phaser.GameObjects.Text;
  private hudTimerText?: Phaser.GameObjects.Text;
  private hudRoundText?: Phaser.GameObjects.Text;
  private hudLevelText?: Phaser.GameObjects.Text;
  private hudXpBar?: { bg: Phaser.GameObjects.Rectangle; fill: Phaser.GameObjects.Rectangle };

  // Audio (tasks 15.5, 15.6)
  private bgmSurvival?: Phaser.Sound.BaseSound;
  private bgmBoss?: Phaser.Sound.BaseSound;
  private currentBgm?: Phaser.Sound.BaseSound;

  // Downed / spectator state
  private localIsDown = false;
  private rescueFlash?: Phaser.GameObjects.Arc;
  private spaceKey?: Phaser.Input.Keyboard.Key;

  // Minimap
  private minimapGfx?: Phaser.GameObjects.Graphics;

  // Teammate arrows (screen-edge indicators)
  private teammateArrows = new Map<string, Phaser.GameObjects.Graphics>();

  // Schema-synced projectile sprites (ranged enemy attacks — server-authoritative travel + collision)
  private projectileSprites = new Map<string, Phaser.GameObjects.Arc>();

  // Rescue progress bars displayed above downed players' heads (targetId → bar graphics)
  private rescueBars = new Map<string, { bg: Phaser.GameObjects.Rectangle; fill: Phaser.GameObjects.Rectangle }>();

  // Guard flag: Colyseus state callbacks survive scene destruction; skip Phaser work when false
  private sceneAlive = true;

  // Input
  private boundKeys?: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    rescue: Phaser.Input.Keyboard.Key;
  };
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: {
    room: Room;
    localSessionId: string;
    keyBindings: KeyBindings;
    graphicsQuality?: GraphicsQuality;
    showDamageNumbers?: boolean;
    volume?: number;
  }) {
    this.room = data.room;
    this.$ = getStateCallbacks(data.room) as (instance: any) => any;
    this.localSessionId = data.localSessionId;
    this.keyBindings = data.keyBindings;
    this.graphicsQuality  = data.graphicsQuality  ?? 'high';
    this.showDamageNumbers = data.showDamageNumbers ?? true;
    this.volume = data.volume ?? 0.7;
  }

  /** 15.1/15.2/15.3/15.4/15.5/15.6: Load all Kenney + OpenGameArt assets.
   *  Each load call uses a key; missing files are silently ignored at runtime by Phaser. */
  preload() {
    // 15.1: Kenney Tiny Dungeon — characters and monsters (16×16 spritesheet)
    this.load.atlas('tiny-dungeon', 'assets/sprites/tiny-dungeon.png', 'assets/sprites/tiny-dungeon.json');

    // 15.2: Kenney Tiny Town — tilemap + tileset
    this.load.tilemapTiledJSON('map', 'assets/tilemaps/map.json');
    this.load.image('tiny-town', 'assets/sprites/tiny-town.png');

    // 15.3: Kenney UI Pack — HUD elements
    this.load.atlas('ui-pack', 'assets/sprites/ui-pack.png', 'assets/sprites/ui-pack.json');

    // 15.4: OpenGameArt effects
    this.load.spritesheet('fx-attack',  'assets/sprites/fx-attack.png',  { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('fx-levelup', 'assets/sprites/fx-levelup.png', { frameWidth: 48, frameHeight: 48 });

    // 15.5: Freesound SFX
    this.load.audio('sfx-attack',  'assets/audio/sfx-attack.ogg');
    this.load.audio('sfx-hurt',    'assets/audio/sfx-hurt.ogg');
    this.load.audio('sfx-levelup', 'assets/audio/sfx-levelup.ogg');
    this.load.audio('sfx-rescue',  'assets/audio/sfx-rescue.ogg');

    // 15.6: OpenGameArt BGM
    this.load.audio('bgm-survival', 'assets/audio/bgm-survival.ogg');
    this.load.audio('bgm-boss',     'assets/audio/bgm-boss.ogg');

    // Track whether assets loaded successfully
    this.load.on('complete', () => { this.assetsLoaded = true; });
  }

  create() {
    // Mark scene dead on any teardown path (stop OR full game.destroy).
    // Colyseus state callbacks survive scene destruction and keep firing on this
    // instance; sceneAlive=false makes every callback bail out immediately.
    this.events.once('shutdown', () => { this.sceneAlive = false; });
    this.events.once('destroy',  () => { this.sceneAlive = false; });

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.setupAnimations();
    this.createMap();
    this.setupInput();
    this.setupHUD();
    this.setupRoomListeners();
    this.setupEnemyListeners();
    this.setupItemListeners();
    this.setupBossListeners();
    this.setupProjectileListeners();
    this.setupServerMessageListeners();
    this.setupAudio();
    this.setupMinimap();
  }

  // ----- Map -----

  /** 15.2: Load Kenney Tiny Town tilemap; fall back to placeholder rectangles if unavailable. */
  private createMap() {
    if (this.assetsLoaded && this.cache.tilemap.exists('map')) {
      const map = this.make.tilemap({ key: 'map' });
      const tiles = map.addTilesetImage('tiny-town', 'tiny-town');
      if (tiles) {
        map.createLayer('Ground', tiles, 0, 0);
        const wallLayer = map.createLayer('Walls', tiles, 0, 0);
        wallLayer?.setDepth(1);
        return;
      }
    }
    // Fallback placeholder map
    const inner = { x: WALL_THICKNESS, y: WALL_THICKNESS, w: WORLD_WIDTH - WALL_THICKNESS * 2, h: WORLD_HEIGHT - WALL_THICKNESS * 2 };
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, inner.w, inner.h, COLOR_FLOOR);
    const wallRects = [
      [WORLD_WIDTH / 2, WALL_THICKNESS / 2, WORLD_WIDTH, WALL_THICKNESS],
      [WORLD_WIDTH / 2, WORLD_HEIGHT - WALL_THICKNESS / 2, WORLD_WIDTH, WALL_THICKNESS],
      [WALL_THICKNESS / 2, WORLD_HEIGHT / 2, WALL_THICKNESS, WORLD_HEIGHT],
      [WORLD_WIDTH - WALL_THICKNESS / 2, WORLD_HEIGHT / 2, WALL_THICKNESS, WORLD_HEIGHT],
    ] as const;
    for (const [x, y, w, h] of wallRects) {
      this.add.rectangle(x, y, w, h, COLOR_WALL).setDepth(1);
    }
  }

  // ----- Animations -----

  private setupAnimations() {
    if (!this.assetsLoaded) return;
    if (this.textures.exists('fx-attack') && !this.anims.exists('fx-attack')) {
      this.anims.create({ key: 'fx-attack', frames: this.anims.generateFrameNumbers('fx-attack', { start: 0, end: 5 }), frameRate: 12, repeat: 0 });
    }
    if (this.textures.exists('fx-levelup') && !this.anims.exists('fx-levelup')) {
      this.anims.create({ key: 'fx-levelup', frames: this.anims.generateFrameNumbers('fx-levelup', { start: 0, end: 7 }), frameRate: 12, repeat: 0 });
    }
  }

  // ----- Audio (15.5/15.6) -----

  private setupAudio() {
    if (!this.assetsLoaded) return;
    if (this.cache.audio.exists('bgm-survival')) {
      this.bgmSurvival = this.sound.add('bgm-survival', { loop: true, volume: this.volume * 0.6 });
    }
    if (this.cache.audio.exists('bgm-boss')) {
      this.bgmBoss = this.sound.add('bgm-boss', { loop: true, volume: this.volume * 0.7 });
    }
    // Start survival BGM
    this.playBGM('survival');
  }

  private playBGM(type: 'survival' | 'boss') {
    const next = type === 'boss' ? this.bgmBoss : this.bgmSurvival;
    if (!next || next === this.currentBgm) return;
    this.currentBgm?.stop();
    this.currentBgm = next;
    next.play();
  }

  private playSFX(key: string) {
    if (!this.assetsLoaded || !this.cache.audio.exists(key)) return;
    this.sound.play(key, { volume: this.volume });
  }

  // ----- HUD (15.3) -----

  private setupHUD() {
    const style = { fontSize: '13px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 };
    // HP display
    this.hudHpText    = this.add.text(10, 8, 'HP: —', style).setDepth(HUD_DEPTH).setScrollFactor(0);
    // Round display
    this.hudRoundText = this.add.text(SCREEN_WIDTH / 2, 8, '', style).setOrigin(0.5, 0).setDepth(HUD_DEPTH).setScrollFactor(0);
    // Countdown timer
    this.hudTimerText = this.add.text(SCREEN_WIDTH - 10, 8, '', { ...style, align: 'right' }).setOrigin(1, 0).setDepth(HUD_DEPTH).setScrollFactor(0);

    // Level display (bottom-left)
    this.hudLevelText = this.add.text(10, SCREEN_HEIGHT - 36, 'Lv.1', style).setDepth(HUD_DEPTH).setScrollFactor(0);

    // XP bar (bottom, full width)
    const xpBarW = SCREEN_WIDTH - 20;
    this.hudXpBar = {
      bg:   this.add.rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 10, xpBarW, 8, 0x333333).setDepth(HUD_DEPTH).setScrollFactor(0),
      fill: this.add.rectangle(10, SCREEN_HEIGHT - 10, 0, 8, 0x44ccff).setDepth(HUD_DEPTH + 1).setOrigin(0, 0.5).setScrollFactor(0),
    };

    // Boss HP bar — hidden until boss is active
    this.bossHpBar = {
      bg:   this.add.rectangle(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 20, 400, 14, 0x330000).setDepth(HUD_DEPTH).setScrollFactor(0).setVisible(false),
      fill: this.add.rectangle(SCREEN_WIDTH / 2 - 200, SCREEN_HEIGHT - 20, 400, 14, 0xcc0000).setDepth(HUD_DEPTH + 1).setOrigin(0, 0.5).setScrollFactor(0).setVisible(false),
    };
  }

  // ----- Room/Player listeners -----

  private setupRoomListeners() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = this.room.state as any;
    const $ = this.$;

    $(state.players).onAdd((player: any, sessionId: string) => {
      if (!this.sceneAlive) return;
      const isLocal = sessionId === this.localSessionId;
      const sprite  = this.createPlayerSprite(player, isLocal);

      if (isLocal) {
        this.localSprite = sprite;
        this.cameras.main.startFollow(sprite, true, 0.1, 0.1);
        $(player).onChange(() => {
          if (!this.sceneAlive) return;
          this.localSprite?.setPosition(player.x, player.y);
          this.updateHUD(player, state);

          // 倒地狀態變化
          const wasDown = this.localIsDown;
          this.localIsDown = !!player.isDown;

          if (!wasDown && this.localIsDown) {
            // 剛倒下 → 開始觀看自己，server 會設 spectatingId
            this.localSprite?.setAlpha(0.35);
          }
          if (wasDown && !this.localIsDown) {
            // 被救起 → 恢復相機跟隨自己
            this.localSprite?.setAlpha(1.0);
            if (this.localSprite) this.cameras.main.startFollow(this.localSprite, true, 0.1, 0.1);
          }

          // 更新觀戰視角
          if (this.localIsDown && player.spectatingId) {
            this.updateSpectatorCamera(player.spectatingId);
          }
        });
      } else {
        this.remoteSprites.set(sessionId, sprite);
        this.remoteInterpolators.set(sessionId, new RemotePlayerInterpolator(player.x, player.y));
        $(player).onChange(() => {
          if (!this.sceneAlive) return;
          this.remoteInterpolators.get(sessionId)?.setTarget(player.x, player.y);
          // Show downed state
          const s = this.remoteSprites.get(sessionId);
          if (s) s.setAlpha(player.isDown ? 0.35 : 1.0);
        });
      }
    });

    $(state.players).onRemove((_player: unknown, sessionId: string) => {
      this.remoteSprites.get(sessionId)?.destroy();
      this.remoteSprites.delete(sessionId);
      this.remoteInterpolators.delete(sessionId);
      this.clearRescueBar(sessionId);
      if (sessionId === this.localSessionId) {
        this.localSprite?.destroy();
        this.localSprite = undefined;
      }
    });

    // Track game state changes for BGM
    $(state).onChange(() => {
      if (!this.sceneAlive) return;
      const gs = state.gameState;
      if (gs === 'BOSS_BATTLE') this.playBGM('boss');
      else if (gs === 'SURVIVAL_PHASE') this.playBGM('survival');
      // Update round/timer HUD
      this.hudRoundText?.setText(gs === 'LOBBY' ? '' : `第 ${state.currentRound} 關`);
    });
  }

  private createPlayerSprite(player: any, isLocal: boolean): Phaser.GameObjects.Rectangle {
    const color = isLocal ? COLOR_LOCAL_PLAYER : player.isBot ? COLOR_BOT_PLAYER : COLOR_REMOTE_PLAYER;
    return this.add.rectangle(player.x, player.y, 24, 24, color).setDepth(2);
  }

  private updateHUD(localPlayer: any, state: any) {
    this.hudHpText?.setText(`HP: ${localPlayer.hp}/${localPlayer.maxHp}`);
    const timeLeft = state.survivalTimeLeft as number;
    if (timeLeft > 0) {
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      this.hudTimerText?.setText(`${m}:${String(s).padStart(2, '0')}`);
    } else {
      this.hudTimerText?.setText('');
    }

    // Level & XP
    const lv  = localPlayer.level as number ?? 1;
    const xp  = localPlayer.xp   as number ?? 0;
    const threshold = lv * 100;
    this.hudLevelText?.setText(`Lv.${lv}`);
    if (this.hudXpBar) {
      const xpBarW = SCREEN_WIDTH - 20;
      const pct = Math.min(1, xp / threshold);
      this.hudXpBar.fill.setSize(xpBarW * pct, 8);
    }
  }

  // ----- Enemy listeners -----

  private setupEnemyListeners() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enemies = (this.room.state as any).enemies as Map<string, any>;
    const $ = this.$;

    $(enemies).onAdd((enemy: any, id: string) => {
      if (!this.sceneAlive) return;
      const color  = enemy.type === 'elite' ? COLOR_ELITE_ENEMY : enemy.type === 'ranged' ? 0x9955ff : COLOR_ENEMY;
      const size   = enemy.type === 'elite' ? 28 : 20;
      const sprite = this.add.rectangle(enemy.x, enemy.y, size, size, color).setDepth(2);
      this.enemySprites.set(id, sprite);
      let prevHp = enemy.hp as number;
      $(enemy).onChange(() => {
        if (!this.sceneAlive) return;
        sprite.setPosition(enemy.x, enemy.y);
        // 15.4: attack effect on damage taken
        if (enemy.hp < prevHp) {
          if (this.assetsLoaded && this.anims.exists('fx-attack')) {
            const fx = this.add.sprite(enemy.x, enemy.y, 'fx-attack').setDepth(3);
            fx.play('fx-attack').once('animationcomplete', () => fx.destroy());
          } else {
            // Fallback: orange flash circle
            const flash = this.add.circle(enemy.x, enemy.y, 14, 0xff6600, 0.85).setDepth(3);
            this.tweens.add({ targets: flash, alpha: 0, scaleX: 2, scaleY: 2, duration: 200, onComplete: () => flash.destroy() });
          }
          this.playSFX('sfx-attack');
        }
        // 14.2: floating damage number
        if (this.showDamageNumbers && enemy.hp < prevHp) {
          const dmg = prevHp - enemy.hp;
          const txt = this.add.text(enemy.x, enemy.y - 10, `-${dmg}`, { fontSize: '12px', color: '#ffee44', stroke: '#000', strokeThickness: 2 }).setDepth(4);
          this.tweens.add({ targets: txt, y: enemy.y - 35, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
        }
        prevHp = enemy.hp;
      });
    });

    $(enemies).onRemove((_enemy: unknown, id: string) => {
      this.enemySprites.get(id)?.destroy();
      this.enemySprites.delete(id);
    });
  }

  // ----- Item listeners -----

  private setupItemListeners() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (this.room.state as any).items as Map<string, any>;
    const $ = this.$;

    const itemColor = (type: string) => {
      if (type === 'HEALTH_PACK')   return COLOR_HEALTH_PACK;
      if (type === 'WEAPON')        return COLOR_WEAPON;
      if (type === 'PASSIVE')       return COLOR_PASSIVE;
      if (type === 'UPGRADE_STONE') return COLOR_UPGRADE_STONE;
      return 0xffffff;
    };

    $(items).onAdd((item: any, id: string) => {
      if (!this.sceneAlive) return;
      const sprite = this.add.rectangle(item.x, item.y, 16, 16, itemColor(item.type)).setDepth(1);
      this.itemSprites.set(id, sprite);
    });

    $(items).onRemove((_item: unknown, id: string) => {
      this.itemSprites.get(id)?.destroy();
      this.itemSprites.delete(id);
    });
  }

  // ----- Projectile listeners -----

  private setupProjectileListeners() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectiles = (this.room.state as any).projectiles as Map<string, any>;
    const $ = this.$;

    $(projectiles).onAdd((proj: any, id: string) => {
      if (!this.sceneAlive) return;
      // Only render moving (enemy) projectiles; boss projectiles have vx==0
      if (proj.vx === 0 && proj.vy === 0) return;
      const ball = this.add.circle(proj.x, proj.y, 5, 0x9955ff, 1).setDepth(4);
      this.projectileSprites.set(id, ball);
      $(proj).onChange(() => {
        if (!this.sceneAlive) return;
        ball.setPosition(proj.x, proj.y);
      });
    });

    $(projectiles).onRemove((_proj: unknown, id: string) => {
      this.projectileSprites.get(id)?.destroy();
      this.projectileSprites.delete(id);
    });
  }

  // ----- Boss listeners (15.1/10.2) -----

  private setupBossListeners() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const boss = (this.room.state as any).boss;
    if (!boss) return;

    this.$(boss).onChange(() => {
      if (!this.sceneAlive) return;
      if (!boss.id) {
        // Boss cleared
        this.bossSprite?.destroy();
        this.bossSprite = undefined;
        this.bossHpBar?.bg.setVisible(false);
        this.bossHpBar?.fill.setVisible(false);
        return;
      }
      if (!this.bossSprite) {
        this.bossSprite = this.add.rectangle(boss.x, boss.y, 40, 40, COLOR_BOSS).setDepth(2);
        this.bossHpBar?.bg.setVisible(true);
        this.bossHpBar?.fill.setVisible(true);
      }
      this.bossSprite.setPosition(boss.x, boss.y);
      // Update boss HP bar
      const pct = Math.max(0, boss.hp / boss.maxHp);
      const barW = 400;
      this.bossHpBar?.fill.setSize(barW * pct, 14);
      this.bossHpBar?.fill.setX(SCREEN_WIDTH / 2 - barW / 2);
    });
  }

  // ----- Server message listeners -----

  private setupServerMessageListeners() {
    // 15.6: Switch BGM on boss phase 2
    this.room.onMessage('BOSS_PHASE_CHANGE', () => {
      this.playSFX('sfx-hurt');
    });

    // 15.4/15.5: Level-up effect
    this.room.onMessage('LEVEL_UP', (_msg: unknown) => {
      this.playSFX('sfx-levelup');
      if (this.localSprite && this.assetsLoaded && this.anims.exists('fx-levelup')) {
        const { x, y } = this.localSprite;
        const fx = this.add.sprite(x, y, 'fx-levelup').setDepth(5);
        fx.play('fx-levelup').once('animationcomplete', () => fx.destroy());
      }
    });

    // 15.5: Rescue SFX + clear rescue bar
    this.room.onMessage('PLAYER_REVIVED', (msg: { targetId: string }) => {
      if (!this.sceneAlive) return;
      this.playSFX('sfx-rescue');
      this.clearRescueBar(msg.targetId);
    });

    // Rescue progress — show bar above downed player's head
    this.room.onMessage('RESCUE_PROGRESS', (msg: { targetId: string; progress: number }) => {
      if (!this.sceneAlive) return;
      this.updateRescueBar(msg.targetId, msg.progress);
    });

    // 15.5: Hurt SFX when local player takes damage
    this.room.onMessage('PLAYER_HURT', () => {
      this.playSFX('sfx-hurt');
    });

  }

  // ----- Minimap -----

  private readonly MM_W = 120;   // minimap width in pixels
  private readonly MM_H = 90;    // minimap height in pixels
  private readonly MM_X = SCREEN_WIDTH  - 128;  // top-right corner x
  private readonly MM_Y = 8;

  private setupMinimap() {
    this.minimapGfx = this.add.graphics().setDepth(HUD_DEPTH + 2).setScrollFactor(0);
  }

  private drawMinimap() {
    const gfx = this.minimapGfx;
    if (!gfx) return;
    gfx.clear();

    const mx = this.MM_X, my = this.MM_Y, mw = this.MM_W, mh = this.MM_H;
    const scaleX = mw / WORLD_WIDTH;
    const scaleY = mh / WORLD_HEIGHT;
    const toMM = (wx: number, wy: number) => ({ x: mx + wx * scaleX, y: my + wy * scaleY });

    // Background
    gfx.fillStyle(0x000000, 0.6);
    gfx.fillRect(mx, my, mw, mh);
    gfx.lineStyle(1, 0x888888, 0.8);
    gfx.strokeRect(mx, my, mw, mh);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = this.room.state as any;

    // Enemies — red dots
    gfx.fillStyle(0xff3333, 1);
    if (state?.enemies) {
      state.enemies.forEach((enemy: any) => {
        const p = toMM(enemy.x, enemy.y);
        gfx.fillRect(p.x - 1, p.y - 1, 2, 2);
      });
    }

    // Items — yellow dots
    gfx.fillStyle(0xffee44, 1);
    if (state?.items) {
      state.items.forEach((item: any) => {
        const p = toMM(item.x, item.y);
        gfx.fillRect(p.x - 1, p.y - 1, 2, 2);
      });
    }

    // Boss — dark red dot
    if (state?.boss?.id) {
      gfx.fillStyle(0xaa0000, 1);
      const p = toMM(state.boss.x, state.boss.y);
      gfx.fillCircle(p.x, p.y, 3);
    }

    // Remote players — orange dots
    gfx.fillStyle(0xff8844, 1);
    for (const [, sprite] of this.remoteSprites) {
      const p = toMM(sprite.x, sprite.y);
      gfx.fillCircle(p.x, p.y, 3);
    }

    // Local player — bright blue dot
    if (this.localSprite) {
      gfx.fillStyle(0x44aaff, 1);
      const p = toMM(this.localSprite.x, this.localSprite.y);
      gfx.fillCircle(p.x, p.y, 3);
    }
  }

  // ----- Input -----

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    const kb = this.keyBindings;
    const kc = (key: string, fallback: number) => key.length === 1 ? key.toUpperCase().charCodeAt(0) : fallback;
    this.boundKeys = {
      up:     this.input.keyboard!.addKey(kc(kb.up,     Phaser.Input.Keyboard.KeyCodes.W)),
      down:   this.input.keyboard!.addKey(kc(kb.down,   Phaser.Input.Keyboard.KeyCodes.S)),
      left:   this.input.keyboard!.addKey(kc(kb.left,   Phaser.Input.Keyboard.KeyCodes.A)),
      right:  this.input.keyboard!.addKey(kc(kb.right,  Phaser.Input.Keyboard.KeyCodes.D)),
      rescue: this.input.keyboard!.addKey(kc(kb.rescue, Phaser.Input.Keyboard.KeyCodes.F)),
    };
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  private updateSpectatorCamera(spectatingId: string) {
    const target = this.remoteSprites.get(spectatingId) ?? this.localSprite;
    if (target) this.cameras.main.startFollow(target, true, 0.1, 0.1);
  }

  // ----- Update loop -----

  private spectatingId = '';

  update() {
    for (const [sessionId, interpolator] of this.remoteInterpolators) {
      interpolator.update(LERP_ALPHA);
      this.remoteSprites.get(sessionId)?.setPosition(interpolator.x, interpolator.y);
    }

    if (this.localIsDown) {
      // Poll spectatingId from state every frame so camera follows immediately after CYCLE_VIEW
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state = this.room.state as any;
      const localPlayer = state?.players?.get?.(this.localSessionId);
      const currentSpectatingId: string = localPlayer?.spectatingId ?? '';
      if (currentSpectatingId && currentSpectatingId !== this.spectatingId) {
        this.spectatingId = currentSpectatingId;
        this.updateSpectatorCamera(currentSpectatingId);
      }
      this.updateDownedInput();
    } else {
      this.spectatingId = '';
      this.sendInput();
    }

    this.drawMinimap();
    this.drawTeammateArrows();
  }

  /** Draw screen-edge arrows pointing to out-of-view teammates. */
  private drawTeammateArrows() {
    if (!this.localSprite) return;

    const cam = this.cameras.main;
    const margin = 20;  // px from screen edge

    for (const [id, sprite] of this.remoteSprites) {
      // Convert teammate world position to screen coords
      const sx = sprite.x - cam.scrollX;
      const sy = sprite.y - cam.scrollY;

      if (!this.teammateArrows.has(id)) {
        this.teammateArrows.set(id, this.add.graphics().setDepth(HUD_DEPTH + 1).setScrollFactor(0));
      }
      const arrowGfx = this.teammateArrows.get(id)!;
      arrowGfx.clear();

      const inView = sx >= 0 && sx <= SCREEN_WIDTH && sy >= 0 && sy <= SCREEN_HEIGHT;
      if (inView) continue;  // no arrow when on screen

      // Arrow position: clamped to screen edge
      const cx = Math.max(margin, Math.min(SCREEN_WIDTH  - margin, sx));
      const cy = Math.max(margin, Math.min(SCREEN_HEIGHT - margin, sy));

      // Direction: from screen center toward teammate
      const angle = Math.atan2(sy - SCREEN_HEIGHT / 2, sx - SCREEN_WIDTH / 2);

      // Draw filled triangle pointing toward teammate
      const ARROW = 10;
      arrowGfx.fillStyle(0xff8844, 0.9);
      arrowGfx.beginPath();
      arrowGfx.moveTo(cx + Math.cos(angle) * ARROW,           cy + Math.sin(angle) * ARROW);
      arrowGfx.lineTo(cx + Math.cos(angle + 2.4) * ARROW * 0.6, cy + Math.sin(angle + 2.4) * ARROW * 0.6);
      arrowGfx.lineTo(cx + Math.cos(angle - 2.4) * ARROW * 0.6, cy + Math.sin(angle - 2.4) * ARROW * 0.6);
      arrowGfx.closePath();
      arrowGfx.fillPath();
    }

    // Clean up arrows for players who left
    for (const [id, gfx] of this.teammateArrows) {
      if (!this.remoteSprites.has(id)) {
        gfx.destroy();
        this.teammateArrows.delete(id);
      }
    }
  }

  /** 倒地狀態：F 求救 + Space 切換視角 */
  private updateDownedInput() {
    if (!this.boundKeys || !this.spaceKey) return;

    // Space — 切換觀戰視角
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.room.send('CYCLE_VIEW');
    }

    // F — 求救信號
    if (this.boundKeys.rescue.isDown) {
      this.room.send('RESCUE_PING');
      // 視覺反饋：本地 sprite 閃光（避免重複建立）
      if (!this.rescueFlash && this.localSprite) {
        const { x, y } = this.localSprite;
        this.rescueFlash = this.add.circle(x, y, 20, 0xffdd00, 0.7).setDepth(5);
        this.tweens.add({
          targets: this.rescueFlash,
          alpha: 0, scaleX: 2.5, scaleY: 2.5,
          duration: 400,
          onComplete: () => { this.rescueFlash?.destroy(); this.rescueFlash = undefined; },
        });
      }
    }
  }

  private sendInput() {
    if (!this.localSprite || !this.cursors || !this.boundKeys) return;

    const left   = this.cursors.left.isDown   || this.boundKeys.left.isDown;
    const right  = this.cursors.right.isDown  || this.boundKeys.right.isDown;
    const up     = this.cursors.up.isDown     || this.boundKeys.up.isDown;
    const down   = this.cursors.down.isDown   || this.boundKeys.down.isDown;

    this.room.send('PLAYER_INPUT', {
      dx: right ? 1 : left ? -1 : 0,
      dy: down  ? 1 : up   ? -1 : 0,
      rescue: false,  // rescue is now proximity-based on server; key no longer needed
    });
  }

  // ----- Rescue progress bars -----

  private updateRescueBar(targetId: string, progress: number) {
    const sprite = this.remoteSprites.get(targetId)
      ?? (targetId === this.localSessionId ? this.localSprite : undefined);
    if (!sprite) return;

    const BAR_W = 32;
    const BAR_H = 4;
    const BAR_OFFSET_Y = -20;  // above player sprite

    let bar = this.rescueBars.get(targetId);
    if (!bar) {
      const bg   = this.add.rectangle(sprite.x, sprite.y + BAR_OFFSET_Y, BAR_W, BAR_H, 0x333333).setDepth(6).setOrigin(0.5, 0.5);
      const fill = this.add.rectangle(sprite.x - BAR_W / 2, sprite.y + BAR_OFFSET_Y, 0, BAR_H, 0x44ff88).setDepth(7).setOrigin(0, 0.5);
      bar = { bg, fill };
      this.rescueBars.set(targetId, bar);
    }

    bar.bg.setPosition(sprite.x, sprite.y + BAR_OFFSET_Y);
    bar.fill.setPosition(sprite.x - BAR_W / 2, sprite.y + BAR_OFFSET_Y);
    bar.fill.setSize(BAR_W * Math.min(1, progress), BAR_H);
  }

  private clearRescueBar(targetId: string) {
    const bar = this.rescueBars.get(targetId);
    if (bar) { bar.bg.destroy(); bar.fill.destroy(); }
    this.rescueBars.delete(targetId);
  }
}
