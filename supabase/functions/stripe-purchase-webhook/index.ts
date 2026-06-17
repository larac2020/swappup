import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "stripe-signature, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2025-08-27.basil",
  });
  const sig = req.headers.get("stripe-signature");
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (!secret || !sig) {
      return new Response("Missing signature or webhook secret", { status: 400 });
    }
    event = await stripe.webhooks.constructEventAsync(body, sig, secret);
  } catch (e) {
    return new Response(`Webhook error: ${(e as Error).message}`, { status: 400 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const purchaseId = session.metadata?.purchase_id;
    if (!purchaseId) return new Response("ok");

    const pi = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

    const { data: purchase } = await admin.from("purchases").select("*").eq("id", purchaseId).single();
    if (!purchase) return new Response("ok");

    await admin.from("purchases").update({
      status: "pending_transfer",
      escrow_status: "authorized",
      stripe_payment_id: pi || session.id,
    }).eq("id", purchaseId);

    // Decrement listing stock; deactivate if zero
    const { data: listing } = await admin.from("listings").select("*")
      .eq("id", purchase.listing_id).single();
    if (listing) {
      await admin.from("listings").update({
        ticket_count: 0,
        is_active: false,
      }).eq("id", purchase.listing_id);

      // Notify seller
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
        });
      }

      // Build trip data shared by both emails
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

      // Email 1a — buyer confirmation
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

      // Email 1b — seller action required
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
  }

  if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const purchaseId = session.metadata?.purchase_id;
    if (purchaseId) {
      await admin.from("purchases").update({
        status: "refunded",
        escrow_status: "canceled",
      }).eq("id", purchaseId);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});