import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";

interface ExtractedField {
  key: string;
  label: string;
  currentValue: any;
  newValue: any;
  isNew: boolean; // true = wine doesn't have this data yet
}

interface Props {
  open: boolean;
  fields: ExtractedField[];
  onApply: (selectedKeys: string[]) => void;
  onCancel: () => void;
}

export default function ExtractionVerificationModal({ open, fields, onApply, onCancel }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(fields.map((f) => [f.key, true]))
  );

  const toggle = (key: string) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const selectedCount = Object.values(checked).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display">Datos extraídos del PDF</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-1 py-2">
          {fields.map((f) => (
            <div
              key={f.key}
              onClick={() => toggle(f.key)}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                f.isNew
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : "bg-amber-500/10 border border-amber-500/20"
              }`}
            >
              <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                checked[f.key]
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/30 bg-transparent"
              }`}>
                {checked[f.key] && <Check className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                  {f.label}
                </p>
                {!f.isNew && (
                  <p className="text-sm text-muted-foreground line-through truncate">
                    {formatValue(f.currentValue)}
                  </p>
                )}
                <p className="text-sm font-medium text-foreground truncate">
                  {formatValue(f.newValue)}
                </p>
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                f.isNew
                  ? "text-emerald-700 bg-emerald-500/20"
                  : "text-amber-700 bg-amber-500/20"
              }`}>
                {f.isNew ? "Nuevo" : "Cambio"}
              </span>
            </div>
          ))}
          {fields.length === 0 && (
            <p className="text-center text-muted-foreground py-6 text-sm">
              No se encontraron datos nuevos o diferentes.
            </p>
          )}
        </div>
        <div className="flex gap-3 pt-3 border-t border-border">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onApply(Object.keys(checked).filter((k) => checked[k]))}
            disabled={selectedCount === 0}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Aplicar {selectedCount > 0 ? `(${selectedCount})` : ""}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatValue(v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}
