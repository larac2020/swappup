import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { requireServiceRole } from "../_shared/require-service-role.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const unauthorized = await requireServiceRole(req);
  if (unauthorized) return unauthorized;
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date().toISOString();
    const { data: expiredSeller } = await admin.from("purchases")
      .select("id")
      .eq("status", "pending_transfer")
      .lt("transfer_deadline", now);

    let sellerCount = 0;
    for (const p of expiredSeller || []) {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/cancel-escrow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          purchase_id: p.id,
          reason: "Seller did not complete the name change in time",
          cause: "seller_missed",
        }),
      });
      sellerCount++;
    }

    // Buyer 48h verification window expired — seller transferred but buyer never confirmed.
    const { data: expiredBuyer } = await admin.from("purchases")
      .select("id")
      .eq("status", "transfer_confirmed")
      .eq("escrow_status", "pending_release")
      .lt("escrow_deadline", now);

    let buyerCount = 0;
    for (const p of expiredBuyer || []) {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/cancel-escrow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          purchase_id: p.id,
          reason: "Buyer did not confirm the booking within 48 hours",
          cause: "buyer_no_confirm",
        }),
      });
      buyerCount++;
    }

    return new Response(JSON.stringify({ expiredSeller: sellerCount, expiredBuyer: buyerCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});