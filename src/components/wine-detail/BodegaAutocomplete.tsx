import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Bodega {
  id: string;
  nombre: string;
}

interface Props {
  bodegas: Bodega[];
  selectedBodegaId: string | null;
  onBodegaChange: (id: string | null) => void;
}

export default function BodegaAutocomplete({ bodegas, selectedBodegaId, onBodegaChange }: Props) {
  const selected = bodegas.find((b) => b.id === selectedBodegaId);
  const [query, setQuery] = useState(selected?.nombre || "");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sel = bodegas.find((b) => b.id === selectedBodegaId);
    setQuery(sel?.nombre || "");
  }, [selectedBodegaId, bodegas]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = bodegas
    .filter((b) => b.nombre.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  const exactMatch = bodegas.some((b) => b.nombre.toLowerCase() === query.trim().toLowerCase());

  const handleCreate = async () => {
    if (!query.trim() || creating) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("bodegas")
      .insert({ nombre: query.trim(), tipo_entidad: "bodega" })
      .select("id")
      .single();
    setCreating(false);
    if (error) {
      toast.error("Error al crear bodega");
      return;
    }
    toast.success(`Bodega "${query.trim()}" creada`);
    onBodegaChange(data.id);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="text-xs text-muted-foreground mb-1 block">Bodega</label>
      {selected && !open ? (
        <div className="flex items-center gap-2 w-full px-3 py-2 bg-card border border-border rounded-lg">
          <span className="text-sm font-medium text-foreground flex-1 truncate">{selected.nombre}</span>
          <button
            onClick={() => { onBodegaChange(null); setQuery(""); }}
            className="p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Desvincular bodega"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value.trim()) onBodegaChange(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar o crear bodega…"
          className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      )}
      {open && query.trim().length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                onBodegaChange(b.id);
                setQuery(b.nombre);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors text-foreground"
            >
              {b.nombre}
            </button>
          ))}
          {!exactMatch && query.trim().length > 1 && (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full text-left px-3 py-2 text-sm text-primary font-medium hover:bg-accent transition-colors border-t border-border"
            >
              + Crear "{query.trim()}" como nueva bodega
            </button>
          )}
          {filtered.length === 0 && exactMatch && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>
          )}
        </div>
      )}
    </div>
  );
}
