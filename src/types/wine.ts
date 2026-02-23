export interface Wine {
  id: number;
  nombre: string;
  isla: string;
  tipo: string;
  uvas: string;
  anada: number | null;
  precio_carta: number | null;
  precio_coste: number | null;
  stock: number | null;
  bodega: string | null;
  do: string | null;
  descripcion_corta?: string | null;
  foto_url?: string | null;
  subtipo?: string | null;
}

export type RawWine = Omit<Wine, "id" | "bodega" | "do">;

export const WINE_TYPES = ["blanco", "tinto", "rosado", "espumoso", "dulce", "sidra"] as const;

export const ISLANDS = [
  "Tenerife",
  "Gran Canaria",
  "Lanzarote",
  "La Palma",
  "El Hierro",
  "La Gomera",
  "Fuerteventura",
  "Islas Canarias",
] as const;

export function getCanonicalIsland(isla: string): string {
  const lower = isla.toLowerCase();
  // Islas Canarias (DOP regional) — must check BEFORE individual islands
  if (lower.includes("islas canarias")) return "Islas Canarias";
  // Tenerife — all 5 sub-DOP + island name
  if (lower.includes("tenerife") || lower.includes("abona") || lower.includes("tacoronte") || lower.includes("acentejo") || lower.includes("güimar") || lower.includes("güímar") || lower.includes("orotava") || lower.includes("ycoden") || lower.includes("daute") || lower.includes("isora")) return "Tenerife";
  // Gran Canaria
  if (lower.includes("gran canaria") || lower.includes("monte lentiscal") || lower === "gc") return "Gran Canaria";
  if (lower.includes("lanzarote")) return "Lanzarote";
  if (lower.includes("la palma") || lower.includes("palma")) return "La Palma";
  if (lower.includes("hierro")) return "El Hierro";
  if (lower.includes("gomera")) return "La Gomera";
  if (lower.includes("fuerteventura")) return "Fuerteventura";
  return isla;
}

export function getTypeLabel(tipo: string): string {
  const labels: Record<string, string> = {
    blanco: "Blanco",
    tinto: "Tinto",
    rosado: "Rosado",
    espumoso: "Espumoso",
    dulce: "Dulce",
    sidra: "Sidra",
  };
  return labels[tipo] || tipo;
}
