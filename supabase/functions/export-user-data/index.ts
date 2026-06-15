import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify requesting user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get profile
    const { data: profile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Get all user data
    const profileId = profile?.id;
    
    // Columns safe to share with a seller about their sales (NO buyer PII).
    // Mirrors get_seller_purchases() / the seller view used elsewhere in the app.
    const SELLER_PURCHASE_COLUMNS = [
      "id","listing_id","seller_id","buyer_id","quantity","total_price",
      "status","escrow_status","escrow_deadline","transfer_deadline",
      "seller_transferred","buyer_confirmed","name_change_fee",
      "transfer_booking_ref","transfer_surname","transfer_confirmed_at",
      "seller_reminder_sent","seller_deadline_warning_sent","seller_late_warning_sent",
      "created_at",
    ].join(",");

    const [listings, buyerPurchases, sellerPurchases, favorites, searchHistory, cartItems, consent, notifications] = await Promise.all([
      profileId ? adminClient.from("listings").select("*").eq("seller_id", profileId) : { data: [] },
      // Buyer side: user owns this PII, full export is fine.
      profileId ? adminClient.from("purchases").select("*").eq("buyer_id", profileId) : { data: [] },
      // Seller side: strip buyer PII (buyer_email, buyer_full_name, stripe_payment_id,
      // transfer_payment_proof_url, name_change_proof_url, etc.).
      profileId ? adminClient.from("purchases").select(SELLER_PURCHASE_COLUMNS).eq("seller_id", profileId) : { data: [] },
      profileId ? adminClient.from("favorites").select("*").eq("user_id", profileId) : { data: [] },
      profileId ? adminClient.from("search_history").select("*").eq("user_id", profileId) : { data: [] },
      profileId ? adminClient.from("cart_items").select("*").eq("user_id", profileId) : { data: [] },
      adminClient.from("data_consent").select("*").eq("user_id", user.id),
      adminClient.from("notifications").select("*").eq("user_id", user.id),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      account: {
        email: user.email,
        created_at: user.created_at,
      },
      profile: profile || null,
      data_consent: consent.data || [],
      listings: listings.data || [],
      purchases_as_buyer: buyerPurchases.data || [],
      purchases_as_seller: sellerPurchases.data || [],
      favorites: favorites.data || [],
      search_history: searchHistory.data || [],
      cart_items: cartItems.data || [],
      notifications: notifications.data || [],
    };

    return new Response(JSON.stringify(exportData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("export-user-data error", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
