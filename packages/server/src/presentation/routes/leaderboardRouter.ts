import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from '../../infrastructure/db.js';

export const leaderboardRouter = Router();

const LIMIT = 20;

/** 13.3: GET /leaderboard/fastest-clear — top N entries by fastest clear time (ascending). */
leaderboardRouter.get('/fastest-clear', async (_req: Request, res: Response) => {
  try {
    const { rows } = await db.query(
      `SELECT display_name, is_guest, class AS player_class, clear_time, total_damage
       FROM player_results
       WHERE cleared = true AND clear_time IS NOT NULL
       ORDER BY clear_time ASC
       LIMIT $1`,
      [LIMIT],
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/** 13.3: GET /leaderboard/highest-damage — top N entries by total_damage (descending). */
leaderboardRouter.get('/highest-damage', async (_req: Request, res: Response) => {
  try {
    const { rows } = await db.query(
      `SELECT display_name, is_guest, class AS player_class, total_damage, clear_time
       FROM player_results
       ORDER BY total_damage DESC
       LIMIT $1`,
      [LIMIT],
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/** 13.3: GET /leaderboard/highest-survival — top N entries by survival_time (descending). */
leaderboardRouter.get('/highest-survival', async (_req: Request, res: Response) => {
  try {
    const { rows } = await db.query(
      `SELECT display_name, is_guest, class AS player_class, survival_time, total_damage
       FROM player_results
       ORDER BY survival_time DESC
       LIMIT $1`,
      [LIMIT],
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});
