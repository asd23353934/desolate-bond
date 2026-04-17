import type { BossPattern, BossPatternContext } from './types.js';

const RING_COUNT = 3;
const BASE_LEAD_MS = 500;
const RING_GAP_MS = 350;  // each subsequent ring fires this long after the previous

/** RING_BURST: concentric circle telegraphs expanding from boss, resolving in sequence. */
export const ringBurstPattern: BossPattern = {
  id: 'RING_BURST',
  execute(ctx, pattern) {
    const { boss } = ctx;
    const maxRadius = pattern.radius && pattern.radius > 0 ? pattern.radius : pattern.range;
    const dmgPerRing = Math.round(pattern.damage * ctx.damageScale);
    const cx = boss.x;
    const cy = boss.y;
    for (let i = 0; i < RING_COUNT; i++) {
      const outer = maxRadius * ((i + 1) / RING_COUNT);
      const inner = maxRadius * (i / RING_COUNT);
      const lead = BASE_LEAD_MS + i * RING_GAP_MS;
      ctx.scheduleTelegraph(
        'CIRCLE',
        { x: cx, y: cy, radius: outer },
        lead,
        () => resolveRing(ctx, cx, cy, inner, outer, dmgPerRing),
      );
    }
  },
};

function resolveRing(
  ctx: BossPatternContext,
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  dmg: number,
) {
  for (const [sessionId, player] of ctx.players) {
    if (player.isDown || player.isDisconnected) continue;
    const dx = player.x - cx;
    const dy = player.y - cy;
    const distSq = dx * dx + dy * dy;
    if (distSq >= inner * inner && distSq <= outer * outer) {
      ctx.damagePlayer(sessionId, dmg);
    }
  }
}
