import ExcelJS from "exceljs";
import { supabase } from "@/integrations/supabase/client";

// ── Constants ──────────────────────────────────────────────────
const GRANATE = "8B0000";
const AMBER = "CC8800";
const ORANGE_HDR = "B05000";
const BLUE_LIGHT = "D9EAF7";
const BORDER_COLOR = "CCCCCC";

const DO_OPTIONS = [
  "Sin D.O.", "D.O. Gran Canaria", "D.O. Lanzarote", "D.O. La Palma",
  "D.O. El Hierro", "D.O. La Gomera", "D.O. Fuerteventura",
  "D.O. Tacoronte-Acentejo", "D.O. Valle de La Orotava",
  "D.O. Ycoden-Daute-Isora", "D.O. Abona", "D.O. Valle de Güímar",
  "D.O.P. Islas Canarias",
];

const TIPO_OPTIONS = "blanco,tinto,rosado,espumoso,dulce,sidra";

const SEED_PROVEEDORES = [
  { nombre: "Premium Drinks", web: "premiumdrinks.es" },
  { nombre: "La Cava de Piñero", web: "lacavadepinero.es" },
  { nombre: "Vinofilos", web: "vinofilos.es" },
  { nombre: "Harvest Distribuciones", web: "harvestdistribuciones.com.es" },
  { nombre: "Suertes del Marqués", web: "suertesdelmarques.com" },
  { nombre: "El Grifo", web: "elgrifo.com" },
  { nombre: "Vega de Gáldar", web: "vegadegaldar.com" },
];

// ── Helpers ────────────────────────────────────────────────────
const thin = (color = BORDER_COLOR): Partial<ExcelJS.Border> => ({ style: "thin", color: { argb: color } });
const border4 = (color?: string): Partial<ExcelJS.Borders> => ({ top: thin(color), bottom: thin(color), left: thin(color), right: thin(color) });
const fill = (argb: string): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const fontW = (size: number, bold = false, color = "FFFFFF", italic = false): Partial<ExcelJS.Font> => ({ name: "Arial", size, bold, italic, color: { argb: color } });

function setRow(ws: ExcelJS.Worksheet, row: number, height: number) {
  ws.getRow(row).height = height;
}

// ── Main export function ───────────────────────────────────────
export async function exportarInventario(): Promise<number> {
  // 1. Fetch data
  const { data, error } = await supabase
    .from("vinos")
    .select(`id_local, nombre, anada, tipo, subtipo, isla, "do", uvas, precio_carta, stock_actual, precio_coste, foto_url, bodegas ( nombre )`)
    .order("nombre", { ascending: true });

  if (error) throw error;
  const vinos = data || [];

  const wb = new ExcelJS.Workbook();
  wb.creator = "Tabaiba App";

  // ════════════════════════════════════════════════════════════
  // HOJA 1 — INVENTARIO
  // ════════════════════════════════════════════════════════════
  const ws = wb.addWorksheet("INVENTARIO");

  const fecha = new Date();
  const fechaStr = fecha.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

  // Column widths
  const widths = [46, 7, 11, 22, 36, 14, 10, 26, 26, 11, 14, 26, 26, 38];
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  // Row 1 — Banner
  ws.mergeCells("A1:N1");
  const c1 = ws.getCell("A1");
  c1.value = `INVENTARIO DE VINOS · RESTAURANTE TABAIBA · Exportado ${fechaStr}`;
  c1.fill = fill(GRANATE);
  c1.font = fontW(14, true);
  c1.alignment = { vertical: "middle", horizontal: "center" };
  setRow(ws, 1, 28);

  // Row 2 — Legend
  ws.mergeCells("A2:N2");
  const c2 = ws.getCell("A2");
  c2.value = "  🟢 Verde = datos existentes (no modificar salvo error)     🟡 Amarillo = completar: bodega, DO, subtipo, coste     🟠 Naranja = proveedor y foto (opcional)";
  c2.fill = fill(BLUE_LIGHT);
  c2.font = fontW(9, false, "444444", true);
  c2.alignment = { vertical: "middle" };
  setRow(ws, 2, 18);

  // Row 3 — spacer
  setRow(ws, 3, 5);

  // Row 4 — Headers
  const headers = [
    "NOMBRE DEL VINO", "AÑADA", "TIPO", "ISLA / ORIGEN", "UVAS",
    "PRECIO CARTA (€)", "STOCK ACTUAL", "BODEGA / ELABORADOR", "D.O. OFICIAL",
    "SUBTIPO", "PRECIO COSTE (€)", "PROVEEDOR / DISTRIBUIDOR", "CONTACTO PROVEEDOR", "URL FOTO",
  ];
  const hdrColors: string[] = [];
  const hdrFonts: string[] = [];
  headers.forEach((_, i) => {
    if (i <= 6) { hdrColors.push(GRANATE); hdrFonts.push("FFFFFF"); }
    else if (i <= 10) { hdrColors.push(AMBER); hdrFonts.push("2D2D00"); }
    else { hdrColors.push(ORANGE_HDR); hdrFonts.push("FFFFFF"); }
  });

  const hdrRow = ws.getRow(4);
  hdrRow.height = 34;
  headers.forEach((h, i) => {
    const cell = hdrRow.getCell(i + 1);
    cell.value = h;
    cell.fill = fill(hdrColors[i]);
    cell.font = fontW(9, true, hdrFonts[i]);
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = border4();
  });

  // Data rows (starting row 5)
  const dataStartRow = 5;
  const greenEven = "DFF0D8";
  const greenOdd = "EAFAEA";
  const yellowEven = "FFF3CD";
  const yellowOdd = "FFF9E6";
  const orangeEven = "FFF0E0";
  const orangeOdd = "FFF8F0";

  vinos.forEach((v: any, idx: number) => {
    const rowNum = dataStartRow + idx;
    const isEven = idx % 2 === 0;
    const row = ws.getRow(rowNum);
    row.height = 17;

    const vals: any[] = [
      (v.nombre || "").trim(),
      v.anada ?? "",
      v.tipo ? v.tipo.trim().toLowerCase() : "",
      (v.isla || "").trim(),
      (v.uvas || "").trim(),
      v.precio_carta != null ? Number(Number(v.precio_carta).toFixed(2)) : "",
      v.stock_actual ?? 0,
      v.bodegas?.nombre ? (v.bodegas.nombre as string).trim() : "",
      (v.do || "").trim(),
      v.subtipo ? v.subtipo.trim().toLowerCase() : "",
      v.precio_coste != null ? Number(Number(v.precio_coste).toFixed(2)) : "",
      "",
      "",
      v.foto_url || "",
    ];

    vals.forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      cell.font = { name: "Arial", size: 9 };
      cell.border = border4();

      // Background color by zone
      let bg: string;
      if (ci <= 6) bg = isEven ? greenEven : greenOdd;
      else if (ci <= 10) bg = isEven ? yellowEven : yellowOdd;
      else bg = isEven ? orangeEven : orangeOdd;

      // Orange subtype exception
      if (ci === 9 && typeof val === "string" && val === "orange") {
        bg = "EDE7F6";
        cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "5B2C8D" } };
      }
      cell.fill = fill(bg);

      // Formatting
      if (ci === 5 || ci === 10) {
        cell.numFmt = '#,##0.00 "€"';
        cell.alignment = { horizontal: "right", vertical: "middle" };
      } else if (ci === 1 || ci === 6) {
        cell.numFmt = "0";
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (ci === 2 || ci === 9) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else {
        cell.alignment = { vertical: "middle" };
      }
    });
  });

  // Data validations on data columns
  const lastDataRow = dataStartRow + vinos.length - 1;
  if (vinos.length > 0) {
    // Col C — TIPO
    ws.getColumn(3).eachCell((cell, rowNumber) => {
      if (rowNumber >= dataStartRow && rowNumber <= lastDataRow) {
        cell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [`"${TIPO_OPTIONS}"`],
          showErrorMessage: true,
          errorTitle: "Tipo no válido",
          error: "Selecciona un tipo de la lista",
        };
      }
    });

    // Col I — D.O.
    ws.getColumn(9).eachCell((cell, rowNumber) => {
      if (rowNumber >= dataStartRow && rowNumber <= lastDataRow) {
        cell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [`"${DO_OPTIONS.join(",")}"`],
        };
      }
    });

    // Col J — SUBTIPO
    ws.getColumn(10).eachCell((cell, rowNumber) => {
      if (rowNumber >= dataStartRow && rowNumber <= lastDataRow) {
        cell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ['"orange"'],
        };
      }
    });

    // Col L — PROVEEDOR (dynamic list from PROVEEDORES sheet)
    ws.getColumn(12).eachCell((cell, rowNumber) => {
      if (rowNumber >= dataStartRow && rowNumber <= lastDataRow) {
        cell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ["PROVEEDORES!$A$4:$A$60"],
        };
      }
    });
  }

  // Freeze & autofilter
  ws.views = [{ state: "frozen", ySplit: 4, xSplit: 0 }];
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 14 } };

  // Totals row
  const totalsRow = dataStartRow + vinos.length;
  ws.mergeCells(`A${totalsRow}:G${totalsRow}`);
  const totCell = ws.getCell(`A${totalsRow}`);
  totCell.value = `TOTAL: ${vinos.length} referencias · Exportado ${fechaStr}`;
  totCell.fill = fill("F5DEDE");
  totCell.font = fontW(9, true, GRANATE);
  totCell.alignment = { vertical: "middle" };
  ws.getRow(totalsRow).height = 20;

  // COUNTA formulas for totals
  const lastR = dataStartRow + vinos.length - 1;
  const formulaCols: { col: string; label: string }[] = [
    { col: "H", label: "bodegas" },
    { col: "J", label: "subtipos" },
    { col: "K", label: "costes" },
    { col: "L", label: "proveedores" },
    { col: "N", label: "fotos" },
  ];
  formulaCols.forEach(({ col, label }) => {
    const c = ws.getCell(`${col}${totalsRow}`);
    c.value = { formula: `COUNTA(${col}${dataStartRow}:${col}${lastR})` };
    c.numFmt = `0 "${label}"`;
    c.fill = fill("F5DEDE");
    c.font = fontW(9, true, GRANATE);
    c.border = border4();
  });

  // Note row
  const noteRow = totalsRow + 1;
  ws.mergeCells(`A${noteRow}:N${noteRow}`);
  const noteCell = ws.getCell(`A${noteRow}`);
  noteCell.value = "💡  URL FOTO: enlace directo a la imagen subida en la app. Para añadir o cambiar fotos, usa la ficha del vino → pestaña Gestión.";
  noteCell.fill = fill(BLUE_LIGHT);
  noteCell.font = fontW(8, false, "666666", true);
  noteCell.alignment = { vertical: "middle", wrapText: true };
  setRow(ws, noteRow, 22);

  // ════════════════════════════════════════════════════════════
  // HOJA 2 — PROVEEDORES
  // ════════════════════════════════════════════════════════════
  const wsP = wb.addWorksheet("PROVEEDORES");

  // Widths
  [30, 16, 30, 30, 42, 36].forEach((w, i) => { wsP.getColumn(i + 1).width = w; });

  // Row 1 — Banner
  wsP.mergeCells("A1:F1");
  const p1 = wsP.getCell("A1");
  p1.value = "PROVEEDORES · RESTAURANTE TABAIBA";
  p1.fill = fill(GRANATE);
  p1.font = fontW(13, true);
  p1.alignment = { vertical: "middle", horizontal: "center" };
  setRow(wsP, 1, 26);

  // Row 2 — Notice
  wsP.mergeCells("A2:F2");
  const p2 = wsP.getCell("A2");
  p2.value = "Registra cada proveedor UNA SOLA VEZ. Su nombre aparecerá automáticamente en el desplegable de la hoja INVENTARIO.";
  p2.fill = fill(BLUE_LIGHT);
  p2.font = fontW(9, false, "444444", true);
  p2.alignment = { vertical: "middle" };
  setRow(wsP, 2, 18);

  // Row 3 — Headers
  const pHeaders = ["PROVEEDOR / DISTRIBUIDOR", "TELÉFONO", "EMAIL", "WEB", "BODEGAS QUE DISTRIBUYE", "NOTAS"];
  const pRow3 = wsP.getRow(3);
  pRow3.height = 28;
  pHeaders.forEach((h, i) => {
    const cell = pRow3.getCell(i + 1);
    cell.value = h;
    cell.fill = fill(ORANGE_HDR);
    cell.font = fontW(9, true);
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = border4("888888");
  });

  // Seed data from row 4
  SEED_PROVEEDORES.forEach((prov, idx) => {
    const rowNum = 4 + idx;
    const row = wsP.getRow(rowNum);
    row.height = 17;
    const bgColor = idx % 2 === 0 ? orangeEven : orangeOdd;
    row.getCell(1).value = prov.nombre;
    row.getCell(4).value = prov.web;
    for (let c = 1; c <= 6; c++) {
      const cell = row.getCell(c);
      cell.fill = fill(bgColor);
      cell.font = { name: "Arial", size: 9 };
      cell.border = border4();
      cell.alignment = { vertical: "middle" };
    }
  });

  // Empty rows up to row 60
  for (let r = 4 + SEED_PROVEEDORES.length; r <= 60; r++) {
    const row = wsP.getRow(r);
    row.height = 17;
    const bgColor = (r - 4) % 2 === 0 ? orangeEven : orangeOdd;
    for (let c = 1; c <= 6; c++) {
      const cell = row.getCell(c);
      cell.fill = fill(bgColor);
      cell.font = { name: "Arial", size: 9 };
      cell.border = border4();
    }
  }

  wsP.views = [{ state: "frozen", ySplit: 3, xSplit: 0 }];
  wsP.autoFilter = { from: { row: 3, column: 1 }, to: { row: 59, column: 6 } };

  // ════════════════════════════════════════════════════════════
  // HOJA 3 — INSTRUCCIONES
  // ════════════════════════════════════════════════════════════
  const wsI = wb.addWorksheet("INSTRUCCIONES");
  wsI.getColumn(1).width = 26;
  wsI.getColumn(2).width = 68;

  // Row 1 — Banner
  wsI.mergeCells("A1:B1");
  const i1 = wsI.getCell("A1");
  i1.value = "INSTRUCCIONES — Inventario de Vinos Tabaiba";
  i1.fill = fill(GRANATE);
  i1.font = fontW(13, true);
  i1.alignment = { vertical: "middle", horizontal: "center" };
  setRow(wsI, 1, 26);

  // Row 2
  wsI.mergeCells("A2:B2");
  const i2 = wsI.getCell("A2");
  i2.value = "Este archivo sirve tanto para subir datos a la app como para exportar el inventario actualizado. El formato es siempre el mismo.";
  i2.fill = fill(BLUE_LIGHT);
  i2.font = fontW(9, false, "444444", true);
  i2.alignment = { vertical: "middle", wrapText: true };
  setRow(wsI, 2, 22);

  // Helper to add instruction sections
  const addBanner = (row: number, text: string, color: string) => {
    wsI.mergeCells(`A${row}:B${row}`);
    const c = wsI.getCell(`A${row}`);
    c.value = text;
    c.fill = fill(color);
    c.font = fontW(10, true, "FFFFFF");
    c.alignment = { vertical: "middle" };
    c.border = border4();
    setRow(wsI, row, 24);
  };

  const addPair = (row: number, a: string, b: string, bgColor?: string) => {
    const r = wsI.getRow(row);
    r.height = 22;
    const cA = r.getCell(1);
    cA.value = a;
    cA.font = fontW(9, true, "333333");
    cA.alignment = { vertical: "middle" };
    cA.border = border4();
    const cB = r.getCell(2);
    cB.value = b;
    cB.font = fontW(9, false, "333333");
    cB.alignment = { vertical: "middle", wrapText: true };
    cB.border = border4();
    if (bgColor) {
      cA.fill = fill(bgColor);
      cB.fill = fill(bgColor);
    }
  };

  // Steps
  addBanner(4, "📋  PASOS A SEGUIR", ORANGE_HDR);
  addPair(5, "Paso 1 — Proveedores", "Ve a la hoja PROVEEDORES. Revisa y añade. Solo hace falta una vez.", "F5DEDE");
  addPair(6, "Paso 2 — Inventario", "Los vinos están cargados con sus datos actuales.");
  addPair(7, "Paso 3 — Amarillo", "Completa: Bodega, D.O. (desplegable), Subtipo y Precio Coste.", "F5DEDE");
  addPair(8, "Paso 4 — Naranja", "Selecciona el Proveedor del desplegable.");
  addPair(9, "Paso 5 — Subir", "Guarda el archivo y súbelo a la app.", "F5DEDE");

  // Case sensitivity
  addBanner(11, "⚠️  MAYÚSCULAS Y MINÚSCULAS", AMBER);
  addPair(12, "Campos con desplegable", "TIPO, D.O. y SUBTIPO tienen desplegable. Úsalos siempre.");
  addPair(13, "Campos de texto libre", "BODEGA, PROVEEDOR y NOTAS. La app los normaliza internamente.", BLUE_LIGHT);

  // Orange subtype
  addBanner(15, "🍊  SUBTIPO ORANGE", GRANATE);
  addPair(16, "¿Qué es?", "Blancos con maceración en piel. Filtro propio separado de los blancos.");
  addPair(17, "¿Qué valor?", "Solo escribe 'orange' o déjalo vacío.", BLUE_LIGHT);

  // URL Foto
  addBanner(19, "📸  URL FOTO", "555555");
  addPair(20, "¿Qué es?", "Al exportar aparece el enlace a la foto. Solo de consulta.");
  addPair(21, "¿Cómo subir?", "Ficha del vino → pestaña Gestión → Foto.", BLUE_LIGHT);

  // FAQ
  addBanner(23, "❓  PREGUNTAS FRECUENTES", "555555");
  addPair(24, "¿Bodega y proveedor son lo mismo?", "No. Bodega = elaborador. Proveedor = distribuidor.");
  addPair(25, "¿Tengo que rellenar todo?", "No. Funciona con celdas vacías.", BLUE_LIGHT);
  addPair(26, "¿Puedo añadir vinos nuevos?", "Sí, añade filas al final de INVENTARIO.");
  addPair(27, "¿Puedo añadir proveedores?", "Sí, añade filas en PROVEEDORES.", BLUE_LIGHT);
  addPair(28, "¿Este archivo y el que descargo...", "Sí. Mismo formato. Puedes editarlo y volver a subirlo.");

  // ── Generate and download ───────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const fechaFile = fecha.toISOString().slice(0, 10).replace(/-/g, "");
  a.href = url;
  a.download = `Inventario_Tabaiba_${fechaFile}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);

  return vinos.length;
}
