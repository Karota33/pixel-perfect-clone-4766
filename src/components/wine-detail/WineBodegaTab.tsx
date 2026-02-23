import WineDescriptionSection from "./WineDescriptionSection";
import WineMaridajesSection from "./WineMaridajesSection";

interface Props {
  supaWine: any;
  wine: any;
}

export default function WineBodegaTab({ supaWine, wine }: Props) {
  if (!supaWine) return null;

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
