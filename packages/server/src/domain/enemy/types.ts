import type { EnemySchema } from '../../infrastructure/colyseus/LobbySchema.js';
import type { TelegraphGeom } from '../boss/patterns/types.js';

export interface EnemyTargetInfo {
  x: number;
  y: number;
  id: string;
  dist: number;
  dx: number;   // target.x - enemy.x
  dy: number;   // target.y - enemy.y
}

export interface EnemyBehaviorContext {
  enemy: EnemySchema;
  nearestTarget: EnemyTargetInfo | null;
  dt: number;          // seconds per tick
  slowMult: number;    // 1 normal, 0.6 when slowed
  round: number;
  worldMinX: number;
  worldMaxX: number;
  worldMinY: number;
  worldMaxY: number;
  damagePlayer(sessionId: string, amount: number): void;
  /** Damage all non-downed players whose position falls within `radius` of (cx, cy). */
  damagePlayersInRadius(cx: number, cy: number, radius: number, amount: number): void;
  scheduleTelegraph(
    shape: 'CIRCLE' | 'SECTOR' | 'LINE',
    geom: TelegraphGeom,
    leadMs: number,
    resolve: () => void,
  ): string;
  spawnEnemyProjectile(x: number, y: number, angle: number, speed: number, damage: number): void;
  /** Current position of a player (by session id). Null if the player is gone/downed. */
  getPlayerPosition(sessionId: string): { x: number; y: number } | null;
  /** Remaining ms on an enemy-scoped cooldown key; missing keys return 0. */
  getCooldown(key: string): number;
  setCooldown(key: string, ms: number): void;
  /** Per-enemy local state bag (survives across ticks, keyed by enemy id). */
  getLocal<T = unknown>(): T | undefined;
  setLocal<T = unknown>(value: T): void;
}

export interface EnemyBehaviorConfig {
  type: string;
  baseHp(round: number): number;
  onTick(ctx: EnemyBehaviorContext): void;
  onDeath?(ctx: EnemyBehaviorContext): void;
}
