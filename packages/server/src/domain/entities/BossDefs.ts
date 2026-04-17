/** Boss definitions for each of the 3 rounds. Stat scaling applied via DifficultyScaling.ts. */

import type { BossPatternId } from '../boss/patterns/registry.js';

export interface BossAttackPattern {
  /** Pattern id, looked up in BOSS_PATTERN_REGISTRY. */
  type: BossPatternId;
  damage: number;       // base damage per hit
  cooldownMs: number;   // ms between uses of this pattern
  range: number;        // trigger range (pixels); also melee hitbox / line length
  speed?: number;       // projectile/charge speed (px/s)
  radius?: number;      // area-of-effect radius (pixels)
}

export interface BossDef {
  id: string;
  name: string;
  baseHp: number;
  baseDamage: number;         // multiplier applied to all pattern damage
  moveSpeedPhase1: number;    // px/s
  moveSpeedPhase2: number;    // px/s — faster in phase 2
  phase1Patterns: BossAttackPattern[];
  phase2Patterns: BossAttackPattern[];  // replaces phase1 at 50% HP
}

export const BOSS_DEFS: Record<string, BossDef> = {
  GOLEM: {
    id: 'GOLEM',
    name: '石像魔',
    baseHp: 800,
    baseDamage: 1.0,
    moveSpeedPhase1: 45,
    moveSpeedPhase2: 70,
    phase1Patterns: [
      { type: 'MELEE',      damage: 20, cooldownMs: 1400, range: 55 },
      { type: 'CHARGE',     damage: 35, cooldownMs: 4500, range: 200, speed: 300 },
      { type: 'RING_BURST', damage: 18, cooldownMs: 7000, range: 0, radius: 220 },
    ],
    phase2Patterns: [
      { type: 'MELEE',      damage: 22, cooldownMs: 1100, range: 55 },
      { type: 'CHARGE',     damage: 38, cooldownMs: 3500, range: 220, speed: 340 },
      { type: 'RING_BURST', damage: 20, cooldownMs: 6000, range: 0, radius: 240 },
      { type: 'SUMMON',     damage: 0,  cooldownMs: 9000, range: 0, radius: 80 },
    ],
  },
  WRAITH: {
    id: 'WRAITH',
    name: '幽靈將軍',
    baseHp: 600,
    baseDamage: 1.0,
    moveSpeedPhase1: 65,
    moveSpeedPhase2: 95,
    phase1Patterns: [
      { type: 'PROJECTILE', damage: 18, cooldownMs: 1000, range: 350, speed: 200 },
      { type: 'AREA',       damage: 25, cooldownMs: 6000, range: 130, radius: 130 },
      { type: 'BEAM',       damage: 32, cooldownMs: 7500, range: 400 },
    ],
    phase2Patterns: [
      { type: 'PROJECTILE', damage: 18, cooldownMs: 700,  range: 350, speed: 250 },
      { type: 'AREA',       damage: 28, cooldownMs: 5000, range: 140, radius: 140 },
      { type: 'BEAM',       damage: 36, cooldownMs: 6000, range: 420 },
      { type: 'RING_BURST', damage: 18, cooldownMs: 8000, range: 0, radius: 200 },
    ],
  },
  DRAGON: {
    id: 'DRAGON',
    name: '龍王',
    baseHp: 1200,
    baseDamage: 1.0,
    moveSpeedPhase1: 53,
    moveSpeedPhase2: 82,
    phase1Patterns: [
      { type: 'MELEE',      damage: 25, cooldownMs: 1100, range: 70 },
      { type: 'PROJECTILE', damage: 20, cooldownMs: 2400, range: 380, speed: 220 },
      { type: 'AREA',       damage: 36, cooldownMs: 7000, range: 160, radius: 160 },
      { type: 'DASH_LINE',  damage: 38, cooldownMs: 6500, range: 260 },
    ],
    phase2Patterns: [
      { type: 'MELEE',      damage: 30, cooldownMs:  850, range: 70 },
      { type: 'PROJECTILE', damage: 22, cooldownMs: 1700, range: 380, speed: 280 },
      { type: 'AREA',       damage: 40, cooldownMs: 6000, range: 170, radius: 170 },
      { type: 'DASH_LINE',  damage: 42, cooldownMs: 5500, range: 280 },
      { type: 'BEAM',       damage: 45, cooldownMs: 7500, range: 420 },
    ],
  },
};

/** Maps round number (1–3) to the Boss def id for that round. */
export const BOSS_BY_ROUND: Record<number, string> = {
  1: 'GOLEM',
  2: 'WRAITH',
  3: 'DRAGON',
};
