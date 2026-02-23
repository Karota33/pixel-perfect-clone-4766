import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMarginSettings } from "@/hooks/useMarginSettings";
import { useCopaMaridaje } from "@/hooks/useCopaMaridaje";
import { WINE_TYPES, getTypeLabel } from "@/types/wine";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const { settings, setGlobal, setTypeMargin } = useMarginSettings();
  const { ml: copaMaridajeMl, setMl: setCopaMaridajeMl } = useCopaMaridaje();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-2xl py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">
            Ajustes
          </h1>
        </div>
      </header>

      <main className="container max-w-2xl py-6 space-y-6 animate-fade-in">
        {/* Margen global */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Margen objetivo
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Porcentaje de margen que se usa para calcular el PVP sugerido y las alertas.
            </p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Margen global (%)
            </label>
            <input
              type="number"
              min={0}
              max={99}
              value={settings.global}
              onChange={(e) => {
                setGlobal(Number(e.target.value));
                toast.success("Margen global actualizado");
              }}
              className="w-32 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>

        {/* Margen por tipo */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Margen por tipo de vino
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Deja vacío para usar el margen global ({settings.global}%).
            </p>
          </div>

          <div className="space-y-3">
            {WINE_TYPES.map((type) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground capitalize">
                  {getTypeLabel(type)}
                </span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  placeholder={`${settings.global}%`}
                  value={settings.byType[type] ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTypeMargin(type, v === "" ? null : Number(v));
                  }}
                  className="w-24 px-3 py-1.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 text-right"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Copa maridaje */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Tamaño de copa maridaje
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Afecta al cálculo de precio por copa en maridaje de toda la carta.
            </p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Tamaño de copa maridaje (ml)
            </label>
            <input
              type="number"
              min={30}
              max={300}
              value={copaMaridajeMl}
              onChange={(e) => {
                setCopaMaridajeMl(Number(e.target.value));
                toast.success("Tamaño de copa actualizado");
              }}
              className="w-32 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
