import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Verifies the request carries a real signed-in user JWT (not just the public anon key).
 * Returns the user, or a Response to short-circuit with 401.
 */
export async function requireUser(req: Request): Promise<
  { user: { id: string; email?: string }; error?: undefined } | { user?: undefined; error: Response }
> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return {
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return {
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  return { user: { id: data.user.id, email: data.user.email ?? undefined } };
}