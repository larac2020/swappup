import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const isServiceRole = auth === `Bearer ${SRK}`;

    const body = await req.json();
    const { purchase_id, auto } = body || {};
    const autoRelease = isServiceRole && auto === true;

    let callerUserId: string | null = null;
    if (!autoRelease) {
      if (!auth) return j({ error: "Unauthorized" }, 401);
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: auth } } },
      );
      const { data: u } = await userClient.auth.getUser();
      if (!u.user) return j({ error: "Unauthorized" }, 401);
      callerUserId = u.user.id;
    }

    if (!purchase_id) return j({ error: "Missing purchase_id" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      SRK,
    );

    const { data: purchase } = await admin.from("purchases").select("*").eq("id", purchase_id).single();
    if (!purchase) return j({ error: "Not found" }, 404);

    // Block payouts when the seller account is frozen / banned / under fraud review.
    const { data: sellerGuard } = await admin
      .from("profiles")
      .select("payouts_frozen, account_status")
      .eq("id", purchase.seller_id)
      .single();
    if (sellerGuard?.payouts_frozen || sellerGuard?.account_status === "banned" || sellerGuard?.account_status === "suspended") {
      return j({ error: "PAYOUT_FROZEN: Seller account is under fraud review. Payout cannot be released." }, 403);
    }

    if (!autoRelease) {
      // Only buyer can release manually
      const { data: buyerProfile } = await admin.from("profiles").select("user_id").eq("id", purchase.buyer_id).single();
      if (buyerProfile?.user_id !== callerUserId) return j({ error: "Forbidden" }, 403);
    }
    if (purchase.escrow_status === "released") return j({ ok: true, already: true });

    // Capture PI
    if (purchase.stripe_payment_id?.startsWith("pi_")) {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
      try { await stripe.paymentIntents.capture(purchase.stripe_payment_id); } catch (e) { console.error(e); }
    }

    await admin.from("purchases").update({
      status: "completed",
      escrow_status: "released",
      buyer_confirmed: true,
    }).eq("id", purchase_id);

    // Increment counters
    const { data: sellerP } = await admin.from("profiles").select("user_id, email, full_name, transactions_sold").eq("id", purchase.seller_id).single();
    const { data: buyerP } = await admin.from("profiles").select("user_id, full_name, transactions_bought").eq("id", purchase.buyer_id).single();
    if (sellerP) await admin.from("profiles").update({ transactions_sold: (sellerP.transactions_sold ?? 0) + 1 }).eq("id", purchase.seller_id);
    if (buyerP) await admin.from("profiles").update({ transactions_bought: (buyerP.transactions_bought ?? 0) + 1 }).eq("id", purchase.buyer_id);

    if (sellerP) {
      await admin.from("notifications").insert({
        user_id: sellerP.user_id,
        title: "Payment released",
        message: "The buyer confirmed receipt of the ticket. Your payout is on its way.",
        type: "payout",
        listing_id: purchase.listing_id,
      });

      // Email 5 — seller payout released
      if (sellerP.email) {
        const { data: listing } = await admin.from("listings")
          .select("origin_city, origin_country, destination_city, destination_country, departure_date, airline, flight_number")
          .eq("id", purchase.listing_id).single();
        const payoutNet = Number(purchase.total_price || 0); // gross — fee breakdown handled elsewhere
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "escrow-released-seller",
            recipientEmail: sellerP.email,
            idempotencyKey: `payout-${purchase.id}`,
            templateData: {
              sellerName: (sellerP.full_name || "").split(" ")[0],
              buyerName: (buyerP?.full_name || purchase.buyer_full_name || "").split(" ")[0],
              payoutAmount: payoutNet ? `€${payoutNet.toFixed(2)}` : undefined,
              trip: listing ? {
                origin: `${listing.origin_city}${listing.origin_country ? `, ${listing.origin_country}` : ""}`,
                destination: `${listing.destination_city}${listing.destination_country ? `, ${listing.destination_country}` : ""}`,
                departureDate: listing.departure_date,
                airline: listing.airline,
                flightNumber: listing.flight_number,
              } : undefined,
            },
          },
        }).catch((e) => console.error("email payout failed", e));
      }
    }

    return j({ ok: true });
  } catch (e) {
    console.error("release-escrow error", e);
    return j({ error: "An unexpected error occurred" }, 500);
  }
});

function j(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}