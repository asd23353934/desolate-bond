import { ProjectileSchema } from '../../../infrastructure/colyseus/LobbySchema.js';
import type { BossPattern } from './types.js';

/** Shared ranged pattern used for both PROJECTILE and CHARGE ids (current behavior). */
function executeRanged(ctx: Parameters<BossPattern['execute']>[0], pattern: Parameters<BossPattern['execute']>[1]) {
  const { boss, nearestPlayer } = ctx;
  if (!nearestPlayer || nearestPlayer.dist > pattern.range) return;
  const angle = Math.atan2(nearestPlayer.y - boss.y, nearestPlayer.x - boss.x);
  const proj = new ProjectileSchema();
  proj.id = crypto.randomUUID();
  proj.x = boss.x;
  proj.y = boss.y;
  proj.angle = angle;
  const travelMs = Math.ceil((pattern.range / (pattern.speed ?? 200)) * 1000);
  const dmg = Math.round(pattern.damage * ctx.damageScale);
  const endX = boss.x + Math.cos(angle) * pattern.range;
  const endY = boss.y + Math.sin(angle) * pattern.range;
  ctx.addProjectile(proj, travelMs, () => {
    for (const [sessionId, player] of ctx.players) {
      if (player.isDown || player.isDisconnected) continue;
      const dx = player.x - endX;
      const dy = player.y - endY;
      if (dx * dx + dy * dy <= 30 * 30) {
        ctx.damagePlayer(sessionId, dmg);
      }
    }
  });
}

export const projectilePattern: BossPattern = {
  id: 'PROJECTILE',
  execute: executeRanged,
};

export const chargePattern: BossPattern = {
  id: 'CHARGE',
  execute: executeRanged,
};
