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

    const systemPrompt = `You are a flight ticket parser. Given an image of a flight ticket, boarding pass, or booking confirmation, extract the following information and return it as a JSON object using the tool provided.

Important rules:
- For country names, use full names like "United Kingdom", "United States", "United Arab Emirates"
- For dates, use ISO format: YYYY-MM-DD
- For prices, return just the number without currency symbol
- If you cannot determine a field, omit it from the response
- Look for airline name, flight number, departure/arrival cities, dates, price, and the number of passengers/tickets
- If the confirmation shows multiple passengers or tickets, return the total count in ticketCount`;

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
                  ticketCount: { type: "number", description: "Number of passengers or tickets in the booking" },
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
