import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import type { Room } from 'colyseus.js';
import type { AuthUser } from '@/application/useAuth';
import type { GameSettings } from '@/application/useGameSettings';
import { GameScene } from '@/infrastructure/phaser/GameScene';
import { SkillSelectionOverlay } from '@/presentation/components/SkillSelectionOverlay';
import { RewardSelectionOverlay } from '@/presentation/components/RewardSelectionOverlay';
import { SKILL_DEFS } from '@/domain/skillDefs';
import { ITEM_DEFS } from '@/domain/itemDefs';

interface GamePageProps {
  room: Room;
  user: AuthUser;
  settings: GameSettings;
  onLeave: () => void;
  onReturnToLobby: () => void;
}

interface LevelUpState { level: number; options: string[]; isPreBoss?: boolean; ownedLevels?: Record<string, number>; weaponId?: string; weaponLevel?: number; weapon2Id?: string; weapon2Level?: number; weapon3Id?: string; weapon3Level?: number; }

interface LocalPlayerState {
  hp: number; maxHp: number; level: number; xp: number;
  selectedClass: string; skillIds: string[]; skillLevels: number[];
  weaponId: string; weaponLevel: number; weapon2Id: string; weapon2Level: number; weapon3Id: string; weapon3Level: number; passiveIds: string[];
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
        skillLevels: player.skillLevels?.toArray?.() ?? [...(player.skillLevels ?? [])],
        weaponId: player.weaponId ?? '',
        weaponLevel: player.weaponLevel ?? 0,
        weapon2Id: player.weapon2Id ?? '',
        weapon2Level: player.weapon2Level ?? 0,
        weapon3Id: player.weapon3Id ?? '',
        weapon3Level: player.weapon3Level ?? 0,
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
  const [postBossReward, setPostBossReward] = useState<{ options: string[] } | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [preBossWaiting, setPreBossWaiting] = useState<{ waitingNames: string[]; expiresAt: number } | null>(null);
  const [preBossTimeLeft, setPreBossTimeLeft] = useState(0);
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
    const unsub = room.onMessage('PRE_BOSS_SKILL_OPTIONS', (msg: { options: string[]; ownedLevels?: Record<string, number>; weaponId?: string; weaponLevel?: number; weapon2Id?: string; weapon2Level?: number; weapon3Id?: string; weapon3Level?: number }) => {
      setLevelUp({ level: 0, options: msg.options, isPreBoss: true, ownedLevels: msg.ownedLevels, weaponId: msg.weaponId, weaponLevel: msg.weaponLevel, weapon2Id: msg.weapon2Id, weapon2Level: msg.weapon2Level, weapon3Id: msg.weapon3Id, weapon3Level: msg.weapon3Level });
    });
    return () => { unsub(); };
  }, [room]);

  // Boss 前選技能等待狀態
  useEffect(() => {
    const unsub = room.onMessage('PRE_BOSS_WAITING', (msg: { waitingNames: string[]; timeLeft: number }) => {
      setPreBossWaiting(prev => ({
        waitingNames: msg.waitingNames,
        expiresAt: msg.timeLeft > 0 ? Date.now() + msg.timeLeft : (prev?.expiresAt ?? Date.now()),
      }));
    });
    return () => { unsub(); };
  }, [room]);

  useEffect(() => {
    const unsub = room.onMessage('BOSS_SPAWNED', () => {
      setPreBossWaiting(null);
    });
    return () => { unsub(); };
  }, [room]);

  // Boss 後獎勵選擇
  useEffect(() => {
    const unsub = room.onMessage('POST_BOSS_REWARD_OPTIONS', (msg: { options: string[] }) => {
      setPostBossReward({ options: msg.options });
    });
    return () => { unsub(); };
  }, [room]);

  // 消除 BOSS_AREA_ATTACK 未註冊警告（視覺效果由 GameScene 自行處理）
  useEffect(() => {
    const unsub = room.onMessage('BOSS_AREA_ATTACK', () => {});
    return () => { unsub(); };
  }, [room]);

  // 倒數計時器
  useEffect(() => {
    if (!preBossWaiting) return;
    const id = setInterval(() => {
      setPreBossTimeLeft(Math.max(0, Math.ceil((preBossWaiting.expiresAt - Date.now()) / 1000)));
    }, 500);
    return () => clearInterval(id);
  }, [preBossWaiting]);

  function handleSkillSelect(skillId: string) {
    if (levelUp?.isPreBoss) {
      room.send('SELECT_PRE_BOSS_SKILL', { skillId });
    } else {
      room.send('SELECT_SKILL', { skillId });
    }
    setLevelUp(null);
  }

  function handleRewardSelect(rewardId: string) {
    room.send('SELECT_REWARD', { rewardId });
    setPostBossReward(null);
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
              preBossTimeLeft={levelUp.isPreBoss ? preBossTimeLeft : undefined}
              ownedLevels={levelUp.ownedLevels}
              weaponId={levelUp.weaponId}
              weaponLevel={levelUp.weaponLevel}
              weapon2Id={levelUp.weapon2Id}
              weapon2Level={levelUp.weapon2Level}
              weapon3Id={levelUp.weapon3Id}
              weapon3Level={levelUp.weapon3Level}
            />
          )}

          {/* Boss 後獎勵選擇 */}
          {postBossReward && !result && (
            <RewardSelectionOverlay
              options={postBossReward.options}
              ownedWeaponIds={[ps?.weaponId, ps?.weapon2Id, ps?.weapon3Id].filter(Boolean) as string[]}
              onSelect={handleRewardSelect}
            />
          )}

          {/* Boss 前等待：倒數顯示於 Phaser HUD（第X關下方），此處僅顯示仍在選擇的玩家名單 */}
          {preBossWaiting && preBossWaiting.waitingNames.length > 0 && !levelUp && !result && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="bg-black/70 border border-red-600 rounded-lg px-4 py-2 text-center">
                <div className="flex gap-2 justify-center flex-wrap">
                  {preBossWaiting.waitingNames.map((name) => (
                    <span key={name} className="text-xs text-yellow-300">⏳ {name}</span>
                  ))}
                </div>
              </div>
            </div>
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
                {(() => {
                  const xpThreshold = Math.floor(80 * Math.pow(1.06, ps.level - 1));
                  return (
                    <>
                      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (ps.xp / xpThreshold) * 100)}%` }}
                        />
                      </div>
                      <div className="text-gray-500 mt-0.5">{ps.xp}/{xpThreshold} XP</div>
                    </>
                  );
                })()}
              </>
            ) : <div className="text-gray-500">載入中…</div>}
          </div>

          {/* Skills */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
            <div className="font-bold text-yellow-400 mb-2">技能 {ps ? `(${ps.skillIds.length}/8)` : ''}</div>
            {ps ? (
              ps.skillIds.length === 0
                ? <div className="text-gray-500">尚無技能</div>
                : ps.skillIds.map((id, i) => {
                    const def = SKILL_DEFS[id];
                    const lv  = ps.skillLevels[i] ?? 1;
                    return def ? (
                      <div key={id} className="relative group mb-1 cursor-default">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-300">{def.name}</span>
                          <span className="text-[9px] bg-yellow-800 text-yellow-200 px-1 rounded">Lv.{lv}</span>
                        </div>
                        {/* Hover tooltip */}
                        <div className="absolute left-full ml-1 top-0 hidden group-hover:block bg-gray-800 border border-gray-600 rounded p-2 text-[10px] text-gray-200 w-36 z-20 pointer-events-none shadow-lg">
                          {def.levelDesc?.[lv] ?? def.description}
                        </div>
                      </div>
                    ) : null;
                  })
            ) : <div className="text-gray-500">載入中…</div>}
          </div>

          {/* Equipment */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
            <div className="font-bold text-yellow-400 mb-2">裝備</div>
            {ps ? (
              <>
                {([
                  { id: ps.weaponId,  lv: ps.weaponLevel,  label: '槽1' },
                  { id: ps.weapon2Id, lv: ps.weapon2Level ?? 0, label: '槽2' },
                  { id: ps.weapon3Id, lv: ps.weapon3Level ?? 0, label: '槽3' },
                ] as { id: string; lv: number; label: string }[]).map(({ id, lv, label }) => (
                  <div key={label} className="relative group mb-1 cursor-default">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 text-[10px]">{label}</span>
                      <span className="text-gray-400">武器：</span>
                      <span>{ITEM_DEFS[id]?.name ?? '（空）'}</span>
                      {id && lv > 0 && (
                        <span className="text-[9px] bg-orange-800 text-orange-200 px-1 rounded">Lv.{lv}</span>
                      )}
                    </div>
                    {ITEM_DEFS[id] && (
                      <div className="absolute left-full ml-1 top-0 hidden group-hover:block bg-gray-800 border border-gray-600 rounded p-2 text-[10px] text-gray-200 w-36 z-20 pointer-events-none shadow-lg">
                        {ITEM_DEFS[id]!.levelDesc?.[lv] ?? ITEM_DEFS[id]!.description}
                      </div>
                    )}
                  </div>
                ))}
                {ps.passiveIds.length === 0
                  ? <div className="text-gray-500">無被動</div>
                  : ps.passiveIds.map((id, i) => {
                      const def = ITEM_DEFS[id];
                      return (
                        <div key={i} className="relative group mb-0.5 cursor-default">
                          <div className="text-gray-300">{def?.name ?? id}</div>
                          {def && (
                            <div className="absolute left-full ml-1 top-0 hidden group-hover:block bg-gray-800 border border-gray-600 rounded p-2 text-[10px] text-gray-200 w-36 z-20 pointer-events-none shadow-lg">
                              {def.description}
                            </div>
                          )}
                        </div>
                      );
                    })
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
