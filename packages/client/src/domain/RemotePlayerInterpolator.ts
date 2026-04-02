/**
 * Smooths remote player movement by linearly interpolating (Lerp) the render
 * position toward the latest server-reported position each frame.
 *
 * Usage in Phaser Scene update():
 *   interpolator.setTarget(serverX, serverY);   // on each Colyseus state patch
 *   interpolator.update(LERP_ALPHA);             // on each render frame
 *   sprite.setPosition(interpolator.x, interpolator.y);
 */

/** Lerp factor per frame at ~60fps. Higher = snappier, lower = smoother. */
export const LERP_ALPHA = 0.2;

export class RemotePlayerInterpolator {
  private renderX: number;
  private renderY: number;
  private targetX: number;
  private targetY: number;

  constructor(x: number, y: number) {
    this.renderX = x;
    this.renderY = y;
    this.targetX = x;
    this.targetY = y;
  }

  /** Called when a new server state patch arrives. */
  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  /** Called every render frame. alpha is the lerp factor (0–1). */
  update(alpha: number = LERP_ALPHA): void {
    this.renderX += (this.targetX - this.renderX) * alpha;
    this.renderY += (this.targetY - this.renderY) * alpha;
  }

  get x(): number { return this.renderX; }
  get y(): number { return this.renderY; }
}
