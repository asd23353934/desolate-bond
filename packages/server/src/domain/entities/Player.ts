import type { PlayerClass } from './GameSession.js';

export interface Player {
  id: string;
  username: string;
  isGuest: boolean;
  selectedClass: PlayerClass | null;
  isHost: boolean;
  isBot: boolean;
  isConnected: boolean;
}
