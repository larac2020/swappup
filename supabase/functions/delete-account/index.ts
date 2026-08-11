import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BLOCKED_MESSAGE =
  "We're unable to process this request right now, as you have an active transaction in progress. Please try again once it's complete.";

// Escrow states that mean money is still in flight.
const OPEN_ESCROW = ["pending", "authorized", "held"];
// Purchase states that mean the transaction is not finished.
const OPEN_STATUS = ["pending", "pending_transfer", "transfer_confirmed"];
// Dispute/report states that count as unresolved.
const CLOSED_DISPUTE = ["resolved", "rejected", "closed", "dismissed", "withdrawn"];

const ANON_TEXT = "[deleted]";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile } = await adminClient
      .from("profiles")
      .select("id, id_document_url")
      .eq("user_id", user.id)
      .maybeSingle();

    const profileId = profile?.id as string | undefined;

    // ---------------------------------------------------------------
    // 1. Block deletion while anything is still unresolved
    // ---------------------------------------------------------------
    if (profileId) {
      const { data: openPurchases, error: purchaseErr } = await adminClient
        .from("purchases")
        .select("id, status, escrow_status")
        .or(`buyer_id.eq.${profileId},seller_id.eq.${profileId}`);
      if (purchaseErr) throw purchaseErr;

      const hasOpenPurchase = (openPurchases ?? []).some(
        (p) => OPEN_ESCROW.includes(p.escrow_status) || OPEN_STATUS.includes(p.status),
      );

      const { data: fraudCases } = await adminClient
        .from("fraud_cases")
        .select("id")
        .eq("seller_id", profileId)
        .eq("status", "under_review")
        .limit(1);

      const { data: feeDisputes } = await adminClient
        .from("name_change_fee_disputes")
        .select("id, status")
        .eq("seller_id", profileId);

      const { data: reports } = await adminClient
        .from("seller_reports")
        .select("id, status")
        .or(`seller_id.eq.${profileId},reporter_id.eq.${profileId}`);

      const hasOpenDispute =
        (feeDisputes ?? []).some((d) => !CLOSED_DISPUTE.includes(d.status)) ||
        (reports ?? []).some((r) => !CLOSED_DISPUTE.includes(r.status));

      if (hasOpenPurchase || (fraudCases?.length ?? 0) > 0 || hasOpenDispute) {
        return json({ error: BLOCKED_MESSAGE, code: "ACTIVE_TRANSACTION" }, 409);
      }
    }

    if (profileId) {
      // -------------------------------------------------------------
      // 2. Immediate deletion of purely personal, non-evidential data
      // -------------------------------------------------------------
      await adminClient.from("cart_items").delete().eq("user_id", profileId);
      await adminClient.from("watchlist").delete().eq("user_id", profileId);
      await adminClient.from("listing_views").delete().eq("viewer_id", profileId);
      await adminClient.from("search_history").delete().eq("user_id", profileId);
      await adminClient.from("notifications").delete().eq("user_id", user.id);
      await adminClient.from("data_consent").delete().eq("user_id", user.id);

      // -------------------------------------------------------------
      // 3. Listings are deactivated, never deleted
      // -------------------------------------------------------------
      await adminClient.from("listings").update({ is_active: false }).eq("seller_id", profileId);

      // -------------------------------------------------------------
      // 4. Blank only the free-text PII on retained purchase records.
      //    Amounts, statuses, proof URLs and timestamps stay intact.
      // -------------------------------------------------------------
      const purchasePii = {
        buyer_full_name: ANON_TEXT,
        buyer_email: ANON_TEXT,
        transfer_surname: ANON_TEXT,
        seller_finality_ip: ANON_TEXT,
      };
      await adminClient.from("purchases").update(purchasePii).eq("buyer_id", profileId);
      await adminClient.from("purchases").update(purchasePii).eq("seller_id", profileId);

      // -------------------------------------------------------------
      // 5. Delete the ID document image only. Transfer proofs are
      //    transaction evidence and are deliberately retained.
      // -------------------------------------------------------------
      const { data: idFiles } = await adminClient.storage.from("id-documents").list(user.id);
      if (idFiles?.length) {
        await adminClient.storage
          .from("id-documents")
          .remove(idFiles.map((f) => `${user.id}/${f.name}`));
      }
      if (profile?.id_document_url) {
        await adminClient.storage.from("id-documents").remove([profile.id_document_url]);
      }

      // -------------------------------------------------------------
      // 6. Tombstone the profile. Extracted identity fields
      //    (name, DOB, document type, issuing country, verification
      //    status) are intentionally preserved for the retention period.
      // -------------------------------------------------------------
      await adminClient
        .from("profiles")
        .update({
          anonymized_at: new Date().toISOString(),
          email: `deleted+${profileId}@anonymized.invalid`,
          full_name: ANON_TEXT,
          phone: null,
          address_line1: null,
          address_line2: null,
          city: null,
          postal_code: null,
          avatar_url: null,
          id_document_url: null,
        })
        .eq("id", profileId);
    }

    // Remove login credentials. The profile row survives (FK is SET NULL).
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return json({ success: true });
  } catch (error) {
    console.error("delete-account error", error);
    return json({ error: "An unexpected error occurred" }, 400);
  }
});
