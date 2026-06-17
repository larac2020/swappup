import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const KNOWN_CODES = new Set([
  "BOOKING_ALREADY_SOLD",
  "DUPLICATE_BOOKING_REF",
  "DUPLICATE_BOOKING_FINGERPRINT",
  "LISTING_LOCKED",
]);

function j(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return j({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: u } = await userClient.auth.getUser();
    if (!u.user) return j({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const code = String(body?.error_code || "").trim();
    if (!KNOWN_CODES.has(code)) return j({ error: "Invalid error_code" }, 400);

    const bookingRef: string | null = body?.booking_reference || null;
    const attempt = body?.attempted_listing ?? null;
    const errorMessage: string = String(body?.error_message || "").slice(0, 2000);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: seller } = await admin
      .from("profiles")
      .select("id, account_status, fraud_case_id")
      .eq("user_id", u.user.id)
      .single();
    if (!seller) return j({ error: "Profile not found" }, 404);

    // Try to identify a conflicting prior sale (for evidence)
    let conflictListingId: string | null = null;
    let conflictPurchaseId: string | null = null;
    if (bookingRef) {
      const { data: sb } = await admin
        .from("sold_bookings")
        .select("listing_id, purchase_id")
        .eq("booking_reference_normalized", bookingRef.toUpperCase().replace(/[\s\-_]/g, ""))
        .maybeSingle();
      if (sb) {
        conflictListingId = sb.listing_id;
        conflictPurchaseId = sb.purchase_id;
      }
    }

    // Re-use an open case if one exists; otherwise open a new one.
    let caseId = seller.fraud_case_id as string | null;
    if (caseId) {
      const { data: existing } = await admin
        .from("fraud_cases")
        .select("id, status")
        .eq("id", caseId)
        .maybeSingle();
      if (!existing || existing.status !== "under_review") caseId = null;
    }

    if (!caseId) {
      const { data: openCase } = await admin
        .from("fraud_cases")
        .select("id")
        .eq("seller_id", seller.id)
        .eq("status", "under_review")
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      caseId = openCase?.id ?? null;
    }

    const evidenceBase = {
      error_code: code,
      error_message: errorMessage,
      attempted_listing: attempt,
      conflict_listing_id: conflictListingId,
      conflict_purchase_id: conflictPurchaseId,
      detected_at: new Date().toISOString(),
      detected_by: "report-fraud-attempt",
    };

    if (!caseId) {
      const { data: newCase, error: caseErr } = await admin
        .from("fraud_cases")
        .insert({
          seller_id: seller.id,
          status: "under_review",
          reason: "Duplicate-sale attempt detected: " + code,
          evidence: { initial: evidenceBase },
        })
        .select("id")
        .single();
      if (caseErr) {
        console.error("fraud_cases insert error", caseErr);
        return j({ error: "Could not open fraud case" }, 500);
      }
      caseId = newCase.id;
    }

    // Always log the event
    await admin.from("fraud_events").insert({
      case_id: caseId,
      seller_id: seller.id,
      event_type: "duplicate_sale_attempt",
      listing_id: conflictListingId,
      purchase_id: conflictPurchaseId,
      booking_reference: bookingRef,
      actor_user_id: u.user.id,
      evidence: evidenceBase,
    });

    // Freeze payouts + suspend account (only if not already banned)
    if (seller.account_status !== "banned") {
      await admin
        .from("profiles")
        .update({
          account_status: "suspended",
          payouts_frozen: true,
          fraud_case_id: caseId,
        })
        .eq("id", seller.id);
    }

    // Notify admins
    const { data: admins } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (admins?.length) {
      await admin.from("notifications").insert(
        admins.map((a: { user_id: string }) => ({
          user_id: a.user_id,
          type: "fraud",
          title: "Fraud case opened",
          message: `Seller ${seller.id} attempted a duplicate sale (${code}).`,
        })),
      );
    }

    return j({ ok: true, case_id: caseId, status: "under_review" });
  } catch (e) {
    console.error("report-fraud-attempt error", e);
    return j({ error: (e as Error).message || "Unexpected error" }, 500);
  }
});