import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import type { Room } from 'colyseus.js';
import type { AuthUser } from '@/application/useAuth';
import type { GameSettings } from '@/application/useGameSettings';
import { GameScene } from '@/infrastructure/phaser/GameScene';
import { SkillSelectionOverlay } from '@/presentation/components/SkillSelectionOverlay';
import { SKILL_DEFS } from '@/domain/skillDefs';
import { ITEM_DEFS } from '@/domain/itemDefs';

interface GamePageProps {
  room: Room;
  user: AuthUser;
  settings: GameSettings;
  onLeave: () => void;
  onReturnToLobby: () => void;
}

interface LevelUpState { level: number; options: string[]; isPreBoss?: boolean }

interface LocalPlayerState {
  hp: number; maxHp: number; level: number; xp: number;
  selectedClass: string; skillIds: string[];
  weaponId: string; passiveIds: string[];
  isDown: boolean;
}

interface SessionResultPlayer {
  displayName: string; isGuest: boolean; playerClass: string;
  totalDamage: number; survivalTimeSec: number;
}
interface SessionResult {
  cleared: boolean; round: number; clearTimeMs: number | null;
  players: SessionResultPlayer[];
}

function useLocalPlayerState(room: Room): LocalPlayerState | null {
  const [ps, setPs] = useState<LocalPlayerState | null>(null);
  useEffect(() => {
    const read = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state = room.state as any;
      const player = state?.players?.get?.(room.sessionId);
      if (!player) return;
      setPs({
        hp: player.hp ?? 0,
        maxHp: player.maxHp ?? 0,
        level: player.level ?? 1,
        xp: player.xp ?? 0,
        selectedClass: player.selectedClass ?? '',
        skillIds: player.skillIds?.toArray?.() ?? [...(player.skillIds ?? [])],
        weaponId: player.weaponId ?? '',
        passiveIds: player.passiveIds?.toArray?.() ?? [...(player.passiveIds ?? [])],
        isDown: player.isDown ?? false,
      });
    };
    read();
    room.onStateChange(read);
    return () => { room.onStateChange.remove(read); };
  }, [room]);
  return ps;
}

interface TeammateState {
  id: string; displayName: string; isBot: boolean;
  hp: number; maxHp: number; selectedClass: string; isDown: boolean;
}

function useTeammatesState(room: Room): TeammateState[] {
  const [teammates, setTeammates] = useState<TeammateState[]>([]);
  useEffect(() => {
    const read = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state = room.state as any;
      if (!state?.players) return;
      const list: TeammateState[] = [];
      state.players.forEach((player: any, id: string) => {
        if (id === room.sessionId) return; // skip self
        list.push({
          id,
          displayName: player.displayName ?? id,
          isBot: player.isBot ?? false,
          hp: player.hp ?? 0,
          maxHp: player.maxHp ?? 0,
          selectedClass: player.selectedClass ?? '',
          isDown: player.isDown ?? false,
        });
      });
      setTeammates(list);
    };
    read();
    room.onStateChange(read);
    return () => { room.onStateChange.remove(read); };
  }, [room]);
  return teammates;
}

const CLASS_LABEL: Record<string, string> = { TANK: '坦克', DAMAGE: '傷害', SUPPORT: '輔助', '': '未選' };

export function GamePage({ room, settings, onLeave, onReturnToLobby }: GamePageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [levelUp, setLevelUp] = useState<LevelUpState | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [result, setResult] = useState<SessionResult | null>(null);
  const ps = useLocalPlayerState(room);
  const teammates = useTeammatesState(room);

  // 結算
  useEffect(() => {
    const unsub = room.onMessage('SESSION_RESULT', (msg: SessionResult) => {
      setResult(msg);
    });
    return () => { unsub(); };
  }, [room]);

  useEffect(() => {
    const unsub = room.onMessage('LEVEL_UP', (msg: LevelUpState) => {
      setLevelUp(msg);
    });
    return () => { unsub(); };
  }, [room]);

  useEffect(() => {
    const unsub = room.onMessage('PRE_BOSS_SKILL_OPTIONS', (msg: { options: string[] }) => {
      setLevelUp({ level: 0, options: msg.options, isPreBoss: true });
    });
    return () => { unsub(); };
  }, [room]);

  function handleSkillSelect(skillId: string) {
    if (levelUp?.isPreBoss) {
      room.send('SELECT_PRE_BOSS_SKILL', { skillId });
    } else {
      room.send('SELECT_SKILL', { skillId });
    }
    setLevelUp(null);
  }

  useEffect(() => {
    if (!containerRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: containerRef.current,
      backgroundColor: '#1a1a1a',
      scene: [GameScene],
    });

    game.scene.start('GameScene', {
      room,
      localSessionId:    room.sessionId,
      keyBindings:       settings.keyBindings,       // 14.4
      graphicsQuality:   settings.graphicsQuality,   // 14.3
      showDamageNumbers: settings.showDamageNumbers, // 14.2
      volume:            settings.volume,            // 14.1
    });

    return () => {
      game.destroy(true);
    };
  // room is stable for the lifetime of GamePage
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="flex items-start gap-3">
        {/* Phaser canvas + overlays */}
        <div className="relative">
          <div ref={containerRef} />

          {/* 升級技能選擇 */}
          {levelUp && !result && (
            <SkillSelectionOverlay
              level={levelUp.level}
              options={levelUp.options}
              onSelect={handleSkillSelect}
              isPreBoss={levelUp.isPreBoss}
            />
          )}

          {/* 倒地提示 */}
          {ps?.isDown && !result && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/60 pointer-events-none">
              <div className="text-white text-2xl font-bold mb-3">你已倒下！</div>
              <div className="text-yellow-300 text-sm mb-1">
                按住 <kbd className="bg-gray-800 text-white px-2 py-0.5 rounded font-mono">F</kbd> 發出求救信號
              </div>
              <div className="text-gray-200 text-sm">
                按 <kbd className="bg-gray-800 text-white px-2 py-0.5 rounded font-mono">空白鍵</kbd> 切換觀戰視角
              </div>
              <div className="text-gray-400 text-xs mt-2">等待隊友靠近救援…</div>
            </div>
          )}

          {/* 遊戲結算 overlay */}
          {result && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/85">
              <div className="bg-gray-900 border border-yellow-600 rounded-xl p-6 w-[520px] text-white">
                <h2 className={`text-2xl font-bold text-center mb-1 ${result.cleared ? 'text-yellow-400' : 'text-red-400'}`}>
                  {result.cleared ? '🏆 通關成功！' : '💀 全隊覆滅'}
                </h2>
                <p className="text-gray-400 text-sm text-center mb-4">
                  第 {result.round} 關
                  {result.clearTimeMs != null && `　通關時間 ${Math.floor(result.clearTimeMs / 60000)}m ${Math.floor((result.clearTimeMs % 60000) / 1000)}s`}
                </p>

                <table className="w-full text-sm mb-5">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left pb-1">玩家</th>
                      <th className="text-right pb-1">職業</th>
                      <th className="text-right pb-1">傷害</th>
                      <th className="text-right pb-1">存活</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.players.map((p, i) => (
                      <tr key={i} className="border-b border-gray-800">
                        <td className="py-1">{p.displayName}{p.isGuest ? ' (訪客)' : ''}</td>
                        <td className="text-right text-gray-300">{CLASS_LABEL[p.playerClass] ?? p.playerClass}</td>
                        <td className="text-right text-orange-300">{p.totalDamage}</td>
                        <td className="text-right text-gray-300">{p.survivalTimeSec}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex gap-3">
                  <button
                    onClick={() => { room.send('RETURN_TO_LOBBY'); onReturnToLobby(); }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg transition-colors"
                  >
                    回到大廳
                  </button>
                  <button
                    onClick={() => { room.leave(); onLeave(); }}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-2 rounded-lg transition-colors"
                  >
                    離開遊戲
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Character stats panel */}
        <div className="w-52 text-white text-xs flex flex-col gap-2">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
            <div className="font-bold text-yellow-400 mb-2">角色素質</div>
            {ps ? (
              <>
                <div className="flex justify-between"><span className="text-gray-400">職業</span><span>{CLASS_LABEL[ps.selectedClass]}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">等級</span><span>Lv.{ps.level}</span></div>
                <div className="flex justify-between mb-1"><span className="text-gray-400">HP</span><span>{ps.hp}/{ps.maxHp}</span></div>
                {/* XP bar */}
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (ps.xp / (ps.level * 100)) * 100)}%` }}
                  />
                </div>
                <div className="text-gray-500 mt-0.5">{ps.xp}/{ps.level * 100} XP</div>
              </>
            ) : <div className="text-gray-500">載入中…</div>}
          </div>

          {/* Skills */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
            <button
              className="font-bold text-yellow-400 mb-2 flex items-center justify-between w-full"
              onClick={() => setShowPanel(v => !v)}
            >
              <span>技能 {ps ? `(${ps.skillIds.length}/6)` : ''}</span>
              <span className="text-gray-400">{showPanel ? '▲' : '▼'}</span>
            </button>
            {showPanel && ps && (
              ps.skillIds.length === 0
                ? <div className="text-gray-500">尚無技能</div>
                : ps.skillIds.map(id => {
                    const def = SKILL_DEFS[id];
                    return def ? (
                      <div key={id} className="mb-1.5">
                        <div className="text-yellow-300">{def.name}</div>
                        <div className="text-gray-400">{def.description}</div>
                      </div>
                    ) : null;
                  })
            )}
          </div>

          {/* Equipment */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
            <div className="font-bold text-yellow-400 mb-2">裝備</div>
            {ps ? (
              <>
                <div className="mb-1">
                  <span className="text-gray-400">武器：</span>
                  <span>{ITEM_DEFS[ps.weaponId]?.name ?? '（無）'}</span>
                </div>
                {ps.passiveIds.length === 0
                  ? <div className="text-gray-500">無被動</div>
                  : ps.passiveIds.map((id, i) => (
                      <div key={i} className="text-gray-300">
                        {ITEM_DEFS[id]?.name ?? id}
                      </div>
                    ))
                }
              </>
            ) : null}
          </div>

          {/* Teammate status */}
          {teammates.length > 0 && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
              <div className="font-bold text-yellow-400 mb-2">隊友狀態</div>
              {teammates.map(t => (
                <div key={t.id} className={`mb-2 ${t.isDown ? 'opacity-50' : ''}`}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className={t.isDown ? 'text-red-400 line-through' : 'text-gray-200'}>
                      {t.displayName}{t.isBot ? ' [Bot]' : ''}
                    </span>
                    <span className="text-gray-500 text-[10px]">{CLASS_LABEL[t.selectedClass] ?? t.selectedClass}</span>
                  </div>
                  {t.isDown ? (
                    <div className="text-red-400 text-[10px]">已倒下</div>
                  ) : (
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${t.maxHp > 0 ? Math.max(0, Math.min(100, (t.hp / t.maxHp) * 100)) : 0}%` }}
                      />
                    </div>
                  )}
                  {!t.isDown && (
                    <div className="text-gray-500 text-[10px] mt-0.5">{t.hp}/{t.maxHp} HP</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button onClick={onLeave} className="text-sm underline text-muted-foreground">
        離開遊戲
      </button>
    </div>
  );
}
