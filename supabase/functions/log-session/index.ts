import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const deviceFp = typeof body?.device_fp === "string" ? body.device_fp : "";

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
      "";
    const country =
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-vercel-ip-country") ||
      null;
    const userAgent = req.headers.get("user-agent") ?? "";

    const ipHash = ip ? await sha256(`ip:${ip}`) : "";
    const deviceHash = deviceFp ? await sha256(`dev:${deviceFp}`) : "";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Try update first, then insert if no row matched
    const { data: existing } = await admin
      .from("user_sessions")
      .select("id, hit_count")
      .eq("user_id", user.id)
      .eq("ip_hash", ipHash)
      .eq("device_hash", deviceHash)
      .maybeSingle();

    if (existing?.id) {
      await admin
        .from("user_sessions")
        .update({
          hit_count: (existing.hit_count ?? 1) + 1,
          last_seen_at: new Date().toISOString(),
          country,
          user_agent: userAgent.slice(0, 500),
        })
        .eq("id", existing.id);
    } else {
      await admin.from("user_sessions").insert({
        user_id: user.id,
        ip_hash: ipHash,
        device_hash: deviceHash,
        country,
        user_agent: userAgent.slice(0, 500),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("log-session error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});