import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Can be called by buyer (refund / report) OR by scheduled expire-transfers (service role).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const isService = auth.includes(serviceKey);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

    const { purchase_id, reason } = await req.json();
    if (!purchase_id) return j({ error: "Missing purchase_id" }, 400);

    const { data: purchase } = await admin.from("purchases").select("*").eq("id", purchase_id).single();
    if (!purchase) return j({ error: "Not found" }, 404);
    if (["refunded","released"].includes(purchase.escrow_status)) return j({ ok: true, already: true });

    if (!isService) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: auth } } },
      );
      const { data: u } = await userClient.auth.getUser();
      if (!u.user) return j({ error: "Unauthorized" }, 401);
      const { data: buyerProfile } = await admin.from("profiles").select("user_id").eq("id", purchase.buyer_id).single();
      if (buyerProfile?.user_id !== u.user.id) return j({ error: "Forbidden" }, 403);
    }

    if (purchase.stripe_payment_id?.startsWith("pi_")) {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
      try { await stripe.paymentIntents.cancel(purchase.stripe_payment_id); } catch (e) { console.error(e); }
    }

    await admin.from("purchases").update({
      status: "refunded",
      escrow_status: "canceled",
    }).eq("id", purchase_id);

    // Restore listing stock
    const { data: listing } = await admin.from("listings").select("ticket_count, is_active, title").eq("id", purchase.listing_id).single();
    if (listing) {
      await admin.from("listings").update({
        ticket_count: (listing.ticket_count ?? 0) + (purchase.quantity ?? 1),
        is_active: true,
      }).eq("id", purchase.listing_id);
    }

    // Notify both parties
    const { data: buyerP } = await admin.from("profiles").select("user_id").eq("id", purchase.buyer_id).single();
    const { data: sellerP } = await admin.from("profiles").select("user_id").eq("id", purchase.seller_id).single();
    if (buyerP) await admin.from("notifications").insert({
      user_id: buyerP.user_id, title: "Refund issued",
      message: `Your purchase has been refunded${reason ? ": " + reason : "."}`,
      type: "refund", listing_id: purchase.listing_id,
    });
    if (sellerP) await admin.from("notifications").insert({
      user_id: sellerP.user_id, title: "Sale canceled",
      message: `A purchase was canceled${reason ? ": " + reason : "."}`,
      type: "refund", listing_id: purchase.listing_id,
    });

    return j({ ok: true });
  } catch (e) {
    return j({ error: (e as Error).message }, 500);
  }
});

function j(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}