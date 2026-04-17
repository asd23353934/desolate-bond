import { meleePattern } from './meleePattern.js';
import { areaPattern } from './areaPattern.js';
import { projectilePattern, chargePattern } from './projectilePattern.js';
import { dashLinePattern } from './dashLinePattern.js';
import { ringBurstPattern } from './ringBurstPattern.js';
import { summonPattern } from './summonPattern.js';
import { beamPattern } from './beamPattern.js';
import type { BossPattern } from './types.js';

export const BOSS_PATTERN_REGISTRY = {
  MELEE: meleePattern,
  AREA: areaPattern,
  PROJECTILE: projectilePattern,
  CHARGE: chargePattern,
  DASH_LINE: dashLinePattern,
  RING_BURST: ringBurstPattern,
  SUMMON: summonPattern,
  BEAM: beamPattern,
} as const satisfies Record<string, BossPattern>;

export type BossPatternId = keyof typeof BOSS_PATTERN_REGISTRY;
