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

    const { purchase_id, reason, cause } = await req.json();
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
    const { data: listing } = await admin.from("listings")
      .select("ticket_count, is_active, title, origin_city, origin_country, destination_city, destination_country, departure_date, airline, flight_number")
      .eq("id", purchase.listing_id).single();
    // Only restore stock for seller-side failures. If the buyer failed to confirm AFTER the seller
    // already executed the airline name change, the booking is now under the buyer's name on the
    // airline side and the listing should NOT be re-activated.
    if (listing && cause !== "buyer_no_confirm") {
      await admin.from("listings").update({
        ticket_count: (listing.ticket_count ?? 0) + (purchase.quantity ?? 1),
        is_active: true,
      }).eq("id", purchase.listing_id);
    }

    // Notify both parties
    const { data: buyerP } = await admin.from("profiles").select("user_id, email, full_name").eq("id", purchase.buyer_id).single();
    const { data: sellerP } = await admin.from("profiles").select("user_id, email, full_name").eq("id", purchase.seller_id).single();
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

    // Send emails 6 + 7 only when cancellation was triggered by the system (expire-transfers).
    // Buyer-initiated refunds use a different in-app flow.
    if (isService && listing) {
      const trip = {
        origin: `${listing.origin_city}${listing.origin_country ? `, ${listing.origin_country}` : ""}`,
        destination: `${listing.destination_city}${listing.destination_country ? `, ${listing.destination_country}` : ""}`,
        departureDate: listing.departure_date,
        airline: listing.airline,
        flightNumber: listing.flight_number,
      };

      if (cause === "buyer_no_confirm") {
        // Seller-side: dedicated email explaining that the buyer failed to confirm and that the
        // name-change fee paid to the airline is not recoverable by swappup.
        if (sellerP?.email) {
          await admin.functions.invoke("send-transactional-email", {
            body: {
              templateName: "transfer-buyer-no-confirm-seller",
              recipientEmail: sellerP.email,
              idempotencyKey: `seller-buyer-no-confirm-${purchase.id}`,
              templateData: {
                sellerName: (sellerP.full_name || "").split(" ")[0],
                buyerName: (purchase.buyer_full_name || buyerP?.full_name || "").split(" ")[0],
                nameChangeFee: purchase.name_change_fee ? `€${Number(purchase.name_change_fee).toFixed(2)}` : undefined,
                purchaseId: purchase.id,
                trip,
              },
            },
          }).catch((e) => console.error("email seller buyer-no-confirm failed", e));
        }
        // Buyer side: still receives the apology / refund email so they have a record.
        const buyerRecipient = buyerP?.email || purchase.buyer_email;
        if (buyerRecipient) {
          await admin.functions.invoke("send-transactional-email", {
            body: {
              templateName: "transfer-missed-buyer-apology",
              recipientEmail: buyerRecipient,
              idempotencyKey: `buyer-no-confirm-refund-${purchase.id}`,
              templateData: {
                buyerName: (purchase.buyer_full_name || buyerP?.full_name || "").split(" ")[0],
                refundAmount: purchase.total_price ? `€${Number(purchase.total_price).toFixed(2)}` : undefined,
                trip,
              },
            },
          }).catch((e) => console.error("email buyer no-confirm refund failed", e));
        }
      } else {
        // Default — seller missed the 24h transfer deadline.
        // Email 6 — buyer apology
        const buyerRecipient = buyerP?.email || purchase.buyer_email;
        if (buyerRecipient) {
          await admin.functions.invoke("send-transactional-email", {
            body: {
              templateName: "transfer-missed-buyer-apology",
              recipientEmail: buyerRecipient,
              idempotencyKey: `buyer-apology-${purchase.id}`,
              templateData: {
                buyerName: (purchase.buyer_full_name || buyerP?.full_name || "").split(" ")[0],
                refundAmount: purchase.total_price ? `€${Number(purchase.total_price).toFixed(2)}` : undefined,
                trip,
              },
            },
          }).catch((e) => console.error("email buyer apology failed", e));
        }

        // Email 7 — seller warning
        if (sellerP?.email) {
          await admin.functions.invoke("send-transactional-email", {
            body: {
              templateName: "transfer-missed-seller-warning",
              recipientEmail: sellerP.email,
              idempotencyKey: `seller-missed-${purchase.id}`,
              templateData: {
                sellerName: (sellerP.full_name || "").split(" ")[0],
                trip,
              },
            },
          }).catch((e) => console.error("email seller warning failed", e));
        }
      }
    }

    return j({ ok: true });
  } catch (e) {
    return j({ error: (e as Error).message }, 500);
  }
});

function j(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}