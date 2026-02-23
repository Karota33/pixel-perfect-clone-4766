import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const { nombre, tipo, isla, uvas, anada, bodega, do: dop, field } = await req.json();

    const wineContext = `Vino: ${nombre}
Tipo: ${tipo}
Isla: ${isla}
${uvas ? `Uvas: ${uvas}` : ""}
${anada ? `Añada: ${anada}` : ""}
${bodega ? `Bodega: ${bodega}` : ""}
${dop ? `DO: ${dop}` : ""}`;

    let systemPrompt: string;
    let userPrompt: string;

    if (field === "descripcion_corta") {
      systemPrompt =
        "Eres sommelier de un restaurante con estrella Michelin en Canarias. Escribe UNA frase de máximo 160 caracteres para presentar este vino en sala. Tono elegante, evocador, sin tecnicismos. Solo la frase, sin comillas.";
      userPrompt = wineContext;
    } else if (field === "maridaje") {
      systemPrompt =
        "Eres sommelier de un restaurante con estrella Michelin en Canarias. Sugiere 2-3 maridajes concretos para este vino con platos de cocina canaria o mediterránea. Tono profesional pero accesible. Responde con texto plano, sin JSON ni markdown.";
      userPrompt = wineContext;
    } else {
      systemPrompt = `Eres sommelier de un restaurante con estrella Michelin en Canarias. Genera un JSON con exactamente 3 campos:
- "vinedo": descripción del viñedo y elaboración (2-3 frases, tono evocador)
- "cata": notas de cata (2-3 frases, sensorial y elegante)
- "maridaje": sugerencia de maridaje con cocina canaria (1-2 frases)

Responde SOLO con el JSON válido, sin markdown ni explicaciones.`;
      userPrompt = wineContext;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    let result: Record<string, unknown>;

    if (field === "descripcion_corta") {
      result = { descripcion_corta: text.trim() };
    } else if (field === "maridaje") {
      result = { maridaje: text.trim() };
    } else {
      try {
        const parsed = JSON.parse(text);
        result = { descripcion_larga: parsed };
      } catch {
        // Try extracting JSON from the response
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          result = { descripcion_larga: JSON.parse(match[0]) };
        } else {
          throw new Error("Could not parse JSON from AI response");
        }
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
