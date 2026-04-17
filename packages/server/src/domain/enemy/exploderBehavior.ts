import type { EnemyBehaviorConfig, EnemyBehaviorContext } from './types.js';

const CONTACT_RANGE = 22;
const EXPLOSION_RADIUS = 90;
const EXPLOSION_DAMAGE_CAP = 28;
const TELEGRAPH_LEAD_MS = 600;
const CHASE_BONUS = 1.15;

interface ExploderLocal {
  primed: boolean;
}

function detonate(ctx: EnemyBehaviorContext): void {
  const { enemy } = ctx;
  const cx = enemy.x;
  const cy = enemy.y;
  ctx.scheduleTelegraph(
    'CIRCLE',
    { x: cx, y: cy, radius: EXPLOSION_RADIUS },
    TELEGRAPH_LEAD_MS,
    () => {
      ctx.damagePlayersInRadius(cx, cy, EXPLOSION_RADIUS, EXPLOSION_DAMAGE_CAP);
    },
  );
}

/** Exploder: rushes players, primes a circular telegraph on contact or on death, then detonates. */
export const exploderBehavior: EnemyBehaviorConfig = {
  type: 'exploder',
  baseHp(round) {
    // Fragile glass cannon — one-shot from most weapons so players can disarm it.
    return 70 + (round - 1) * 15;
  },
  onTick(ctx) {
    const { enemy, nearestTarget, dt, slowMult, round } = ctx;
    if (!nearestTarget) return;
    const speed = (65 + (round - 1) * 5) * CHASE_BONUS;
    const local = ctx.getLocal<ExploderLocal>() ?? { primed: false };

    if (local.primed) return;  // already detonating — freeze in place

    if (nearestTarget.dist >= 8) {
      const inv = 1 / nearestTarget.dist;
      enemy.x = Math.max(ctx.worldMinX, Math.min(ctx.worldMaxX, enemy.x + nearestTarget.dx * inv * speed * slowMult * dt));
      enemy.y = Math.max(ctx.worldMinY, Math.min(ctx.worldMaxY, enemy.y + nearestTarget.dy * inv * speed * slowMult * dt));
    }

    if (nearestTarget.dist <= CONTACT_RANGE) {
      ctx.setLocal<ExploderLocal>({ primed: true });
      detonate(ctx);
    }
  },
  onDeath(ctx) {
    const local = ctx.getLocal<ExploderLocal>();
    if (local?.primed) return;  // already detonating from contact
    detonate(ctx);
  },
};
