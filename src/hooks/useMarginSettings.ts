import { useState, useCallback } from "react";

export interface MarginSettings {
  global: number;
  byType: Record<string, number>;
}

const STORAGE_KEY = "tabaiba_margin_settings";

const DEFAULT_SETTINGS: MarginSettings = {
  global: 70,
  byType: {},
};

function load(): MarginSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function useMarginSettings() {
  const [settings, setSettings] = useState<MarginSettings>(load);

  const save = useCallback((next: MarginSettings) => {
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setGlobal = useCallback(
    (value: number) => save({ ...settings, global: value }),
    [settings, save]
  );

  const setTypeMargin = useCallback(
    (type: string, value: number | null) => {
      const byType = { ...settings.byType };
      if (value === null) delete byType[type];
      else byType[type] = value;
      save({ ...settings, byType });
    },
    [settings, save]
  );

  const getMarginFor = useCallback(
    (tipo: string): number => settings.byType[tipo] ?? settings.global,
    [settings]
  );

  return { settings, setGlobal, setTypeMargin, getMarginFor };
}
