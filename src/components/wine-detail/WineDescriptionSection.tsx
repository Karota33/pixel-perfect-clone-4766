import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, ChevronDown, ChevronUp, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DescLarga {
  vinedo?: string;
  cata?: string;
  maridaje?: string;
}

interface Props {
  vinoId: string;
  nombre: string;
  tipo: string;
  isla: string;
  uvas: string | null;
  anada: number | null;
  bodega: string | null;
  dop: string | null;
  initialCorta: string;
  initialLarga: DescLarga;
  initialNotas: string;
}

export default function WineDescriptionSection({
  vinoId, nombre, tipo, isla, uvas, anada, bodega, dop,
  initialCorta, initialLarga, initialNotas,
}: Props) {
  const [corta, setCorta] = useState(initialCorta);
  const [larga, setLarga] = useState<DescLarga>(initialLarga);
  const [notas, setNotas] = useState(initialNotas);
  const [showLarga, setShowLarga] = useState(false);
  const [loadingCorta, setLoadingCorta] = useState(false);
  const [loadingLarga, setLoadingLarga] = useState(false);
  const [saving, setSaving] = useState(false);

  const winePayload = { nombre, tipo, isla, uvas, anada, bodega, do: dop };

  const generateCorta = async () => {
    setLoadingCorta(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-wine-description", {
        body: { ...winePayload, field: "descripcion_corta" },
      });
      if (error) throw error;
      setCorta(data.descripcion_corta || "");
      toast.success("Descripción corta generada");
    } catch (e) {
      console.error(e);
      toast.error("Error generando descripción");
    } finally {
      setLoadingCorta(false);
    }
  };

  const generateLarga = async () => {
    setLoadingLarga(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-wine-description", {
        body: { ...winePayload, field: "descripcion_larga" },
      });
      if (error) throw error;
      setLarga(data.descripcion_larga || {});
      setShowLarga(true);
      toast.success("Descripción completa generada");
    } catch (e) {
      console.error(e);
      toast.error("Error generando descripción");
    } finally {
      setLoadingLarga(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("vinos")
        .update({
          descripcion_corta: corta || null,
          descripcion_larga: larga as any,
          notas_internas: notas || null,
        })
        .eq("id", vinoId);
      if (error) throw error;
      toast.success("Descripción guardada");
    } catch (e) {
      console.error(e);
      toast.error("Error guardando descripción");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Descripción corta */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-foreground">
            Descripción
          </h3>
          <button
            onClick={generateCorta}
            disabled={loadingCorta}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loadingCorta ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Generar con IA
          </button>
        </div>
        <div className="relative">
        <AutoResizeTextarea
          value={corta}
          onChange={(v) => setCorta(v.slice(0, 160))}
          maxLength={160}
          minRows={3}
          placeholder="Descripción corta para la carta…"
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
          style={{ fontSize: "15px", lineHeight: "1.5" }}
        />
        <span className="absolute bottom-2.5 right-4 text-xs text-muted-foreground">
          {corta.length}/160
        </span>
        </div>
      </div>

      {/* Descripción larga expandible */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => setShowLarga(!showLarga)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
        >
          <span className="text-sm font-medium text-foreground">
            Descripción completa
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                generateLarga();
              }}
              disabled={loadingLarga}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loadingLarga ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Generar con IA
            </button>
            {showLarga ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>
        {showLarga && (
          <div className="border-t border-border p-4 space-y-0 divide-y divide-border/60">
            <div className="pb-4">
              <DescBlock
                label="🍇 Viñedo y elaboración"
                value={larga.vinedo || ""}
                onChange={(v) => setLarga({ ...larga, vinedo: v })}
              />
            </div>
            <div className="py-4">
              <DescBlock
                label="🥂 Notas de cata"
                value={larga.cata || ""}
                onChange={(v) => setLarga({ ...larga, cata: v })}
              />
            </div>
            <div className="pt-4">
              <DescBlock
                label="🍽️ Maridaje"
                value={larga.maridaje || ""}
                onChange={(v) => setLarga({ ...larga, maridaje: v })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Notas internas */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-2">
        <h3 className="font-display text-base font-semibold text-foreground">
          Notas internas
        </h3>
        <AutoResizeTextarea
          value={notas}
          onChange={(v) => setNotas(v)}
          minRows={3}
          placeholder="Notas privadas sobre este vino…"
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
          style={{ fontSize: "15px", lineHeight: "1.5" }}
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Guardar descripción
      </button>
    </div>
  );
}

function AutoResizeTextarea({
  value,
  onChange,
  minRows = 3,
  maxLength,
  placeholder,
  className,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  minRows?: number;
  maxLength?: number;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 22.5;
    const minHeight = lineHeight * minRows + 24; // 24 = py-3 top+bottom
    el.style.height = Math.max(el.scrollHeight, minHeight) + "px";
  }, [minRows]);

  useEffect(() => { resize(); }, [value, resize]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
      maxLength={maxLength}
      placeholder={placeholder}
      className={className}
      style={{ ...style, overflow: "hidden" }}
      onInput={resize}
    />
  );
}

function DescBlock({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1.5 font-medium">{label}</p>
      <AutoResizeTextarea
        value={value}
        onChange={onChange}
        minRows={3}
        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
        style={{ fontSize: "15px", lineHeight: "1.5" }}
      />
    </div>
  );
}
