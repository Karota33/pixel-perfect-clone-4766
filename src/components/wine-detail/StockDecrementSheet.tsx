import { useState, useEffect, useRef } from "react";

const MOTIVOS = [
  { key: "venta", label: "Venta", emoji: "🍷" },
  { key: "rotura", label: "Rotura", emoji: "💔" },
  { key: "consumo_interno", label: "Consumo interno", emoji: "🍽️" },
  { key: "ajuste_manual", label: "Ajuste manual", emoji: "✏️" },
] as const;

const AUTO_CONFIRM_MS = 3000;

interface Props {
  open: boolean;
  onConfirm: (motivo: string) => void;
  onCancel: () => void;
}

export default function StockDecrementSheet({ open, onConfirm, onCancel }: Props) {
  const [selected, setSelected] = useState("venta");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!open) return;
    setSelected("venta");
    setCountdown(3);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timerRef.current = setTimeout(() => {
      onConfirm("venta");
    }, AUTO_CONFIRM_MS);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open]);

  const handleSelect = (key: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSelected(key);
    setCountdown(0);
  };

  const handleConfirm = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onConfirm(selected);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onCancel} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl p-4 pb-8 animate-slide-up safe-bottom">
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
        <p className="text-sm font-semibold text-foreground mb-3">Motivo del descuento</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {MOTIVOS.map((m) => (
            <button
              key={m.key}
              onClick={() => handleSelect(m.key)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                selected === m.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
              }`}
            >
              <span>{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleConfirm}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Confirmar {countdown > 0 ? `(${countdown}s)` : ""}
        </button>
      </div>
    </>
  );
}
