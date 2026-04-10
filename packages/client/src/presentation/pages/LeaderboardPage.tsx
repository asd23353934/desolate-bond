import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelPanel, PixelButton, PixelTabs, PixelBadge } from '@/components/pixel-ui';
import { api, type LeaderboardEntry } from '@/infrastructure/api';

interface LeaderboardPageProps {
  onBack: () => void;
}

type Category = 'fastest-clear' | 'highest-damage' | 'highest-survival';

const TABS = ['FASTEST CLEAR', 'HIGHEST DAMAGE', 'LONGEST SURVIVAL'];
const TAB_KEYS: Category[] = ['fastest-clear', 'highest-damage', 'highest-survival'];

function formatTime(ms: number | null): string {
  if (ms === null) return '—';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function rankPrefix(rank: number) {
  if (rank === 1) return '♛';
  if (rank === 2) return '♜';
  if (rank === 3) return '♞';
  return `${rank}.`;
}

function rankColor(rank: number) {
  if (rank === 1) return 'text-pixel-gold';
  if (rank === 2) return 'text-pixel-muted';
  if (rank === 3) return 'text-orange-400';
  return 'text-pixel-text';
}

function classBadgeVariant(cls: string): 'tank' | 'damage' | 'support' {
  if (cls === 'TANK') return 'tank';
  if (cls === 'DAMAGE') return 'damage';
  return 'support';
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <pre className="font-body text-pixel-muted text-xs mb-4 inline-block text-left">
{`    _____
   /     \\
  | () () |
   \\  ^  /
    |||||
    |||||`}
      </pre>
      <p className="font-heading text-xs text-pixel-muted">NO RECORDS YET</p>
    </div>
  );
}

export function LeaderboardPage({ onBack }: LeaderboardPageProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = TAB_KEYS[activeTab];

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetch =
      category === 'fastest-clear'   ? api.leaderboardFastestClear  :
      category === 'highest-damage'  ? api.leaderboardHighestDamage :
                                       api.leaderboardHighestSurvival;
    fetch()
      .then(setEntries)
      .catch(() => setError('無法載入排行榜'))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <section className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[720px]">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <PixelButton variant="secondary" size="sm" onClick={onBack}>
            ← BACK
          </PixelButton>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <h2 className="font-heading text-xl text-pixel-amber" style={{ textShadow: '2px 2px 0 #000' }}>
              HALL OF FAME
            </h2>
          </div>
          <div className="w-20" />
        </motion.div>

        {/* Tabs */}
        <div className="mb-4">
          <PixelTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Table */}
        <PixelPanel showCorners={false}>
          <AnimatePresence mode="wait">
            {loading && (
              <motion.p
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-body text-center text-pixel-muted py-12 amber-blink"
              >
                LOADING...
              </motion.p>
            )}
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-body text-center text-pixel-red py-12"
              >
                {error}
              </motion.p>
            )}
            {!loading && !error && entries.length === 0 && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EmptyState />
              </motion.div>
            )}
            {!loading && !error && entries.length > 0 && (
              <motion.div key={category} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-pixel-amber/20">
                        <th className="font-heading text-[8px] text-pixel-amber p-2 text-left">RANK</th>
                        <th className="font-heading text-[8px] text-pixel-amber p-2 text-left">NAME</th>
                        <th className="font-heading text-[8px] text-pixel-amber p-2 text-left">CLASS</th>
                        <th className="font-heading text-[8px] text-pixel-amber p-2 text-right">
                          {category === 'fastest-clear'  ? 'TIME'   :
                           category === 'highest-damage' ? 'DAMAGE' : 'SURVIVAL'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry, i) => {
                        const rank = i + 1;
                        return (
                          <motion.tr
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className={`${
                              i % 2 === 0 ? 'bg-pixel-panel' : 'bg-pixel-border/30'
                            }`}
                          >
                            <td className="p-2">
                              <span className={`font-heading text-xs ${rankColor(rank)}`}>
                                {rankPrefix(rank)}
                              </span>
                            </td>
                            <td className="p-2">
                              <span className="font-body text-lg text-pixel-text">
                                {entry.display_name}
                              </span>
                              {entry.is_guest && (
                                <span className="ml-1 font-heading text-[7px] text-pixel-muted border border-pixel-muted px-1">
                                  GUEST
                                </span>
                              )}
                            </td>
                            <td className="p-2">
                              <PixelBadge variant={classBadgeVariant(entry.player_class)}>
                                {entry.player_class}
                              </PixelBadge>
                            </td>
                            <td className="p-2 text-right">
                              <span className="font-heading text-[10px] text-pixel-teal">
                                {category === 'fastest-clear'  ? formatTime(entry.clear_time)          :
                                 category === 'highest-damage' ? entry.total_damage.toLocaleString()   :
                                                                 `${entry.survival_time}s`}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </PixelPanel>

      </div>
    </section>
  );
}
