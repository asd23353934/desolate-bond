import type { GameSession, PlayerResult } from '../entities/GameSession.js';

export interface IGameSessionRepository {
  create(roomId: string, playerCount: number): Promise<GameSession>;
  save(session: GameSession): Promise<void>;
  saveResults(sessionId: string, results: PlayerResult[]): Promise<void>;
}
