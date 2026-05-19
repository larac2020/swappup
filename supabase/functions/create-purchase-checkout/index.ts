import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    const { listing_id, full_name, email } = await req.json();
    if (!listing_id || !full_name || !email) return j({ error: "Missing fields" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Buyer profile
    const { data: buyer } = await admin
      .from("profiles").select("id").eq("user_id", u.user.id).single();
    if (!buyer) return j({ error: "Buyer profile not found" }, 400);

    // Listing
    const { data: listing } = await admin
      .from("listings").select("*").eq("id", listing_id).single();
    if (!listing || !listing.is_active) return j({ error: "Listing unavailable" }, 400);
    if (listing.seller_id === buyer.id) return j({ error: "Cannot buy your own listing" }, 400);
    if ((listing.ticket_count ?? 0) < 1) return j({ error: "Out of stock" }, 400);

    const ticketPrice = Number(listing.price);
    // Use the server-side listing fee — never trust client input
    const fee = Math.max(0, Number((listing as any).name_change_fee ?? 0));
    const total = ticketPrice + fee;
    const currency = String((listing as any).currency || "EUR").toLowerCase();
    const transferDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Pre-create purchase row (status: pending, escrow: pending)
    const { data: purchase, error: pErr } = await admin.from("purchases").insert({
      buyer_id: buyer.id,
      seller_id: listing.seller_id,
      listing_id: listing.id,
      quantity: 1,
      total_price: total,
      name_change_fee: fee,
      status: "pending",
      escrow_status: "pending",
      buyer_full_name: full_name.trim(),
      buyer_email: email.trim(),
      transfer_deadline: transferDeadline,
      escrow_deadline: transferDeadline,
      original_booking_ref: listing.flight_number || null,
    }).select().single();
    if (pErr) {
      console.error("purchase insert error", pErr);
      return j({ error: "Could not create purchase" }, 400);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const origin = req.headers.get("origin") || "https://flyswap.app";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email.trim(),
      line_items: [{
        price_data: {
          currency,
          product_data: { name: listing.title || "Flight ticket" },
          unit_amount: Math.round(total * 100),
        },
        quantity: 1,
      }],
      payment_intent_data: { capture_method: "manual" },
      metadata: { purchase_id: purchase.id },
      success_url: `${origin}/listing/${listing.id}?purchase=${purchase.id}&success=1`,
      cancel_url: `${origin}/listing/${listing.id}?purchase=${purchase.id}&canceled=1`,
    });

    await admin.from("purchases").update({ stripe_payment_id: session.id }).eq("id", purchase.id);

    return j({ url: session.url, purchase_id: purchase.id });
  } catch (e) {
    console.error(e);
    return j({ error: "An unexpected error occurred" }, 500);
  }
});

function j(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), {
    status: s, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}