/** Base stats for each player class. Task 8.2+ adjusts these via skills and equipment. */

export interface ClassStats {
  maxHp: number;
  attackDamage: number;   // base damage per hit
  speed: number;          // pixels per second
  healBonus: number;      // multiplier for healing received (1.0 = normal)
}

export const CLASS_STATS: Record<string, ClassStats> = {
  TANK:    { maxHp: 200, attackDamage: 8,  speed: 140, healBonus: 1.0 },
  DAMAGE:  { maxHp: 80,  attackDamage: 15, speed: 160, healBonus: 1.0 },
  SUPPORT: { maxHp: 120, attackDamage: 10, speed: 150, healBonus: 1.3 },
};

/** Fallback for unknown or unselected class. */
export const DEFAULT_CLASS_STATS: ClassStats = CLASS_STATS['DAMAGE']!;
