import { Wine, RawWine } from "@/types/wine";
import rawWines from "@/data/vinos_tabaiba.json";

export const initialWines: Wine[] = (rawWines as RawWine[]).map((w, i) => ({
  ...w,
  id: i + 1,
  bodega: null,
  do: null,
}));
