import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { parseCSV, fuzzyMatchWines, FuzzyMatch } from "@/lib/fuzzyMatch";
import { ArrowLeft, Upload, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function PriceComparator() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [matched, setMatched] = useState<FuzzyMatch[]>([]);
  const [unmatched, setUnmatched] = useState<FuzzyMatch[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const csvRows = parseCSV(text);
    if (csvRows.length === 0) {
      toast.error(
        "No se encontraron columnas válidas. El CSV debe tener columnas 'nombre' y 'precio' (o similares)."
      );
      return;
    }

    // Fetch all wines from Supabase
    const { data: wines } = await supabase
      .from("vinos")
      .select("id, nombre, precio_coste");
    if (!wines) {
      toast.error("Error al cargar vinos");
      return;
    }

    const result = fuzzyMatchWines(csvRows, wines);
    setMatched(result.matched);
    setUnmatched(result.unmatched);
    setSelected(new Set(result.matched.map((_, i) => i)));
    setLoaded(true);
  };

  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === matched.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(matched.map((_, i) => i)));
    }
  };

  const handleUpdate = async () => {
    const toUpdate = matched.filter((_, i) => selected.has(i));
    if (toUpdate.length === 0) {
      toast.error("Selecciona al menos un vino");
      return;
    }

    setSaving(true);
    let updated = 0;
    for (const row of toUpdate) {
      if (!row.matchedId) continue;
      const { error } = await supabase
        .from("vinos")
        .update({ precio_coste: row.csvPrice })
        .eq("id", row.matchedId);
      if (!error) updated++;
    }
    setSaving(false);
    toast.success(`${updated} precio${updated !== 1 ? "s" : ""} actualizado${updated !== 1 ? "s" : ""}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-3xl py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/documentos")}
                className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
                Comparar precios
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl py-6 space-y-6 animate-fade-in">
        {!loaded ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-sm text-muted-foreground">
              Sube un CSV con columnas <strong>nombre</strong> y{" "}
              <strong>precio</strong> para comparar con los vinos en carta.
            </p>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity cursor-pointer">
              <Upload className="w-4 h-4" />
              Seleccionar CSV
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFile}
              />
            </label>
          </div>
        ) : (
          <>
            {/* Matched wines */}
            {matched.length > 0 && (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Coincidencias ({matched.length})
                  </h2>
                  <button
                    onClick={toggleAll}
                    className="text-xs text-primary font-medium"
                  >
                    {selected.size === matched.length
                      ? "Deseleccionar todo"
                      : "Seleccionar todo"}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground border-b border-border">
                        <th className="text-left px-3 py-2 w-8"></th>
                        <th className="text-left px-3 py-2">CSV</th>
                        <th className="text-left px-3 py-2">En carta</th>
                        <th className="text-right px-3 py-2">P. CSV</th>
                        <th className="text-right px-3 py-2">P. Actual</th>
                        <th className="text-right px-3 py-2">Dif.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matched.map((row, i) => {
                        const diff =
                          row.currentCost !== null
                            ? row.csvPrice - row.currentCost
                            : null;
                        return (
                          <tr
                            key={i}
                            className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
                              selected.has(i) ? "bg-primary/5" : ""
                            }`}
                            onClick={() => toggleSelect(i)}
                          >
                            <td className="px-3 py-2.5">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  selected.has(i)
                                    ? "bg-primary border-primary"
                                    : "border-border"
                                }`}
                              >
                                {selected.has(i) && (
                                  <Check className="w-3 h-3 text-primary-foreground" />
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-foreground max-w-[140px] truncate">
                              {row.csvName}
                            </td>
                            <td className="px-3 py-2.5 text-foreground max-w-[140px] truncate">
                              {row.matchedName}
                              <span className="text-xs text-muted-foreground ml-1">
                                ({(row.similarity * 100).toFixed(0)}%)
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium">
                              {row.csvPrice.toFixed(2)}€
                            </td>
                            <td className="px-3 py-2.5 text-right text-muted-foreground">
                              {row.currentCost !== null
                                ? `${row.currentCost.toFixed(2)}€`
                                : "—"}
                            </td>
                            <td
                              className={`px-3 py-2.5 text-right font-medium ${
                                diff === null
                                  ? "text-muted-foreground"
                                  : diff > 0
                                  ? "text-destructive"
                                  : diff < 0
                                  ? "text-[hsl(var(--margin-ok))]"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {diff !== null
                                ? `${diff > 0 ? "+" : ""}${diff.toFixed(2)}€`
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 py-3 border-t border-border">
                  <button
                    onClick={handleUpdate}
                    disabled={saving || selected.size === 0}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saving
                      ? "Actualizando..."
                      : `Actualizar ${selected.size} precio${selected.size !== 1 ? "s" : ""} seleccionado${selected.size !== 1 ? "s" : ""}`}
                  </button>
                </div>
              </div>
            )}

            {/* Unmatched */}
            {unmatched.length > 0 && (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[hsl(var(--margin-warn))]" />
                  <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Sin coincidencia ({unmatched.length})
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  {unmatched.map((row, i) => (
                    <div
                      key={i}
                      className="px-4 py-2.5 flex items-center justify-between"
                    >
                      <span className="text-sm text-foreground truncate">
                        {row.csvName}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground shrink-0">
                        {row.csvPrice.toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Load another file */}
            <div className="text-center">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                Cargar otro CSV
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFile}
                />
              </label>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
