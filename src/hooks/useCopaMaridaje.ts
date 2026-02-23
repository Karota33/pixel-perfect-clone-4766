import { useState, useCallback } from "react";

const STORAGE_KEY = "copa_maridaje_ml";
const DEFAULT_ML = 120;

function load(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v) return Number(v);
  } catch {}
  return DEFAULT_ML;
}

export function useCopaMaridaje() {
  const [ml, setMlState] = useState(load);

  const setMl = useCallback((value: number) => {
    setMlState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  return { ml, setMl };
}

export function getCopaMaridajeMl(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v) return Number(v);
  } catch {}
  return DEFAULT_ML;
}
