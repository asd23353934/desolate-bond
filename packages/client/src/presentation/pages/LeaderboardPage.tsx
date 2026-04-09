import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { api, type LeaderboardEntry } from '../../infrastructure/api';

interface LeaderboardPageProps {
  onBack: () => void;
}

type Category = 'fastest-clear' | 'highest-damage' | 'highest-survival';

function GuestBadge() {
  return (
    <span className="ml-1 rounded bg-amber-700 px-1 py-0.5 text-xs text-amber-100">
      訪客
    </span>
  );
}

function formatTime(ms: number | null): string {
  if (ms === null) return '—';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function LeaderboardTable({ entries, category }: { entries: LeaderboardEntry[]; category: Category }) {
  if (entries.length === 0) {
    return <p className="py-8 text-center text-gray-400">尚無紀錄</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-700 text-left text-gray-400">
          <th className="py-2 pr-4">#</th>
          <th className="py-2 pr-4">玩家</th>
          <th className="py-2 pr-4">職業</th>
          {category === 'fastest-clear' && <th className="py-2">通關時間</th>}
          {category === 'highest-damage' && <th className="py-2">總傷害</th>}
          {category === 'highest-survival' && <th className="py-2">存活時間</th>}
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => (
          <tr key={i} className="border-b border-gray-800">
            <td className="py-2 pr-4 text-gray-500">{i + 1}</td>
            <td className="py-2 pr-4 font-medium">
              {e.display_name}
              {e.is_guest && <GuestBadge />}
            </td>
            <td className="py-2 pr-4 text-gray-400">
              {e.player_class === 'TANK' ? '坦克' : e.player_class === 'DAMAGE' ? '輸出' : '輔助'}
            </td>
            {category === 'fastest-clear' && (
              <td className="py-2 font-mono">{formatTime(e.clear_time)}</td>
            )}
            {category === 'highest-damage' && (
              <td className="py-2 font-mono">{e.total_damage.toLocaleString()}</td>
            )}
            {category === 'highest-survival' && (
              <td className="py-2 font-mono">{e.survival_time}s</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function LeaderboardPage({ onBack }: LeaderboardPageProps) {
  const [tab, setTab] = useState<Category>('fastest-clear');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetch =
      tab === 'fastest-clear'    ? api.leaderboardFastestClear    :
      tab === 'highest-damage'   ? api.leaderboardHighestDamage   :
                                   api.leaderboardHighestSurvival;

    fetch()
      .then(setEntries)
      .catch(() => setError('無法載入排行榜'))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <Card className="w-full max-w-2xl bg-gray-900 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">排行榜</CardTitle>
          <Button variant="outline" onClick={onBack} className="border-gray-600 text-gray-300 hover:bg-gray-800">
            返回
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as Category)}>
            <TabsList className="mb-4 bg-gray-800">
              <TabsTrigger value="fastest-clear">最快通關</TabsTrigger>
              <TabsTrigger value="highest-damage">最高傷害</TabsTrigger>
              <TabsTrigger value="highest-survival">最長存活</TabsTrigger>
            </TabsList>

            {(['fastest-clear', 'highest-damage', 'highest-survival'] as Category[]).map((cat) => (
              <TabsContent key={cat} value={cat}>
                {loading && <p className="py-8 text-center text-gray-400">載入中…</p>}
                {error && <p className="py-8 text-center text-red-400">{error}</p>}
                {!loading && !error && (
                  <LeaderboardTable entries={entries} category={cat} />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
