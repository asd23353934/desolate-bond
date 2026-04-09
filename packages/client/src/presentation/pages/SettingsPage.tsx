import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import type { GameSettings, KeyBindings } from '../../application/useGameSettings';

const ACTION_LABELS: Record<keyof KeyBindings, string> = {
  up:     '向上移動',
  down:   '向下移動',
  left:   '向左移動',
  right:  '向右移動',
  rescue: '救援動作',
};

interface SettingsPageProps {
  settings: GameSettings;
  onUpdate: (patch: Partial<GameSettings>) => void;
  onBack: () => void;
}

export function SettingsPage({ settings, onUpdate, onBack }: SettingsPageProps) {
  const [remapping, setRemapping] = useState<keyof KeyBindings | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, action: keyof KeyBindings) {
    if (remapping !== action) return;
    e.preventDefault();

    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    if (key === 'Escape') { setRemapping(null); setConflict(null); return; }

    // 14.4: Duplicate binding detection — reject if another action already uses this key
    const existing = Object.entries(settings.keyBindings).find(
      ([k, v]) => k !== action && v === key,
    );
    if (existing) {
      setConflict(`「${key}」已被「${ACTION_LABELS[existing[0] as keyof KeyBindings]}」使用`);
      setRemapping(null);
      return;
    }

    setConflict(null);
    onUpdate({ keyBindings: { ...settings.keyBindings, [action]: key } });
    setRemapping(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <Card className="w-full max-w-lg bg-gray-900 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">遊戲設定</CardTitle>
          <Button variant="outline" onClick={onBack} className="border-gray-600 text-gray-300 hover:bg-gray-800">
            返回
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">

          {/* 14.1: Master volume */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              主音量：{Math.round(settings.volume * 100)}%
            </label>
            <input
              type="range"
              min={0} max={1} step={0.05}
              value={settings.volume}
              onChange={(e) => onUpdate({ volume: Number(e.target.value) })}
              className="w-full accent-blue-500"
            />
          </div>

          {/* 14.2: Floating damage numbers toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">顯示浮動傷害數字</span>
            <button
              onClick={() => onUpdate({ showDamageNumbers: !settings.showDamageNumbers })}
              className={`relative h-6 w-12 rounded-full transition-colors ${
                settings.showDamageNumbers ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.showDamageNumbers ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* 14.3: Graphics quality preset */}
          <div>
            <p className="mb-2 text-sm font-medium">畫質設定</p>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => onUpdate({ graphicsQuality: q })}
                  className={`flex-1 rounded px-3 py-1.5 text-sm transition-colors ${
                    settings.graphicsQuality === q
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {q === 'high' ? '高' : q === 'medium' ? '中' : '低'}
                </button>
              ))}
            </div>
          </div>

          {/* 14.4: Key bindings */}
          <div>
            <p className="mb-2 text-sm font-medium">按鍵設定</p>
            {conflict && (
              <p className="mb-2 text-xs text-red-400">{conflict}</p>
            )}
            <div className="flex flex-col gap-2">
              {(Object.keys(ACTION_LABELS) as Array<keyof KeyBindings>).map((action) => (
                <div key={action} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{ACTION_LABELS[action]}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-24 border-gray-600 font-mono ${
                      remapping === action ? 'border-blue-500 text-blue-400' : 'text-gray-200'
                    }`}
                    onClick={() => { setRemapping(action); setConflict(null); }}
                    onKeyDown={(e) => handleKeyDown(e, action)}
                  >
                    {remapping === action ? '…按鍵…' : settings.keyBindings[action]}
                  </Button>
                </div>
              ))}
            </div>
            {remapping && (
              <p className="mt-2 text-xs text-gray-400">按下新按鍵，或 Esc 取消</p>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
