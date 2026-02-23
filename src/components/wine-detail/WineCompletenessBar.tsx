import { Progress } from "@/components/ui/progress";

interface Props {
  bodegaId: string | null;
  doValue: string | null;
  descripcionCorta: string | null;
  descripcionLarga: any;
  precioCoste: number | null;
  uvas: string | null;
  anada: number | null;
}

interface Field {
  label: string;
  points: number;
  filled: boolean;
}

export default function WineCompletenessBar({
  bodegaId, doValue, descripcionCorta, descripcionLarga, precioCoste, uvas, anada,
}: Props) {
  const fields: Field[] = [
    { label: "Bodega", points: 20, filled: !!bodegaId },
    { label: "D.O.", points: 15, filled: !!doValue },
    { label: "Descripción corta", points: 20, filled: !!descripcionCorta },
    { label: "Descripción larga", points: 15, filled: !!(descripcionLarga && (descripcionLarga.vinedo || descripcionLarga.cata || descripcionLarga.maridaje)) },
    { label: "Precio coste", points: 15, filled: precioCoste != null && precioCoste > 0 },
    { label: "Uvas", points: 10, filled: !!uvas },
    { label: "Añada", points: 5, filled: anada != null },
  ];

  const score = fields.reduce((sum, f) => sum + (f.filled ? f.points : 0), 0);
  const missing = fields.filter((f) => !f.filled);

  const color = score < 50 ? "hsl(0, 72%, 51%)" : score < 80 ? "hsl(38, 92%, 50%)" : "hsl(142, 71%, 45%)";

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">Completitud</h3>
        <span className="text-sm font-bold" style={{ color }}>{score}%</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      {missing.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {missing.map((f) => (
            <span
              key={f.label}
              className="px-2 py-0.5 bg-secondary text-muted-foreground text-xs rounded-full"
            >
              {f.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
