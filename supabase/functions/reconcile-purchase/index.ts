import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Safety-net reconciliation for purchases. Mirrors the finalization logic in
// `stripe-purchase-webhook` so that if the Stripe webhook is delayed or
// misconfigured, a buyer returning to /account/purchases?success=1 can still
// transition their purchase to `pending_transfer` and trigger the buyer +
// seller emails. Idempotent: re-runs are no-ops once the purchase is past
// `pending`, and `send-transactional-email` is invoked with the same
// idempotency keys used by the webhook so duplicate sends are impossible.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return j({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: u } = await userClient.auth.getUser();
    if (!u.user) return j({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const purchaseId = String(body?.purchase_id || "").trim();
    if (!purchaseId) return j({ error: "Missing purchase_id" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: buyer } = await admin
      .from("profiles").select("id").eq("user_id", u.user.id).single();
    if (!buyer) return j({ error: "Profile not found" }, 400);

    const { data: purchase } = await admin
      .from("purchases").select("*").eq("id", purchaseId).single();
    if (!purchase) return j({ error: "Purchase not found" }, 404);
    if (purchase.buyer_id !== buyer.id) return j({ error: "Forbidden" }, 403);

    // Already finalized — nothing to do.
    if (purchase.status !== "pending") {
      return j({ ok: true, status: purchase.status, reconciled: false });
    }

    const sessionId = purchase.stripe_payment_id;
    if (!sessionId || !String(sessionId).startsWith("cs_")) {
      return j({ ok: true, status: purchase.status, reconciled: false, reason: "no_session" });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Cancelled / expired session → mark refunded so it stops blocking.
    if (session.status === "expired") {
      await admin.from("purchases").update({
        status: "refunded", escrow_status: "canceled",
      }).eq("id", purchase.id);
      return j({ ok: true, status: "refunded", reconciled: true });
    }

    if (session.payment_status !== "paid") {
      return j({ ok: true, status: purchase.status, reconciled: false, payment_status: session.payment_status });
    }

    const pi = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

    // Finalize: same code path as stripe-purchase-webhook.
    await admin.from("purchases").update({
      status: "pending_transfer",
      escrow_status: "authorized",
      stripe_payment_id: pi || sessionId,
    }).eq("id", purchase.id);

    const { data: listing } = await admin.from("listings").select("*")
      .eq("id", purchase.listing_id).single();
    if (listing) {
      await admin.from("listings").update({
        ticket_count: 0,
        is_active: false,
      }).eq("id", purchase.listing_id);

      const { data: sellerProfile } = await admin.from("profiles")
        .select("user_id, email, full_name").eq("id", purchase.seller_id).single();
      const { data: buyerProfile } = await admin.from("profiles")
        .select("user_id, email, full_name").eq("id", purchase.buyer_id).single();

      if (sellerProfile) {
        await admin.from("notifications").insert({
          user_id: sellerProfile.user_id,
          title: "New sale — action required",
          message: `Your listing "${listing.title}" was purchased. You have 24 hours to complete the name change.`,
          type: "sale",
          listing_id: purchase.listing_id,
        }).then(() => null, () => null);
      }

      const trip = {
        origin: `${listing.origin_city}${listing.origin_country ? `, ${listing.origin_country}` : ''}`,
        destination: `${listing.destination_city}${listing.destination_country ? `, ${listing.destination_country}` : ''}`,
        departureDate: listing.departure_date,
        departureTime: listing.departure_time || undefined,
        returnDate: listing.return_date || undefined,
        returnTime: listing.return_departure_time || undefined,
        returnFlightNumber: listing.return_flight_number || undefined,
        airline: listing.airline,
        flightNumber: listing.flight_number,
        passengers: purchase.quantity || 1,
      };
      const fmt = (n: number | string | null | undefined) =>
        n == null ? undefined : `€${Number(n).toFixed(2)}`;
      const deadline = purchase.transfer_deadline
        ? new Date(purchase.transfer_deadline).toUTCString()
        : undefined;
      const orderNumber = `SW-${String(purchase.id).slice(0, 8).toUpperCase()}`;

      if (buyerProfile?.email || purchase.buyer_email) {
        await admin.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'purchase-buyer-confirmation',
            recipientEmail: purchase.buyer_email || buyerProfile?.email,
            idempotencyKey: `buyer-confirm-${purchase.id}`,
            templateData: {
              buyerName: (purchase.buyer_full_name || buyerProfile?.full_name || '').split(' ')[0],
              totalPrice: fmt(purchase.total_price),
              trip,
              bookingRef: purchase.original_booking_ref,
              bookingName: purchase.buyer_full_name || buyerProfile?.full_name,
              purchaseId: purchase.id,
              orderNumber,
            },
          },
        }).catch((e) => console.error('email buyer-confirm failed', e));
      }

      if (sellerProfile?.email) {
        await admin.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'purchase-seller-action-required',
            recipientEmail: sellerProfile.email,
            idempotencyKey: `seller-action-${purchase.id}`,
            templateData: {
              sellerName: (sellerProfile.full_name || '').split(' ')[0],
              nameChangeFee: fmt(purchase.name_change_fee),
              deadline,
              trip,
              purchaseId: purchase.id,
              orderNumber,
              totalPrice: fmt(purchase.total_price),
            },
          },
        }).catch((e) => console.error('email seller-action failed', e));
      }
    }

    return j({ ok: true, status: "pending_transfer", reconciled: true });
  } catch (e) {
    console.error("reconcile-purchase error", e);
    return j({ error: "An unexpected error occurred" }, 500);
  }
});

function j(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), {
    status: s, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}