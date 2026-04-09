/** Boss definitions for each of the 3 rounds. Stat scaling applied via DifficultyScaling.ts. */

export interface BossAttackPattern {
  type: 'MELEE' | 'PROJECTILE' | 'CHARGE' | 'AREA';
  damage: number;       // base damage per hit
  cooldownMs: number;   // ms between uses of this pattern
  range: number;        // trigger range (pixels); also melee hitbox
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
    moveSpeedPhase1: 55,
    moveSpeedPhase2: 85,
    phase1Patterns: [
      { type: 'MELEE', damage: 20, cooldownMs: 1200, range: 55 },
    ],
    phase2Patterns: [
      { type: 'MELEE',   damage: 20, cooldownMs: 1000, range: 55 },
      { type: 'CHARGE',  damage: 35, cooldownMs: 4000, range: 200, speed: 300 },
    ],
  },
  WRAITH: {
    id: 'WRAITH',
    name: '幽靈將軍',
    baseHp: 600,
    baseDamage: 1.0,
    moveSpeedPhase1: 80,
    moveSpeedPhase2: 115,
    phase1Patterns: [
      { type: 'PROJECTILE', damage: 18, cooldownMs: 900, range: 350, speed: 200 },
    ],
    phase2Patterns: [
      { type: 'PROJECTILE', damage: 18, cooldownMs: 650, range: 350, speed: 250 },
      { type: 'AREA',       damage: 25, cooldownMs: 5000, range: 130, radius: 130 },
    ],
  },
  DRAGON: {
    id: 'DRAGON',
    name: '龍王',
    baseHp: 1200,
    baseDamage: 1.0,
    moveSpeedPhase1: 65,
    moveSpeedPhase2: 100,
    phase1Patterns: [
      { type: 'MELEE',      damage: 25, cooldownMs: 1000, range: 70 },
      { type: 'PROJECTILE', damage: 20, cooldownMs: 2200, range: 380, speed: 220 },
    ],
    phase2Patterns: [
      { type: 'MELEE',      damage: 30, cooldownMs:  800, range: 70 },
      { type: 'PROJECTILE', damage: 20, cooldownMs: 1600, range: 380, speed: 280 },
      { type: 'AREA',       damage: 40, cooldownMs: 6000, range: 160, radius: 160 },
    ],
  },
};

/** Maps round number (1–3) to the Boss def id for that round. */
export const BOSS_BY_ROUND: Record<number, string> = {
  1: 'GOLEM',
  2: 'WRAITH',
  3: 'DRAGON',
};
