/**
 * Bot behavior state machine. Produces PlayerInput each tick.
 * The game loop processes bot inputs identically to human inputs (spec 11.1).
 *
 * Priority: DODGE > RESCUE > CHASE_ENEMY (spec 11.2/11.3/11.4)
 */

import type { PlayerInput } from './PlayerInput.js';

export type BotState = 'CHASE_ENEMY' | 'DODGE' | 'RESCUE' | 'ORBIT';

const DODGE_RADIUS   = 80;   // px — enter DODGE when threat within this radius
const RESCUE_RADIUS  = 30;   // px — trigger rescue when within this distance of downed player
const ORBIT_RADIUS   = 100;  // px — preferred distance bots keep from the human anchor
const LEASH_RADIUS   = 200;  // px — if bot is farther than this from all humans, return to orbit

export class BotController {
  state: BotState = 'CHASE_ENEMY';

  tick(params: {
    botX: number;
    botY: number;
    botIndex: number;  // 0-based index among bots — used to spread orbit angles
    bossX: number | null;
    bossY: number | null;
    enemyPositions: Array<{ x: number; y: number }>;
    projectiles: Array<{ x: number; y: number; angle: number }>;
    downedTeammates: Array<{ x: number; y: number }>;
    humanPositions: Array<{ x: number; y: number }>;
  }): PlayerInput {
    const { botX, botY, enemyPositions, projectiles, downedTeammates, humanPositions } = params;

    // 11.3: DODGE — check incoming projectiles
    for (const proj of projectiles) {
      const dx = proj.x - botX;
      const dy = proj.y - botY;
      if (dx * dx + dy * dy <= DODGE_RADIUS * DODGE_RADIUS) {
        this.state = 'DODGE';
        // Move perpendicular to incoming angle (escape sideways)
        const perpAngle = proj.angle + Math.PI / 2;
        return { dx: Math.cos(perpAngle), dy: Math.sin(perpAngle), rescue: false };
      }
    }

    // 11.4: RESCUE — navigate toward nearest downed teammate
    if (downedTeammates.length > 0) {
      this.state = 'RESCUE';
      // Find nearest downed teammate
      let target = downedTeammates[0]!;
      let nearestSq = Infinity;
      for (const dm of downedTeammates) {
        const dx = dm.x - botX;
        const dy = dm.y - botY;
        const distSq = dx * dx + dy * dy;
        if (distSq < nearestSq) { nearestSq = distSq; target = dm; }
      }

      const dx = target.x - botX;
      const dy = target.y - botY;
      const dist = Math.sqrt(nearestSq);
      if (dist <= RESCUE_RADIUS) {
        // Arrived — trigger rescue action
        return { dx: 0, dy: 0, rescue: true };
      }
      return { dx: dx / dist, dy: dy / dist, rescue: false };
    }

    // Find nearest human anchor position
    let anchorX = botX;
    let anchorY = botY;
    let anchorDistSq = Infinity;
    for (const h of humanPositions) {
      const dx = h.x - botX;
      const dy = h.y - botY;
      const dSq = dx * dx + dy * dy;
      if (dSq < anchorDistSq) { anchorDistSq = dSq; anchorX = h.x; anchorY = h.y; }
    }

    // If too far from all humans, return to orbit position regardless of enemies
    if (humanPositions.length > 0 && anchorDistSq > LEASH_RADIUS * LEASH_RADIUS) {
      this.state = 'ORBIT';
      // Target point: orbit radius around anchor, spread by bot index
      const orbitAngle = (params.botIndex * Math.PI * 2) / Math.max(1, 4) + Math.PI / 4;
      const targetX = anchorX + Math.cos(orbitAngle) * ORBIT_RADIUS;
      const targetY = anchorY + Math.sin(orbitAngle) * ORBIT_RADIUS;
      const dx = targetX - botX;
      const dy = targetY - botY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 8) return { dx: 0, dy: 0, rescue: false };
      return { dx: dx / dist, dy: dy / dist, rescue: false };
    }

    // 11.2: CHASE_ENEMY — move toward nearest target (boss or enemy)
    this.state = 'CHASE_ENEMY';

    // In boss battle, move toward boss
    if (params.bossX !== null && params.bossY !== null) {
      const dx = params.bossX - botX;
      const dy = params.bossY - botY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) return { dx: 0, dy: 0, rescue: false };
      return { dx: dx / dist, dy: dy / dist, rescue: false };
    }

    // In survival phase, move toward nearest enemy
    if (enemyPositions.length === 0) {
      // No enemies — drift to orbit position around anchor
      if (humanPositions.length > 0) {
        this.state = 'ORBIT';
        const orbitAngle = (params.botIndex * Math.PI * 2) / Math.max(1, 4) + Math.PI / 4;
        const targetX = anchorX + Math.cos(orbitAngle) * ORBIT_RADIUS;
        const targetY = anchorY + Math.sin(orbitAngle) * ORBIT_RADIUS;
        const dx = targetX - botX;
        const dy = targetY - botY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 8) return { dx: 0, dy: 0, rescue: false };
        return { dx: dx / dist, dy: dy / dist, rescue: false };
      }
      return { dx: 0, dy: 0, rescue: false };
    }

    let nearest = enemyPositions[0]!;
    let nearestDistSq = Infinity;
    for (const e of enemyPositions) {
      const dx = e.x - botX;
      const dy = e.y - botY;
      const distSq = dx * dx + dy * dy;
      if (distSq < nearestDistSq) { nearestDistSq = distSq; nearest = e; }
    }

    const dx = nearest.x - botX;
    const dy = nearest.y - botY;
    const dist = Math.sqrt(nearestDistSq);
    if (dist < 5) return { dx: 0, dy: 0, rescue: false };
    return { dx: dx / dist, dy: dy / dist, rescue: false };
  }
}
