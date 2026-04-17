import type { BossPattern } from './types.js';

const LEAD_MS = 450;

/** MELEE: short windup circle telegraph around boss, then damage anyone inside at resolve. */
export const meleePattern: BossPattern = {
  id: 'MELEE',
  execute(ctx, pattern) {
    const { boss } = ctx;
    const cx = boss.x;
    const cy = boss.y;
    const radius = pattern.range;
    const dmg = Math.round(pattern.damage * ctx.damageScale);
    ctx.scheduleTelegraph(
      'CIRCLE',
      { x: cx, y: cy, radius },
      LEAD_MS,
      () => {
        // Hit-test against the telegraphed position, not the boss's live position.
        for (const [sessionId, player] of ctx.players) {
          if (player.isDown || player.isDisconnected) continue;
          const dx = player.x - cx;
          const dy = player.y - cy;
          if (dx * dx + dy * dy <= radius * radius) {
            ctx.damagePlayer(sessionId, dmg);
          }
        }
      },
    );
  },
};
