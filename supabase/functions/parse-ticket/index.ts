import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a travel ticket parser. The ticket may be a FLIGHT (airline boarding pass / flight booking) or a TRAIN (rail booking from Trenitalia, Italo, SNCF, Deutsche Bahn, Renfe, Eurostar, ÖBB, NS, SBB, Thalys, PKP Intercity, etc.). Extract the available information from the PDF booking confirmation and return it as a JSON object using the tool provided.

Important rules:
- Set ticketKind to "flight" or "train" depending on what you see.
- For country names, use full names like "United Kingdom", "United States", "United Arab Emirates".
- For dates, use ISO format: YYYY-MM-DD.
- For times use HH:MM (24h).
- For FLIGHTS: extract airline, flightNumber, origin/destination cities + countries, dates, price, ticketCount.
- For TRAINS: extract operator, trainNumber, origin/destination station names AND cities + countries, departure date + time, fare class if visible (Base, Executive, Smart, Comfort, Prima, Club, TGV INOUI, Ouigo, Flexpreis, Sparpreis, Flexible, Promo, Standard Premier, Business Premier, Standard, Flex, Sparschiene, Saver, Supersaver, Premium, Flexi), price and number of passengers.

PRICE EXTRACTION (CRITICAL — used to cap the seller's resale price):
- Return the TOTAL amount the buyer originally paid for ALL tickets in this booking, in numeric form, with no currency symbol and using a dot as decimal separator (e.g. 145.50, not "€145,50" or "145,50 EUR").
- Look for labels such as "Total", "Total paid", "Amount paid", "Order total", "Grand total", "Totale", "Importo totale", "Prezzo totale", "Total price", "Total amount", "Payment total", "Charged", "Paid". Prefer the FINAL total after taxes/fees/discounts, NOT a per-passenger fare or a sub-line item.
- If only a per-passenger fare is shown, multiply by the number of passengers to get the total.
- IGNORE refund estimates, voucher balances, frequent-flyer points, "from" prices, fare comparisons, or seat-selection add-ons shown separately from the booking total.
- Also return the detected currency (ISO 4217 code like "EUR", "GBP", "USD") in priceCurrency when visible.
- If you genuinely cannot determine a reliable total price, OMIT originalPrice rather than guessing.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Parse this flight ticket and extract all available information." },
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
                  flightNumber: { type: "string", description: "Flight number e.g. FR1234" },
                  departureDate: { type: "string", description: "Departure date in YYYY-MM-DD format" },
                  returnDate: { type: "string", description: "Return date in YYYY-MM-DD format if applicable" },
                  originalPrice: { type: "number", description: "Ticket price as a number" },
                  priceCurrency: { type: "string", description: "ISO 4217 currency code of the original price (e.g. EUR, GBP, USD)" },
                  ticketCount: { type: "number", description: "Number of passengers or tickets in the booking" },
                  ticketKind: { type: "string", enum: ["flight", "train"], description: "Whether this is a flight or train ticket" },
                  operator: { type: "string", description: "Train operator name (only for trains)" },
                  trainNumber: { type: "string", description: "Train number (only for trains)" },
                  trainClass: { type: "string", description: "Fare class label as printed on the ticket (only for trains)" },
                  originStation: { type: "string", description: "Origin station name (only for trains)" },
                  destinationStation: { type: "string", description: "Destination station name (only for trains)" },
                  departureTime: { type: "string", description: "Departure time HH:MM 24h (only for trains)" },
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
