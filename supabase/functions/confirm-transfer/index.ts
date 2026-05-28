import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u.user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { purchase_id, booking_ref, surname, proof_path, name_change_proof_path } = body ?? {};
    if (!purchase_id || !booking_ref || !surname || !proof_path || !name_change_proof_path) {
      return json({ error: "Missing fields" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SRK);

    // Fetch purchase and verify caller is the seller.
    const { data: purchase, error: pErr } = await admin
      .from("purchases")
      .select("*")
      .eq("id", purchase_id)
      .single();
    if (pErr || !purchase) return json({ error: "Purchase not found" }, 404);

    const { data: sellerProfile } = await admin
      .from("profiles")
      .select("id, user_id, full_name")
      .eq("id", purchase.seller_id)
      .single();
    if (!sellerProfile || sellerProfile.user_id !== u.user.id) {
      return json({ error: "Forbidden" }, 403);
    }

    // Update purchase as seller (server-side, service role).
    const escrowDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const { error: updErr } = await admin
      .from("purchases")
      .update({
        transfer_booking_ref: booking_ref,
        transfer_surname: surname,
        transfer_confirmed_at: new Date().toISOString(),
        status: "transfer_confirmed",
        escrow_status: "pending_release",
        seller_transferred: true,
        transfer_payment_proof_url: proof_path,
        name_change_proof_url: name_change_proof_path,
        escrow_deadline: escrowDeadline,
      })
      .eq("id", purchase_id);
    if (updErr) throw updErr;

    // Look up buyer (server-side; PII never leaves the function).
    const { data: buyerProfile } = await admin
      .from("profiles")
      .select("user_id, email, full_name")
      .eq("id", purchase.buyer_id)
      .single();

    if (buyerProfile) {
      await admin.from("notifications").insert({
        user_id: buyerProfile.user_id,
        title: "Transfer confirmed — please verify your ticket",
        message: `The seller has confirmed the name change and uploaded a payment proof. Booking ref: ${booking_ref}. Surname: ${surname}. Open your purchases to verify and release payment.`,
        type: "transfer_confirmed",
        listing_id: purchase.listing_id,
      });

      const recipient = buyerProfile.email || purchase.buyer_email;
      if (recipient) {
        const { data: listing } = await admin
          .from("listings")
          .select("origin_city, origin_country, destination_city, destination_country, departure_date, airline, flight_number")
          .eq("id", purchase.listing_id)
          .single();

        // Fire-and-forget transactional email via internal function call.
        await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SRK}`,
          },
          body: JSON.stringify({
            templateName: "transfer-confirmed-buyer-verify",
            recipientEmail: recipient,
            idempotencyKey: `buyer-verify-${purchase.id}`,
            templateData: {
              buyerName: (purchase.buyer_full_name || buyerProfile.full_name || "").split(" ")[0],
              newBookingRef: booking_ref,
              surname,
              trip: listing ? {
                origin: `${listing.origin_city}${listing.origin_country ? `, ${listing.origin_country}` : ""}`,
                destination: `${listing.destination_city}${listing.destination_country ? `, ${listing.destination_country}` : ""}`,
                departureDate: listing.departure_date,
                airline: listing.airline,
                flightNumber: listing.flight_number,
              } : undefined,
              sellerName: sellerProfile.full_name ?? undefined,
            },
          }),
        }).catch((e) => console.error("send-transactional-email failed", e));
      }
    }

    return json({ ok: true });
  } catch (e) {
    console.error("confirm-transfer error", e);
    console.error("confirm-transfer error", e);
    return json({ error: "An unexpected error occurred" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}