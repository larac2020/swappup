import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Minimal airline-name → IATA prefix map. We primarily rely on the flight number
// prefix (e.g. "FR1234" → FR), this is only used as a fallback when the OCR
// flight number is missing or malformed.
const AIRLINE_NAME_TO_IATA: Record<string, string> = {
  ryanair: "FR",
  easyjet: "U2",
  "british airways": "BA",
  lufthansa: "LH",
  "air france": "AF",
  klm: "KL",
  iberia: "IB",
  vueling: "VY",
  wizz: "W6",
  "wizz air": "W6",
  "turkish airlines": "TK",
  emirates: "EK",
  qatar: "QR",
  "qatar airways": "QR",
  "ita airways": "AZ",
  alitalia: "AZ",
  delta: "DL",
  united: "UA",
  "american airlines": "AA",
  "swiss international air lines": "LX",
  swiss: "LX",
  "austrian airlines": "OS",
  tap: "TP",
  "tap air portugal": "TP",
  norwegian: "DY",
  sas: "SK",
  finnair: "AY",
  aegean: "A3",
  "aer lingus": "EI",
  jet2: "LS",
};

function parseFlightNumber(raw: string | null | undefined): { iata: string; number: string } | null {
  if (!raw) return null;
  const cleaned = raw.replace(/\s+/g, "").toUpperCase();
  // Match 2-3 char prefix (letters or letter+digit, e.g. U2, A3) + 1-5 digits
  const m = cleaned.match(/^([A-Z][A-Z0-9])(\d{1,5})$/);
  if (!m) return null;
  return { iata: m[1], number: m[2] };
}

function airlineToIata(name: string | null | undefined): string | null {
  if (!name) return null;
  const k = name.trim().toLowerCase();
  return AIRLINE_NAME_TO_IATA[k] ?? null;
}

function normalize(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const AVIATIONSTACK_API_KEY = Deno.env.get("AVIATIONSTACK_API_KEY");
    if (!AVIATIONSTACK_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Flight verification is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      airline,
      flightNumber,
      departureDate,
      originCity,
      destinationCity,
      originCountry,
      destinationCountry,
    } = body ?? {};

    if (!flightNumber || !departureDate || !airline) {
      return new Response(
        JSON.stringify({
          status: "invalid_input",
          error: "Missing flight number, airline, or departure date.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Extract IATA airline code + numeric part from flight number, fallback to airline-name map
    const parsed = parseFlightNumber(flightNumber);
    const iata = parsed?.iata ?? airlineToIata(airline);
    const flightNum = parsed?.number ?? flightNumber.replace(/\D/g, "");

    if (!iata || !flightNum) {
      return new Response(
        JSON.stringify({
          status: "invalid_input",
          error: "Could not parse the flight number. Use format like 'FR1234'.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Check cache first
    const { data: cached } = await adminClient
      .from("flight_verifications")
      .select("*")
      .eq("airline_iata", iata)
      .eq("flight_number", flightNum)
      .eq("departure_date", departureDate)
      .maybeSingle();

    let verification = cached;

    if (!verification) {
      // Call Aviationstack
      const url = new URL("http://api.aviationstack.com/v1/flights");
      url.searchParams.set("access_key", AVIATIONSTACK_API_KEY);
      url.searchParams.set("flight_iata", `${iata}${flightNum}`);
      url.searchParams.set("flight_date", departureDate);

      const resp = await fetch(url.toString());
      if (!resp.ok) {
        const errText = await resp.text();
        console.error("Aviationstack error", resp.status, errText);
        return new Response(
          JSON.stringify({
            status: "provider_error",
            error: "Flight verification service is temporarily unavailable.",
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const json = await resp.json();
      const flights = Array.isArray(json?.data) ? json.data : [];
      const match = flights[0];

      if (!match) {
        // Cache the not-found result too
        const { data: insertedNF } = await adminClient
          .from("flight_verifications")
          .insert({
            airline_iata: iata,
            flight_number: flightNum,
            departure_date: departureDate,
            status: "not_found",
            raw_response: json,
          })
          .select()
          .single();
        verification = insertedNF;
      } else {
        const { data: insertedV } = await adminClient
          .from("flight_verifications")
          .insert({
            airline_iata: iata,
            flight_number: flightNum,
            departure_date: departureDate,
            status: "verified",
            verified_airline: match.airline?.name ?? null,
            verified_origin_iata: match.departure?.iata ?? null,
            verified_destination_iata: match.arrival?.iata ?? null,
            verified_origin_city: match.departure?.airport ?? null,
            verified_destination_city: match.arrival?.airport ?? null,
            raw_response: match,
          })
          .select()
          .single();
        verification = insertedV;
      }
    }

    if (!verification || verification.status === "not_found") {
      return new Response(
        JSON.stringify({
          status: "not_found",
          message:
            "We could not find this flight in the airline's published schedule. Please double-check the flight number and date.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Compare provider data with seller-supplied data
    const flags: string[] = [];
    const verifiedAirline = normalize(verification.verified_airline);
    const sellerAirline = normalize(airline);
    if (
      verifiedAirline &&
      sellerAirline &&
      !verifiedAirline.includes(sellerAirline) &&
      !sellerAirline.includes(verifiedAirline)
    ) {
      flags.push(`Airline mismatch: schedule shows "${verification.verified_airline}"`);
    }

    const verifiedOrigin = normalize(verification.verified_origin_city);
    const verifiedDest = normalize(verification.verified_destination_city);
    const sellerOrigin = normalize(originCity);
    const sellerDest = normalize(destinationCity);

    if (sellerOrigin && verifiedOrigin && !verifiedOrigin.includes(sellerOrigin)) {
      flags.push(
        `Origin mismatch: schedule shows "${verification.verified_origin_city}" (${verification.verified_origin_iata})`,
      );
    }
    if (sellerDest && verifiedDest && !verifiedDest.includes(sellerDest)) {
      flags.push(
        `Destination mismatch: schedule shows "${verification.verified_destination_city}" (${verification.verified_destination_iata})`,
      );
    }

    const finalStatus = flags.length === 0 ? "verified" : "mismatch";

    return new Response(
      JSON.stringify({
        status: finalStatus,
        flags,
        verified: {
          airline: verification.verified_airline,
          originIata: verification.verified_origin_iata,
          destinationIata: verification.verified_destination_iata,
          originAirport: verification.verified_origin_city,
          destinationAirport: verification.verified_destination_city,
        },
        cached: !!cached,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("verify-flight error", err);
    return new Response(
      JSON.stringify({ status: "error", error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});