import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getCanonicalIsland(isla: string): string {
  const lower = isla.toLowerCase();
  if (lower.includes("islas canarias")) return "Islas Canarias";
  if (lower.includes("tenerife") || lower.includes("abona") || lower.includes("tacoronte") || lower.includes("acentejo") || lower.includes("güimar") || lower.includes("güímar") || lower.includes("orotava") || lower.includes("ycoden") || lower.includes("daute") || lower.includes("isora")) return "Tenerife";
  if (lower.includes("gran canaria") || lower.includes("monte lentiscal") || lower === "gc") return "Gran Canaria";
  if (lower.includes("lanzarote")) return "Lanzarote";
  if (lower.includes("la palma") || lower.includes("palma")) return "La Palma";
  if (lower.includes("hierro")) return "El Hierro";
  if (lower.includes("gomera")) return "La Gomera";
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

    const body = await req.json();
    let wines = body.wines;
    const clean = body.clean === true;

    // If wines_url provided, fetch wines from URL
    if (!wines && body.wines_url) {
      console.log("Fetching wines from URL:", body.wines_url);
      const resp = await fetch(body.wines_url);
      if (!resp.ok) throw new Error(`Failed to fetch wines: ${resp.status}`);
      wines = await resp.json();
    }

    // Clean mode: wipe dependent tables, then vinos
    if (clean) {
      console.log("Clean mode: deleting all dependent data...");
      const dummyId = "00000000-0000-0000-0000-000000000000";
      await supabase.from("stock_movimientos").delete().neq("id", dummyId);
      await supabase.from("price_history").delete().neq("id", dummyId);
      await supabase.from("maridajes").delete().neq("id", dummyId);
      await supabase.from("puntuaciones").delete().neq("id", dummyId);
      await supabase.from("pedido_lineas").delete().neq("id", dummyId);
      await supabase.from("ventas").delete().neq("id", dummyId);
      await supabase.from("imagenes").delete().neq("id", dummyId);
      await supabase.from("documentos").delete().neq("id", dummyId);
      await supabase.from("vinos").delete().neq("id", dummyId);
      console.log("Clean complete.");
    }

    if (!wines || !Array.isArray(wines) || wines.length === 0) {
      return new Response(
        JSON.stringify({ error: "No wines array provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${wines.length} wines...`);

    const BATCH = 50;
    let totalInserted = 0;

    for (let i = 0; i < wines.length; i += BATCH) {
      const batch = wines.slice(i, i + BATCH).map((w: any, j: number) => ({
        nombre: w.nombre,
        isla: w.isla || "Tenerife",
        isla_normalizada: getCanonicalIsland(w.isla || "Tenerife"),
        tipo: w.tipo || "blanco",
        uvas: w.uvas || null,
        anada: w.anada ?? null,
        precio_carta: w.precio_carta ?? null,
        precio_coste: w.precio_coste ?? null,
        stock_actual: w.stock ?? 0,
        do: w.do || null,
        estado: "en_carta",
        id_local: i + j + 1,
      }));

      const { error } = await supabase.from("vinos").insert(batch);
      if (error) throw new Error(`Insert batch ${i}: ${error.message}`);
      totalInserted += batch.length;
    }

    const { count } = await supabase
      .from("vinos")
      .select("*", { count: "exact", head: true });

    return new Response(
      JSON.stringify({
        success: true,
        vinos_inserted: totalInserted,
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
