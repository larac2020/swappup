import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STALE_DAYS = 30;
const FIRECRAWL = "https://api.firecrawl.dev/v2/search";
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function normalizeAirline(name: string): { code: string; display: string } {
  const display = (name || "").trim();
  const code = display.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return { code, display };
}

async function liveLookup(airline: string, routeType: string): Promise<any | null> {
  const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!FIRECRAWL_KEY || !LOVABLE_API_KEY) return null;

  // 1) Search the web for the official name change page
  const query = `${airline} name change correction fee official policy`;
  const sres = await fetch(FIRECRAWL, {
    method: "POST",
    headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      limit: 3,
      scrapeOptions: { formats: ["markdown"] },
    }),
  });
  if (!sres.ok) {
    console.error("firecrawl error", sres.status, await sres.text());
    return null;
  }
  const sdata = await sres.json();
  const results = sdata?.data?.web ?? sdata?.data ?? [];
  const corpus = (Array.isArray(results) ? results : [])
    .slice(0, 3)
    .map((r: any) => `# ${r.title || ""}\nURL: ${r.url}\n\n${(r.markdown || "").slice(0, 6000)}`)
    .join("\n\n---\n\n");
  const sourceUrl = (Array.isArray(results) && results[0]?.url) || null;

  if (!corpus) return null;

  // 2) Use AI to extract the fee with structured output
  const ai = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You extract the published name-change/name-correction fee for an airline ticket from official airline content. Only use the provided sources. If the policy says tickets are non-transferable, set is_transferable=false and fee_amount=0. Prefer the higher end of any range. Output currency in ISO code.",
        },
        {
          role: "user",
          content: `Airline: ${airline}\nRoute type: ${routeType}\n\nSources:\n${corpus}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "report_fee",
            description: "Report the name change fee for the airline.",
            parameters: {
              type: "object",
              properties: {
                is_transferable: { type: "boolean" },
                fee_amount: { type: "number", description: "Single representative fee. If a range, use the upper bound." },
                fee_max: { type: "number" },
                currency: { type: "string", description: "ISO currency code, e.g. EUR, USD, GBP" },
                confidence: { type: "string", enum: ["low", "medium", "high"] },
                notes: { type: "string" },
              },
              required: ["is_transferable", "fee_amount", "currency", "confidence"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "report_fee" } },
    }),
  });

  if (!ai.ok) {
    console.error("ai error", ai.status, await ai.text());
    return null;
  }
  const adata = await ai.json();
  const args = adata?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return null;
  try {
    const parsed = JSON.parse(args);
    return { ...parsed, source_url: sourceUrl };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authenticated caller (defense in depth on top of verify_jwt = true)
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { airline, route_type, force_refresh } = await req.json();
    if (!airline || typeof airline !== "string") {
      return new Response(JSON.stringify({ error: "airline is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const routeType = route_type === "domestic" ? "domestic" : "international";
    const { code, display } = normalizeAirline(airline);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Read cached row
    const { data: cached } = await supabase
      .from("airline_change_fees")
      .select("*")
      .eq("airline_code", code)
      .eq("route_type", routeType)
      .maybeSingle();

    const stale =
      !cached ||
      !cached.last_verified_at ||
      Date.now() - new Date(cached.last_verified_at).getTime() > STALE_DAYS * 86400_000;

    if (cached && !stale && !force_refresh) {
      return new Response(JSON.stringify({ ...cached, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Live lookup
    const live = await liveLookup(display, routeType);
    if (!live) {
      // Fall back to cached value if any, else generic estimate
      if (cached) {
        return new Response(JSON.stringify({ ...cached, cached: true, refresh_failed: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({
          airline_code: code,
          airline_name: display,
          route_type: routeType,
          fee_amount: 80,
          currency: "EUR",
          is_transferable: true,
          confidence: "low",
          last_verified_at: new Date().toISOString(),
          source_url: null,
          notes: "Live lookup unavailable, showing platform estimate.",
          cached: false,
          refresh_failed: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const row = {
      airline_code: code,
      airline_name: display,
      route_type: routeType,
      fee_amount: Number(live.fee_max ?? live.fee_amount) || 0,
      fee_max: live.fee_max ?? null,
      currency: live.currency || "EUR",
      is_transferable: live.is_transferable !== false,
      confidence: live.confidence || "medium",
      source_url: live.source_url || null,
      notes: live.notes || null,
      last_verified_at: new Date().toISOString(),
    };

    const { data: upserted, error: upErr } = await supabase
      .from("airline_change_fees")
      .upsert(row, { onConflict: "airline_code,route_type" })
      .select()
      .single();
    if (upErr) console.error("upsert error", upErr);

    return new Response(JSON.stringify({ ...(upserted || row), cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-name-change-fee error", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});