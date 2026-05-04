import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { purchase_id } = await req.json();
    if (!purchase_id) return j({ error: "Missing purchase_id" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: purchase } = await admin.from("purchases").select("*").eq("id", purchase_id).single();
    if (!purchase) return j({ error: "Not found" }, 404);

    // Only buyer can release
    const { data: buyerProfile } = await admin.from("profiles").select("user_id").eq("id", purchase.buyer_id).single();
    if (buyerProfile?.user_id !== u.user.id) return j({ error: "Forbidden" }, 403);
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
    const { data: sellerP } = await admin.from("profiles").select("user_id, transactions_sold").eq("id", purchase.seller_id).single();
    const { data: buyerP } = await admin.from("profiles").select("user_id, transactions_bought").eq("id", purchase.buyer_id).single();
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
    }

    return j({ ok: true });
  } catch (e) {
    return j({ error: (e as Error).message }, 500);
  }
});

function j(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}