import { Wine, getCanonicalIsland, getTypeLabel } from "@/types/wine";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { calcMarginReal, getMarginStatus, getMarginColor } from "@/lib/margins";
import { useMarginSettings } from "@/hooks/useMarginSettings";

interface WineCardProps {
  wine: Wine;
}

export default function WineCard({ wine }: WineCardProps) {
  const navigate = useNavigate();
  const { getMarginFor } = useMarginSettings();
  const isAvailable = wine.stock !== null && wine.stock > 0;

  const marginTarget = getMarginFor(wine.tipo);
  const marginReal = calcMarginReal(wine.precio_carta, wine.precio_coste);
  const marginStatus = getMarginStatus(marginReal, marginTarget);

  return (
    <button
      onClick={() => navigate(`/vino/${wine.id}`)}
      className="w-full text-left bg-card rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-border animate-fade-in"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: isAvailable
                  ? "hsl(var(--wine-available))"
                  : "hsl(var(--wine-unavailable))",
              }}
            />
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: getMarginColor(marginStatus) }}
            />
            <h3 className="font-display text-base font-semibold text-foreground truncate">
              {wine.nombre}
            </h3>
            {wine.descripcion_corta && (
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-primary" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
            {wine.bodega && <span>{wine.bodega}</span>}
            {wine.bodega && <span className="text-border">·</span>}
            <span className="capitalize">{getTypeLabel(wine.tipo)}</span>
            <span className="text-border">·</span>
            <span>{wine.do || getCanonicalIsland(wine.isla)}</span>
          </div>

          {wine.uvas && (
            <p className="text-xs text-muted-foreground/70 mt-1 truncate">
              {wine.uvas}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          {wine.precio_carta ? (
            <span className="font-display text-lg font-bold text-foreground">
              {wine.precio_carta}€
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">S/P</span>
          )}
          {wine.stock !== null && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {wine.stock} ud.
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
