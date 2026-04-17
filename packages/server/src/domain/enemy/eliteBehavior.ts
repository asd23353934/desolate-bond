import type { EnemyBehaviorConfig } from './types.js';

const CONTACT_RANGE = 20;
const ELITE_DAMAGE = 10;
const MELEE_COOLDOWN_MS = 1200;
const AOE_COOLDOWN_MS = 6000;
const AOE_TRIGGER_RANGE = 180;
const AOE_RADIUS = 130;
const AOE_DAMAGE = 22;
const AOE_TELEGRAPH_LEAD_MS = 700;

type Phase = 'idle' | 'casting';

interface EliteLocal {
  phase: Phase;
}

/** Elite: fast melee chaser with a periodic telegraphed CIRCLE AOE attack. */
export const eliteBehavior: EnemyBehaviorConfig = {
  type: 'elite',
  baseHp(round) {
    return 400 + (round - 1) * 120;
  },
  onTick(ctx) {
    const { enemy, nearestTarget, dt, slowMult, round } = ctx;
    if (!nearestTarget) return;
    const speed = 95 + (round - 1) * 5;
    const local = ctx.getLocal<EliteLocal>() ?? { phase: 'idle' };

    if (local.phase === 'casting') return;  // frozen during AOE windup

    // AOE attack has priority when off-cooldown and a target is in range.
    const aoeKey = `enemy:${enemy.id}:aoe`;
    const aoeCd = ctx.getCooldown(aoeKey);
    if (aoeCd <= 0 && nearestTarget.dist <= AOE_TRIGGER_RANGE) {
      const cx = enemy.x;
      const cy = enemy.y;
      ctx.setLocal<EliteLocal>({ phase: 'casting' });
      ctx.setCooldown(aoeKey, AOE_COOLDOWN_MS + AOE_TELEGRAPH_LEAD_MS);
      ctx.scheduleTelegraph(
        'CIRCLE',
        { x: cx, y: cy, radius: AOE_RADIUS },
        AOE_TELEGRAPH_LEAD_MS,
        () => {
          ctx.setLocal<EliteLocal>({ phase: 'idle' });
          ctx.damagePlayersInRadius(cx, cy, AOE_RADIUS, AOE_DAMAGE);
        },
      );
      return;
    }
    ctx.setCooldown(aoeKey, Math.max(0, aoeCd - 60));

    // Chase + melee contact
    if (nearestTarget.dist >= 12) {
      const inv = 1 / nearestTarget.dist;
      enemy.x = Math.max(ctx.worldMinX, Math.min(ctx.worldMaxX, enemy.x + nearestTarget.dx * inv * speed * slowMult * dt));
      enemy.y = Math.max(ctx.worldMinY, Math.min(ctx.worldMaxY, enemy.y + nearestTarget.dy * inv * speed * slowMult * dt));
    }

    const cdKey = `enemy:${enemy.id}`;
    const cd = ctx.getCooldown(cdKey);
    if (nearestTarget.dist <= CONTACT_RANGE) {
      if (cd <= 0) {
        ctx.setCooldown(cdKey, MELEE_COOLDOWN_MS);
        ctx.damagePlayer(nearestTarget.id, ELITE_DAMAGE);
      } else {
        ctx.setCooldown(cdKey, Math.max(0, cd - 60));
      }
    } else if (cd > 0) {
      ctx.setCooldown(cdKey, Math.max(0, cd - 60));
    }
  },
};
