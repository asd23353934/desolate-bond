import { db } from '../db.js';
import type { IGameSessionRepository } from '../../domain/interfaces/IGameSession.js';
import type { GameSession, PlayerResult } from '../../domain/entities/GameSession.js';

export class GameSessionRepository implements IGameSessionRepository {
  async create(roomId: string, playerCount: number): Promise<GameSession> {
    const { rows } = await db.query<{ id: string; started_at: Date }>(
      'INSERT INTO game_sessions (room_id, player_count) VALUES ($1, $2) RETURNING id, started_at',
      [roomId, playerCount]
    );
    const row = rows[0]!;
    return {
      id: row.id,
      roomId,
      state: 'LOBBY',
      round: 0,
      playerCount,
      startedAt: row.started_at,
      endedAt: null,
      results: [],
    };
  }

  async save(session: GameSession): Promise<void> {
    await db.query(
      'UPDATE game_sessions SET ended_at = $1, boss_count = $2 WHERE id = $3',
      [session.endedAt, session.round, session.id]
    );
  }

  async saveResults(sessionId: string, results: PlayerResult[]): Promise<void> {
    if (results.length === 0) return;

    const values = results.map((r, i) => {
      const base = i * 9;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9})`;
    });

    const params = results.flatMap((r) => [
      sessionId,
      r.userId.startsWith('guest_') ? null : r.userId,
      r.displayName,
      r.isGuest,
      r.playerClass,
      r.totalDamage,
      r.survivalTime,
      r.cleared,
      r.clearTime,
    ]);

    await db.query(
      `INSERT INTO player_results
         (session_id, user_id, display_name, is_guest, class, total_damage, survival_time, cleared, clear_time)
       VALUES ${values.join(', ')}`,
      params
    );
  }
}
