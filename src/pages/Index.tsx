import { useState, useMemo } from "react";
import { Wine, getCanonicalIsland, getTypeLabel, ISLANDS } from "@/types/wine";
import { useWines } from "@/hooks/useWines";
import WineCard from "@/components/WineCard";
import FilterChips from "@/components/FilterChips";
import SearchBar from "@/components/SearchBar";
import { Wine as WineIcon } from "lucide-react";

const TYPE_OPTIONS = ["Blanco", "Tinto", "Rosado", "Espumoso", "Dulce"];

export default function Index() {
  const { wines } = useWines();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [islandFilter, setIslandFilter] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return wines
      .filter((w) => {
        if (typeFilter && getTypeLabel(w.tipo) !== typeFilter) return false;
        if (islandFilter && getCanonicalIsland(w.isla) !== islandFilter) return false;
        if (q) {
          const haystack = [w.nombre, w.bodega, w.uvas].filter(Boolean).join(" ").toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [wines, search, typeFilter, islandFilter]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-2xl py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WineIcon className="w-5 h-5 text-primary" />
              <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
                Tabaiba
              </h1>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {filtered.length} vino{filtered.length !== 1 ? "s" : ""}
            </span>
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
          </div>
        </div>
      </header>

      {/* Wine List */}
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
    </div>
  );
}
