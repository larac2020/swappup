import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // This function is called by a cron job to compute fraud scores for all users
    // Fraud signals:
    // 1. New account (< 7 days) with high-value listings
    // 2. Rapid listing creation (> 3 in 1 hour)
    // 3. Failed verifications
    // 4. Account age vs listing count ratio

    const { data: profiles, error: profilesErr } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, created_at, verification_status, transactions_sold, transactions_bought");

    if (profilesErr) throw profilesErr;

    for (const profile of profiles || []) {
      let score = 0;
      const flags: string[] = [];

      const accountAge = Date.now() - new Date(profile.created_at).getTime();
      const accountDays = accountAge / (1000 * 60 * 60 * 24);

      // 1. Check active listings
      const { count: activeListings } = await supabaseAdmin
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", profile.id)
        .eq("is_active", true);

      // 2. Check listings created in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: recentListings } = await supabaseAdmin
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", profile.id)
        .gte("created_at", oneHourAgo);

      // 3. New account with many listings
      if (accountDays < 7 && (activeListings ?? 0) > 3) {
        score += 30;
        flags.push("new_account_high_activity");
      }

      // 4. Rapid listing creation
      if ((recentListings ?? 0) > 3) {
        score += 25;
        flags.push("rapid_listing_creation");
      }

      // 5. Unverified with listings
      if (profile.verification_status !== "verified" && (activeListings ?? 0) > 0) {
        score += 15;
        flags.push("unverified_seller");
      }

      // 6. No transaction history but many listings
      const totalTransactions = (profile.transactions_sold ?? 0) + (profile.transactions_bought ?? 0);
      if (totalTransactions === 0 && (activeListings ?? 0) > 5) {
        score += 20;
        flags.push("no_history_many_listings");
      }

      // 7. Check for high-value listings from new accounts
      if (accountDays < 7) {
        const { data: highValueListings } = await supabaseAdmin
          .from("listings")
          .select("price")
          .eq("seller_id", profile.id)
          .eq("is_active", true)
          .gte("price", 500);

        if ((highValueListings?.length ?? 0) > 0) {
          score += 20;
          flags.push("new_account_high_value");
        }
      }

      const isFlagged = score >= 50;
      // Reduce listing limit for flagged accounts
      const listingLimit = isFlagged ? 3 : score >= 30 ? 5 : 10;

      // Upsert fraud score
      await supabaseAdmin
        .from("fraud_scores")
        .upsert(
          {
            user_id: profile.user_id,
            score,
            flags: flags,
            is_flagged: isFlagged,
            listing_limit: listingLimit,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
    }

    return new Response(
      JSON.stringify({ success: true, processed: profiles?.length ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Fraud check error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
