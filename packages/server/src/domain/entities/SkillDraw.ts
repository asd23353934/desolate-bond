import { CLASS_SKILL_POOLS, COMMON_SKILL_POOL } from './SkillPools.js';

const CLASS_WEIGHT  = 3;
const COMMON_WEIGHT = 1;

/**
 * Draw up to `count` skill options for a player.
 * Class-pool skills have higher weight (3×) than common skills (1×),
 * so class identity is reinforced while common skills still appear occasionally.
 */
export function drawSkillOptions(
  playerClass: string,
  ownedSkills: string[],
  count = 3,
): string[] {
  const owned = new Set(ownedSkills);
  const classPool  = (CLASS_SKILL_POOLS[playerClass] ?? []).filter((s) => !owned.has(s));
  const commonPool = COMMON_SKILL_POOL.filter((s) => !owned.has(s));

  // Build weighted candidate list
  const weighted: string[] = [
    ...classPool.flatMap((s) => Array(CLASS_WEIGHT).fill(s) as string[]),
    ...commonPool.flatMap((s) => Array(COMMON_WEIGHT).fill(s) as string[]),
  ];

  if (weighted.length === 0) return [];

  const chosen: string[] = [];
  const remaining = [...weighted];

  while (chosen.length < count && remaining.length > 0) {
    const idx = Math.floor(Math.random() * remaining.length);
    const pick = remaining[idx]!;

    if (!chosen.includes(pick)) chosen.push(pick);

    // Remove all occurrences of this skill to avoid re-picking
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (remaining[i] === pick) remaining.splice(i, 1);
    }
  }

  return chosen;
}
