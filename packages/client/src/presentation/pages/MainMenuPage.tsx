import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PixelPanel, PixelButton, PixelInput, PixelDivider, FloatingParticles } from '@/components/pixel-ui';
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

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0 },
};

export function MainMenuPage({ user, onLogout }: MainMenuPageProps) {
  const { room, roomCode, error, loading, createRoom, joinRoom, leaveRoom } = useRoom(user);
  const codeFromURL = useRoomCodeFromURL();
  const { settings, updateSettings } = useGameSettings();
  const [inputCode, setInputCode] = useState(codeFromURL);
  const [inGame, setInGame] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings,    setShowSettings]    = useState(false);
  const [showHelp,        setShowHelp]        = useState(false);

  useEffect(() => {
    if (codeFromURL) joinRoom(codeFromURL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (room && inGame) {
    return (
      <GamePage
        room={room} user={user} settings={settings}
        onLeave={() => { setInGame(false); leaveRoom(); }}
        onReturnToLobby={() => setInGame(false)}
      />
    );
  }
  if (room) {
    return <LobbyPage room={room} roomCode={roomCode} user={user} onLeave={leaveRoom} onGameStart={() => setInGame(true)} />;
  }
  if (showLeaderboard) return <LeaderboardPage onBack={() => setShowLeaderboard(false)} />;
  if (showSettings)    return <SettingsPage settings={settings} onUpdate={updateSettings} onBack={() => setShowSettings(false)} />;
  if (showHelp)        return <HelpPage onBack={() => setShowHelp(false)} />;

  return (
    <section className="min-h-screen flex items-center justify-center p-4 relative scanlines">
      <FloatingParticles />

      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(244,168,52,0.08) 0%, transparent 50%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[480px] relative z-10"
      >
        <PixelPanel className="relative">

          {/* Top ornament */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-pixel-amber font-body tracking-widest">────</span>
            <span className="text-pixel-amber text-2xl">♛</span>
            <span className="text-pixel-amber font-body tracking-widest">────</span>
          </div>

          {/* Title */}
          <motion.div
            className="text-center mb-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1
              className="font-heading text-3xl text-pixel-amber inline-block"
              style={{ textShadow: '4px 4px 0 #000', animation: 'flicker 6s ease-in-out infinite' }}
            >
              絕境同盟
            </h1>
          </motion.div>

          <p className="text-center font-heading text-[10px] text-pixel-teal tracking-[0.3em] mb-1">
            DESOLATE BOND
          </p>
          <p className="text-center font-body text-pixel-muted text-sm mb-2">
            ♦ ROGUELITE ADVENTURE ♦
          </p>
          <p className="text-right font-body text-pixel-muted text-sm mb-4">
            {user.displayName}{user.isGuest ? '（訪客）' : ''}
          </p>

          <PixelDivider />

          {/* Primary actions */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <motion.div variants={staggerItem}>
              <PixelButton fullWidth size="lg" onClick={createRoom} disabled={loading}>
                ⚔ CREATE ROOM
              </PixelButton>
            </motion.div>

            <motion.div variants={staggerItem} className="flex gap-2">
              <PixelInput
                value={inputCode}
                onChange={e => setInputCode(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                maxLength={6}
                className="text-center tracking-[0.5em] uppercase"
              />
              <PixelButton
                onClick={() => joinRoom(inputCode)}
                disabled={loading || inputCode.length !== 6}
                className="shrink-0"
              >
                JOIN
              </PixelButton>
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-body text-pixel-red text-center"
              >
                ! {error}
              </motion.p>
            )}
          </motion.div>

          <PixelDivider />

          {/* Secondary actions */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
              <PixelButton variant="secondary" onClick={() => setShowLeaderboard(true)}>
                🏆 LEADERBOARD
              </PixelButton>
              <PixelButton variant="secondary" onClick={() => setShowSettings(true)}>
                ⚙ SETTINGS
              </PixelButton>
            </motion.div>
            <motion.div variants={staggerItem}>
              <PixelButton variant="secondary" fullWidth onClick={() => setShowHelp(true)}>
                📖 HOW TO PLAY
              </PixelButton>
            </motion.div>
          </motion.div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <button
              onClick={onLogout}
              className="font-body text-pixel-muted hover:text-pixel-red transition-colors cursor-crosshair text-sm"
            >
              [LOGOUT]
            </button>
            <p className="font-body text-[10px] text-pixel-muted mt-2">v0.1.0 ALPHA</p>
          </div>

        </PixelPanel>
      </motion.div>
    </section>
  );
}
