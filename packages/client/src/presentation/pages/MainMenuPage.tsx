import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AuthUser } from '@/application/useAuth';
import { useRoom } from '@/application/useRoom';
import { useRoomCodeFromURL } from '@/application/useRoomCodeFromURL';
import { useGameSettings } from '@/application/useGameSettings';
import { LobbyPage } from './LobbyPage';
import { GamePage } from './GamePage';
import { LeaderboardPage } from './LeaderboardPage';
import { SettingsPage } from './SettingsPage';
import { HelpPage } from './HelpPage';

interface MainMenuPageProps {
  user: AuthUser;
  onLogout: () => void;
}

export function MainMenuPage({ user, onLogout }: MainMenuPageProps) {
  const { room, roomCode, error, loading, createRoom, joinRoom, leaveRoom } = useRoom(user);
  const codeFromURL = useRoomCodeFromURL();
  const { settings, updateSettings } = useGameSettings();
  const [inputCode, setInputCode] = useState(codeFromURL);
  const [inGame, setInGame] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Auto-join if URL has ?room=
  useEffect(() => {
    if (codeFromURL) joinRoom(codeFromURL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (room && inGame) {
    return (
      <GamePage
        room={room}
        user={user}
        settings={settings}
        onLeave={() => { setInGame(false); leaveRoom(); }}
        onReturnToLobby={() => setInGame(false)}
      />
    );
  }

  if (room) {
    return <LobbyPage room={room} roomCode={roomCode} user={user} onLeave={leaveRoom} onGameStart={() => setInGame(true)} />;
  }

  if (showLeaderboard) {
    return <LeaderboardPage onBack={() => setShowLeaderboard(false)} />;
  }

  if (showSettings) {
    return <SettingsPage settings={settings} onUpdate={updateSettings} onBack={() => setShowSettings(false)} />;
  }

  if (showHelp) {
    return <HelpPage onBack={() => setShowHelp(false)} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-bold">絕境同盟</h1>
      <p className="text-muted-foreground">歡迎，{user.displayName}{user.isGuest ? '（訪客）' : ''}</p>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Button onClick={createRoom} disabled={loading} size="lg">
          建立房間
        </Button>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">加入房間</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="輸入 6 碼房間碼"
              maxLength={6}
            />
            <Button onClick={() => joinRoom(inputCode)} disabled={loading || inputCode.length !== 6}>
              加入
            </Button>
          </CardContent>
        </Card>

        {error && <p className="text-center text-sm text-destructive">{error}</p>}

        <Button variant="outline" onClick={() => setShowLeaderboard(true)}>
          排行榜
        </Button>

        <Button variant="outline" onClick={() => setShowSettings(true)}>
          設定
        </Button>

        <Button variant="outline" onClick={() => setShowHelp(true)}>
          操作說明
        </Button>

        <Button variant="outline" onClick={onLogout} className="mt-4">
          登出
        </Button>
      </div>
    </div>
  );
}
