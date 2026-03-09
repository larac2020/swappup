import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a flight search assistant. Extract search parameters from natural language queries.

Available tags: city_trip, beach, winter_holiday, ski_trip, adventure, romantic, family, business

Extract and return a JSON object with these optional fields:
- destinationCity: string (city name)
- destinationCountry: string (country name)
- departureDate: string (ISO date YYYY-MM-DD)
- returnDate: string (ISO date YYYY-MM-DD)
- minPrice: number
- maxPrice: number
- tags: array of strings (from available tags)
- flexibility: number (0, 1, or 3 days)

Important rules:
- Only include fields that are clearly mentioned in the query
- If dates are relative (e.g., "next month", "July"), calculate the actual date from today: ${new Date().toISOString().split('T')[0]}
- If a price range is mentioned (e.g., "under 500", "cheap", "budget"), set appropriate min/max
- "Cheap" or "budget" typically means under 300
- For month names without year, assume current year if in the future, otherwise next year
- Extract relevant tags based on keywords (e.g., "beach vacation" → ["beach"], "family trip" → ["family"])`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_search_params",
              description: "Extract structured search parameters from natural language query",
              parameters: {
                type: "object",
                properties: {
                  destinationCity: { type: "string" },
                  destinationCountry: { type: "string" },
                  departureDate: { type: "string" },
                  returnDate: { type: "string" },
                  minPrice: { type: "number" },
                  maxPrice: { type: "number" },
                  tags: { 
                    type: "array",
                    items: { 
                      type: "string",
                      enum: ["city_trip", "beach", "winter_holiday", "ski_trip", "adventure", "romantic", "family", "business"]
                    }
                  },
                  flexibility: { type: "number", enum: [0, 1, 3] }
                },
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_search_params" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI search failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "Could not parse search query" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchParams = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ success: true, params: searchParams }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
