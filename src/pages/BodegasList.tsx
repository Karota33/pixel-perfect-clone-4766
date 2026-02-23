import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useBodegas } from "@/hooks/useBodegas";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Phone, Mail, Search } from "lucide-react";
import StarRating from "@/components/StarRating";
import { toast } from "sonner";
import { useEffect } from "react";

export default function BodegasList() {
  const navigate = useNavigate();
  const { bodegas, loading, fetchBodegas } = useBodegas();
  const [search, setSearch] = useState("");
  const [wineCounts, setWineCounts] = useState<Record<string, number>>({});

  // Fetch wine counts per bodega
  useEffect(() => {
    async function fetchCounts() {
      const { data } = await supabase
        .from("vinos")
        .select("bodega_id");
      if (!data) return;
      const counts: Record<string, number> = {};
      data.forEach((v) => {
        if (v.bodega_id) {
          counts[v.bodega_id] = (counts[v.bodega_id] || 0) + 1;
        }
      });
      setWineCounts(counts);
    }
    fetchCounts();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return bodegas;
    return bodegas.filter((b) => b.nombre.toLowerCase().includes(q));
  }, [bodegas, search]);

  const handleNewBodega = async () => {
    const { data, error } = await supabase
      .from("bodegas")
      .insert({ nombre: "Nueva bodega" })
      .select("id")
      .single();
    if (error) {
      toast.error("Error al crear bodega");
      return;
    }
    if (data) {
      navigate(`/bodegas/${data.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-2xl py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
                Bodegas
              </h1>
            </div>
            <button
              onClick={handleNewBodega}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Nueva
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar bodega..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/20 transition-shadow"
            />
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-3 space-y-2">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No se encontraron bodegas
          </div>
        ) : (
          filtered.map((bodega) => {
            const hasContact = !!(bodega.contacto_email || bodega.contacto_tel);
            const count = wineCounts[bodega.id] || 0;

            return (
              <button
                key={bodega.id}
                onClick={() => navigate(`/bodegas/${bodega.id}`)}
                className="w-full text-left bg-card rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-border animate-fade-in"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-base font-semibold text-foreground truncate">
                        {bodega.nombre}
                      </h3>
                      {hasContact && (
                        <span className="w-2 h-2 rounded-full shrink-0 bg-[hsl(var(--margin-ok))]" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                      {bodega.isla && <span>{bodega.isla}</span>}
                      {bodega.isla && count > 0 && <span className="text-border">·</span>}
                      {count > 0 && (
                        <span>
                          {count} vino{count !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {bodega.valoracion && bodega.valoracion > 0 && (
                      <div className="mt-1.5">
                        <StarRating value={bodega.valoracion} readonly size={14} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground/50">
                    {bodega.contacto_tel && <Phone className="w-3.5 h-3.5" />}
                    {bodega.contacto_email && <Mail className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </main>
    </div>
  );
}
