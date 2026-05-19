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

    const systemPrompt = `You are a travel credit/voucher verification expert. Given an image of a travel credit, airline voucher, flight credit, or travel funds document, you must:

1. Determine if this is a GENUINE travel credit/voucher document
2. Extract key details from it
3. Flag any signs of fraud or manipulation

Important rules:
- Look for official airline branding, logos, and formatting
- Check for credit/voucher codes, reference numbers, or booking references
- Identify the issuing airline
- Find the credit value and currency
- Look for expiry dates
- Check for any terms, conditions, or restrictions
- Flag if the image appears edited, low quality, or suspicious
- Return a confidence score (0-100) on authenticity`;

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
              { type: "text", text: "Verify this travel credit/voucher document. Extract details and assess authenticity." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "verify_voucher",
              description: "Verify and extract travel credit/voucher information",
              parameters: {
                type: "object",
                properties: {
                  isValid: { type: "boolean", description: "Whether this appears to be a genuine travel credit/voucher" },
                  confidenceScore: { type: "number", description: "Confidence score 0-100 on authenticity" },
                  airline: { type: "string", description: "Issuing airline name" },
                  creditType: { type: "string", enum: ["flight_credit", "airline_voucher", "travel_funds"], description: "Type of credit" },
                  creditValue: { type: "number", description: "Credit/voucher value as a number" },
                  currency: { type: "string", description: "Currency code (EUR, GBP, USD)" },
                  expiryDate: { type: "string", description: "Expiry date in YYYY-MM-DD format if visible" },
                  referenceCode: { type: "string", description: "Voucher/credit reference code if visible" },
                  restrictions: { type: "string", description: "Any restrictions or conditions noted" },
                  flags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Any red flags or concerns about authenticity"
                  },
                  notes: { type: "string", description: "Additional notes about the document" },
                },
                required: ["isValid", "confidenceScore"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "verify_voucher" } },
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
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
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

    let verification = { isValid: false, confidenceScore: 0 };
    if (toolCall?.function?.arguments) {
      try {
        verification = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    return new Response(JSON.stringify({ verification }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-voucher error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
