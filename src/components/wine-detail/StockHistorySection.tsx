import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp } from "lucide-react";

interface StockMovimiento {
  id: string;
  cantidad: number;
  tipo: string;
  motivo: string | null;
  notas: string | null;
  fecha: string | null;
}

const motivoLabels: Record<string, string> = {
  venta: "🍷 Venta",
  rotura: "💔 Rotura",
  consumo_interno: "🍽️ Consumo interno",
  ajuste_manual: "✏️ Ajuste",
  entrada: "📦 Entrada",
  inventario_fisico: "📋 Inventario",
};

interface Props {
  vinoId: string;
  refreshKey: number;
}

export default function StockHistorySection({ vinoId, refreshKey }: Props) {
  const [movimientos, setMovimientos] = useState<StockMovimiento[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    supabase
      .from("stock_movimientos")
      .select("id, cantidad, tipo, motivo, notas, fecha")
      .eq("vino_id", vinoId)
      .order("fecha", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setMovimientos(data);
      });
  }, [vinoId, refreshKey]);

  if (movimientos.length === 0) return null;

  const formatDate = (fecha: string | null) => {
    if (!fecha) return "";
    const d = new Date(fecha);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `Hoy ${time}`;
    return `${d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} ${time}`;
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
      >
        <span className="text-sm font-medium text-foreground">
          📦 Historial de stock ({movimientos.length})
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {movimientos.map((m) => {
            const sign = m.tipo === "entrada" ? "+" : "-";
            const color = m.tipo === "entrada" ? "text-green-600" : "text-red-500";
            return (
              <div key={m.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-muted-foreground shrink-0">{formatDate(m.fecha)}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-foreground truncate">
                    {motivoLabels[m.motivo || m.tipo] || m.motivo || m.tipo}
                  </span>
                </div>
                <span className={`font-mono font-semibold shrink-0 ${color}`}>
                  {sign}{Math.abs(m.cantidad)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
