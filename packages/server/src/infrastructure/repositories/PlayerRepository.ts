import { db } from '../db.js';
import type { IPlayerRepository, UserRecord } from '../../domain/interfaces/IPlayerRepository.js';

export class PlayerRepository implements IPlayerRepository {
  async findByUsername(username: string): Promise<UserRecord | null> {
    const { rows } = await db.query<UserRecord>(
      'SELECT id, username, password_hash AS "passwordHash", is_guest AS "isGuest", created_at AS "createdAt" FROM users WHERE username = $1',
      [username]
    );
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const { rows } = await db.query<UserRecord>(
      'SELECT id, username, password_hash AS "passwordHash", is_guest AS "isGuest", created_at AS "createdAt" FROM users WHERE id = $1',
      [id]
    );
    return rows[0] ?? null;
  }

  async create(username: string, passwordHash: string, isGuest: boolean): Promise<UserRecord> {
    const { rows } = await db.query<UserRecord>(
      'INSERT INTO users (username, password_hash, is_guest) VALUES ($1, $2, $3) RETURNING id, username, password_hash AS "passwordHash", is_guest AS "isGuest", created_at AS "createdAt"',
      [username, passwordHash, isGuest]
    );
    return rows[0]!;
  }
}
