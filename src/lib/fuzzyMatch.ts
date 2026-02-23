/**
 * Levenshtein distance between two strings (case-insensitive).
 */
function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= an; i++) matrix[i] = [i];
  for (let j = 0; j <= bn; j++) matrix[0][j] = j;

  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[an][bn];
}

/**
 * Normalise a wine name for comparison: lowercase, trim,
 * remove accents, collapse whitespace.
 */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface FuzzyMatch {
  csvName: string;
  csvPrice: number;
  matchedName: string | null;
  matchedId: string | null;
  currentCost: number | null;
  distance: number;
  similarity: number; // 0-1
}

/**
 * Match CSV rows against wine names.
 * Returns sorted by best match first.
 * Threshold: similarity >= 0.6 is considered a match.
 */
export function fuzzyMatchWines(
  csvRows: { name: string; price: number }[],
  wines: { id: string; nombre: string; precio_coste: number | null }[]
): { matched: FuzzyMatch[]; unmatched: FuzzyMatch[] } {
  const matched: FuzzyMatch[] = [];
  const unmatched: FuzzyMatch[] = [];

  for (const row of csvRows) {
    const normRow = normalise(row.name);
    let bestDist = Infinity;
    let bestWine: (typeof wines)[0] | null = null;

    for (const wine of wines) {
      const normWine = normalise(wine.nombre);
      const dist = levenshtein(normRow, normWine);
      if (dist < bestDist) {
        bestDist = dist;
        bestWine = wine;
      }
    }

    const maxLen = Math.max(normRow.length, bestWine ? normalise(bestWine.nombre).length : 1);
    const similarity = 1 - bestDist / maxLen;

    const result: FuzzyMatch = {
      csvName: row.name,
      csvPrice: row.price,
      matchedName: similarity >= 0.6 ? bestWine?.nombre ?? null : null,
      matchedId: similarity >= 0.6 ? bestWine?.id ?? null : null,
      currentCost: similarity >= 0.6 ? bestWine?.precio_coste ?? null : null,
      distance: bestDist,
      similarity,
    };

    if (result.matchedId) {
      matched.push(result);
    } else {
      unmatched.push(result);
    }
  }

  matched.sort((a, b) => b.similarity - a.similarity);
  return { matched, unmatched };
}

/**
 * Parse a CSV string and extract name + price columns.
 * Auto-detects column names.
 */
export function parseCSV(
  text: string
): { name: string; price: number }[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Detect separator
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/"/g, ""));

  // Find name column
  const nameIdx = headers.findIndex((h) =>
    ["nombre", "name", "vino", "wine", "producto", "product", "referencia", "ref", "nombre del vino"].includes(h)
  );
  // Find price column
  const priceIdx = headers.findIndex((h) =>
    ["precio", "price", "coste", "cost", "pvp", "precio_coste", "precio_ud", "importe", "precio (€/ud)", "precio (eur)", "precio €", "p.v.p."].includes(h)
  );

  if (nameIdx === -1 || priceIdx === -1) return [];

  const rows: { name: string; price: number }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/"/g, ""));
    const name = cols[nameIdx];
    const priceStr = cols[priceIdx]?.replace(",", ".").replace(/[€$]/g, "");
    const price = parseFloat(priceStr);
    if (name && !isNaN(price)) {
      rows.push({ name, price });
    }
  }
  return rows;
}
