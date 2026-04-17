import type { BossPattern } from './types.js';

const LEAD_MS = 900;   // longer windup — beam is high damage
const BEAM_WIDTH = 50;

/** BEAM: charge-then-fire narrow line from boss through nearest player to pattern.range. */
export const beamPattern: BossPattern = {
  id: 'BEAM',
  execute(ctx, pattern) {
    const { boss, nearestPlayer } = ctx;
    if (!nearestPlayer) return;
    const angle = Math.atan2(nearestPlayer.y - boss.y, nearestPlayer.x - boss.x);
    const length = pattern.range;
    const dmg = Math.round(pattern.damage * ctx.damageScale);
    const originX = boss.x;
    const originY = boss.y;
    ctx.scheduleTelegraph(
      'LINE',
      { x: originX, y: originY, angle, length, width: BEAM_WIDTH },
      LEAD_MS,
      () => {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const halfW = BEAM_WIDTH / 2;
        for (const [sessionId, player] of ctx.players) {
          if (player.isDown || player.isDisconnected) continue;
          const rx = player.x - originX;
          const ry = player.y - originY;
          const along = rx * cos + ry * sin;
          const across = Math.abs(-rx * sin + ry * cos);
          if (along >= 0 && along <= length && across <= halfW) {
            ctx.damagePlayer(sessionId, dmg);
          }
        }
      },
    );
  },
};
