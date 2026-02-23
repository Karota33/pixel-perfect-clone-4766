import { useState, useEffect, useCallback } from "react";
import { Wine } from "@/types/wine";
import { initialWines } from "@/data/wines";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "tabaiba_wines";
const VERSION_KEY = "tabaiba_wines_version";
const CURRENT_VERSION = "2";

function loadWines(): Wine[] {
  try {
    const version = localStorage.getItem(VERSION_KEY);
    if (version === CURRENT_VERSION) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    }
  } catch {}
  localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialWines));
  return initialWines;
}

function saveWines(wines: Wine[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wines));
}

export function useWines() {
  const [wines, setWines] = useState<Wine[]>(loadWines);

  // Fetch descripcion_corta from Supabase and merge
  useEffect(() => {
    async function fetchDescriptions() {
      const { data } = await supabase
        .from("vinos")
        .select("nombre, descripcion_corta");
      if (!data) return;
      const descMap = new Map(
        data.map((v) => [v.nombre, v.descripcion_corta])
      );
      setWines((prev) =>
        prev.map((w) => ({
          ...w,
          descripcion_corta: descMap.get(w.nombre) ?? null,
        }))
      );
    }
    fetchDescriptions();
  }, []);

  useEffect(() => {
    saveWines(wines);
  }, [wines]);

  const updateWine = useCallback((id: number, updates: Partial<Wine>) => {
    setWines((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  }, []);

  const getWine = useCallback(
    (id: number) => wines.find((w) => w.id === id) || null,
    [wines]
  );

  return { wines, updateWine, getWine };
}
