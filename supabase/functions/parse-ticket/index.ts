import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/require-user.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;

    const { image, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a travel ticket parser. The ticket may be a FLIGHT (airline boarding pass / flight booking) or a TRAIN (rail booking from Trenitalia, Italo, SNCF, Deutsche Bahn, Renfe, Eurostar — which absorbed Thalys in 2023 — ÖBB, NS, SBB, PKP Intercity, etc.). Extract the available information from the PDF booking confirmation and return it as a JSON object using the tool provided.

Important rules:
- Set ticketKind to "flight" or "train" depending on what you see.
- For country names, use full names like "United Kingdom", "United States", "United Arab Emirates".
- For dates, use ISO format: YYYY-MM-DD.
- For times use HH:MM (24h).
- For FLIGHTS: extract airline, flightNumber, origin/destination cities + countries, dates, times, price, ticketCount, and travelClass (cabin class).
- For FLIGHTS also extract, per journey direction, the list of airlines operating each leg (outboundLegAirlines / inboundLegAirlines) and the number of stopovers (outboundStopovers / inboundStopovers). Only populate the leg-airline arrays when the carrier of every leg is clearly printed; if any leg's carrier is unclear, omit the array entirely rather than guessing.
- For TRAINS: extract operator (NOT airline), trainNumber, origin/destination station names AND cities + countries, departure + arrival times for every leg, trainType, travelClass, fareClass, price and number of passengers. Do NOT populate the "airline" field for trains.

TRAIN OPERATOR VOCABULARY (use these exact operator names):
- Trenitalia (Italy): trainTypes Frecciarossa, Frecciargento, Frecciabianca, Intercity, Intercity Notte, Regionale Veloce, Regionale, Eurocity. Service levels: Standard, Premium, Business, Executive, Salottino. Flexibility tiers: Base, Economy, Super Economy.
- Italo (Italy): trainTypes Italo AGV, Italo EVO. Fare classes: Smart, Comfort, Prima, Club Executive.
- SNCF (France): trainTypes TGV INOUI, TGV Ouigo, Intercités, TER. Fare classes: TGV INOUI Loisir/Pro, Intercités, TER, Ouigo.
- Deutsche Bahn (Germany): trainTypes ICE, IC, EC, RE, RB. Fare classes: Flexpreis, Sparpreis, Super Sparpreis.
- Renfe (Spain): trainTypes AVE, AVLO, Avant, Alvia, Euromed, Intercity. Fare classes: Prémium, Elige, Básico, AVLO.
- Eurostar (UK / cross-border, includes former Thalys): trainTypes Eurostar e320, Eurostar e300. Fare classes: Standard, Plus, Premier.
- ÖBB (Austria): trainTypes Railjet, Nightjet, ICE, EC, IC, REX. Fare classes: Standard, Sparschiene.
- NS (Netherlands): trainTypes Intercity Direct, Intercity, Sprinter. Fare class: Standard day ticket.
- SBB (Switzerland): trainTypes IC, IR, RE, S, EC. Fare classes: Standard, Saver / Supersaver.
- PKP Intercity (Poland): trainTypes EIP, EIC, IC, TLK. Fare classes: Flexi, Promo.

If you see "Thalys", set operator to "Eurostar" (the brand merged in 2023).

TRAIN TYPE & TRAVEL CLASS:
- trainType MUST be one of the operator's listed product names if visible (e.g. "Frecciarossa", "ICE", "TGV INOUI"). Omit if you cannot tell.
- travelClass for TRAINS MUST be exactly one of: "first", "second", "business", "executive", "premium", "standard". Map "1ª classe", "1st class", "Première", "Erste Klasse" → "first"; "2ª classe", "2nd class", "Seconde" → "second". For Trenitalia/Italo service levels, also map "Salottino"/"Executive"/"Club Executive" → "executive", "Business" → "business", "Premium"/"Prima" → "premium", "Standard"/"Smart"/"Comfort" → "standard".
- travelClass for FLIGHTS MUST be exactly one of: "economy", "premium_economy", "business", "first". Map "Economy"/"Coach"/"Main Cabin"/"Y" → "economy"; "Premium Economy"/"Premium Select"/"W" → "premium_economy"; "Business"/"Club"/"J"/"C" → "business"; "First"/"La Première"/"Suites"/"F" → "first".

DATE EXTRACTION (CRITICAL — do NOT confuse with administrative dates):
- "departureDate" MUST be the date the passenger physically TRAVELS / DEPARTS on the OUTBOUND leg (origin → destination).
- "returnDate" MUST be the date the passenger TRAVELS BACK on the INBOUND leg (destination → origin), only if a return leg exists. Otherwise omit it.
- NEVER use any of these as departureDate or returnDate (they are administrative, not travel dates):
  - Booking date / Purchase date / Order date / Issue date / Issued on / "Data di acquisto" / "Data prenotazione" / "Data emissione"
  - Payment date / Transaction date / Confirmation date
  - Check-in opening date, ticket print date, document validity date
  - Passenger date of birth, document expiry
- If the only date you can confidently identify is a booking/purchase/issue date, OMIT departureDate rather than guessing.
- Look for travel-date labels such as: "Departure", "Departing", "Outbound", "Travel date", "Flight date", "Date of travel", "Andata", "Partenza", "Data di viaggio"; for return: "Return", "Returning", "Inbound", "Ritorno".
- Dates printed as DD/MM/YYYY or DD-MM-YYYY (common in EU tickets) MUST be converted to YYYY-MM-DD without swapping day and month.
- If the ticket shows a year only as 2 digits, assume 20xx.
- Sanity check before returning: the travel date must be in the FUTURE (today or later). If a candidate "departure" date is clearly in the past, you almost certainly picked a booking/issue date — re-scan the document and find the actual travel date instead, or omit it.

TIME EXTRACTION:
- "outboundDepartureTime" = HH:MM (24h) the passenger leaves the origin on the OUTBOUND leg.
- "outboundArrivalTime" = HH:MM the passenger arrives at the destination on the OUTBOUND leg, if visible.
- "inboundDepartureTime" / "inboundArrivalTime" = same but for the RETURN leg, only if a return exists.
- Convert 12h times (e.g. "7:25 PM") to 24h ("19:25"). Strip seconds and timezone suffixes.
- For TRAINS, also fill "departureTime" with the same value as "outboundDepartureTime" for backward compatibility, but ALWAYS populate the leg-specific fields when visible.

PRICE EXTRACTION (CRITICAL — used to cap the seller's resale price):
- Return the TOTAL amount the buyer originally paid for ALL tickets in this booking, in numeric form, with no currency symbol and using a dot as decimal separator (e.g. 145.50, not "€145,50" or "145,50 EUR").
- Look for labels such as "Total", "Total paid", "Amount paid", "Order total", "Grand total", "Totale", "Importo totale", "Prezzo totale", "Total price", "Total amount", "Payment total", "Charged", "Paid". Prefer the FINAL total after taxes/fees/discounts, NOT a per-passenger fare or a sub-line item.
- If only a per-passenger fare is shown, multiply by the number of passengers to get the total.
- IGNORE refund estimates, voucher balances, frequent-flyer points, "from" prices, fare comparisons, or seat-selection add-ons shown separately from the booking total.
- Also return the detected currency (ISO 4217 code like "EUR", "GBP", "USD") in priceCurrency when visible.
- If you genuinely cannot determine a reliable total price, OMIT originalPrice rather than guessing.`;

    const systemPromptWithBookingRef = systemPrompt + `\n\nBOOKING REFERENCE / PNR EXTRACTION (CRITICAL — used to prevent the same booking being listed twice):
- "bookingReference" MUST be the unique booking identifier the airline or rail operator assigns to this reservation. Also called: PNR, Booking Reference, Booking Code, Reservation Number, Record Locator, Confirmation Code, Airline Reference, Codice di prenotazione, Codice PNR, Numero di prenotazione, Buchungsnummer, Référence de réservation.
- For airlines, this is typically a 6-character alphanumeric code (e.g. "ABC123", "XYZ7QP"). Ryanair, easyJet, BA, Lufthansa, Air France, Iberia and most carriers use this 6-char format. Some carriers use 5–7 characters.
- For trains: Trenitalia "Codice di prenotazione" (often 6 letters); Italo 6-digit "Codice di prenotazione"; SNCF "Référence de dossier" (6 chars); Deutsche Bahn "Auftragsnummer".
- Return the booking reference EXACTLY as printed (preserve case and characters), with no surrounding text.
- Do NOT return ticket numbers (long numeric e-ticket strings like 13-digit "1234567890123"), transaction IDs, payment references, customer numbers, frequent-flyer numbers, or order numbers — only the booking reference / PNR that uniquely identifies the reservation with the carrier.
- If you cannot confidently find the booking reference, OMIT the field rather than guessing.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPromptWithBookingRef },
          {
            role: "user",
            content: [
              { type: "text", text: "Parse this travel ticket booking confirmation (PDF) and extract all available information, including the TOTAL price the buyer originally paid." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_ticket_info",
              description: "Extract structured flight ticket information",
              parameters: {
                type: "object",
                properties: {
                  originCity: { type: "string", description: "Departure city name" },
                  originCountry: { type: "string", description: "Departure country full name" },
                  destinationCity: { type: "string", description: "Arrival city name" },
                  destinationCountry: { type: "string", description: "Arrival country full name" },
                  airline: { type: "string", description: "Airline name" },
                  outboundLegAirlines: {
                    type: "array",
                    items: { type: "string" },
                    description: "Marketing/operating airline name for EACH leg of the OUTBOUND journey, in order (one entry per flight segment). A direct flight has exactly one entry. Only include airlines actually printed on the ticket; omit the field entirely if leg-level carriers are not clearly readable.",
                  },
                  inboundLegAirlines: {
                    type: "array",
                    items: { type: "string" },
                    description: "Same as outboundLegAirlines but for the INBOUND/return journey. Omit if there is no return leg or the carriers are not clearly readable.",
                  },
                  outboundStopovers: { type: "number", description: "Number of stopovers/connections on the outbound journey (0 for a direct flight)." },
                  inboundStopovers: { type: "number", description: "Number of stopovers/connections on the inbound/return journey (0 for a direct flight)." },
                  flightNumber: { type: "string", description: "Flight number e.g. FR1234" },
                  departureDate: { type: "string", description: "OUTBOUND travel date (when passenger physically departs origin) in YYYY-MM-DD. Never the booking/purchase/issue date." },
                  returnDate: { type: "string", description: "INBOUND travel date (when passenger physically departs destination on the return leg) in YYYY-MM-DD. Omit if no return leg." },
                  outboundDepartureTime: { type: "string", description: "Outbound departure time HH:MM 24h" },
                  outboundArrivalTime: { type: "string", description: "Outbound arrival time HH:MM 24h" },
                  inboundDepartureTime: { type: "string", description: "Inbound (return) departure time HH:MM 24h" },
                  inboundArrivalTime: { type: "string", description: "Inbound (return) arrival time HH:MM 24h" },
                  originalPrice: { type: "number", description: "TOTAL price the buyer originally paid for the whole booking (all passengers, after taxes/fees), as a plain number with dot decimals. Used as the maximum allowed resale price." },
                  priceCurrency: { type: "string", description: "ISO 4217 currency code of the original price (e.g. EUR, GBP, USD)" },
                  ticketCount: { type: "number", description: "Number of passengers or tickets in the booking" },
                  ticketKind: { type: "string", enum: ["flight", "train"], description: "Whether this is a flight or train ticket" },
                  operator: { type: "string", description: "Train operator name (only for trains)" },
                  trainNumber: { type: "string", description: "Train number (only for trains)" },
                  trainClass: { type: "string", description: "Fare class as printed on the ticket — use one of the canonical values listed for the operator if possible (only for trains)" },
                  trainType: { type: "string", description: "Train product type (Frecciarossa, ICE, TGV INOUI, AVE, etc.) — only for trains" },
                  travelClass: { type: "string", description: "Cabin/travel class. For TRAINS use one of: first, second, business, executive, premium, standard. For FLIGHTS use one of: economy, premium_economy, business, first." },
                  originStation: { type: "string", description: "Origin station name (only for trains)" },
                  destinationStation: { type: "string", description: "Destination station name (only for trains)" },
                  departureTime: { type: "string", description: "Outbound departure time HH:MM 24h (trains; mirrors outboundDepartureTime)" },
                  bookingReference: { type: "string", description: "Carrier booking reference / PNR / record locator exactly as printed (e.g. 'ABC123'). Omit if not clearly visible. Never return a long e-ticket number or order/transaction id here." },
                },
                required: [],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_ticket_info" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    let parsed = {};
    if (toolCall?.function?.arguments) {
      try {
        parsed = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    return new Response(JSON.stringify({ parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-ticket error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
