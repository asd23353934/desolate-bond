import type { BossPattern } from './types.js';

const LEAD_MS = 800;

/** AREA: larger windup circle telegraph centered on boss, resolves with AOE damage. */
export const areaPattern: BossPattern = {
  id: 'AREA',
  execute(ctx, pattern) {
    const { boss } = ctx;
    const cx = boss.x;
    const cy = boss.y;
    const radius = pattern.radius && pattern.radius > 0 ? pattern.radius : pattern.range;
    const dmg = Math.round(pattern.damage * ctx.damageScale);
    ctx.scheduleTelegraph(
      'CIRCLE',
      { x: cx, y: cy, radius },
      LEAD_MS,
      () => {
        // Hit-test against the telegraphed position, not the boss's live position —
        // otherwise the red warning on-screen lies about where damage lands.
        for (const [sessionId, player] of ctx.players) {
          if (player.isDown || player.isDisconnected) continue;
          const dx = player.x - cx;
          const dy = player.y - cy;
          if (dx * dx + dy * dy <= radius * radius) {
            ctx.damagePlayer(sessionId, dmg);
          }
        }
        ctx.broadcast('BOSS_AREA_ATTACK', { x: cx, y: cy, radius });
      },
    );
  },
};
