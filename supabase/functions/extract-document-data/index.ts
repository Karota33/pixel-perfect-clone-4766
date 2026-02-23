import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("[extract-document-data] Received body:", JSON.stringify(body));

    const { storage_path } = body;
    if (!storage_path) throw new Error("storage_path required");

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("[extract-document-data] Downloading PDF from storage:", storage_path);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documentos")
      .download(storage_path);

    if (downloadError || !fileData) {
      console.error("[extract-document-data] Download error:", downloadError);
      throw new Error("Could not download file: " + (downloadError?.message || "no data"));
    }

    console.log("[extract-document-data] PDF downloaded, size:", fileData.size, "bytes");

    // Convert to base64 in chunks to avoid stack overflow
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);

    console.log("[extract-document-data] Base64 encoded, length:", base64.length);
    console.log("[extract-document-data] Calling Anthropic API...");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: `Eres un experto en vinos canarios. Analiza este documento (ficha técnica de vino) y extrae exactamente estos campos. Devuelve SOLO un JSON válido sin texto adicional:
{
  "nombre": "nombre del vino (solo nombre, sin añada ni formato)",
  "anada": número o null,
  "do": "zona de producción / denominación de origen (usar formato D.O. Nombre)",
  "isla": "inferir de la DO: Gran Canaria/Tenerife/Lanzarote/La Palma/El Hierro/La Gomera/Fuerteventura",
  "uvas": "todas las variedades de uva separadas por +",
  "graduacion": número (grados alcohólicos) o null,
  "temp_servicio_min": número (temperatura mínima de servicio en °C) o null,
  "temp_servicio_max": número (temperatura máxima de servicio en °C) o null,
  "crianza": "descripción de crianza/envejecimiento" o null,
  "descripcion_corta": "campo Resumen del PDF" o null,
  "descripcion_larga": "campo Descripción completa del PDF" o null,
  "puntuacion_parker": número (puntuación Parker/guía) o null,
  "formato_ml": número (inferir del título: 50cl=500, 75cl=750, 37.5cl=375, 150cl=1500) o 750,
  "bodega": "marca/productor, inferir del nombre del vino" o null,
  "precio": número (precio si aparece) o null
}
Si un campo no aparece en el documento, usa null. Responde SOLO con el JSON válido.`,
        messages: [{
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: "Extrae los datos de vinos de este documento (ficha técnica).",
            },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[extract-document-data] Anthropic error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: `Error de IA: ${response.status} - ${errText.substring(0, 200)}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    console.log("[extract-document-data] Anthropic raw response text:", text.substring(0, 500));

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        console.error("[extract-document-data] Could not parse JSON from:", text);
        throw new Error("No se pudo interpretar la respuesta de la IA");
      }
    }

    console.log("[extract-document-data] Parsed result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[extract-document-data] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
