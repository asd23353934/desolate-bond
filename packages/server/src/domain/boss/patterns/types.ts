import type { MapSchema } from '@colyseus/schema';
import type { BossSchema, PlayerSchema, ProjectileSchema } from '../../../infrastructure/colyseus/LobbySchema.js';
import type { BossAttackPattern } from '../../entities/BossDefs.js';

export interface TelegraphGeom {
  x: number;
  y: number;
  radius?: number;
  angle?: number;
  arcSpan?: number;
  length?: number;
  width?: number;
}

export interface BossPatternContext {
  boss: BossSchema;
  players: MapSchema<PlayerSchema>;
  /** Damage scaling multiplier from DifficultyScaling (player-count scaled). */
  damageScale: number;
  /** Nearest non-downed player snapshot, or null if none alive. */
  nearestPlayer: { x: number; y: number; dist: number } | null;
  damagePlayer(sessionId: string, amount: number): void;
  scheduleTelegraph(
    shape: 'CIRCLE' | 'SECTOR' | 'LINE',
    geom: TelegraphGeom,
    leadMs: number,
    resolve: () => void,
  ): string;
  broadcast(type: string, payload: unknown): void;
  addProjectile(proj: ProjectileSchema, ttlMs: number, onExpire: () => void): void;
  /** Spawn a minion enemy at (x, y). Used by SUMMON pattern. */
  spawnMinion(type: 'basic' | 'ranged', x: number, y: number): void;
}

export interface BossPattern {
  id: string;
  execute(ctx: BossPatternContext, pattern: BossAttackPattern): void;
}
