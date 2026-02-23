import WineDescriptionSection from "./WineDescriptionSection";
import WineMaridajesSection from "./WineMaridajesSection";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  supaWine: any;
  wine: any;
}

export default function WineBodegaTab({ supaWine, wine }: Props) {
  if (!supaWine) {
    return (
      <div className="space-y-6">
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WineDescriptionSection
        vinoId={supaWine.id}
        nombre={wine.nombre}
        tipo={wine.tipo}
        isla={wine.isla}
        uvas={wine.uvas || null}
        anada={wine.anada}
        bodega={wine.bodega}
        dop={supaWine.do || wine.do}
        initialCorta={supaWine.descripcion_corta || ""}
        initialLarga={supaWine.descripcion_larga || {}}
        initialNotas={supaWine.notas_internas || ""}
      />

      <WineMaridajesSection
        vinoId={supaWine.id}
        nombre={wine.nombre}
        tipo={wine.tipo}
        uvas={wine.uvas || null}
      />
    </div>
  );
}
