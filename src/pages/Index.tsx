import { useState, useMemo } from "react";
import { getCanonicalIsland, getTypeLabel, ISLANDS } from "@/types/wine";
import { useWines } from "@/hooks/useWines";
import { useMarginSettings } from "@/hooks/useMarginSettings";
import { calcMarginReal, getMarginStatus } from "@/lib/margins";
import WineCard from "@/components/WineCard";
import FilterChips from "@/components/FilterChips";
import SearchBar from "@/components/SearchBar";
import NewWineDrawer from "@/components/NewWineDrawer";
import { Wine as WineIcon, Settings, Warehouse, FileText, Plus, Download, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

const TYPE_OPTIONS = ["Blanco", "Orange", "Tinto", "Rosado", "Espumoso", "Dulce"];

export default function Index() {
  const { wines } = useWines();
  const { getMarginFor } = useMarginSettings();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [islandFilter, setIslandFilter] = useState("");
  const [marginLowOnly, setMarginLowOnly] = useState(false);
  const [showNewWine, setShowNewWine] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("vinos")
        .select(`id_local, nombre, anada, tipo, subtipo, isla, "do", uvas, precio_carta, stock_actual, precio_coste, foto_url, bodegas ( nombre )`)
        .order("nombre", { ascending: true });

      if (error) throw error;

      const cabeceras = [
        "NOMBRE DEL VINO", "AÑADA", "TIPO", "ISLA / ORIGEN", "UVAS",
        "PRECIO CARTA (€)", "STOCK ACTUAL", "BODEGA / ELABORADOR", "D.O. OFICIAL",
        "SUBTIPO", "PRECIO COSTE (€)", "PROVEEDOR / DISTRIBUIDOR", "CONTACTO PROVEEDOR", "URL FOTO",
      ];

      const filas = (data || []).map((v: any) => [
        (v.nombre || "").trim(),
        v.anada ?? "",
        v.tipo ? v.tipo.toLowerCase().trim() : "",
        v.isla || "",
        v.uvas || "",
        v.precio_carta != null ? Number(Number(v.precio_carta).toFixed(2)) : "",
        v.stock_actual ?? 0,
        v.bodegas?.nombre || "",
        v.do || "",
        v.subtipo ? v.subtipo.toLowerCase().trim() : "",
        v.precio_coste != null ? Number(Number(v.precio_coste).toFixed(2)) : "",
        "",
        "",
        v.foto_url || "",
      ]);

      const ws = XLSX.utils.aoa_to_sheet([cabeceras, ...filas]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "INVENTARIO");
      const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      XLSX.writeFile(wb, `Inventario_Tabaiba_${fecha}.xlsx`);

      toast({ title: `Inventario exportado — ${filas.length} vinos` });
    } catch {
      toast({ title: "Error al exportar. Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return wines
      .filter((w) => {
        if (typeFilter === "Orange") {
          if (w.subtipo !== "orange") return false;
        } else if (typeFilter && getTypeLabel(w.tipo) !== typeFilter) return false;
        if (islandFilter && getCanonicalIsland(w.isla) !== islandFilter) return false;
        if (q) {
          const haystack = [w.nombre, w.bodega, w.uvas].filter(Boolean).join(" ").toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        if (marginLowOnly) {
          const target = getMarginFor(w.tipo);
          const real = calcMarginReal(w.precio_carta, w.precio_coste);
          const status = getMarginStatus(real, target);
          if (status !== "warn" && status !== "danger") return false;
        }
        return true;
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [wines, search, typeFilter, islandFilter, marginLowOnly, getMarginFor]);

  const lowStockCount = useMemo(() => {
    return wines.filter((w) => w.stock === 1).length;
  }, [wines]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-2xl py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WineIcon className="w-5 h-5 text-primary" />
              <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
                Tabaiba
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {lowStockCount > 0 && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "hsl(var(--wine-low) / 0.15)", color: "hsl(var(--wine-low))" }}
                  title={`${lowStockCount} vino${lowStockCount !== 1 ? "s" : ""} con última unidad`}
                >
                  ⚠️ {lowStockCount}
                </span>
              )}
              <span className="text-xs text-muted-foreground font-medium">
                {filtered.length} vino{filtered.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                title="Exportar inventario"
              >
                {exporting
                  ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#8B0000" }} />
                  : <Download className="w-4 h-4" style={{ color: "#8B0000" }} />}
              </button>
              <button
                onClick={() => navigate("/bodegas")}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Warehouse className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => navigate("/documentos")}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => navigate("/settings")}
                className="p-2 -mr-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <SearchBar value={search} onChange={setSearch} />

          <div className="space-y-2">
            <FilterChips
              options={TYPE_OPTIONS}
              selected={typeFilter}
              onSelect={setTypeFilter}
              allLabel="Todos"
            />
            <FilterChips
              options={[...ISLANDS]}
              selected={islandFilter}
              onSelect={setIslandFilter}
              allLabel="Todas"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMarginLowOnly(!marginLowOnly)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  marginLowOnly
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                ⚠ Margen bajo
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <WineIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No se encontraron vinos</p>
          </div>
        ) : (
          filtered.map((wine) => <WineCard key={wine.id} wine={wine} />)
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowNewWine(true)}
        className="fixed bottom-6 right-6 z-20 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity active:scale-95"
        aria-label="Añadir vino"
      >
        <Plus className="w-6 h-6" />
      </button>

      <NewWineDrawer
        open={showNewWine}
        onOpenChange={setShowNewWine}
        onCreated={() => window.location.reload()}
      />
    </div>
  );
}
