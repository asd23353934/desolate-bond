import { useState, useEffect } from 'react';
import type { Room } from 'colyseus.js';
import { RoomQRCode } from '@/presentation/components/RoomQRCode';
import { Button } from '@/components/ui/button';
import type { AuthUser } from '@/application/useAuth';
import { useLobbyState } from '@/application/useLobbyState';

interface LobbyPageProps {
  room: Room;
  roomCode: string;
  user: AuthUser;
  onLeave: () => void;
  onGameStart: () => void;
}

const CLASS_LABELS: Record<string, string> = {
  TANK: '坦克',
  DAMAGE: '輸出',
  SUPPORT: '輔助',
};

const CLASSES = ['TANK', 'DAMAGE', 'SUPPORT'] as const;

export function LobbyPage({ room, roomCode, user, onLeave, onGameStart }: LobbyPageProps) {
  const lobby = useLobbyState(room);
  const me = lobby.players.find((p) => p.id === user.id);
  const isHost = me?.isHost ?? false;
  const [startError, setStartError] = useState<string[]>([]);

  useEffect(() => {
    room.onMessage('START_BLOCKED', (msg: { notReady: string[] }) => {
      setStartError(msg.notReady);
    });
  }, [room]);

  useEffect(() => {
    if (lobby.gameState === 'SURVIVAL_PHASE') {
      onGameStart();
    }
  }, [lobby.gameState, onGameStart]);

  function selectClass(playerClass: string) {
    room.send('SELECT_CLASS', { playerClass });
  }

  function addBot() {
    room.send('ADD_BOT', {});
  }

  function removeBot(botId: string) {
    room.send('REMOVE_BOT', { botId });
  }

  function startGame() {
    setStartError([]);
    room.send('START_GAME', {});
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-6">
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-xl font-semibold">等待大廳</h2>
        <p className="font-mono text-3xl tracking-widest">{roomCode}</p>
      </div>

      <RoomQRCode roomCode={roomCode} />

      {/* Player list */}
      <div className="w-full max-w-sm space-y-2">
        {lobby.players.map((p) => (
          <div key={p.sessionId} className="flex items-center justify-between rounded border p-3">
            <div className="flex items-center gap-2">
              <span>{p.displayName}</span>
              {p.isHost && <span className="text-xs text-muted-foreground">（房主）</span>}
              {p.isGuest && <span className="text-xs text-muted-foreground">訪客</span>}
              {p.isBot && <span className="text-xs text-muted-foreground">Bot</span>}
            </div>
            <div className="flex items-center gap-1">
              {p.selectedClass
                ? <span className="text-sm font-medium">{CLASS_LABELS[p.selectedClass]}</span>
                : <span className="text-sm text-muted-foreground">未選擇</span>
              }
              {isHost && p.isBot && (
                <button onClick={() => removeBot(p.id)} className="ml-2 text-xs text-destructive">移除</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Class selection for self */}
      {!me?.isBot && (
        <div className="flex gap-2">
          {CLASSES.map((cls) => (
            <Button
              key={cls}
              variant={me?.selectedClass === cls ? 'default' : 'outline'}
              onClick={() => selectClass(cls)}
              size="sm"
            >
              {CLASS_LABELS[cls]}
            </Button>
          ))}
        </div>
      )}

      {startError.length > 0 && (
        <p className="text-sm text-destructive">
          以下玩家尚未選擇職業：{startError.join('、')}
        </p>
      )}

      <div className="flex gap-3">
        {isHost && lobby.players.length < 4 && (
          <Button variant="outline" onClick={addBot} size="sm">
            + 新增 Bot
          </Button>
        )}
        {isHost && (
          <Button onClick={startGame}>開始遊戲</Button>
        )}
        <Button variant="outline" onClick={onLeave}>離開房間</Button>
      </div>
    </div>
  );
}
