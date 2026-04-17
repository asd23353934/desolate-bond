import type { EnemyBehaviorConfig } from './types.js';

const RANGED_ATTACK_DIST = 200;
const RANGED_DAMAGE = 6;
const RANGED_PROJ_SPEED = 300;
const FIRE_COOLDOWN_MS = 1500;
const TELEGRAPH_LEAD_MS = 400;
const TELEGRAPH_LINE_LENGTH = 420;
const TELEGRAPH_LINE_WIDTH = 18;
const REPOSITION_MS = 500;
const REPOSITION_SPEED_BONUS = 1.4;

type Phase = 'idle' | 'telegraphing' | 'repositioning';

interface RangedLocal {
  phase: Phase;
  phaseUntilMs: number;
  sidestepDx: number;
  sidestepDy: number;
}

/** Ranged enemy: telegraphs a line before firing, repositions laterally after each shot. */
export const rangedBehavior: EnemyBehaviorConfig = {
  type: 'ranged',
  baseHp(round) {
    return 110 + (round - 1) * 25;
  },
  onTick(ctx) {
    const { enemy, nearestTarget, dt, slowMult, round } = ctx;
    if (!nearestTarget) return;
    const speed = 45 + (round - 1) * 3;
    const now = Date.now();
    const local = ctx.getLocal<RangedLocal>() ?? { phase: 'idle', phaseUntilMs: 0, sidestepDx: 0, sidestepDy: 0 };

    if (local.phase === 'repositioning') {
      if (now >= local.phaseUntilMs) {
        local.phase = 'idle';
      } else {
        const moveSpeed = speed * REPOSITION_SPEED_BONUS * slowMult * dt;
        enemy.x = Math.max(ctx.worldMinX, Math.min(ctx.worldMaxX, enemy.x + local.sidestepDx * moveSpeed));
        enemy.y = Math.max(ctx.worldMinY, Math.min(ctx.worldMaxY, enemy.y + local.sidestepDy * moveSpeed));
        ctx.setLocal(local);
        return;
      }
    }

    if (local.phase === 'telegraphing') {
      // Hold position while aiming — resolve callback will advance the state.
      ctx.setLocal(local);
      return;
    }

    // idle: keep preferred distance
    const inv = nearestTarget.dist > 0 ? 1 / nearestTarget.dist : 0;
    if (nearestTarget.dist > RANGED_ATTACK_DIST + 20) {
      enemy.x = Math.max(ctx.worldMinX, Math.min(ctx.worldMaxX, enemy.x + nearestTarget.dx * inv * speed * slowMult * dt));
      enemy.y = Math.max(ctx.worldMinY, Math.min(ctx.worldMaxY, enemy.y + nearestTarget.dy * inv * speed * slowMult * dt));
    } else if (nearestTarget.dist < RANGED_ATTACK_DIST - 20) {
      enemy.x = Math.max(ctx.worldMinX, Math.min(ctx.worldMaxX, enemy.x - nearestTarget.dx * inv * speed * slowMult * dt));
      enemy.y = Math.max(ctx.worldMinY, Math.min(ctx.worldMaxY, enemy.y - nearestTarget.dy * inv * speed * slowMult * dt));
    }

    const cdKey = `enemy:${enemy.id}`;
    const cd = ctx.getCooldown(cdKey);
    if (cd <= 0 && nearestTarget.dist <= RANGED_ATTACK_DIST + 40) {
      // Commit to fire: schedule telegraph, freeze movement until resolve.
      const angle = Math.atan2(nearestTarget.dy, nearestTarget.dx);
      const originX = enemy.x;
      const originY = enemy.y;
      local.phase = 'telegraphing';
      ctx.setLocal(local);
      ctx.setCooldown(cdKey, FIRE_COOLDOWN_MS + TELEGRAPH_LEAD_MS);
      ctx.scheduleTelegraph(
        'LINE',
        { x: originX, y: originY, angle, length: TELEGRAPH_LINE_LENGTH, width: TELEGRAPH_LINE_WIDTH },
        TELEGRAPH_LEAD_MS,
        () => {
          ctx.spawnEnemyProjectile(enemy.x, enemy.y, angle, RANGED_PROJ_SPEED, RANGED_DAMAGE);
          const perpX = -Math.sin(angle);
          const perpY = Math.cos(angle);
          const side = Math.random() < 0.5 ? 1 : -1;
          const next: RangedLocal = {
            phase: 'repositioning',
            phaseUntilMs: Date.now() + REPOSITION_MS,
            sidestepDx: perpX * side,
            sidestepDy: perpY * side,
          };
          ctx.setLocal(next);
        },
      );
    } else {
      ctx.setCooldown(cdKey, Math.max(0, cd - 60));
      ctx.setLocal(local);
    }
  },
};
