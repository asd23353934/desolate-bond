import { Router } from 'express';
import type { Request, Response } from 'express';
import { matchMaker } from '@colyseus/core';

export const roomsRouter = Router();

roomsRouter.get('/find/:code', async (req: Request, res: Response) => {
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
