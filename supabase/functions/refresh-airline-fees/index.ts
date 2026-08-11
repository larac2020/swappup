import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireServiceRole } from "../_shared/require-service-role.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ~52 tracked airlines. One cron run every 6h × BATCH_SIZE = 20 refreshes/day,
// so the whole list re-verifies comfortably within a week.
const STALE_DAYS = 7;
const BATCH_SIZE = 5;
const FIRECRAWL_SEARCH = "https://api.firecrawl.dev/v2/search";
const FIRECRAWL_SCRAPE = "https://api.firecrawl.dev/v2/scrape";
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Canonical official sources per airline. Used first; falls back to web search.
const AIRLINE_SOURCES: Record<string, string> = {
  ryanair: "https://www.ryanair.com/gb/en/useful-info/help-centre/faq-overview/Fees",
  easyjet: "https://www.easyjet.com/en/help/booking-and-changes/change-name-on-booking",
  wizzair: "https://wizzair.com/en-gb/information-and-services/travel-information/travel-conditions/general-conditions-of-carriage",
  vueling: "https://www.vueling.com/en/customer-services/before-you-fly/changes-to-your-booking",
  volotea: "https://www.volotea.com/en/faqs/changes-bookings/",
  air_europa: "https://www.aireuropa.com/gb/en/aea/general-information/customer-service/change-or-cancel-a-flight.html",
  iberia: "https://www.iberia.com/gb/manage/changes-cancellations/",
  ita_airways: "https://www.ita-airways.com/en_en/fly-ita/before-the-flight/changes-and-cancellations.html",
  tap_air_portugal: "https://www.flytap.com/en-gb/booking/manage-booking",
  eurowings: "https://www.eurowings.com/en/booking/general-conditions-of-carriage.html",
  aer_lingus: "https://www.aerlingus.com/help/help/your-booking/change-flight/",
  pegasus: "https://www.flypgs.com/en/help/general-rules",
  sunexpress: "https://www.sunexpress.com/en/customer-service/booking-and-pricing/",
  play: "https://www.flyplay.com/en/customer-service/before-you-fly/changes-to-your-booking",
  british_airways: "https://www.britishairways.com/en-gb/information/help-and-contacts/faqs/changing-your-booking",
  norwegian: "https://www.norwegian.com/uk/travel-info/booking/change-flight/",
  icelandair: "https://www.icelandair.com/support/booking/changes-and-cancellation/",
  airasia: "https://support.airasia.com/s/article/Add-on-Booking-Fees",
  jetstar: "https://www.jetstar.com/au/en/help/articles/change-name-on-booking",
  scoot: "https://www.flyscoot.com/en/plan/help/faqs",
  cebu_pacific: "https://www.cebupacificair.com/help/manage-booking/change-flight",
  indigo: "https://www.goindigo.in/information/booking-and-cancellation.html",
  flydubai: "https://www.flydubai.com/en/help-and-contact/changes-to-my-booking",
  delta: "https://www.delta.com/us/en/change-cancel/overview",
  united: "https://www.united.com/ual/en/us/fly/help/changes.html",
  american_airlines: "https://www.aa.com/i18n/travel-info/changing-your-trip.jsp",
  swiss: "https://www.swiss.com/us/en/prepare/rebooking-refund",
  // --- EU/EEA + UK market expansion ---
  turkish_airlines: "https://www.turkishairlines.com/en-int/any-questions/changing-my-reservation/",
  tui_airways: "https://www.tui.co.uk/destinations/info/flight-changes",
  transavia: "https://www.transavia.com/en-eu/service/change-a-booking/",
  aegean_airlines: "https://en.aegeanair.com/travel-information/before-the-flight/change-or-cancel-your-booking/",
  lot_polish_airlines: "https://www.lot.com/us/en/customer-service/changes-and-refunds",
  air_baltic: "https://www.airbaltic.com/en/change-booking",
  brussels_airlines: "https://www.brusselsairlines.com/en-be/customer-support/rebooking-and-refund",
  austrian_airlines: "https://www.austrian.com/us/en/rebooking-and-refund",
  qatar_airways: "https://www.qatarairways.com/en/help/manage-booking.html",
  etihad_airways: "https://www.etihad.com/en/help/manage-your-booking",
  air_malta: "https://www.kmmalta.com/en/help/manage-my-booking",
  croatia_airlines: "https://www.croatiaairlines.com/Travel-info/Booking-and-payment/Changes-and-refunds",
  bulgaria_air: "https://www.air.bg/en/information/before-flight/changes-and-refunds",
  air_serbia: "https://www.airserbia.com/en/information/booking/changes-and-refunds",
  loganair: "https://www.loganair.co.uk/help-and-advice/booking-information/changes-to-your-booking/",
  condor: "https://www.condor.com/eu/flight-preparation/booking-service/rebooking.jsp",
  corendon_airlines: "https://www.corendonairlines.com/en/faq",
  cyprus_airways: "https://www.cyprusairways.com/en/plan/faq",
};

// Sanity bounds (in EUR-equivalent). Anything outside this is rejected.
const MIN_FEE_EUR = 0;
const MAX_FEE_EUR = 500;
// Rough FX for sanity-check only (mirrors src/lib/currency.ts rates per 1 EUR).
const FX_PER_EUR: Record<string, number> = {
  EUR: 1, GBP: 0.85, USD: 1.08, CHF: 0.95, NOK: 11.5, ISK: 150, MYR: 5.1,
  AUD: 1.65, SGD: 1.45, PHP: 62, INR: 92,
};

function toEur(amount: number, currency: string): number {
  const rate = FX_PER_EUR[currency?.toUpperCase()] ?? 1;
  return amount / rate;
}

async function scrapeCanonical(url: string): Promise<{ markdown: string; url: string } | null> {
  const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_KEY) return null;
  try {
    const res = await fetch(FIRECRAWL_SCRAPE, {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const md = data?.data?.markdown || data?.markdown || "";
    if (!md || md.length < 200) return null;
    return { markdown: md.slice(0, 12000), url };
  } catch {
    return null;
  }
}

async function liveLookup(airline: string, routeType: string, airlineCode: string): Promise<any | null> {
  const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!FIRECRAWL_KEY || !LOVABLE_API_KEY) return null;

  let corpus = "";
  let sourceUrl: string | null = null;

  // 1) Try the canonical official source first.
  const canonical = AIRLINE_SOURCES[airlineCode];
  if (canonical) {
    const scraped = await scrapeCanonical(canonical);
    if (scraped) {
      corpus = `# Official ${airline}\nURL: ${scraped.url}\n\n${scraped.markdown}`;
      sourceUrl = scraped.url;
    }
  }

  // 2) Fallback: web search across top results.
  if (!corpus) {
    const sres = await fetch(FIRECRAWL_SEARCH, {
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
    corpus = (Array.isArray(results) ? results : [])
      .slice(0, 3)
      .map((r: any) => `# ${r.title || ""}\nURL: ${r.url}\n\n${(r.markdown || "").slice(0, 6000)}`)
      .join("\n\n---\n\n");
    sourceUrl = (Array.isArray(results) && results[0]?.url) || null;
    if (!corpus) return null;
  }

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
  const unauthorized = await requireServiceRole(req);
  if (unauthorized) return unauthorized;

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
      const live = await liveLookup(r.airline_name, r.route_type, r.airline_code);
      if (!live) {
        results.push({ airline_code: r.airline_code, status: "skip" });
        continue;
      }

      // Read existing live row to compare against the proposal.
      const { data: existing } = await supabase
        .from("airline_change_fees")
        .select("fee_amount, currency, is_transferable")
        .eq("airline_code", r.airline_code)
        .eq("route_type", r.route_type)
        .maybeSingle();

      const proposedFee = Number(live.fee_max ?? live.fee_amount) || 0;
      const proposedCurrency = (live.currency || existing?.currency || "EUR").toUpperCase();
      const proposedXfer = live.is_transferable !== false;
      const confidence = live.confidence || "medium";

      // Sanity bounds check (in EUR equivalent).
      const feeEur = toEur(proposedFee, proposedCurrency);
      const outOfBounds = feeEur < MIN_FEE_EUR || feeEur > MAX_FEE_EUR;

      // Confidence gate.
      const lowConfidence = confidence === "low";

      // Large delta vs current live value.
      let largeDelta = false;
      if (existing && existing.fee_amount != null && existing.currency) {
        const currentEur = toEur(Number(existing.fee_amount), existing.currency);
        const deltaEur = Math.abs(feeEur - currentEur);
        const ratio = currentEur > 0 ? deltaEur / currentEur : (feeEur > 0 ? 1 : 0);
        if (deltaEur > 50 || ratio > 0.4) largeDelta = true;
      }

      const quarantineReason = outOfBounds ? "out_of_bounds"
        : lowConfidence ? "low_confidence"
        : largeDelta ? "large_delta"
        : null;

      const nowIso = new Date().toISOString();

      if (quarantineReason) {
        // Don't overwrite live row. Bump last_verified_at, log to history (rejected),
        // and enqueue for review.
        await supabase
          .from("airline_change_fees")
          .update({ last_verified_at: nowIso })
          .eq("airline_code", r.airline_code)
          .eq("route_type", r.route_type);

        await supabase.from("airline_fee_review_queue").insert({
          airline_code: r.airline_code,
          airline_name: r.airline_name,
          route_type: r.route_type,
          current_fee: existing?.fee_amount ?? null,
          current_currency: existing?.currency ?? null,
          current_is_transferable: existing?.is_transferable ?? null,
          proposed_fee: proposedFee,
          proposed_currency: proposedCurrency,
          proposed_is_transferable: proposedXfer,
          reason: quarantineReason,
          source_url: live.source_url || null,
          confidence,
          notes: live.notes || null,
        });

        await supabase.from("airline_change_fee_history").insert({
          airline_code: r.airline_code,
          route_type: r.route_type,
          previous_fee: existing?.fee_amount ?? null,
          new_fee: proposedFee,
          previous_currency: existing?.currency ?? null,
          new_currency: proposedCurrency,
          previous_is_transferable: existing?.is_transferable ?? null,
          new_is_transferable: proposedXfer,
          source_url: live.source_url || null,
          confidence,
          accepted: false,
          rejection_reason: quarantineReason,
          notes: live.notes || null,
        });

        results.push({ airline_code: r.airline_code, status: "quarantined", reason: quarantineReason });
      } else {
        const upsertRow = {
          airline_code: r.airline_code,
          airline_name: r.airline_name,
          route_type: r.route_type,
          fee_amount: proposedFee,
          fee_max: live.fee_max ?? null,
          currency: proposedCurrency,
          is_transferable: proposedXfer,
          confidence,
          source_url: live.source_url || null,
          notes: live.notes || null,
          last_verified_at: nowIso,
        };
        await supabase
          .from("airline_change_fees")
          .upsert(upsertRow, { onConflict: "airline_code,route_type" });

        await supabase.from("airline_change_fee_history").insert({
          airline_code: r.airline_code,
          route_type: r.route_type,
          previous_fee: existing?.fee_amount ?? null,
          new_fee: proposedFee,
          previous_currency: existing?.currency ?? null,
          new_currency: proposedCurrency,
          previous_is_transferable: existing?.is_transferable ?? null,
          new_is_transferable: proposedXfer,
          source_url: live.source_url || null,
          confidence,
          accepted: true,
          notes: live.notes || null,
        });

        results.push({ airline_code: r.airline_code, status: "updated", is_transferable: proposedXfer });
      }
      await new Promise((res) => setTimeout(res, 500));
    } catch (e) {
      results.push({ airline_code: r.airline_code, status: "error", error: e instanceof Error ? e.message : String(e) });
    }
  }

  return new Response(JSON.stringify({ refreshed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});