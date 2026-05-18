import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { requireServiceRole } from "../_shared/require-service-role.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Runs every 15 minutes via pg_cron. Sends:
//  #2: ~1h after purchase if seller hasn't started transfer (seller_reminder_sent)
//  #3: when 4h or less remain until transfer_deadline (seller_deadline_warning_sent)
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const unauthorized = await requireServiceRole(req);
  if (unauthorized) return unauthorized;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const fourHoursFromNow = new Date(now + 4 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date(now).toISOString();

  let started = 0;
  let warned = 0;

  // ---- #2: reminder to start ----
  const { data: needStart } = await admin
    .from("purchases")
    .select("*")
    .eq("status", "pending_transfer")
    .eq("seller_transferred", false)
    .eq("seller_reminder_sent", false)
    .lt("created_at", oneHourAgo)
    .gt("transfer_deadline", nowIso)
    .limit(50);

  for (const p of needStart || []) {
    await sendReminderStart(admin, p);
    await admin.from("purchases").update({ seller_reminder_sent: true }).eq("id", p.id);
    started++;
  }

  // ---- #3: 4h-before-deadline warning ----
  const { data: needWarn } = await admin
    .from("purchases")
    .select("*")
    .eq("status", "pending_transfer")
    .eq("seller_transferred", false)
    .eq("seller_deadline_warning_sent", false)
    .gt("transfer_deadline", nowIso)
    .lt("transfer_deadline", fourHoursFromNow)
    .limit(50);

  for (const p of needWarn || []) {
    await sendDeadlineWarning(admin, p);
    await admin.from("purchases").update({ seller_deadline_warning_sent: true }).eq("id", p.id);
    warned++;
  }

  return new Response(JSON.stringify({ ok: true, started, warned }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

async function loadContext(admin: any, p: any) {
  const [{ data: seller }, { data: listing }] = await Promise.all([
    admin.from("profiles").select("email, full_name").eq("id", p.seller_id).single(),
    admin.from("listings")
      .select("origin_city, origin_country, destination_city, destination_country, departure_date, airline, flight_number")
      .eq("id", p.listing_id).single(),
  ]);
  const trip = listing ? {
    origin: `${listing.origin_city}${listing.origin_country ? `, ${listing.origin_country}` : ""}`,
    destination: `${listing.destination_city}${listing.destination_country ? `, ${listing.destination_country}` : ""}`,
    departureDate: listing.departure_date,
    airline: listing.airline,
    flightNumber: listing.flight_number,
  } : undefined;
  return { seller, trip };
}

async function sendReminderStart(admin: any, p: any) {
  const { seller, trip } = await loadContext(admin, p);
  if (!seller?.email) return;
  const hoursLeft = p.transfer_deadline
    ? Math.max(0, Math.round((new Date(p.transfer_deadline).getTime() - Date.now()) / 3_600_000))
    : undefined;
  await admin.functions.invoke("send-transactional-email", {
    body: {
      templateName: "seller-reminder-start",
      recipientEmail: seller.email,
      idempotencyKey: `seller-reminder-${p.id}`,
      templateData: {
        sellerName: (seller.full_name || "").split(" ")[0],
        trip,
        hoursLeft,
      },
    },
  }).catch((e: unknown) => console.error("reminder-start failed", e));
}

async function sendDeadlineWarning(admin: any, p: any) {
  const { seller, trip } = await loadContext(admin, p);
  if (!seller?.email) return;
  await admin.functions.invoke("send-transactional-email", {
    body: {
      templateName: "seller-deadline-warning",
      recipientEmail: seller.email,
      idempotencyKey: `seller-deadline-warning-${p.id}`,
      templateData: {
        sellerName: (seller.full_name || "").split(" ")[0],
        trip,
        deadline: p.transfer_deadline ? new Date(p.transfer_deadline).toUTCString() : undefined,
      },
    },
  }).catch((e: unknown) => console.error("deadline-warning failed", e));
}