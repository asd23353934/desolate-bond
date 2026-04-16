import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { matchMaker } from '@colyseus/core';
import { requireAuth } from '../../infrastructure/auth/jwt.js';

export const roomsRouter = Router();

// 每 IP 每分鐘 10 次，避免被用來掃碼列舉房間
const FIND_LIMIT = 10;
const FIND_WINDOW_MS = 60_000;
const findRateBuckets = new Map<string, { count: number; resetAt: number }>();

function findRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const now = Date.now();
  const entry = findRateBuckets.get(ip);

  if (!entry || entry.resetAt <= now) {
    findRateBuckets.set(ip, { count: 1, resetAt: now + FIND_WINDOW_MS });
    // Map 過大時 lazy GC：順手清過期 entry，避免無限成長
    if (findRateBuckets.size > 1000) {
      for (const [k, v] of findRateBuckets) {
        if (v.resetAt <= now) findRateBuckets.delete(k);
      }
    }
    next();
    return;
  }

  if (entry.count >= FIND_LIMIT) {
    res.status(429).json({ error: 'RATE_LIMIT', retryAfterMs: entry.resetAt - now });
    return;
  }
  entry.count++;
  next();
}

roomsRouter.get('/find/:code', findRateLimit, requireAuth, async (req: Request, res: Response) => {
  const raw = req.params['code'];
  const code = typeof raw === 'string' ? raw.toUpperCase() : undefined;
  if (!code || code.length !== 6) {
    res.status(400).json({ error: 'INVALID_CODE' });
    return;
  }

  try {
    const rooms = await matchMaker.query({ name: 'game_room' });
    const target = rooms.find((r) => r.metadata?.roomCode === code);

    if (!target) {
      res.status(404).json({ error: 'ROOM_NOT_FOUND' });
      return;
    }

    if (target.clients >= target.maxClients) {
      res.status(409).json({ error: 'ROOM_FULL' });
      return;
    }

    res.json({ roomId: target.roomId });
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});
