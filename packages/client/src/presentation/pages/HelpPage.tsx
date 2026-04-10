import { motion } from 'framer-motion';
import { PixelPanel, PixelButton, PixelProgressBar } from '@/components/pixel-ui';

interface HelpPageProps {
  onBack: () => void;
}

const controls = [
  { key: 'W', action: '向上移動' },
  { key: 'S', action: '向下移動' },
  { key: 'A', action: '向左移動' },
  { key: 'D', action: '向右移動' },
];

const gameFlowSteps = ['LOBBY', 'SURVIVAL', 'BOSS PICK', 'BOSS BATTLE', 'REWARD', '×3', 'RESULT'];

const classes = [
  {
    name: 'TANK', icon: '🛡',
    stats: { hp: 200, atk: 8, spd: 140 },
    hpMax: 200, atkMax: 20, spdMax: 200,
    highlights: ['最大 HP 200，最耐打', '護盾可吸收傷害', '靜止時緩慢回復生命'],
  },
  {
    name: 'DAMAGE', icon: '⚔',
    stats: { hp: 80, atk: 15, spd: 160 },
    hpMax: 200, atkMax: 20, spdMax: 200,
    highlights: ['基礎攻擊傷害最高', 'HP 越低攻擊越強', '移動速度最快'],
  },
  {
    name: 'SUPPORT', icon: '✚',
    stats: { hp: 120, atk: 10, spd: 150 },
    hpMax: 200, atkMax: 20, spdMax: 200,
    highlights: ['治療效果加成 ×1.3', '可為隊友持續回血', '光環提升全隊攻擊力'],
  },
];

const bossMechanics = [
  '每輪 SURVIVAL 結束後進行 BOSS 投票選擇',
  '擊敗 BOSS 可獲得裝備獎勵（武器或被動）',
  '共需擊敗 3 隻 BOSS 才能通關',
  'BOSS 血量低時進入強化狀態，攻擊頻率提升',
  '全隊倒地則挑戰失敗，進入結算',
];

export function HelpPage({ onBack }: HelpPageProps) {
  return (
    <section className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[640px] space-y-4">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <PixelButton variant="secondary" size="sm" onClick={onBack}>
            ← BACK
          </PixelButton>
          <h2 className="font-heading text-xl text-pixel-amber" style={{ textShadow: '2px 2px 0 #000' }}>
            HOW TO PLAY
          </h2>
        </motion.div>

        {/* Controls */}
        <PixelPanel title="⌨ CONTROLS">
          <div className="grid grid-cols-2 gap-2">
            {controls.map(ctrl => (
              <div key={ctrl.key} className="flex items-center gap-2">
                <span className="font-heading text-[10px] text-pixel-amber px-2 py-1 bg-pixel-bg border border-pixel-amber min-w-[40px] text-center"
                  style={{ boxShadow: '2px 2px 0 #000' }}>
                  {ctrl.key}
                </span>
                <span className="font-body text-lg text-pixel-text">{ctrl.action}</span>
              </div>
            ))}
          </div>
          <p className="font-body text-sm text-pixel-muted mt-3">
            ※ 攻擊與救援皆為自動 — 靠近敵人自動攻擊，靠近倒地隊友自動救援
          </p>
        </PixelPanel>

        {/* Game Flow */}
        <PixelPanel title="🎮 GAME FLOW">
          <div className="flex flex-wrap items-center justify-center gap-1">
            {gameFlowSteps.map((step, i) => (
              <div key={step} className="flex items-center">
                <span className={`font-heading text-[8px] px-2 py-1 border ${
                  step === '×3'
                    ? 'border-pixel-muted text-pixel-muted bg-transparent'
                    : 'border-pixel-amber text-pixel-text bg-pixel-panel'
                }`}>
                  {step}
                </span>
                {i < gameFlowSteps.length - 1 && (
                  <span className="text-pixel-amber mx-1 text-xs">──►</span>
                )}
              </div>
            ))}
          </div>
          <p className="font-body text-center text-pixel-muted mt-4">
            完成 3 輪 BOSS 循環後進入最終結算
          </p>
        </PixelPanel>

        {/* Classes */}
        <PixelPanel title="🧙 CLASSES">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {classes.map(cls => (
              <motion.div
                key={cls.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-pixel-bg border border-pixel-border"
              >
                <div className="text-center mb-2">
                  <span className="text-2xl">{cls.icon}</span>
                  <div className="font-heading text-[10px] text-pixel-amber mt-1">{cls.name}</div>
                </div>
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-xs text-pixel-muted w-8">HP</span>
                    <PixelProgressBar value={cls.stats.hp} max={cls.hpMax} variant="hp" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-body text-xs text-pixel-muted w-8">ATK</span>
                    <PixelProgressBar value={cls.stats.atk} max={cls.atkMax} variant="default" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-body text-xs text-pixel-muted w-8">SPD</span>
                    <PixelProgressBar value={cls.stats.spd} max={cls.spdMax} variant="xp" />
                  </div>
                </div>
                <ul className="space-y-1">
                  {cls.highlights.map((h, i) => (
                    <li key={i} className="font-body text-xs text-pixel-text flex gap-1">
                      <span className="text-pixel-amber shrink-0">►</span>{h}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </PixelPanel>

        {/* Boss Mechanics */}
        <PixelPanel title="💀 BOSS MECHANICS">
          <ul className="space-y-2">
            {bossMechanics.map((m, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2"
              >
                <span className="text-pixel-amber font-heading text-xs shrink-0">►</span>
                <span className="font-body text-lg text-pixel-text">{m}</span>
              </motion.li>
            ))}
          </ul>
        </PixelPanel>

        {/* Revive System */}
        <PixelPanel title="🤝 REVIVE SYSTEM">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <pre className="font-body text-pixel-amber text-xs leading-tight shrink-0">
{`  ╔══╗   ♥   ╔══╗
  ║☠ ║ ─────► ║♦ ║
  ╚══╝       ╚══╝
 倒地      靠近救援`}
            </pre>
            <div className="flex-1">
              <p className="font-body text-lg text-pixel-text leading-relaxed">
                當隊友倒地時，只需靠近即可自動開始救援。救援進度條填滿後，隊友將復活。
              </p>
              <p className="font-body text-sm text-pixel-muted mt-2">
                ※ 救援過程中請留意周圍敵人
              </p>
            </div>
          </div>
        </PixelPanel>

      </div>
    </section>
  );
}
