export function calcMarginReal(
  precioCarta: number | null,
  precioCoste: number | null
): number | null {
  if (!precioCarta || !precioCoste || precioCarta === 0) return null;
  return ((precioCarta - precioCoste) / precioCarta) * 100;
}

export function calcPvpSugerido(
  precioCoste: number | null,
  marginTarget: number
): number | null {
  if (!precioCoste || marginTarget >= 100) return null;
  return precioCoste / (1 - marginTarget / 100);
}

export type MarginStatus = "ok" | "warn" | "danger" | "nodata";

export function getMarginStatus(
  marginReal: number | null,
  marginTarget: number
): MarginStatus {
  if (marginReal === null) return "nodata";
  if (marginReal >= marginTarget) return "ok";
  if (marginReal >= marginTarget - 5) return "warn";
  return "danger";
}

export function getMarginColor(status: MarginStatus): string {
  const map: Record<MarginStatus, string> = {
    ok: "hsl(var(--margin-ok))",
    warn: "hsl(var(--margin-warn))",
    danger: "hsl(var(--margin-danger))",
    nodata: "hsl(var(--margin-nodata))",
  };
  return map[status];
}
