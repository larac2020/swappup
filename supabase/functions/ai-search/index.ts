import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/require-user.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;

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

    const today = new Date().toISOString().split('T')[0];

    const systemPrompt = `You are a flight search parameter extractor. Given a natural language query about flights, extract structured search parameters and return ONLY a valid JSON object (no markdown, no explanation).

Today's date is: ${today}

Return a JSON object with ONLY the fields that are relevant to the query. Available fields:
- "destinationCity": string (city name, capitalize properly e.g. "Barcelona")
- "destinationCountry": string (country name e.g. "Spain")  
- "departureDate": string (ISO date YYYY-MM-DD)
- "returnDate": string (ISO date YYYY-MM-DD)
- "minPrice": number
- "maxPrice": number
- "ticketCount": number (number of tickets/persons/passengers/people needed)
- "tags": array of strings from: "city_trip", "beach", "winter_holiday", "ski_trip", "adventure", "romantic", "family", "business"
- "airlines": array of airline names to filter by. Known airlines: Ryanair, EasyJet, Wizz Air, Vueling, Transavia, Norwegian, Eurowings, Volotea, Jet2, British Airways, Lufthansa, Air France, KLM, Iberia, TAP Portugal, Aer Lingus, Swiss, Turkish Airlines, Emirates, Qatar Airways, Etihad, Icelandair, Singapore Airlines, Cathay Pacific
- "mealIncluded": boolean (true if user wants food/meal/dining/breakfast/lunch/dinner included)
- "luggageIncluded": boolean (true if user wants luggage/baggage/suitcase/checked bag included)
- "carryOnIncluded": boolean (true if user wants carry-on/hand luggage/cabin bag included)
- "directOnly": boolean (true if user wants direct/non-stop/no layover/no stopover flights)

Rules:
- "cheap" or "budget" → maxPrice: 200
- "X person(s)", "X people", "X ticket(s)", "X passenger(s)", "for X" (where X is a number referring to people), "solo", "alone" → ticketCount: X (default 1 for solo/alone)
- IMPORTANT: When the user mentions a number of people (e.g. "1 person", "2 people", "for 3"), ALWAYS include ticketCount
- "under X" → maxPrice: X
- "beach vacation" → tags: ["beach"]
- "family trip" → tags: ["family"]  
- "ski" → tags: ["ski_trip", "winter_holiday"]
- "romantic" → tags: ["romantic"]
- "city break" or "city trip" → tags: ["city_trip"]
- "adventure" → tags: ["adventure"]
- "low cost" / "budget airline" / "cheap airline" → airlines: ["Ryanair", "EasyJet", "Wizz Air", "Vueling", "Transavia", "Norwegian", "Eurowings", "Volotea", "Jet2"]
- When user mentions a specific airline name, include it in airlines array
- For month names (e.g. "in July"), set departureDate to first day of that month and returnDate to last day
- If month is in the past for current year, use next year
- Always include tags when the query mentions a trip type
- Understand synonyms: "food"/"dining"/"breakfast"/"lunch"/"dinner" = mealIncluded, "bags"/"baggage"/"suitcase"/"checked bag" = luggageIncluded, "hand luggage"/"cabin bag" = carryOnIncluded, "non-stop"/"no layover"/"no stopover" = directOnly

Examples:
Query: "cheap beach vacation in July" → {"maxPrice": 200, "tags": ["beach"], "departureDate": "2026-07-01", "returnDate": "2026-07-31"}
Query: "family trip to Barcelona" → {"destinationCity": "Barcelona", "destinationCountry": "Spain", "tags": ["family"]}
Query: "city trip for 1 person" → {"tags": ["city_trip"], "ticketCount": 1}
Query: "low cost company" → {"airlines": ["Ryanair", "EasyJet", "Wizz Air", "Vueling", "Transavia", "Norwegian", "Eurowings", "Volotea", "Jet2"]}
Query: "with food included" → {"mealIncluded": true}
Query: "direct flight with luggage" → {"directOnly": true, "luggageIncluded": true}
Query: "romantic weekend in Rome under 300" → {"destinationCity": "Rome", "destinationCountry": "Italy", "tags": ["romantic"], "maxPrice": 300}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract search parameters from this query: "${query}"` }
        ],
        temperature: 0,
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
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("No content in AI response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Could not parse search query" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    }
    
    console.log("AI raw response:", content);
    console.log("Parsed JSON string:", jsonStr);
    
    const searchParams = JSON.parse(jsonStr);

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
