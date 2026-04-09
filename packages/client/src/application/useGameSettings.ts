import { useState, useCallback } from 'react';

export type GraphicsQuality = 'high' | 'medium' | 'low';

export interface KeyBindings {
  up: string;
  down: string;
  left: string;
  right: string;
  rescue: string;
}

export interface GameSettings {
  volume: number;               // 0–1
  showDamageNumbers: boolean;
  graphicsQuality: GraphicsQuality;
  keyBindings: KeyBindings;
}

const STORAGE_KEY = 'desolate-bond:settings';

const DEFAULT_SETTINGS: GameSettings = {
  volume: 0.7,
  showDamageNumbers: true,
  graphicsQuality: 'high',
  keyBindings: { up: 'W', down: 'S', left: 'A', right: 'D', rescue: 'F' },
};

function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) as Partial<GameSettings> };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: GameSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function useGameSettings() {
  const [settings, setSettings] = useState<GameSettings>(loadSettings);

  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
