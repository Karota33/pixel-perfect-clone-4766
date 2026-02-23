import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getCanonicalIsland(isla: string): string {
  const lower = isla.toLowerCase();
  if (lower.includes("tenerife") || lower.includes("orotava") || lower.includes("tacoronte") || lower.includes("ycoden") || lower.includes("güimar") || lower.includes("güímar") || lower.includes("abona")) return "Tenerife";
  if (lower.includes("gran canaria") || lower.includes("monte lentiscal")) return "Gran Canaria";
  if (lower.includes("lanzarote")) return "Lanzarote";
  if (lower.includes("la palma")) return "La Palma";
  if (lower.includes("el hierro") || lower.includes("hierro")) return "El Hierro";
  if (lower.includes("la gomera") || lower.includes("gomera")) return "La Gomera";
  if (lower.includes("fuerteventura")) return "Fuerteventura";
  return isla;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { wines } = await req.json();

    console.log(`Processing ${wines.length} wines...`);

    const BATCH = 50;
    const insertedIds: string[] = [];
    const stockMovimientos: { vino_id: string; cantidad: number }[] = [];

    for (let i = 0; i < wines.length; i += BATCH) {
      const batch = wines.slice(i, i + BATCH).map((w: any) => ({
        nombre: w.nombre,
        isla: w.isla,
        isla_normalizada: getCanonicalIsland(w.isla),
        tipo: w.tipo,
        uvas: w.uvas || null,
        anada: w.anada || null,
        precio_carta: w.precio_carta || null,
        precio_coste: w.precio_coste || null,
        stock_actual: w.stock ?? 0,
        estado: "en_carta",
      }));

      const { data, error } = await supabase
        .from("vinos")
        .insert(batch)
        .select("id, stock_actual");

      if (error) throw new Error(`Insert batch ${i}: ${error.message}`);

      for (const row of data!) {
        insertedIds.push(row.id);
        if (row.stock_actual > 0) {
          stockMovimientos.push({ vino_id: row.id, cantidad: row.stock_actual });
        }
      }
    }

    console.log(`Inserted ${insertedIds.length} wines. Creating ${stockMovimientos.length} stock movements...`);

    if (stockMovimientos.length > 0) {
      for (let i = 0; i < stockMovimientos.length; i += BATCH) {
        const batch = stockMovimientos.slice(i, i + BATCH).map((m) => ({
          vino_id: m.vino_id,
          tipo: "inventario",
          motivo: "inventario_fisico",
          cantidad: m.cantidad,
        }));

        const { error } = await supabase.from("stock_movimientos").insert(batch);
        if (error) throw new Error(`Stock batch ${i}: ${error.message}`);
      }
    }

    const { count } = await supabase
      .from("vinos")
      .select("*", { count: "exact", head: true });

    return new Response(
      JSON.stringify({
        success: true,
        vinos_inserted: insertedIds.length,
        stock_movimientos_created: stockMovimientos.length,
        total_vinos_in_db: count,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
