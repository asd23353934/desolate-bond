import type { EnemyBehaviorConfig } from './types.js';
import { basicBehavior } from './basicBehavior.js';
import { rangedBehavior } from './rangedBehavior.js';
import { eliteBehavior } from './eliteBehavior.js';
import { exploderBehavior } from './exploderBehavior.js';

export const ENEMY_BEHAVIOR_REGISTRY = {
  basic:    basicBehavior,
  ranged:   rangedBehavior,
  elite:    eliteBehavior,
  exploder: exploderBehavior,
} as const satisfies Record<string, EnemyBehaviorConfig>;

export type EnemyType = keyof typeof ENEMY_BEHAVIOR_REGISTRY;

const warnedTypes = new Set<string>();

export function getEnemyBehavior(type: string): EnemyBehaviorConfig {
  const cfg = (ENEMY_BEHAVIOR_REGISTRY as Record<string, EnemyBehaviorConfig>)[type];
  if (cfg) return cfg;
  if (!warnedTypes.has(type)) {
    warnedTypes.add(type);
    console.warn(`[enemy-behavior] unknown type "${type}", falling back to basic`);
  }
  return basicBehavior;
}
