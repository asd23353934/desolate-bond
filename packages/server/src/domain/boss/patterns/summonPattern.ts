import type { BossPattern } from './types.js';

const LEAD_MS = 900;
const MINION_COUNT = 3;
const SPAWN_RADIUS = 80;  // minions appear within this radius of the telegraph center

/** SUMMON: telegraph a circle; at resolve, spawn a few basic minions at the center. */
export const summonPattern: BossPattern = {
  id: 'SUMMON',
  execute(ctx, pattern) {
    const { boss } = ctx;
    const radius = pattern.radius ?? SPAWN_RADIUS;
    // Spawn next to boss, offset toward nearest player so minions are threatening
    let cx = boss.x;
    let cy = boss.y;
    if (ctx.nearestPlayer) {
      const angle = Math.atan2(ctx.nearestPlayer.y - boss.y, ctx.nearestPlayer.x - boss.x);
      cx = boss.x + Math.cos(angle) * radius;
      cy = boss.y + Math.sin(angle) * radius;
    }
    ctx.scheduleTelegraph(
      'CIRCLE',
      { x: cx, y: cy, radius },
      LEAD_MS,
      () => {
        for (let i = 0; i < MINION_COUNT; i++) {
          const a = (i / MINION_COUNT) * Math.PI * 2;
          const r = radius * 0.5;
          ctx.spawnMinion('basic', cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        }
      },
    );
  },
};
