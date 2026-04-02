import Phaser from 'phaser';
import type { Room } from 'colyseus.js';
import { RemotePlayerInterpolator, LERP_ALPHA } from '../../domain/RemotePlayerInterpolator.js';

// Placeholder colors — replaced by Kenney sprites in task 15.1
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

const MAP_WIDTH  = 800;
const MAP_HEIGHT = 600;
const WALL_THICKNESS = 32;

export class GameScene extends Phaser.Scene {
  private room!: Room;
  private localSessionId!: string;

  private localSprite?: Phaser.GameObjects.Rectangle;
  private remoteSprites      = new Map<string, Phaser.GameObjects.Rectangle>();
  private remoteInterpolators = new Map<string, RemotePlayerInterpolator>();

  private enemySprites = new Map<string, Phaser.GameObjects.Rectangle>();
  private itemSprites  = new Map<string, Phaser.GameObjects.Rectangle>();

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { room: Room; localSessionId: string }) {
    this.room = data.room;
    this.localSessionId = data.localSessionId;
  }

  create() {
    this.createPlaceholderMap();
    this.setupInput();
    this.setupRoomListeners();
    this.setupEnemyListeners();
    this.setupItemListeners();
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  /** Placeholder map using Graphics — task 15.2 replaces this with Kenney Tiny Town Tileset. */
  private createPlaceholderMap() {
    const inner = {
      x: WALL_THICKNESS,
      y: WALL_THICKNESS,
      w: MAP_WIDTH  - WALL_THICKNESS * 2,
      h: MAP_HEIGHT - WALL_THICKNESS * 2,
    };

    // Floor
    this.add.rectangle(MAP_WIDTH / 2, MAP_HEIGHT / 2, inner.w, inner.h, COLOR_FLOOR);

    // Walls (visual only — collision is server-side)
    const wallRects = [
      [MAP_WIDTH / 2, WALL_THICKNESS / 2,      MAP_WIDTH,       WALL_THICKNESS],  // top
      [MAP_WIDTH / 2, MAP_HEIGHT - WALL_THICKNESS / 2, MAP_WIDTH, WALL_THICKNESS], // bottom
      [WALL_THICKNESS / 2,      MAP_HEIGHT / 2, WALL_THICKNESS, MAP_HEIGHT],       // left
      [MAP_WIDTH - WALL_THICKNESS / 2, MAP_HEIGHT / 2, WALL_THICKNESS, MAP_HEIGHT], // right
    ] as const;

    for (const [x, y, w, h] of wallRects) {
      this.add.rectangle(x, y, w, h, COLOR_WALL).setDepth(1);
    }
  }

  private setupRoomListeners() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const players = (this.room.state as any).players as Map<string, any>;

    players.onAdd((player: any, sessionId: string) => {
      const color = sessionId === this.localSessionId
        ? COLOR_LOCAL_PLAYER
        : player.isBot ? COLOR_BOT_PLAYER : COLOR_REMOTE_PLAYER;

      const sprite = this.add.rectangle(player.x, player.y, 24, 24, color).setDepth(2);

      if (sessionId === this.localSessionId) {
        this.localSprite = sprite;
        // Local player position is also driven by server state (server-authoritative)
        player.onChange(() => {
          this.localSprite?.setPosition(player.x, player.y);
        });
      } else {
        this.remoteSprites.set(sessionId, sprite);
        this.remoteInterpolators.set(sessionId, new RemotePlayerInterpolator(player.x, player.y));
        player.onChange(() => {
          this.remoteInterpolators.get(sessionId)?.setTarget(player.x, player.y);
        });
      }
    });

    players.onRemove((_player: unknown, sessionId: string) => {
      this.remoteSprites.get(sessionId)?.destroy();
      this.remoteSprites.delete(sessionId);
      this.remoteInterpolators.delete(sessionId);
      if (sessionId === this.localSessionId) {
        this.localSprite?.destroy();
        this.localSprite = undefined;
      }
    });
  }

  update() {
    // Advance remote player interpolation every render frame
    for (const [sessionId, interpolator] of this.remoteInterpolators) {
      interpolator.update(LERP_ALPHA);
      this.remoteSprites.get(sessionId)?.setPosition(interpolator.x, interpolator.y);
    }
    this.sendInput();
  }

  private setupEnemyListeners() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enemies = (this.room.state as any).enemies as Map<string, any>;

    enemies.onAdd((enemy: any, id: string) => {
      const color  = enemy.type === 'elite' ? COLOR_ELITE_ENEMY : COLOR_ENEMY;
      const size   = enemy.type === 'elite' ? 28 : 20;
      const sprite = this.add.rectangle(enemy.x, enemy.y, size, size, color).setDepth(2);
      this.enemySprites.set(id, sprite);
      enemy.onChange(() => {
        sprite.setPosition(enemy.x, enemy.y);
      });
    });

    enemies.onRemove((_enemy: unknown, id: string) => {
      this.enemySprites.get(id)?.destroy();
      this.enemySprites.delete(id);
    });
  }

  private setupItemListeners() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (this.room.state as any).items as Map<string, any>;

    const itemColor = (type: string) => {
      if (type === 'HEALTH_PACK')   return COLOR_HEALTH_PACK;
      if (type === 'WEAPON')        return COLOR_WEAPON;
      if (type === 'PASSIVE')       return COLOR_PASSIVE;
      if (type === 'UPGRADE_STONE') return COLOR_UPGRADE_STONE;
      return 0xffffff;
    };

    items.onAdd((item: any, id: string) => {
      const sprite = this.add.rectangle(item.x, item.y, 16, 16, itemColor(item.type)).setDepth(1);
      this.itemSprites.set(id, sprite);
    });

    items.onRemove((_item: unknown, id: string) => {
      this.itemSprites.get(id)?.destroy();
      this.itemSprites.delete(id);
    });
  }

  private sendInput() {
    if (!this.localSprite || !this.cursors || !this.wasd) return;

    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown;

    this.room.send('PLAYER_INPUT', {
      dx: right ? 1 : left ? -1 : 0,
      dy: down  ? 1 : up   ? -1 : 0,
      rescue: false,
    });
  }
}
