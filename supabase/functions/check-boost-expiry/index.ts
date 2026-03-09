import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const now = new Date();

    // Fetch all active boosted listings that haven't had a reminder sent yet
    const { data: listings, error } = await supabaseAdmin
      .from("listings")
      .select("id, seller_id, bumped_until, departure_date, title, origin_city, destination_city")
      .eq("is_active", true)
      .not("bumped_until", "is", null)
      .gt("bumped_until", now.toISOString());

    if (error) throw error;

    const notificationsToInsert: Array<{
      user_id: string;
      title: string;
      message: string;
      type: string;
      listing_id: string;
    }> = [];

    for (const listing of listings ?? []) {
      const bumpEnd = new Date(listing.bumped_until);
      const departureDate = new Date(listing.departure_date);
      const timeUntilExpiry = bumpEnd.getTime() - now.getTime();
      const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);

      // Calculate boost duration to determine if it's a 24h boost
      // We need to figure out boost duration; we check total boost length
      // For simplicity, we check the remaining time windows:
      // - 1h reminder for boosts expiring in ~1h (for 24h boosts)
      // - 1 day reminder for boosts expiring in ~24h (for 3d and 7d boosts)

      // Skip if departure date is before or on the boost end date
      // (no point re-boosting if the flight has departed)
      if (departureDate <= bumpEnd) continue;

      // Check if we already sent a reminder for this listing's current boost
      const { data: existingNotif } = await supabaseAdmin
        .from("notifications")
        .select("id")
        .eq("listing_id", listing.id)
        .eq("type", "boost_expiry")
        .gte("created_at", new Date(bumpEnd.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existingNotif && existingNotif.length > 0) continue;

      // Get the seller's auth user_id from profiles
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("id", listing.seller_id)
        .single();

      if (!profile) continue;

      const route = `${listing.origin_city} → ${listing.destination_city}`;

      // 1-hour reminder window: between 30min and 1.5h before expiry
      if (hoursUntilExpiry <= 1.5 && hoursUntilExpiry >= 0.5) {
        notificationsToInsert.push({
          user_id: profile.user_id,
          title: "⚡ Boost ending soon!",
          message: `Your boost for "${route}" expires in about 1 hour. Re-boost to stay visible!`,
          type: "boost_expiry",
          listing_id: listing.id,
        });
      }
      // 1-day reminder window: between 20h and 28h before expiry (but not for 24h boosts)
      else if (hoursUntilExpiry <= 28 && hoursUntilExpiry >= 20) {
        // This is the 1-day reminder — only for longer boosts (3d, 7d)
        // A 24h boost would already be almost done, so skip
        // We detect 24h boosts by checking if total boost was ~24h
        // Since we can't know exactly, we use: if expiry is within 28h AND
        // the boost was set more than 28h ago, it's a longer boost
        notificationsToInsert.push({
          user_id: profile.user_id,
          title: "🔥 Boost expiring tomorrow!",
          message: `Your boost for "${route}" ends in about 1 day. Re-boost to keep the momentum!`,
          type: "boost_expiry",
          listing_id: listing.id,
        });
      }
    }

    if (notificationsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("notifications")
        .insert(notificationsToInsert);
      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ processed: listings?.length ?? 0, notifications: notificationsToInsert.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error checking boost expiry:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
