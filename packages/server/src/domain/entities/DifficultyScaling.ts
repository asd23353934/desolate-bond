/**
 * Difficulty scales linearly with active player count.
 *
 * HP:     base × (1 + (count − 1) × 0.6)
 * Damage: base × (1 + (count − 1) × 0.4)
 *
 * 1 player → base values; 4 players → HP ×2.8, Damage ×2.2
 */

export interface ScaledBossStats {
  maxHp: number;
  damage: number;
}

export function scaleBossStats(baseHp: number, baseDamage: number, playerCount: number): ScaledBossStats {
  const count = Math.max(1, playerCount);
  return {
    maxHp:  Math.round(baseHp     * (1 + (count - 1) * 0.6)),
    damage: Math.round(baseDamage * (1 + (count - 1) * 0.4)),
  };
}
