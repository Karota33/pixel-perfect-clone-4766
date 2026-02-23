import { Minus, Plus, Save } from "lucide-react";
import { getCanonicalIsland, getTypeLabel } from "@/types/wine";
import WineCompletenessBar from "./WineCompletenessBar";
import BodegaAutocomplete from "./BodegaAutocomplete";

interface Props {
  wine: any;
  supaWine: any;
  stock: number;
  precioCarta: number;
  setPrecioCarta: (v: number) => void;
  doValue: string;
  setDoValue: (v: string) => void;
  bodegas: any[];
  selectedBodegaId: string | null;
  onBodegaChange: (id: string | null) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onSave: () => void;
}

function calcCopa(precioCarta: number | null): string | null {
  if (!precioCarta || precioCarta <= 0) return null;
  const raw = precioCarta / 6;
  const rounded = Math.round(raw * 2) / 2; // round to nearest .50
  return rounded.toFixed(2);
}

export default function WineCartaTab({
  wine, supaWine, stock, precioCarta, setPrecioCarta,
  doValue, setDoValue, bodegas, selectedBodegaId, onBodegaChange,
  onIncrement, onDecrement, onSave,
}: Props) {
  const copaEstimada = calcCopa(precioCarta);

  return (
    <div className="space-y-5">
      {/* Hero photo */}
      {supaWine?.foto_url && (
        <div className="flex justify-center">
          <img src={supaWine.foto_url} alt={wine.nombre} className="h-48 object-contain rounded-xl" />
        </div>
      )}

      {/* Name + Bodega */}
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold text-foreground leading-tight">{wine.nombre}</h2>
        <BodegaAutocomplete
          bodegas={bodegas.filter((b: any) => b.tipo_entidad === "bodega")}
          selectedBodegaId={selectedBodegaId}
          onBodegaChange={onBodegaChange}
        />
      </div>

      {/* Completeness */}
      {supaWine && (
        <WineCompletenessBar
          bodegaId={supaWine.bodega_id}
          doValue={doValue || wine.do}
          descripcionCorta={supaWine.descripcion_corta}
          descripcionLarga={supaWine.descripcion_larga}
          precioCoste={wine.precio_coste}
          uvas={wine.uvas || null}
          anada={wine.anada}
        />
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        <InfoItem label="Tipo" value={getTypeLabel(wine.tipo)} />
        <InfoItem label="Isla" value={getCanonicalIsland(wine.isla)} />
        <div className="bg-card rounded-lg border border-border p-3">
          <label className="text-xs text-muted-foreground mb-1 block">D.O.</label>
          <input
            type="text"
            value={doValue}
            onChange={(e) => setDoValue(e.target.value)}
            placeholder="—"
            className="w-full text-sm font-medium text-foreground bg-transparent focus:outline-none"
          />
        </div>
        <InfoItem label="Añada" value={wine.anada?.toString() || "—"} />
      </div>

      {wine.uvas && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Variedades</p>
          <p className="text-sm text-foreground">{wine.uvas}</p>
        </div>
      )}

      {/* Stock + Precio Carta */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-5">
        {/* Stock */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Stock (unidades)</label>
          <div className="flex items-center gap-3">
            <button
              onClick={onDecrement}
              disabled={stock <= 0}
              className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-50"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-display text-2xl font-bold text-foreground w-16 text-center">{stock}</span>
            <button
              onClick={onIncrement}
              className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Precio Carta */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Precio carta (€)</label>
          <input
            type="number"
            value={precioCarta || ""}
            onChange={(e) => setPrecioCarta(Number(e.target.value))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>

        {/* Copa estimada */}
        {copaEstimada && (
          <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg">
            <span className="text-sm text-muted-foreground">🍷 Copa estimada:</span>
            <span className="text-sm font-semibold text-foreground">{copaEstimada}€</span>
          </div>
        )}

        {/* Save */}
        <button
          onClick={onSave}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Save className="w-4 h-4" />
          Guardar cambios
        </button>
      </div>
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
