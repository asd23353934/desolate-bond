/**
 * Skill pool definitions.
 * Each class has a dedicated pool; all classes also draw from the common pool.
 * Task 8.3 implements the draw logic (3 options per level-up).
 * Task 8.4 adds cooperative skills for SUPPORT.
 */

export const CLASS_SKILL_POOLS: Record<string, string[]> = {
  TANK:    ['IRON_SKIN', 'SHIELD', 'BARRIER', 'FORTIFY'],
  DAMAGE:  ['POWER_UP', 'MULTI_STRIKE', 'SWIFT_FEET', 'CRITICAL', 'BERSERKER'],
  SUPPORT: ['HEAL', 'REGEN', 'TEAM_HEAL', 'REVIVE_BOOST', 'AURA'],
};

export const COMMON_SKILL_POOL: string[] = [
  'SPEED_UP', 'LIFESTEAL', 'DODGE', 'TOUGH',
];

/** Repeatable stat boost IDs shown as fallback when all skills are maxed. */
export const STAT_BOOST_IDS = ['STAT_HP', 'STAT_ATK', 'STAT_SPD', 'STAT_REGEN'] as const;

/** All valid skill IDs across every pool (includes stat boosts). */
export const ALL_SKILL_IDS = new Set([
  ...Object.values(CLASS_SKILL_POOLS).flat(),
  ...COMMON_SKILL_POOL,
  ...STAT_BOOST_IDS,
]);

export interface CoopSkillDef {
  range: number;        // pixels
  effect: 'HEAL_TICK' | 'ATTACK_BOOST';
  value: number;        // HP per trigger, or attack multiplier
  cooldownMs?: number;  // required for HEAL_TICK
}

/** Support class cooperative skills that affect nearby teammates (including Bots). */
export const COOPERATIVE_SKILLS: Record<string, CoopSkillDef> = {
  TEAM_HEAL: { range: 150, effect: 'HEAL_TICK',    value: 1,    cooldownMs: 1_000 },
  AURA:      { range: 150, effect: 'ATTACK_BOOST', value: 1.10 },
};
