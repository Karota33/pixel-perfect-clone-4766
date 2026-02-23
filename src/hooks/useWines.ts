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

  // Fetch data from Supabase by id_local and merge; also populate id_local for wines that don't have it yet
  useEffect(() => {
    async function fetchSupaData() {
      const { data } = await supabase
        .from("vinos")
        .select("id_local, nombre, descripcion_corta, foto_url, subtipo");
      if (!data) return;

      // Build map by id_local for fast lookup
      const byIdLocal = new Map(
        data.filter((v) => v.id_local != null).map((v) => [v.id_local!, { descripcion_corta: v.descripcion_corta, foto_url: v.foto_url, subtipo: v.subtipo }])
      );

      // Check if any wines lack id_local — if so, populate them
      const needsPopulation = data.filter((v) => v.id_local == null);
      if (needsPopulation.length > 0) {
        // Build name->id_local map from local wines
        const nameToIdLocal = new Map<string, number>();
        wines.forEach((w) => {
          nameToIdLocal.set(w.nombre.toLowerCase(), w.id);
        });

        for (const row of needsPopulation) {
          const localId = nameToIdLocal.get(row.nombre.toLowerCase());
          if (localId != null) {
            await supabase.from("vinos").update({ id_local: localId }).eq("nombre", row.nombre);
            byIdLocal.set(localId, { descripcion_corta: row.descripcion_corta, foto_url: row.foto_url, subtipo: row.subtipo });
          }
        }
      }

      setWines((prev) =>
        prev.map((w) => {
          const supa = byIdLocal.get(w.id);
          return {
            ...w,
            descripcion_corta: supa?.descripcion_corta ?? null,
            foto_url: supa?.foto_url ?? null,
            subtipo: supa?.subtipo ?? null,
          };
        })
      );
    }
    fetchSupaData();
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
