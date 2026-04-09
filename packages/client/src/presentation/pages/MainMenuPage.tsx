import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Swords, Users, Trophy, Settings, Skull, Crown, Shield, BookOpen, LogOut } from 'lucide-react';
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

function GoldButton({
  children,
  variant = 'primary',
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  disabled?: boolean;
}) {
  const baseStyles = 'relative group cursor-pointer transition-all duration-300 font-serif tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed';

  if (variant === 'primary') {
    return (
      <button onClick={onClick} disabled={disabled} className={`${baseStyles} w-full py-4 px-8 text-lg`}>
        <div className="absolute inset-0 bg-[#c9a84c]/10 rounded-sm blur-md group-hover:bg-[#c9a84c]/20 transition-all duration-300" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1510] to-[#0d0a08] rounded-sm border border-[#c9a84c]/60 group-hover:border-[#c9a84c] transition-all duration-300" />
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#c9a84c]" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#c9a84c]" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#c9a84c]" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#c9a84c]" />
        <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/50 to-transparent" />
        <span className="relative text-[#f0e6d3] group-hover:text-[#e0c878] transition-colors duration-300 flex items-center justify-center gap-3">
          {children}
        </span>
      </button>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyles} w-full py-3 px-6 text-sm`}>
      <div className="absolute inset-0 bg-[#0d0d14]/80 rounded-sm border border-[#c9a84c]/30 group-hover:border-[#c9a84c]/60 transition-all duration-300" />
      <span className="relative text-[#f0e6d3]/80 group-hover:text-[#f0e6d3] transition-colors duration-300 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}

function DecorativeDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#c9a84c]/50" />
      <Skull className="w-5 h-5 text-[#c9a84c]/60" />
      <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#c9a84c]/50" />
    </div>
  );
}

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0c0c12] to-[#0a0a0f]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0a0a0f_70%)]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#c9a84c]/5 rounded-full blur-3xl" />
    </div>
  );
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

  if (showLeaderboard) return <LeaderboardPage onBack={() => setShowLeaderboard(false)} />;
  if (showSettings) return <SettingsPage settings={settings} onUpdate={updateSettings} onBack={() => setShowSettings(false)} />;
  if (showHelp) return <HelpPage onBack={() => setShowHelp(false)} />;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />

      <div className="relative w-full max-w-md">
        {/* 卡片發光邊框 */}
        <div className="absolute -inset-px bg-gradient-to-b from-[#c9a84c]/30 via-[#c9a84c]/10 to-[#c9a84c]/30 rounded-lg blur-sm" />

        <div className="relative bg-[#0d0d14] rounded-lg border border-[#c9a84c]/40 p-8 shadow-[0_0_40px_rgba(201,168,76,0.15)]">
          {/* 頂部皇冠裝飾 */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-[#c9a84c]" />
              <Crown className="w-6 h-6 text-[#c9a84c]" />
              <div className="w-8 h-px bg-gradient-to-l from-transparent to-[#c9a84c]" />
            </div>
          </div>

          {/* 遊戲標題 */}
          <div className="text-center mb-8 pt-4">
            <h1 className="font-serif text-4xl md:text-5xl text-[#f0e6d3] tracking-widest mb-2">
              <span className="text-[#c9a84c]">絕</span>境<span className="text-[#c9a84c]">同</span>盟
            </h1>
            <p className="text-[#c9a84c]/60 text-sm tracking-[0.3em] uppercase font-serif">
              Desolate Bond
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-[#f0e6d3]/50 text-xs">
              <Shield className="w-3 h-3" />
              <span>Roguelite Adventure</span>
              <Shield className="w-3 h-3" />
            </div>
            <p className="mt-2 text-[#a09080] text-xs">
              {user.displayName}{user.isGuest ? '（訪客）' : ''}
            </p>
          </div>

          <DecorativeDivider />

          {/* 主要按鈕 */}
          <div className="space-y-4 mb-2">
            <GoldButton variant="primary" onClick={createRoom} disabled={loading}>
              <Swords className="w-5 h-5" />
              <span>創建房間</span>
            </GoldButton>
          </div>

          {/* 加入房間 */}
          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <Input
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="輸入 6 碼房間碼"
                maxLength={6}
                className="bg-[#1a1a24] border-[#c9a84c]/30 text-[#f0e6d3] placeholder:text-[#a09080] focus:border-[#c9a84c] focus:ring-[#c9a84c]/30 uppercase tracking-widest text-center"
              />
              <GoldButton
                variant="primary"
                onClick={() => joinRoom(inputCode)}
                disabled={loading || inputCode.length !== 6}
              >
                <Users className="w-4 h-4" />
                <span>加入</span>
              </GoldButton>
            </div>
            {error && (
              <p className="text-center text-sm text-red-400/80">{error}</p>
            )}
          </div>

          <DecorativeDivider />

          {/* 次要按鈕 — 排行榜+設定並排，操作說明獨行 */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <GoldButton variant="secondary" onClick={() => setShowLeaderboard(true)}>
                <Trophy className="w-4 h-4" />
                <span>排行榜</span>
              </GoldButton>
              <GoldButton variant="secondary" onClick={() => setShowSettings(true)}>
                <Settings className="w-4 h-4" />
                <span>設定</span>
              </GoldButton>
            </div>

            <GoldButton variant="secondary" onClick={() => setShowHelp(true)}>
              <BookOpen className="w-4 h-4" />
              <span>操作說明</span>
            </GoldButton>
          </div>

          {/* 登出 — 縮小置底 */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs text-[#a09080]/60 hover:text-[#a09080] transition-colors duration-200 tracking-wider uppercase"
            >
              <LogOut className="w-3 h-3" />
              <span>登出</span>
            </button>
          </div>

          {/* 底部版本號 */}
          <div className="mt-8 flex items-center justify-center">
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/30 to-transparent" />
          </div>
          <p className="text-center text-[#c9a84c]/30 text-xs mt-4 tracking-widest">
            v0.1.0 Alpha
          </p>
        </div>
      </div>
    </div>
  );
}
