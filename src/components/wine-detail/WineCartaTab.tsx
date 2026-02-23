import { Minus, Plus, Save, ChevronsUpDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getCanonicalIsland, getTypeLabel } from "@/types/wine";
import WineCompletenessBar from "./WineCompletenessBar";
import BodegaAutocomplete from "./BodegaAutocomplete";

const DO_OPTIONS = [
  "Sin D.O.",
  "D.O. Gran Canaria",
  "D.O. Lanzarote",
  "D.O. La Palma",
  "D.O. El Hierro",
  "D.O. La Gomera",
  "D.O. Fuerteventura",
  "D.O. Tacoronte-Acentejo",
  "D.O. Valle de La Orotava",
  "D.O. Ycoden-Daute-Isora",
  "D.O. Abona",
  "D.O. Valle de Güímar",
  "D.O.P. Islas Canarias",
];

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

function DoSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = DO_OPTIONS.filter((o) =>
    o.toLowerCase().includes(filter.toLowerCase())
  );

  const displayValue = value || "Sin D.O.";

  return (
    <div ref={ref} className="bg-card rounded-lg border border-border p-3 relative">
      <label className="text-xs text-muted-foreground mb-1 block">D.O.</label>
      <button
        type="button"
        onClick={() => { setOpen(!open); setFilter(""); }}
        className="w-full flex items-center justify-between text-sm font-medium text-foreground bg-transparent focus:outline-none"
      >
        <span className="truncate">{displayValue}</span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar D.O.…"
              autoFocus
              className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-ring/30"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt === "Sin D.O." ? "" : opt); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
              >
                {(opt === "Sin D.O." ? !value : value === opt) && (
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
                <span className={opt === "Sin D.O." && !value ? "font-medium" : value === opt ? "font-medium" : ""}>{opt}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WineCartaTab({
  wine, supaWine, stock, precioCarta, setPrecioCarta,
  doValue, setDoValue, bodegas, selectedBodegaId, onBodegaChange,
  onIncrement, onDecrement, onSave,
}: Props) {
  const copaEstimada = calcCopa(precioCarta);

  return (
    <div className="space-y-5">
      {supaWine?.foto_url && (
        <div className="flex justify-center">
          <img src={supaWine.foto_url} alt={wine.nombre} className="h-48 object-contain rounded-xl" />
        </div>
      )}

      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold text-foreground leading-tight">{wine.nombre}</h2>
        <BodegaAutocomplete
          bodegas={bodegas.filter((b: any) => b.tipo_entidad === "bodega")}
          selectedBodegaId={selectedBodegaId}
          onBodegaChange={onBodegaChange}
        />
      </div>

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

      <div className="grid grid-cols-2 gap-3">
        <InfoItem label="Tipo" value={getTypeLabel(wine.tipo)} />
        <InfoItem label="Isla" value={getCanonicalIsland(wine.isla)} />
        <DoSelector value={doValue} onChange={setDoValue} />
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
