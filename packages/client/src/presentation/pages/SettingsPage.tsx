import { useState } from 'react';
import { motion } from 'framer-motion';
import { PixelPanel, PixelButton, PixelSlider, PixelToggle, PixelRadioGroup } from '@/components/pixel-ui';
import type { GameSettings, KeyBindings } from '@/application/useGameSettings';

const ACTION_LABELS: Record<keyof KeyBindings, string> = {
  up:     'MOVE UP',
  down:   'MOVE DOWN',
  left:   'MOVE LEFT',
  right:  'MOVE RIGHT',
  rescue: 'RESCUE',
};

interface SettingsPageProps {
  settings: GameSettings;
  onUpdate: (patch: Partial<GameSettings>) => void;
  onBack: () => void;
}

export function SettingsPage({ settings, onUpdate, onBack }: SettingsPageProps) {
  const [remapping, setRemapping] = useState<keyof KeyBindings | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  const volumePct = Math.round(settings.volume * 100);

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, action: keyof KeyBindings) {
    if (remapping !== action) return;
    e.preventDefault();
    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    if (key === 'Escape') { setRemapping(null); setConflict(null); return; }

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

  const qualityMap: Record<string, string> = { high: 'HIGH', medium: 'MED', low: 'LOW' };
  const qualityRevMap: Record<string, 'high' | 'medium' | 'low'> = {
    HIGH: 'high', MED: 'medium', LOW: 'low',
  };

  return (
    <section className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[560px] space-y-4">

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
            SETTINGS
          </h2>
        </motion.div>

        {/* Audio */}
        <PixelPanel title="♫ AUDIO">
          <PixelSlider
            label="Volume"
            value={volumePct}
            onChange={v => onUpdate({ volume: v / 100 })}
          />
        </PixelPanel>

        {/* Display */}
        <PixelPanel title="◉ DISPLAY">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-body text-lg text-pixel-text">Floating Damage Numbers</span>
              <PixelToggle
                checked={settings.showDamageNumbers}
                onChange={v => onUpdate({ showDamageNumbers: v })}
              />
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-body text-lg text-pixel-text">Graphics Quality</span>
              <PixelRadioGroup
                options={['HIGH', 'MED', 'LOW']}
                value={qualityMap[settings.graphicsQuality]}
                onChange={v => onUpdate({ graphicsQuality: qualityRevMap[v] })}
              />
            </div>
          </div>
        </PixelPanel>

        {/* Controls */}
        <PixelPanel title="⌨ CONTROLS">
          <div className="space-y-2">
            <div className="flex border-b border-pixel-border pb-2 mb-2">
              <span className="flex-1 font-heading text-[8px] text-pixel-muted">ACTION</span>
              <span className="w-28 font-heading text-[8px] text-pixel-muted text-center">KEY</span>
            </div>

            {(Object.keys(ACTION_LABELS) as Array<keyof KeyBindings>).map((action, i) => {
              const isRemapping = remapping === action;
              const isDuplicate = conflict !== null && isRemapping === false;
              return (
                <motion.div
                  key={action}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center"
                >
                  <span className="flex-1 font-body text-lg text-pixel-text">
                    {ACTION_LABELS[action]}
                  </span>
                  <button
                    className={`w-28 py-1 px-2 border font-heading text-[10px] transition-all cursor-crosshair ${
                      isRemapping
                        ? 'border-pixel-amber bg-pixel-amber/20 amber-blink'
                        : isDuplicate
                        ? 'border-pixel-red bg-pixel-red/10 text-pixel-red'
                        : 'border-pixel-border hover:border-pixel-amber text-pixel-text'
                    }`}
                    onClick={() => { setRemapping(action); setConflict(null); }}
                    onKeyDown={e => handleKeyDown(e, action)}
                  >
                    {isRemapping ? 'PRESS KEY...' : settings.keyBindings[action]}
                  </button>
                </motion.div>
              );
            })}

            {conflict && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 pt-3 border-t border-pixel-border font-body text-pixel-red flex items-center gap-2"
              >
                <span className="font-heading text-xs">!</span>
                {conflict}
              </motion.p>
            )}
            {remapping && (
              <p className="font-body text-sm text-pixel-muted mt-2">
                按下新按鍵，或 ESC 取消
              </p>
            )}
          </div>
        </PixelPanel>

      </div>
    </section>
  );
}
