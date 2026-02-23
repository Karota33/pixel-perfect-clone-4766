import * as XLSX from "xlsx";

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

/**
 * Remove 4-digit year (1900-2099) from a string before comparison.
 */
function stripYear(s: string): string {
  return s.replace(/\b(19|20)\d{2}\b/g, "").replace(/\s+/g, " ").trim();
}

export interface FuzzyMatch {
  csvName: string;
  csvPrice: number;
  csvBodega?: string;
  csvVintage?: string;
  matchedName: string | null;
  matchedId: string | null;
  currentCost: number | null;
  distance: number;
  similarity: number; // 0-1
}

/**
 * Match CSV rows against wine names.
 * Strips 4-digit years before comparison.
 * Threshold: similarity >= 0.55 is considered a match.
 */
export function fuzzyMatchWines(
  csvRows: { name: string; price: number; bodega?: string; vintage?: string }[],
  wines: { id: string; nombre: string; precio_coste: number | null }[]
): { matched: FuzzyMatch[]; unmatched: FuzzyMatch[] } {
  const matched: FuzzyMatch[] = [];
  const unmatched: FuzzyMatch[] = [];

  for (const row of csvRows) {
    const normRow = stripYear(normalise(row.name));
    let bestDist = Infinity;
    let bestWine: (typeof wines)[0] | null = null;

    for (const wine of wines) {
      const normWine = stripYear(normalise(wine.nombre));
      const dist = levenshtein(normRow, normWine);
      if (dist < bestDist) {
        bestDist = dist;
        bestWine = wine;
      }
    }

    const maxLen = Math.max(normRow.length, bestWine ? stripYear(normalise(bestWine.nombre)).length : 1);
    const similarity = 1 - bestDist / maxLen;
    const THRESHOLD = 0.55;

    const result: FuzzyMatch = {
      csvName: row.name,
      csvPrice: row.price,
      csvBodega: row.bodega,
      csvVintage: row.vintage,
      matchedName: similarity >= THRESHOLD ? bestWine?.nombre ?? null : null,
      matchedId: similarity >= THRESHOLD ? bestWine?.id ?? null : null,
      currentCost: similarity >= THRESHOLD ? bestWine?.precio_coste ?? null : null,
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

// --- Header matchers (case-insensitive, substring) ---

const NAME_PATTERNS = ["nombre", "vino", "wine", "producto"];
const PRICE_PATTERNS = ["precio", "price", "coste", "pvp", "€"];
const BODEGA_PATTERNS = ["bodega", "productor", "producer", "winery"];
const VINTAGE_PATTERNS = ["añada", "anada", "vintage", "año", "year"];

function matchesAny(header: string, patterns: string[]): boolean {
  const h = header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return patterns.some((p) => h.includes(p.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
}

interface ColumnMap {
  nameIdx: number;
  priceIdx: number;
  bodegaIdx: number;
  vintageIdx: number;
}

function findHeaderRow(rows: string[][]): { headerRowIdx: number; cols: ColumnMap } | null {
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const cells = rows[r];
    if (!cells || cells.length < 2) continue;

    const nameIdx = cells.findIndex((c) => matchesAny(c, NAME_PATTERNS));
    const priceIdx = cells.findIndex((c) => matchesAny(c, PRICE_PATTERNS));

    if (nameIdx !== -1 && priceIdx !== -1) {
      const bodegaIdx = cells.findIndex((c) => matchesAny(c, BODEGA_PATTERNS));
      const vintageIdx = cells.findIndex((c) => matchesAny(c, VINTAGE_PATTERNS));
      return { headerRowIdx: r, cols: { nameIdx, priceIdx, bodegaIdx, vintageIdx } };
    }
  }
  return null;
}

export type ParsedRow = { name: string; price: number; bodega?: string; vintage?: string };

function extractRows(
  dataRows: string[][],
  cols: ColumnMap
): ParsedRow[] {
  const rows: ParsedRow[] = [];
  for (const cells of dataRows) {
    const name = cells[cols.nameIdx]?.trim();
    const priceStr = cells[cols.priceIdx]
      ?.replace(",", ".")
      .replace(/[€$\s]/g, "")
      .trim();
    const price = parseFloat(priceStr || "");
    if (name && !isNaN(price)) {
      const row: ParsedRow = { name, price };
      if (cols.bodegaIdx !== -1) row.bodega = cells[cols.bodegaIdx]?.trim() || undefined;
      if (cols.vintageIdx !== -1) row.vintage = cells[cols.vintageIdx]?.trim() || undefined;
      rows.push(row);
    }
  }
  return rows;
}

/**
 * Parse a CSV string and extract name + price columns.
 * Auto-detects header row (skips company headers).
 */
export function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const sep = lines[0].includes(";") ? ";" : ",";
  const allRows = lines.map((l) => l.split(sep).map((c) => c.trim().replace(/"/g, "")));

  const result = findHeaderRow(allRows);
  if (!result) return [];

  return extractRows(allRows.slice(result.headerRowIdx + 1), result.cols);
}

/**
 * Parse an Excel file (ArrayBuffer) and extract name + price columns.
 * Auto-detects header row (skips company headers / notes).
 */
export function parseExcel(buffer: ArrayBuffer): ParsedRow[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];

  const raw: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  });
  const allRows = raw.map((row) => row.map((cell) => String(cell ?? "")));

  const result = findHeaderRow(allRows);
  if (!result) return [];

  return extractRows(allRows.slice(result.headerRowIdx + 1), result.cols);
}
