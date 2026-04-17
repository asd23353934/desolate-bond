import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import type { Room } from 'colyseus.js';
import { RoomQRCode } from '@/presentation/components/RoomQRCode';
import { PixelPanel, PixelButton, PixelBadge, PixelProgressBar } from '@/components/pixel-ui';
import type { AuthUser } from '@/application/useAuth';
import { useLobbyState } from '@/application/useLobbyState';

interface LobbyPageProps {
  room: Room;
  roomCode: string;
  user: AuthUser;
  onLeave: () => void;
  onGameStart: () => void;
}

const CLASSES = ['TANK', 'DAMAGE', 'SUPPORT'] as const;
type PlayerClass = typeof CLASSES[number];

const CLASS_META: Record<PlayerClass, {
  icon: string;
  label: string;
  desc: string;
  hp: number; atk: number; spd: number;
  hpMax: number; atkMax: number; spdMax: number;
}> = {
  TANK:    { icon: '🛡', label: '坦克', desc: '高生命值，保護隊友', hp: 200, atk: 8,  spd: 140, hpMax: 200, atkMax: 20, spdMax: 200 },
  DAMAGE:  { icon: '🏹', label: '射手', desc: '遠程射擊，長條穿透',   hp: 80,  atk: 15, spd: 160, hpMax: 200, atkMax: 20, spdMax: 200 },
  SUPPORT: { icon: '✚', label: '補師', desc: '治療隊友，增益效果', hp: 120, atk: 10, spd: 150, hpMax: 200, atkMax: 20, spdMax: 200 },
};

function classBadgeVariant(cls: string): 'tank' | 'damage' | 'support' {
  if (cls === 'TANK') return 'tank';
  if (cls === 'DAMAGE') return 'damage';
  return 'support';
}

export function LobbyPage({ room, roomCode: _roomCode, user, onLeave, onGameStart }: LobbyPageProps) {
  const lobby = useLobbyState(room);
  const roomCode = lobby.roomCode || _roomCode;
  const me = lobby.players.find(p => p.id === user.id);
  const isHost = me?.isHost ?? false;
  const [startError, setStartError] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    room.onMessage('START_BLOCKED', (msg: { notReady: string[] }) => setStartError(msg.notReady));
  }, [room]);

  useEffect(() => {
    if (lobby.gameState === 'SURVIVAL_PHASE') onGameStart();
  }, [lobby.gameState, onGameStart]);

  function selectClass(playerClass: string) { room.send('SELECT_CLASS', { playerClass }); }
  function addBot(playerClass: string)       { room.send('ADD_BOT', { playerClass }); }
  function removeBot(botId: string)          { room.send('REMOVE_BOT', { botId }); }
  function startGame()                       { setStartError([]); room.send('START_GAME', {}); }

  function handleCopyCode() {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[640px] space-y-4">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h2 className="font-heading text-xl text-pixel-amber" style={{ textShadow: '2px 2px 0 #000' }}>
            WAITING ROOM
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Room code copy */}
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-4 py-2 border-2 border-pixel-amber bg-pixel-panel cursor-crosshair hover:bg-pixel-amber/10 transition-colors"
              style={{ boxShadow: '4px 4px 0 #000' }}
            >
              <span className="font-heading text-sm text-pixel-amber">ROOM: {roomCode}</span>
              {copied
                ? <Check className="w-4 h-4 text-pixel-green" />
                : <Copy className="w-4 h-4 text-pixel-amber" />
              }
            </button>

            {/* QR Code */}
            <div className="w-24 h-24 border-2 border-dashed border-pixel-border flex items-center justify-center">
              <RoomQRCode roomCode={roomCode} />
            </div>
          </div>
        </motion.div>

        {/* Players */}
        <PixelPanel title={`ADVENTURERS [${lobby.players.length}/4]`}>
          <div className="space-y-2">
            {[0, 1, 2, 3].map(slot => {
              const player = lobby.players[slot];
              if (!player) {
                return (
                  <div key={slot} className="flex items-center justify-center h-12 border-2 border-dashed border-pixel-border">
                    {isHost ? (
                      <div className="flex gap-2">
                        {CLASSES.map(cls => (
                          <PixelButton key={cls} variant="secondary" size="sm" onClick={() => addBot(cls)}>
                            + {CLASS_META[cls].label} BOT
                          </PixelButton>
                        ))}
                      </div>
                    ) : (
                      <span className="font-body text-pixel-muted">── EMPTY ──</span>
                    )}
                  </div>
                );
              }
              return (
                <motion.div
                  key={player.sessionId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: slot * 0.08 }}
                  className="flex items-center gap-3 p-2 bg-pixel-bg/50 border border-pixel-border"
                >
                  <div className="w-8 h-8 bg-pixel-panel border border-pixel-amber flex items-center justify-center text-lg">
                    {player.selectedClass ? CLASS_META[player.selectedClass as PlayerClass]?.icon ?? '?' : '?'}
                  </div>
                  <span className="font-body text-lg text-pixel-text flex-1">{player.displayName}</span>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {player.selectedClass && (
                      <PixelBadge variant={classBadgeVariant(player.selectedClass)}>
                        {CLASS_META[player.selectedClass as PlayerClass]?.label ?? player.selectedClass}
                      </PixelBadge>
                    )}
                    {player.isHost && <PixelBadge variant="host">HOST</PixelBadge>}
                    {player.isBot  && <PixelBadge>BOT</PixelBadge>}
                    {player.isGuest && <PixelBadge>GUEST</PixelBadge>}
                    <div className={`w-3 h-3 ${player.selectedClass ? 'bg-pixel-green' : 'bg-pixel-muted'}`} />
                    {isHost && player.isBot && (
                      <PixelButton variant="danger" size="sm" onClick={() => removeBot(player.id)}>✕</PixelButton>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </PixelPanel>

        {/* Class selection (own player) */}
        {!me?.isBot && (
          <PixelPanel title="SELECT CLASS">
            <div className="grid grid-cols-3 gap-3">
              {CLASSES.map(cls => {
                const meta = CLASS_META[cls];
                const selected = me?.selectedClass === cls;
                return (
                  <button
                    key={cls}
                    onClick={() => selectClass(cls)}
                    className={`relative p-3 border-2 transition-all cursor-crosshair ${
                      selected
                        ? 'border-pixel-amber bg-pixel-amber/10'
                        : 'border-pixel-border hover:border-pixel-amber/50'
                    }`}
                  >
                    <div className="text-2xl mb-1 text-center">{meta.icon}</div>
                    <div className="font-heading text-[10px] text-pixel-text text-center mb-2">{meta.label}</div>
                    <div className="space-y-1">
                      <PixelProgressBar value={meta.hp}  max={meta.hpMax}  variant="hp"      />
                      <PixelProgressBar value={meta.atk} max={meta.atkMax} variant="default" />
                      <PixelProgressBar value={meta.spd} max={meta.spdMax} variant="xp"      />
                    </div>
                    <p className="font-body text-xs text-pixel-muted mt-2 hidden sm:block text-center">
                      {meta.desc}
                    </p>
                    {selected && (
                      <div className="absolute top-1 right-1 text-pixel-amber font-heading text-[10px]">✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          </PixelPanel>
        )}

        {/* Errors */}
        {startError.length > 0 && (
          <p className="font-body text-pixel-red text-center">
            ► 以下玩家尚未選擇職業：{startError.join('、')}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <PixelButton variant="danger" className="flex-1" onClick={onLeave}>
            ← LEAVE ROOM
          </PixelButton>
          {isHost ? (
            <PixelButton
              size="lg"
              className="flex-[2]"
              disabled={lobby.players.length < 1}
              onClick={startGame}
            >
              ▶ START GAME
            </PixelButton>
          ) : (
            <div className="flex-[2] flex items-center justify-center">
              <span className="font-heading text-xs text-pixel-amber amber-blink">
                WAITING FOR HOST...
              </span>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
