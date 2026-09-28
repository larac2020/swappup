// Fetches ECB reference rates (via Frankfurter) and upserts them into fx_rates.
// Safety rule: on ANY fetch/parse/validation failure we log and write NOTHING.
// The upsert is all-or-nothing (single statement), so the table is never
// nulled, zeroed or partially overwritten.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest?base=EUR";

// Currencies we need (EUR is the base, stored as 1).
const REQUIRED = ["GBP", "USD", "CHF", "SEK", "NOK", "DKK", "PLN", "ISK", "TRY", "CZK", "HUF", "RON"];

// Bulgaria joined the euro on 1 Jan 2026 and the ECB no longer publishes BGN.
// Its irrevocably fixed conversion rate is used instead.
const FIXED = { BGN: 1.95583 };

// Non-service callers can only trigger a refresh if the last one is older than this.
const PUBLIC_THROTTLE_MS = 60 * 60 * 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let isService = false;
  const auth = req.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    try {
      const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { data } = await anon.auth.getClaims(auth.slice(7));
      isService = data?.claims?.role === "service_role";
    } catch { /* treat as public */ }
  }

  if (!isService) {
    const { data: last } = await admin
      .from("fx_rates").select("fetched_at").order("fetched_at", { ascending: false }).limit(1).maybeSingle();
    if (last && Date.now() - new Date(last.fetched_at).getTime() < PUBLIC_THROTTLE_MS) {
      return json({ skipped: true, reason: "recently refreshed" });
    }
  }

  let payload: { base?: string; date?: string; rates?: Record<string, unknown> };
  try {
    const res = await fetch(FRANKFURTER_URL, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    payload = await res.json();
  } catch (e) {
    console.error("refresh-fx-rates: fetch failed, table untouched:", String(e));
    return json({ ok: false, error: "fetch_failed" }, 502);
  }

  const rates = payload?.rates;
  if (payload?.base !== "EUR" || !rates || typeof rates !== "object") {
    console.error("refresh-fx-rates: unexpected payload, table untouched:", JSON.stringify(payload).slice(0, 500));
    return json({ ok: false, error: "parse_failed" }, 502);
  }

  const bad = REQUIRED.filter((c) => {
    const v = Number(rates[c]);
    return !Number.isFinite(v) || v <= 0;
  });
  if (bad.length) {
    console.error("refresh-fx-rates: missing/invalid rates, table untouched:", bad.join(","));
    return json({ ok: false, error: "validation_failed", missing: bad }, 502);
  }

  const fetchedAt = new Date().toISOString();
  const source = `ECB via Frankfurter (${payload.date ?? "unknown date"})`;
  const rows = [
    { currency_code: "EUR", rate_per_eur: 1, fetched_at: fetchedAt, source: "base" },
    ...REQUIRED.map((c) => ({ currency_code: c, rate_per_eur: Number(rates[c]), fetched_at: fetchedAt, source })),
    ...Object.entries(FIXED).map(([c, v]) => ({
      currency_code: c, rate_per_eur: v, fetched_at: fetchedAt, source: "Fixed euro conversion rate",
    })),
  ];

  const { error } = await admin.from("fx_rates").upsert(rows, { onConflict: "currency_code" });
  if (error) {
    console.error("refresh-fx-rates: upsert failed, table untouched:", error.message);
    return json({ ok: false, error: "write_failed" }, 500);
  }

  return json({ ok: true, count: rows.length, ecb_date: payload.date });
});
