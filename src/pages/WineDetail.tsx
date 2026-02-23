import { useParams, useNavigate } from "react-router-dom";
import { useWines } from "@/hooks/useWines";
import { useMarginSettings } from "@/hooks/useMarginSettings";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { getCanonicalIsland, getTypeLabel } from "@/types/wine";
import { calcMarginReal, calcPvpSugerido, getMarginStatus, getMarginColor } from "@/lib/margins";
import { ArrowLeft, Minus, Plus, Save, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function WineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getWine, updateWine } = useWines();
  const { getMarginFor } = useMarginSettings();
  const { record, getForWine } = usePriceHistory();

  const wine = getWine(Number(id));

  const [stock, setStock] = useState(wine?.stock ?? 0);
  const [precioCarta, setPrecioCarta] = useState(wine?.precio_carta ?? 0);
  const [precioCoste, setPrecioCoste] = useState(wine?.precio_coste ?? 0);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (wine) {
      setStock(wine.stock ?? 0);
      setPrecioCarta(wine.precio_carta ?? 0);
      setPrecioCoste(wine.precio_coste ?? 0);
    }
  }, [wine]);

  if (!wine) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Vino no encontrado</p>
      </div>
    );
  }

  const marginTarget = getMarginFor(wine.tipo);
  const marginReal = calcMarginReal(precioCarta || null, precioCoste || null);
  const pvpSugerido = calcPvpSugerido(precioCoste || null, marginTarget);
  const marginStatus = getMarginStatus(marginReal, marginTarget);
  const ingresoBruto = precioCarta && precioCoste ? precioCarta - precioCoste : null;
  const priceHistory = getForWine(wine.id);

  const handleSave = () => {
    // Record price changes
    if ((precioCarta || null) !== wine.precio_carta) {
      record(wine.id, "precio_carta", wine.precio_carta, precioCarta || null);
    }
    if ((precioCoste || null) !== wine.precio_coste) {
      record(wine.id, "precio_coste", wine.precio_coste, precioCoste || null);
    }
    updateWine(wine.id, {
      stock,
      precio_carta: precioCarta || null,
      precio_coste: precioCoste || null,
    });
    toast.success("Guardado");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-2xl py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground truncate">
            Ficha de vino
          </h1>
        </div>
      </header>

      <main className="container max-w-2xl py-6 space-y-6 animate-fade-in">
        {/* Name */}
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold text-foreground leading-tight">
            {wine.nombre}
          </h2>
          {wine.bodega && (
            <p className="text-sm text-primary font-medium">{wine.bodega}</p>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoItem label="Tipo" value={getTypeLabel(wine.tipo)} />
          <InfoItem label="Origen" value={wine.do || getCanonicalIsland(wine.isla)} />
          <InfoItem label="Isla" value={getCanonicalIsland(wine.isla)} />
          <InfoItem label="Añada" value={wine.anada?.toString() || "—"} />
        </div>

        {wine.uvas && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Variedades</p>
            <p className="text-sm text-foreground">{wine.uvas}</p>
          </div>
        )}

        {/* Editable Fields */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-5">
          {/* Stock */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">
              Stock (unidades)
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStock(Math.max(0, stock - 1))}
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-display text-2xl font-bold text-foreground w-16 text-center">
                {stock}
              </span>
              <button
                onClick={() => setStock(stock + 1)}
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Precio Carta */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Precio carta (€)
            </label>
            <input
              type="number"
              value={precioCarta || ""}
              onChange={(e) => setPrecioCarta(Number(e.target.value))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>

          {/* Precio Coste */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Precio coste (€)
            </label>
            <input
              type="number"
              value={precioCoste || ""}
              onChange={(e) => setPrecioCoste(Number(e.target.value))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>

          {/* Margin Section */}
          {precioCoste > 0 && (
            <div className="pt-3 border-t border-border space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: getMarginColor(marginStatus) }}
                />
                <p className="text-xs text-muted-foreground">
                  Margen objetivo: {marginTarget}%
                </p>
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

          {/* Save */}
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Save className="w-4 h-4" />
            Guardar cambios
          </button>
        </div>

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
                    {priceHistory.map((ev, i) => (
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
      </main>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
