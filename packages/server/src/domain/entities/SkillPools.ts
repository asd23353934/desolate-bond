/**
 * Skill pool definitions.
 * Each class has a dedicated pool; all classes also draw from the common pool.
 * Task 8.3 implements the draw logic (3 options per level-up).
 * Task 8.4 adds cooperative skills for SUPPORT.
 */

export const CLASS_SKILL_POOLS: Record<string, string[]> = {
  TANK:    ['IRON_SKIN', 'SHIELD', 'BARRIER', 'TAUNT', 'FORTIFY'],
  DAMAGE:  ['POWER_UP', 'MULTI_STRIKE', 'SWIFT_FEET', 'CRITICAL', 'BERSERKER'],
  SUPPORT: ['HEAL', 'REGEN', 'TEAM_HEAL', 'REVIVE_BOOST', 'AURA'],
};

export const COMMON_SKILL_POOL: string[] = [
  'SPEED_UP', 'LIFESTEAL', 'DODGE', 'TOUGH',
];

/** All valid skill IDs across every pool. */
export const ALL_SKILL_IDS = new Set([
  ...Object.values(CLASS_SKILL_POOLS).flat(),
  ...COMMON_SKILL_POOL,
]);
