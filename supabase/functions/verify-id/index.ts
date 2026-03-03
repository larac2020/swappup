import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an ID document verification assistant. Analyze uploaded images and determine:
1. Is this a valid identity document (passport, national ID card, or driving license)?
2. Does it appear to be a genuine document (not a screenshot of a screen, not a photocopy of poor quality, not a drawing)?
3. Can you identify the document type?

You must respond ONLY with a JSON object using this exact tool call format.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this image and determine if it is a valid, genuine identity document (passport, national ID card, or driving license). Check if it has typical security features visible, proper formatting, and appears to be a real document rather than a fake or screenshot."
              },
              {
                type: "image_url",
                image_url: { url: image }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "verify_document",
              description: "Return the verification result for the uploaded ID document.",
              parameters: {
                type: "object",
                properties: {
                  is_valid_id: {
                    type: "boolean",
                    description: "Whether the image shows a valid identity document (passport, national ID, or driving license)"
                  },
                  appears_genuine: {
                    type: "boolean",
                    description: "Whether the document appears to be genuine (not a fake, screenshot, or poor photocopy)"
                  },
                  document_type: {
                    type: "string",
                    enum: ["passport", "national_id", "driving_license", "unknown"],
                    description: "The type of document detected"
                  },
                  confidence: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Confidence level in the assessment"
                  },
                  reason: {
                    type: "string",
                    description: "Brief explanation of the assessment"
                  }
                },
                required: ["is_valid_id", "appears_genuine", "document_type", "confidence", "reason"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "verify_document" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI verification service error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No verification result returned");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ verification: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-id error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
