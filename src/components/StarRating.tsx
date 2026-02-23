import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
}

export default function StarRating({ value, onChange, readonly = false, size = 20 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star === value ? 0 : star)}
          className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
        >
          <Star
            size={size}
            className={
              star <= value
                ? "fill-primary text-primary"
                : "fill-none text-muted-foreground/40"
            }
          />
        </button>
      ))}
    </div>
  );
}
