import { getMarginColor, getMarginStatus, calcMarginReal, calcPvpSugerido } from "@/lib/margins";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import StockHistorySection from "./StockHistorySection";
import WineDocumentsSection from "./WineDocumentsSection";

interface Props {
  wine: any;
  supaWine: any;
  precioCoste: number;
  setPrecioCoste: (v: number) => void;
  precioCarta: number;
  marginTarget: number;
  priceHistory: any[];
  stockRefreshKey: number;
  onFotoUpdated: (url: string) => void;
}

export default function WineGestionTab({
  wine, supaWine, precioCoste, setPrecioCoste, precioCarta,
  marginTarget, priceHistory, stockRefreshKey, onFotoUpdated,
}: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const marginReal = calcMarginReal(precioCarta || null, precioCoste || null);
  const pvpSugerido = calcPvpSugerido(precioCoste || null, marginTarget);
  const marginStatus = getMarginStatus(marginReal, marginTarget);
  const ingresoBruto = precioCarta && precioCoste ? precioCarta - precioCoste : null;

  return (
    <div className="space-y-6">
      {/* Precio Coste + Margin */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-5">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Precio coste (€)</label>
          <input
            type="number"
            value={precioCoste || ""}
            onChange={(e) => setPrecioCoste(Number(e.target.value))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>

        {precioCoste > 0 && (
          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: getMarginColor(marginStatus) }}
              />
              <p className="text-xs text-muted-foreground">Margen objetivo: {marginTarget}%</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Margen real</p>
                <p className="font-display text-lg font-bold" style={{ color: getMarginColor(marginStatus) }}>
                  {marginReal !== null ? `${marginReal.toFixed(1)}%` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">PVP sugerido</p>
                <p className="font-display text-lg font-bold text-foreground">
                  {pvpSugerido !== null ? `${pvpSugerido.toFixed(0)}€` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ingreso bruto/ud.</p>
                <p className="font-display text-lg font-bold text-foreground">
                  {ingresoBruto !== null ? `${ingresoBruto.toFixed(1)}€` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">vs. objetivo</p>
                <p className="font-display text-lg font-bold" style={{ color: getMarginColor(marginStatus) }}>
                  {marginReal !== null
                    ? `${(marginReal - marginTarget) > 0 ? "+" : ""}${(marginReal - marginTarget).toFixed(1)}%`
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stock History */}
      {supaWine && (
        <StockHistorySection vinoId={supaWine.id} refreshKey={stockRefreshKey} />
      )}

      {/* Documents */}
      {supaWine && (
        <WineDocumentsSection
          vinoId={supaWine.id}
          vinoNombre={wine?.nombre || ""}
          vinoAnada={wine?.anada ?? null}
          fotoUrl={supaWine.foto_url}
          onFotoUpdated={onFotoUpdated}
        />
      )}

      {/* Price History */}
      {priceHistory.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">
              Historial de precios ({priceHistory.length})
            </span>
            {showHistory ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {showHistory && (
            <div className="border-t border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-left px-4 py-2">Fecha</th>
                    <th className="text-left px-4 py-2">Campo</th>
                    <th className="text-right px-4 py-2">Anterior</th>
                    <th className="text-right px-4 py-2">Nuevo</th>
                  </tr>
                </thead>
                <tbody>
                  {priceHistory.map((ev: any, i: number) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(ev.date).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-4 py-2 text-foreground">
                        {ev.field === "precio_carta" ? "P. Carta" : "P. Coste"}
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground">
                        {ev.oldValue !== null ? `${ev.oldValue}€` : "—"}
                      </td>
                      <td className="px-4 py-2 text-right text-foreground font-medium">
                        {ev.newValue !== null ? `${ev.newValue}€` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
