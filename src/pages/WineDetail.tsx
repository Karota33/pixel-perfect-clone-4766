import { useParams, useNavigate } from "react-router-dom";
import { useWines } from "@/hooks/useWines";
import { useMarginSettings } from "@/hooks/useMarginSettings";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBodegas } from "@/hooks/useBodegas";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StockDecrementSheet from "@/components/wine-detail/StockDecrementSheet";
import WineCartaTab from "@/components/wine-detail/WineCartaTab";
import WineBodegaTab from "@/components/wine-detail/WineBodegaTab";
import WineGestionTab from "@/components/wine-detail/WineGestionTab";

export default function WineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getWine, updateWine } = useWines();
  const { getMarginFor } = useMarginSettings();
  const { record, getForWine } = usePriceHistory();
  const { bodegas, fetchBodegas } = useBodegas();

  const wine = getWine(Number(id));

  const [stock, setStock] = useState(wine?.stock ?? 0);
  const [precioCarta, setPrecioCarta] = useState(wine?.precio_carta ?? 0);
  const [precioCoste, setPrecioCoste] = useState(wine?.precio_coste ?? 0);
  const [doValue, setDoValue] = useState("");
  const [formatoMl, setFormatoMl] = useState(750);
  const [subtipo, setSubtipo] = useState<string | null>(null);
  const [selectedBodegaId, setSelectedBodegaId] = useState<string | null>(null);
  const [showDecrementSheet, setShowDecrementSheet] = useState(false);
  const [stockRefreshKey, setStockRefreshKey] = useState(0);

  const [supaWine, setSupaWine] = useState<{
    id: string;
    descripcion_corta: string | null;
    descripcion_larga: any;
    notas_internas: string | null;
    bodega_id: string | null;
    do: string | null;
    foto_url: string | null;
    formato_ml: number | null;
    subtipo: string | null;
    graduacion: number | null;
    temp_servicio_min: number | null;
    temp_servicio_max: number | null;
    crianza: string | null;
    puntuacion_parker: number | null;
  } | null>(null);

  const fetchSupaWine = useCallback(async () => {
    if (!wine) return;
    console.log("[fetchSupaWine] buscando:", wine.nombre, "anada:", wine.anada);

    // Try nombre + anada first for precision
    let query = supabase
      .from("vinos")
      .select("id, descripcion_corta, descripcion_larga, notas_internas, bodega_id, do, foto_url, formato_ml, subtipo, graduacion, temp_servicio_min, temp_servicio_max, crianza, puntuacion_parker")
      .ilike("nombre", wine.nombre);

    if (wine.anada != null) {
      query = query.eq("anada", wine.anada);
    }

    const { data, error } = await query.limit(1);
    console.log("[fetchSupaWine] result:", data?.length, "first:", data?.[0]?.id, "error:", error?.message);

    if (error) {
      console.error("[fetchSupaWine] error:", error.code, error.message);
    } else if (data && data.length > 0) {
      setSupaWine(data[0] as any);
    }
  }, [wine?.nombre, wine?.anada]);

  useEffect(() => {
    fetchSupaWine();
  }, [fetchSupaWine]);

  useEffect(() => {
    if (supaWine) {
      setSelectedBodegaId(supaWine.bodega_id);
      setDoValue(supaWine.do || wine?.do || "");
      setFormatoMl(supaWine.formato_ml ?? 750);
      setSubtipo(supaWine.subtipo ?? null);
    }
  }, [supaWine]);

  useEffect(() => {
    if (wine) {
      setStock(wine.stock ?? 0);
      setPrecioCarta(wine.precio_carta ?? 0);
      setPrecioCoste(wine.precio_coste ?? 0);
    }
  }, [wine]);

  const persistStock = useCallback(async (newStock: number) => {
    if (!supaWine) return;
    await supabase.from("vinos").update({ stock_actual: newStock }).eq("id", supaWine.id);
  }, [supaWine]);

  const recordStockMovement = useCallback(async (
    tipo: string, cantidad: number, motivo: string,
  ) => {
    if (!supaWine) return;
    await supabase.from("stock_movimientos").insert({
      vino_id: supaWine.id, tipo, cantidad, motivo,
    });
    setStockRefreshKey((k) => k + 1);
  }, [supaWine]);

  const handleDecrement = () => {
    if (stock <= 0) return;
    setShowDecrementSheet(true);
  };

  const handleDecrementConfirm = (motivo: string) => {
    setShowDecrementSheet(false);
    const newStock = Math.max(0, stock - 1);
    setStock(newStock);
    updateWine(wine!.id, { stock: newStock });
    persistStock(newStock);
    recordStockMovement("salida", 1, motivo);
    toast.success("Stock actualizado");
  };

  const handleIncrement = () => {
    const newStock = stock + 1;
    setStock(newStock);
    updateWine(wine!.id, { stock: newStock });
    persistStock(newStock);
    recordStockMovement("entrada", 1, "entrada");
    toast.success("Stock actualizado");
  };

  const handleBodegaChange = async (newId: string | null) => {
    setSelectedBodegaId(newId);
    if (supaWine) {
      await supabase.from("vinos").update({ bodega_id: newId }).eq("id", supaWine.id);
      toast.success("Bodega actualizada");
      fetchBodegas();
    }
  };

  if (!wine) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Vino no encontrado</p>
      </div>
    );
  }

  const marginTarget = getMarginFor(wine.tipo);
  const priceHistory = getForWine(wine.id);

  const handleSave = async () => {
    if ((precioCarta || null) !== wine.precio_carta) {
      record(wine.id, "precio_carta", wine.precio_carta, precioCarta || null);
    }
    if ((precioCoste || null) !== wine.precio_coste) {
      record(wine.id, "precio_coste", wine.precio_coste, precioCoste || null);
    }
    updateWine(wine.id, {
      precio_carta: precioCarta || null,
      precio_coste: precioCoste || null,
    });

    if (supaWine) {
      const updates: Record<string, any> = {};
      if (doValue !== (supaWine.do || "")) updates.do = doValue || null;
      if (formatoMl !== (supaWine.formato_ml ?? 750)) updates.formato_ml = formatoMl;
      if (subtipo !== (supaWine.subtipo ?? null)) updates.subtipo = subtipo;
      if (Object.keys(updates).length > 0) {
        await supabase.from("vinos").update(updates).eq("id", supaWine.id);
      }
    }

    toast.success("Guardado");
  };

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
          <h1 className="font-display text-lg font-bold text-foreground truncate">
            Ficha de vino
          </h1>
        </div>
      </header>

      <main className="container max-w-2xl py-6 animate-fade-in">
        <Tabs defaultValue="carta" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="carta" className="flex-1">Carta</TabsTrigger>
            <TabsTrigger value="bodega" className="flex-1">Bodega</TabsTrigger>
            <TabsTrigger value="gestion" className="flex-1">Gestión</TabsTrigger>
          </TabsList>

          <TabsContent value="carta">
            <WineCartaTab
              wine={wine}
              supaWine={supaWine}
              stock={stock}
              precioCarta={precioCarta}
              setPrecioCarta={setPrecioCarta}
              doValue={doValue}
              setDoValue={setDoValue}
              bodegas={bodegas}
              selectedBodegaId={selectedBodegaId}
              onBodegaChange={handleBodegaChange}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onSave={handleSave}
              formatoMl={formatoMl}
              setFormatoMl={setFormatoMl}
              subtipo={subtipo}
              setSubtipo={setSubtipo}
            />
          </TabsContent>

          <TabsContent value="bodega">
            <WineBodegaTab supaWine={supaWine} wine={wine} />
          </TabsContent>

          <TabsContent value="gestion">
            <WineGestionTab
              wine={wine}
              supaWine={supaWine}
              precioCoste={precioCoste}
              setPrecioCoste={setPrecioCoste}
              precioCarta={precioCarta}
              marginTarget={marginTarget}
              priceHistory={priceHistory}
              stockRefreshKey={stockRefreshKey}
              onFotoUpdated={(url) => setSupaWine((prev) => prev ? { ...prev, foto_url: url } : prev)}
              onWineDataUpdated={fetchSupaWine}
            />
          </TabsContent>
        </Tabs>
      </main>

      <StockDecrementSheet
        open={showDecrementSheet}
        onConfirm={handleDecrementConfirm}
        onCancel={() => setShowDecrementSheet(false)}
      />
    </div>
  );
}
