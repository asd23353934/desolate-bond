import type { EnemyBehaviorConfig } from './types.js';

const CONTACT_RANGE = 20;
const MELEE_DAMAGE = 6;
const ATTACK_COOLDOWN_MS = 1200;
const TELEGRAPH_LEAD_MS = 400;
const LINE_LENGTH = 48;
const LINE_WIDTH = 28;

type Phase = 'idle' | 'winding';

interface BasicLocal {
  phase: Phase;
}

/** Basic melee: chases nearest player, telegraphs a LINE lunge, damages on resolve only if target is still inside the strip. */
export const basicBehavior: EnemyBehaviorConfig = {
  type: 'basic',
  baseHp(round) {
    return 180 + (round - 1) * 40;
  },
  onTick(ctx) {
    const { enemy, nearestTarget, dt, slowMult, round } = ctx;
    if (!nearestTarget) return;
    const speed = 65 + (round - 1) * 5;
    const local = ctx.getLocal<BasicLocal>() ?? { phase: 'idle' };

    if (local.phase === 'winding') return;

    if (nearestTarget.dist >= 12) {
      const inv = 1 / nearestTarget.dist;
      enemy.x = Math.max(ctx.worldMinX, Math.min(ctx.worldMaxX, enemy.x + nearestTarget.dx * inv * speed * slowMult * dt));
      enemy.y = Math.max(ctx.worldMinY, Math.min(ctx.worldMaxY, enemy.y + nearestTarget.dy * inv * speed * slowMult * dt));
    }

    const cdKey = `enemy:${enemy.id}`;
    const cd = ctx.getCooldown(cdKey);
    if (nearestTarget.dist <= CONTACT_RANGE && cd <= 0) {
      const angle = Math.atan2(nearestTarget.dy, nearestTarget.dx);
      const originX = enemy.x;
      const originY = enemy.y;
      const targetId = nearestTarget.id;
      const halfWidth = LINE_WIDTH / 2;
      ctx.setLocal<BasicLocal>({ phase: 'winding' });
      ctx.setCooldown(cdKey, ATTACK_COOLDOWN_MS + TELEGRAPH_LEAD_MS);
      ctx.scheduleTelegraph(
        'LINE',
        { x: originX, y: originY, angle, length: LINE_LENGTH, width: LINE_WIDTH },
        TELEGRAPH_LEAD_MS,
        () => {
          ctx.setLocal<BasicLocal>({ phase: 'idle' });
          const pos = ctx.getPlayerPosition(targetId);
          if (!pos) return;
          const px = pos.x - originX;
          const py = pos.y - originY;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const along = px * cos + py * sin;
          const across = -px * sin + py * cos;
          if (along >= -CONTACT_RANGE && along <= LINE_LENGTH && Math.abs(across) <= halfWidth) {
            ctx.damagePlayer(targetId, MELEE_DAMAGE);
          }
        },
      );
    } else if (cd > 0) {
      ctx.setCooldown(cdKey, Math.max(0, cd - 60));
    }
  },
};
