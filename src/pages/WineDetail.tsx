import { useParams, useNavigate } from "react-router-dom";
import { useWines } from "@/hooks/useWines";
import { getCanonicalIsland, getTypeLabel } from "@/types/wine";
import { ArrowLeft, Minus, Plus, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function WineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getWine, updateWine } = useWines();

  const wine = getWine(Number(id));

  const [stock, setStock] = useState(wine?.stock ?? 0);
  const [precioCarta, setPrecioCarta] = useState(wine?.precio_carta ?? 0);
  const [precioCoste, setPrecioCoste] = useState(wine?.precio_coste ?? 0);

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

  const margin =
    precioCarta && precioCoste
      ? (((precioCarta - precioCoste) / precioCarta) * 100).toFixed(1)
      : null;

  const handleSave = () => {
    updateWine(wine.id, {
      stock,
      precio_carta: precioCarta || null,
      precio_coste: precioCoste || null,
    });
    toast.success("Guardado");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        {/* Name & Price */}
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
          <InfoItem
            label="Origen"
            value={wine.do || getCanonicalIsland(wine.isla)}
          />
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

          {/* Margin */}
          {margin && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">Margen estimado</p>
              <p className="font-display text-lg font-bold text-primary">
                {margin}%
              </p>
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
