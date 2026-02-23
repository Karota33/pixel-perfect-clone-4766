import { useState, useCallback } from "react";

export interface PriceEvent {
  wineId: number;
  field: "precio_carta" | "precio_coste";
  oldValue: number | null;
  newValue: number | null;
  date: string; // ISO
}

const STORAGE_KEY = "tabaiba_price_history";

function load(): PriceEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function save(events: PriceEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function usePriceHistory() {
  const [history, setHistory] = useState<PriceEvent[]>(load);

  const record = useCallback(
    (
      wineId: number,
      field: PriceEvent["field"],
      oldValue: number | null,
      newValue: number | null
    ) => {
      if (oldValue === newValue) return;
      const event: PriceEvent = {
        wineId,
        field,
        oldValue,
        newValue,
        date: new Date().toISOString(),
      };
      const next = [...history, event];
      setHistory(next);
      save(next);
    },
    [history]
  );

  const getForWine = useCallback(
    (wineId: number) =>
      history
        .filter((e) => e.wineId === wineId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [history]
  );

  return { record, getForWine };
}
