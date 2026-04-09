import { CLASS_SKILL_POOLS, COMMON_SKILL_POOL } from './SkillPools.js';

const CLASS_WEIGHT   = 3;
const COMMON_WEIGHT  = 1;
const UPGRADE_WEIGHT = 2;
const WEAPON_WEIGHT  = 3;
export const MAX_SKILL_LEVEL  = 3;
export const MAX_WEAPON_LEVEL = 5;

/**
 * Draw up to `count` skill options for a player.
 * Includes skills not yet owned (new), skills below max level (upgrades),
 * and weapon upgrade tokens (WEAPON_LEVEL / WEAPON2_LEVEL / WEAPON3_LEVEL) when applicable.
 * All three weapon slots are equal — no primary/secondary distinction.
 */
export function drawSkillOptions(
  playerClass: string,
  ownedSkills: string[],
  skillLevels: number[] = [],
  count = 3,
  weaponId: string = '',
  weaponLevel: number = 0,
  availableWeaponIds: string[] = [],  // weapons player can acquire (offered when a slot is empty)
  weapon2Id: string = '',
  weapon2Level: number = 0,
  weapon3Id: string = '',
  weapon3Level: number = 0,
): string[] {
  const ownedSet   = new Set(ownedSkills);
  const classPool  = (CLASS_SKILL_POOLS[playerClass] ?? []).filter(s => !ownedSet.has(s));
  const commonPool = COMMON_SKILL_POOL.filter(s => !ownedSet.has(s));

  // Skills already owned but below max level can be "upgraded"
  const upgradePool = ownedSkills.filter((id, i) => (skillLevels[i] ?? 1) < MAX_SKILL_LEVEL);

  // Already-equipped weapon ids (to avoid offering duplicates in other slots)
  const equippedWeapons = [weaponId, weapon2Id, weapon3Id].filter(Boolean);

  // Weapons available for each empty slot (excluding already-equipped)
  const slot1Candidates = availableWeaponIds.filter(wid => !equippedWeapons.includes(wid));
  const slot2Candidates = availableWeaponIds.filter(wid => wid !== weapon2Id && !equippedWeapons.includes(wid));
  const slot3Candidates = availableWeaponIds.filter(wid => wid !== weapon3Id && !equippedWeapons.includes(wid));

  const weighted: string[] = [
    ...classPool.flatMap(s  => Array<string>(CLASS_WEIGHT).fill(s)),
    ...commonPool.flatMap(s => Array<string>(COMMON_WEIGHT).fill(s)),
    ...upgradePool.flatMap(s => Array<string>(UPGRADE_WEIGHT).fill(s)),
    // Weapon upgrades (only when weapon is present and below max level)
    ...(weaponId  && weaponLevel  < MAX_WEAPON_LEVEL ? Array<string>(WEAPON_WEIGHT).fill('WEAPON_LEVEL')  : []),
    ...(weapon2Id && weapon2Level < MAX_WEAPON_LEVEL ? Array<string>(WEAPON_WEIGHT).fill('WEAPON2_LEVEL') : []),
    ...(weapon3Id && weapon3Level < MAX_WEAPON_LEVEL ? Array<string>(WEAPON_WEIGHT).fill('WEAPON3_LEVEL') : []),
    // Weapon acquisition: slot 1 if empty
    ...(!weaponId ? slot1Candidates.flatMap(wid => Array<string>(WEAPON_WEIGHT).fill(wid)) : []),
    // Weapon acquisition: slot 2 if slot 1 filled but slot 2 empty
    ...(weaponId && !weapon2Id ? slot2Candidates.flatMap(wid => Array<string>(WEAPON_WEIGHT).fill(`W2:${wid}`)) : []),
    // Weapon acquisition: slot 3 if slots 1&2 filled but slot 3 empty
    ...(weaponId && weapon2Id && !weapon3Id ? slot3Candidates.flatMap(wid => Array<string>(WEAPON_WEIGHT).fill(`W3:${wid}`)) : []),
  ];

  // Fallback: when all skills and weapons are maxed, offer repeatable stat boosts
  if (weighted.length === 0) {
    const fallback = ['STAT_HP', 'STAT_ATK', 'STAT_SPD', 'STAT_REGEN'];
    const shuffled = [...fallback].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  const chosen: string[]    = [];
  const remaining: string[] = [...weighted];

  while (chosen.length < count && remaining.length > 0) {
    const idx  = Math.floor(Math.random() * remaining.length);
    const pick = remaining[idx]!;
    if (!chosen.includes(pick)) chosen.push(pick);
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (remaining[i] === pick) remaining.splice(i, 1);
    }
  }

  return chosen;
}
