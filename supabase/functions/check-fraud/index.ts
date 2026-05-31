import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { requireServiceRole } from "../_shared/require-service-role.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const unauthorized = await requireServiceRole(req);
  if (unauthorized) return unauthorized;

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
    // 5. Repeated cancellations (buyer- or seller-initiated)
    // 6. Repeated disputes (seller_reports against them + name_change_fee_disputes filed)
    // 7. Airline concentration (most active listings on a single airline)
    // 8. IP/device reuse across multiple users (shared fingerprint)
    // 9. Unusually cheap listings vs route median
    // 10. Post-transfer reuse — seller listed/sold the same flight+date+booking ref after a completed transfer

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
      const { data: activeListingRows, count: activeListings } = await supabaseAdmin
        .from("listings")
        .select("airline, price, origin_city, destination_city", { count: "exact" })
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

      // 8. Repeated cancellations — purchases involving this user (as buyer or seller) that were cancelled
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const [{ count: cancelledAsSeller }, { count: cancelledAsBuyer }] = await Promise.all([
        supabaseAdmin
          .from("purchases")
          .select("*", { count: "exact", head: true })
          .eq("seller_id", profile.id)
          .eq("status", "cancelled")
          .gte("created_at", ninetyDaysAgo),
        supabaseAdmin
          .from("purchases")
          .select("*", { count: "exact", head: true })
          .eq("buyer_id", profile.id)
          .eq("status", "cancelled")
          .gte("created_at", ninetyDaysAgo),
      ]);
      const totalCancellations = (cancelledAsSeller ?? 0) + (cancelledAsBuyer ?? 0);
      if (totalCancellations >= 5) {
        score += 35;
        flags.push("repeated_cancellations_severe");
      } else if (totalCancellations >= 2) {
        score += 20;
        flags.push("repeated_cancellations");
      }

      // 9. Repeated disputes — reports filed against this seller + name-change-fee disputes they filed
      const [{ count: reportsAgainst }, { count: feeDisputes }] = await Promise.all([
        supabaseAdmin
          .from("seller_reports")
          .select("*", { count: "exact", head: true })
          .eq("seller_id", profile.id)
          .gte("created_at", ninetyDaysAgo),
        supabaseAdmin
          .from("name_change_fee_disputes")
          .select("*", { count: "exact", head: true })
          .eq("seller_id", profile.id)
          .gte("created_at", ninetyDaysAgo),
      ]);
      const totalDisputes = (reportsAgainst ?? 0) + (feeDisputes ?? 0);
      if (totalDisputes >= 3) {
        score += 30;
        flags.push("repeated_disputes_severe");
      } else if (totalDisputes >= 1) {
        score += 15;
        flags.push("repeated_disputes");
      }

      // 10. Airline concentration — >=70% of active listings on a single airline (with >=4 listings)
      if ((activeListings ?? 0) >= 4 && activeListingRows) {
        const byAirline = new Map<string, number>();
        for (const row of activeListingRows) {
          const a = (row.airline ?? "").trim().toLowerCase();
          if (!a) continue;
          byAirline.set(a, (byAirline.get(a) ?? 0) + 1);
        }
        let topShare = 0;
        for (const c of byAirline.values()) {
          const share = c / (activeListings ?? 1);
          if (share > topShare) topShare = share;
        }
        if (topShare >= 0.9) {
          score += 20;
          flags.push("airline_concentration_severe");
        } else if (topShare >= 0.7) {
          score += 10;
          flags.push("airline_concentration");
        }
      }

      // 11. IP/device reuse — same ip_hash or device_hash seen on >=2 distinct users
      const { data: sessions } = await supabaseAdmin
        .from("user_sessions")
        .select("ip_hash, device_hash")
        .eq("user_id", profile.user_id);

      const ipHashes = Array.from(
        new Set((sessions ?? []).map((s) => s.ip_hash).filter((h) => h && h.length > 0))
      );
      const deviceHashes = Array.from(
        new Set((sessions ?? []).map((s) => s.device_hash).filter((h) => h && h.length > 0))
      );

      let sharedIp = false;
      let sharedDevice = false;
      if (ipHashes.length > 0) {
        const { data: sharedIpRows } = await supabaseAdmin
          .from("user_sessions")
          .select("user_id")
          .in("ip_hash", ipHashes)
          .neq("user_id", profile.user_id)
          .limit(1);
        sharedIp = (sharedIpRows?.length ?? 0) > 0;
      }
      if (deviceHashes.length > 0) {
        const { data: sharedDeviceRows } = await supabaseAdmin
          .from("user_sessions")
          .select("user_id")
          .in("device_hash", deviceHashes)
          .neq("user_id", profile.user_id)
          .limit(1);
        sharedDevice = (sharedDeviceRows?.length ?? 0) > 0;
      }
      if (sharedDevice) {
        score += 30;
        flags.push("shared_device_fingerprint");
      } else if (sharedIp) {
        score += 10;
        flags.push("shared_ip");
      }

      // 12. Unusually cheap listings — listing price < 40% of route median (>=3 comparable listings)
      if (activeListingRows && activeListingRows.length > 0) {
        let cheapCount = 0;
        for (const row of activeListingRows) {
          if (!row.origin_city || !row.destination_city || !row.price) continue;
          const { data: peers } = await supabaseAdmin
            .from("listings")
            .select("price")
            .eq("origin_city", row.origin_city)
            .eq("destination_city", row.destination_city)
            .eq("is_active", true)
            .neq("seller_id", profile.id);
          const prices = (peers ?? [])
            .map((p) => Number(p.price))
            .filter((n) => Number.isFinite(n) && n > 0)
            .sort((a, b) => a - b);
          if (prices.length < 3) continue;
          const median = prices[Math.floor(prices.length / 2)];
          if (Number(row.price) < median * 0.4) cheapCount++;
        }
        if (cheapCount >= 3) {
          score += 25;
          flags.push("unusually_cheap_listings_severe");
        } else if (cheapCount >= 1) {
          score += 15;
          flags.push("unusually_cheap_listings");
        }
      }

      // 13. Post-transfer reuse — same flight + departure_date + original booking ref re-listed or re-sold
      //     by this seller AFTER a completed transfer. Strong signal the seller reverted the name change.
      const { data: completedTransfers } = await supabaseAdmin
        .from("purchases")
        .select("listing_id, original_booking_ref, transfer_confirmed_at, listings:listing_id(flight_number, departure_date)")
        .eq("seller_id", profile.id)
        .eq("status", "transfer_confirmed")
        .not("transfer_confirmed_at", "is", null);

      let postTransferReuse = 0;
      for (const t of completedTransfers ?? []) {
        const flightNo = (t as any).listings?.flight_number;
        const depDate = (t as any).listings?.departure_date;
        const bookingRef = (t as any).original_booking_ref;
        if (!flightNo || !depDate) continue;

        // Any *other* listing by this seller for the same flight+date created after the transfer was confirmed?
        const { count: dupListings } = await supabaseAdmin
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("seller_id", profile.id)
          .eq("flight_number", flightNo)
          .eq("departure_date", depDate)
          .neq("id", (t as any).listing_id)
          .gte("created_at", (t as any).transfer_confirmed_at);

        // Any *other* purchase by this seller with the same original booking ref after the transfer?
        let dupPurchases = 0;
        if (bookingRef) {
          const { count } = await supabaseAdmin
            .from("purchases")
            .select("*", { count: "exact", head: true })
            .eq("seller_id", profile.id)
            .eq("original_booking_ref", bookingRef)
            .neq("listing_id", (t as any).listing_id);
          dupPurchases = count ?? 0;
        }

        if ((dupListings ?? 0) > 0 || dupPurchases > 0) postTransferReuse++;
      }
      if (postTransferReuse > 0) {
        score += 80; // Severe — likely seller reverted name change to re-sell the same ticket
        flags.push("post_transfer_ticket_reuse");
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
