import { useState, useRef, useEffect } from "react";
import { Plus, X, ChevronsUpDown, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ISLANDS, getTypeLabel } from "@/types/wine";
import { useWines } from "@/hooks/useWines";
import { useBodegas } from "@/hooks/useBodegas";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const TYPE_OPTIONS_CREATE = ["blanco", "tinto", "rosado", "espumoso", "dulce"] as const;

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

const FORMATO_OPTIONS = [
  { value: 375, label: "375ml (37.5cl)" },
  { value: 500, label: "500ml (50cl)" },
  { value: 750, label: "750ml (75cl)" },
  { value: 1500, label: "1500ml (Magnum)" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function NewWineDrawer({ open, onOpenChange, onCreated }: Props) {
  const { bodegas, fetchBodegas } = useBodegas();
  const [saving, setSaving] = useState(false);

  // Required fields
  const [nombre, setNombre] = useState("");
  const [anada, setAnada] = useState("");
  const [tipo, setTipo] = useState("blanco");
  const [isla, setIsla] = useState("Tenerife");
  const [precioCarta, setPrecioCarta] = useState("");
  const [stockInicial, setStockInicial] = useState("0");

  // Optional fields
  const [bodegaId, setBodegaId] = useState<string | null>(null);
  const [bodegaQuery, setBodegaQuery] = useState("");
  const [bodegaOpen, setBodegaOpen] = useState(false);
  const [doValue, setDoValue] = useState("");
  const [uvas, setUvas] = useState("");
  const [formatoMl, setFormatoMl] = useState(750);

  const bodegaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) fetchBodegas();
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bodegaRef.current && !bodegaRef.current.contains(e.target as Node)) setBodegaOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const resetForm = () => {
    setNombre(""); setAnada(""); setTipo("blanco"); setIsla("Tenerife");
    setPrecioCarta(""); setStockInicial("0"); setBodegaId(null);
    setBodegaQuery(""); setDoValue(""); setUvas(""); setFormatoMl(750);
  };

  const canSave = nombre.trim() && anada.trim() && anada.length === 4 && tipo && isla;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("vinos").insert({
        nombre: nombre.trim(),
        anada: Number(anada),
        tipo,
        isla,
        precio_carta: precioCarta ? Number(precioCarta) : null,
        stock_actual: Number(stockInicial) || 0,
        bodega_id: bodegaId,
        do: doValue || null,
        uvas: uvas.trim() || null,
        formato_ml: formatoMl,
      });
      if (error) throw error;
      toast.success("Vino añadido a la carta");
      resetForm();
      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "Error al crear vino");
    } finally {
      setSaving(false);
    }
  };

  const filteredBodegas = bodegas
    .filter((b) => b.tipo_entidad === "bodega" && b.nombre.toLowerCase().includes(bodegaQuery.toLowerCase()))
    .slice(0, 8);

  const selectedBodega = bodegas.find((b) => b.id === bodegaId);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="font-display text-lg">Nueva referencia</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto space-y-5">
          {/* Required fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nombre del vino *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Listán Negro Reserva"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Añada *</label>
                <input
                  type="number"
                  value={anada}
                  onChange={(e) => setAnada(e.target.value)}
                  placeholder="2023"
                  min={1900}
                  max={2100}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tipo *</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none cursor-pointer"
                >
                  {TYPE_OPTIONS_CREATE.map((t) => (
                    <option key={t} value={t}>{getTypeLabel(t)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Isla *</label>
              <select
                value={isla}
                onChange={(e) => setIsla(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none cursor-pointer"
              >
                {ISLANDS.filter(i => i !== "Islas Canarias").map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Precio carta (€) *</label>
                <input
                  type="number"
                  value={precioCarta}
                  onChange={(e) => setPrecioCarta(e.target.value)}
                  placeholder="0.00"
                  min={0}
                  step={0.5}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Stock inicial</label>
                <input
                  type="number"
                  value={stockInicial}
                  onChange={(e) => setStockInicial(e.target.value)}
                  min={0}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>
          </div>

          {/* Optional fields */}
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Más datos — opcional</p>

            {/* Bodega autocomplete */}
            <div ref={bodegaRef} className="relative">
              <label className="text-xs text-muted-foreground mb-1 block">Bodega</label>
              {selectedBodega && !bodegaOpen ? (
                <div className="flex items-center gap-2 w-full px-3 py-2 bg-card border border-border rounded-lg">
                  <span className="text-sm text-foreground flex-1 truncate">{selectedBodega.nombre}</span>
                  <button onClick={() => { setBodegaId(null); setBodegaQuery(""); }} className="p-0.5 rounded hover:bg-accent text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={bodegaQuery}
                  onChange={(e) => { setBodegaQuery(e.target.value); setBodegaOpen(true); }}
                  onFocus={() => setBodegaOpen(true)}
                  placeholder="Buscar bodega…"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              )}
              {bodegaOpen && bodegaQuery.trim().length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-36 overflow-y-auto">
                  {filteredBodegas.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => { setBodegaId(b.id); setBodegaQuery(b.nombre); setBodegaOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
                    >
                      {b.nombre}
                    </button>
                  ))}
                  {filteredBodegas.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>
                  )}
                </div>
              )}
            </div>

            {/* D.O. */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">D.O.</label>
              <select
                value={doValue}
                onChange={(e) => setDoValue(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none cursor-pointer"
              >
                {DO_OPTIONS.map((opt) => (
                  <option key={opt} value={opt === "Sin D.O." ? "" : opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Uvas */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Variedades de uva</label>
              <input
                type="text"
                value={uvas}
                onChange={(e) => setUvas(e.target.value)}
                placeholder="Ej: Listán Negro, Negramoll"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            {/* Formato */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Formato</label>
              <select
                value={formatoMl}
                onChange={(e) => setFormatoMl(Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none cursor-pointer"
              >
                {FORMATO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? "Guardando…" : "Añadir a la carta"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
