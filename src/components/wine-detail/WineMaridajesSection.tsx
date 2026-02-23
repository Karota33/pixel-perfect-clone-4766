import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, Loader2, Save, Plus, Trash2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Maridaje {
  id: string;
  plato: string;
  descripcion: string | null;
  en_carta: boolean | null;
  generado_ia: boolean | null;
  orden: number | null;
}

interface Props {
  vinoId: string;
  nombre: string;
  tipo: string;
  uvas: string | null;
}

export default function WineMaridajesSection({ vinoId, nombre, tipo, uvas }: Props) {
  const [maridajes, setMaridajes] = useState<Maridaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingIA, setLoadingIA] = useState(false);
  const [iaSuggestion, setIaSuggestion] = useState<string | null>(null);
  const [newPlato, setNewPlato] = useState("");
  const [newDescripcion, setNewDescripcion] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchMaridajes = useCallback(async () => {
    const { data } = await supabase
      .from("maridajes")
      .select("*")
      .eq("vino_id", vinoId)
      .order("orden");
    if (data) setMaridajes(data);
    setLoading(false);
  }, [vinoId]);

  useEffect(() => {
    fetchMaridajes();
  }, [fetchMaridajes]);

  const generateSuggestion = async () => {
    setLoadingIA(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-wine-description", {
        body: { nombre, tipo, isla: "", uvas, anada: null, bodega: null, do: null, field: "maridaje" },
      });
      if (error) throw error;
      setIaSuggestion(data.maridaje || "Sin sugerencia");
      toast.success("Sugerencia generada");
    } catch (e) {
      console.error(e);
      toast.error("Error generando sugerencia");
    } finally {
      setLoadingIA(false);
    }
  };

  const useSuggestion = () => {
    if (iaSuggestion) {
      setNewPlato(iaSuggestion.split(".")[0] || iaSuggestion);
      setNewDescripcion(iaSuggestion);
      setIaSuggestion(null);
    }
  };

  const addMaridaje = async () => {
    if (!newPlato.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("maridajes").insert({
        vino_id: vinoId,
        plato: newPlato.trim(),
        descripcion: newDescripcion.trim() || null,
        en_carta: true,
        generado_ia: false,
        orden: maridajes.length,
      });
      if (error) throw error;
      toast.success("Maridaje añadido");
      setNewPlato("");
      setNewDescripcion("");
      fetchMaridajes();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const deleteMaridaje = async (id: string) => {
    await supabase.from("maridajes").delete().eq("id", id);
    fetchMaridajes();
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-foreground">🍽️ Maridajes</h3>
        <button
          onClick={generateSuggestion}
          disabled={loadingIA}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loadingIA ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Sugerencia IA
        </button>
      </div>

      {/* IA Suggestion block */}
      {iaSuggestion && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Propuesta IA</span>
          </div>
          <p className="text-sm text-amber-900 dark:text-amber-200">{iaSuggestion}</p>
          <button
            onClick={useSuggestion}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Copy className="w-3 h-3" />
            Usar esta sugerencia
          </button>
        </div>
      )}

      {/* Existing maridajes */}
      {maridajes.length > 0 && (
        <div className="space-y-2">
          {maridajes.map((m) => (
            <div key={m.id} className="flex items-start gap-2 p-2 bg-background rounded-lg border border-border">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{m.plato}</p>
                {m.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{m.descripcion}</p>}
              </div>
              <button
                onClick={() => deleteMaridaje(m.id)}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new */}
      <div className="space-y-2 pt-2 border-t border-border">
        <input
          type="text"
          value={newPlato}
          onChange={(e) => setNewPlato(e.target.value)}
          placeholder="Plato o maridaje..."
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        <textarea
          value={newDescripcion}
          onChange={(e) => setNewDescripcion(e.target.value)}
          placeholder="Descripción (opcional)..."
          rows={2}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
        />
        <button
          onClick={addMaridaje}
          disabled={!newPlato.trim() || saving}
          className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Añadir maridaje
        </button>
      </div>
    </div>
  );
}
