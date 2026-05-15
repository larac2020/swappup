import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STALE_DAYS = 14;
const BATCH_SIZE = 5;
const FIRECRAWL = "https://api.firecrawl.dev/v2/search";
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function liveLookup(airline: string, routeType: string): Promise<any | null> {
  const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!FIRECRAWL_KEY || !LOVABLE_API_KEY) return null;

  const sres = await fetch(FIRECRAWL, {
    method: "POST",
    headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `${airline} name change correction fee official policy`,
      limit: 3,
      scrapeOptions: { formats: ["markdown"] },
    }),
  });
  if (!sres.ok) return null;
  const sdata = await sres.json();
  const results = sdata?.data?.web ?? sdata?.data ?? [];
  const corpus = (Array.isArray(results) ? results : [])
    .slice(0, 3)
    .map((r: any) => `# ${r.title || ""}\nURL: ${r.url}\n\n${(r.markdown || "").slice(0, 6000)}`)
    .join("\n\n---\n\n");
  const sourceUrl = (Array.isArray(results) && results[0]?.url) || null;
  if (!corpus) return null;

  const ai = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You extract the published name-change/name-correction fee for an airline ticket from official airline content. Only use the provided sources. If the policy says tickets are non-transferable, set is_transferable=false and fee_amount=0. Prefer the higher end of any range. Output currency in ISO code." },
        { role: "user", content: `Airline: ${airline}\nRoute type: ${routeType}\n\nSources:\n${corpus}` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "report_fee",
          parameters: {
            type: "object",
            properties: {
              is_transferable: { type: "boolean" },
              fee_amount: { type: "number" },
              fee_max: { type: "number" },
              currency: { type: "string" },
              confidence: { type: "string", enum: ["low", "medium", "high"] },
              notes: { type: "string" },
            },
            required: ["is_transferable", "fee_amount", "currency", "confidence"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "report_fee" } },
    }),
  });
  if (!ai.ok) return null;
  const adata = await ai.json();
  const args = adata?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return null;
  try {
    return { ...JSON.parse(args), source_url: sourceUrl };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const cutoff = new Date(Date.now() - STALE_DAYS * 86400_000).toISOString();

  const { data: rows, error } = await supabase
    .from("airline_change_fees")
    .select("airline_code, airline_name, route_type, last_verified_at")
    .or(`last_verified_at.lt.${cutoff},last_verified_at.is.null`)
    .order("last_verified_at", { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: any[] = [];
  for (const r of rows ?? []) {
    try {
      const live = await liveLookup(r.airline_name, r.route_type);
      if (!live) {
        results.push({ airline_code: r.airline_code, status: "skip" });
        continue;
      }
      const upsertRow = {
        airline_code: r.airline_code,
        airline_name: r.airline_name,
        route_type: r.route_type,
        fee_amount: Number(live.fee_max ?? live.fee_amount) || 0,
        fee_max: live.fee_max ?? null,
        currency: live.currency || "EUR",
        is_transferable: live.is_transferable !== false,
        confidence: live.confidence || "medium",
        source_url: live.source_url || null,
        notes: live.notes || null,
        last_verified_at: new Date().toISOString(),
      };
      await supabase
        .from("airline_change_fees")
        .upsert(upsertRow, { onConflict: "airline_code,route_type" });
      results.push({ airline_code: r.airline_code, status: "updated", is_transferable: upsertRow.is_transferable });
      await new Promise((res) => setTimeout(res, 500));
    } catch (e) {
      results.push({ airline_code: r.airline_code, status: "error", error: e instanceof Error ? e.message : String(e) });
    }
  }

  return new Response(JSON.stringify({ refreshed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});