import type { Player } from './Player.js';
import type { GameState } from './GameSession.js';

export interface Room {
  id: string;
  code: string;
  state: GameState;
  players: Player[];
  maxPlayers: 4;
  createdAt: Date;
}
