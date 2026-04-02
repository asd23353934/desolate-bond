export type GameState =
  | 'LOBBY'
  | 'SURVIVAL_PHASE'
  | 'PRE_BOSS_SELECTION'
  | 'BOSS_BATTLE'
  | 'POST_BOSS_SELECTION'
  | 'GAME_OVER'
  | 'RESULT';

export type PlayerClass = 'TANK' | 'DAMAGE' | 'SUPPORT';

export interface PlayerResult {
  userId: string;
  displayName: string;
  isGuest: boolean;
  playerClass: PlayerClass;
  totalDamage: number;
  survivalTime: number;
  cleared: boolean;
  clearTime: number | null;
}

export interface GameSession {
  id: string;
  roomId: string;
  state: GameState;
  round: number;
  playerCount: number;
  startedAt: Date;
  endedAt: Date | null;
  results: PlayerResult[];
}
