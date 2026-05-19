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

    // Verify the requesting user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get the user's profile id
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      // Delete user data from all tables (cascade will handle some)
      await adminClient.from("cart_items").delete().eq("user_id", profile.id);
      await adminClient.from("favorites").delete().eq("user_id", profile.id);
      await adminClient.from("listing_views").delete().eq("viewer_id", profile.id);
      await adminClient.from("search_history").delete().eq("user_id", profile.id);
      await adminClient.from("notifications").delete().eq("user_id", user.id);
      await adminClient.from("data_consent").delete().eq("user_id", user.id);
      
      // Deactivate listings rather than delete (preserve transaction history integrity)
      await adminClient.from("listings").update({ is_active: false }).eq("seller_id", profile.id);
      
      // Delete profile
      await adminClient.from("profiles").delete().eq("id", profile.id);
    }

    // Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("delete-account error", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
