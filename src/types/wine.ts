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
}

export type RawWine = Omit<Wine, "id" | "bodega" | "do">;

export const WINE_TYPES = ["blanco", "tinto", "rosado", "espumoso", "dulce", "sidra"] as const;

export const ISLANDS = [
  "Gran Canaria",
  "Tenerife",
  "Lanzarote",
  "La Palma",
  "El Hierro",
  "La Gomera",
  "Fuerteventura",
] as const;

export function getCanonicalIsland(isla: string): string {
  const lower = isla.toLowerCase();
  if (lower.includes("tenerife") || lower.includes("orotava") || lower.includes("tacoronte") || lower.includes("ycoden") || lower.includes("güimar") || lower.includes("güímar") || lower.includes("abona")) return "Tenerife";
  if (lower.includes("gran canaria") || lower.includes("monte lentiscal")) return "Gran Canaria";
  if (lower.includes("lanzarote")) return "Lanzarote";
  if (lower.includes("la palma")) return "La Palma";
  if (lower.includes("el hierro") || lower.includes("hierro")) return "El Hierro";
  if (lower.includes("la gomera") || lower.includes("gomera")) return "La Gomera";
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
