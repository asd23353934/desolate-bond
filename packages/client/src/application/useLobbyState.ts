import { useEffect, useState } from 'react';
import type { Room } from 'colyseus.js';

export interface LobbyPlayer {
  sessionId: string;
  id: string;
  displayName: string;
  isGuest: boolean;
  isHost: boolean;
  isBot: boolean;
  selectedClass: string;
  isReady: boolean;
}

export interface LobbySnapshot {
  roomCode: string;
  gameState: string;
  players: LobbyPlayer[];
}

function snapshot(state: Record<string, unknown>): LobbySnapshot {
  const players: LobbyPlayer[] = [];
  const playersMap = state['players'] as Map<string, Record<string, unknown>> | undefined;
  if (playersMap) {
    for (const [sessionId, p] of playersMap) {
      players.push({
        sessionId,
        id: String(p['id'] ?? ''),
        displayName: String(p['displayName'] ?? ''),
        isGuest: Boolean(p['isGuest']),
        isHost: Boolean(p['isHost']),
        isBot: Boolean(p['isBot']),
        selectedClass: String(p['selectedClass'] ?? ''),
        isReady: Boolean(p['isReady']),
      });
    }
  }
  return {
    roomCode: String(state['roomCode'] ?? ''),
    gameState: String(state['gameState'] ?? 'LOBBY'),
    players,
  };
}

export function useLobbyState(room: Room): LobbySnapshot {
  const [lobbySnapshot, setLobbySnapshot] = useState<LobbySnapshot>(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    snapshot(room.state as any ?? {})
  );

  useEffect(() => {
    const refresh = () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setLobbySnapshot(snapshot(room.state as any ?? {}));

    room.onStateChange(refresh);
    return () => { room.onStateChange.clear(); };
  }, [room]);

  return lobbySnapshot;
}
