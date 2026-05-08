import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeAirlineCode(name: string) {
  return (name || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await anonClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      airline,
      route_type,
      platform_fee,
      proposed_fee,
      evidence_url,
      note,
      listing_id,
      currency,
    } = body || {};

    if (!airline || typeof airline !== "string") {
      return new Response(JSON.stringify({ error: "airline is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const proposedNum = Number(proposed_fee);
    if (!Number.isFinite(proposedNum) || proposedNum < 0) {
      return new Response(JSON.stringify({ error: "proposed_fee must be a non-negative number" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: profile } = await admin
      .from("profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const routeType = route_type === "domestic" ? "domestic" : "international";
    const airlineCode = normalizeAirlineCode(airline);

    // Record the dispute
    await admin.from("name_change_fee_disputes").insert({
      listing_id: listing_id || null,
      seller_id: profile.id,
      airline_code: airlineCode,
      airline_name: airline,
      route_type: routeType,
      platform_fee: platform_fee ?? null,
      proposed_fee: proposedNum,
      currency: currency || "EUR",
      evidence_url: evidence_url || null,
      note: note || null,
    });

    // Force a fresh lookup
    const refreshRes = await admin.functions.invoke("get-name-change-fee", {
      body: { airline, route_type: routeType, force_refresh: true },
    });
    const fresh = refreshRes.data || null;
    const newFee = fresh?.fee_max ?? fresh?.fee_amount ?? null;
    const oldFee = platform_fee ?? null;
    const updated = newFee !== null && oldFee !== null && Number(newFee) !== Number(oldFee);

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        oldFee,
        newFee,
        currency: fresh?.currency || currency || "EUR",
        source_url: fresh?.source_url || null,
        last_verified_at: fresh?.last_verified_at || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("report-name-change-fee error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});