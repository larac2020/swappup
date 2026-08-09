import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/require-user.ts";
import {
  GENERIC_VERIFICATION_FAILURE_MESSAGE,
  isSanctionedIssuingCountry,
} from "../_shared/verification-constants.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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

    const {
      image,
      profileName,
      persist,
      id_document_url,
      acknowledge_name_mismatch,
    } = await req.json();
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

    const nameInstruction = profileName
      ? `\n4. Extract the full name from the document and compare it to the profile name: "${profileName}". The name on the ID must match the profile name (allow minor variations like middle names, accents, or abbreviation differences, but the core first and last name must match).`
      : "";

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
3. Can you identify the document type?${nameInstruction}

You must respond ONLY with a JSON object using this exact tool call format.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please analyze this image and determine if it is a valid, genuine identity document (passport, national ID card, or driving license). Check if it has typical security features visible, proper formatting, and appears to be a real document rather than a fake or screenshot.${profileName ? ` Also extract the name on the document and verify it matches the profile name: "${profileName}".` : ""}`
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
                  extracted_name: {
                    type: "string",
                    description: "The full name extracted from the document"
                  },
                  name_matches_profile: {
                    type: "boolean",
                    description: "Whether the name on the document matches the provided profile name. True if no profile name was provided."
                  },
                  first_name: {
                    type: "string",
                    description: "First name (given name) as printed on the document"
                  },
                  last_name: {
                    type: "string",
                    description: "Last name (surname) as printed on the document"
                  },
                  date_of_birth: {
                    type: "string",
                    description: "Date of birth in YYYY-MM-DD format if visible, else empty string"
                  },
                  expiry_date: {
                    type: "string",
                    description: "Document expiry date in YYYY-MM-DD format if visible, else empty string"
                  },
                  issuing_country: {
                    type: "string",
                    description: "Issuing country, prefer ISO-3166 alpha-2 code (e.g. GB, IT, US). Empty string if unknown."
                  },
                  document_number: {
                    type: "string",
                    description: "Document number as printed. Empty string if not visible."
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
                required: ["is_valid_id", "appears_genuine", "document_type", "extracted_name", "name_matches_profile", "confidence", "reason"],
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

    // Server-side expiry check + derive last4 of document number
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    let is_expired = false;
    if (typeof result.expiry_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(result.expiry_date)) {
      const exp = new Date(result.expiry_date + "T00:00:00Z");
      if (!isNaN(exp.getTime())) is_expired = exp < today;
    }
    const docNum = typeof result.document_number === "string" ? result.document_number.trim() : "";
    const document_number_last4 = docNum ? docNum.slice(-4) : "";
    // Strip full document_number from the response — we never return it to the client.
    delete result.document_number;

    const verification = { ...result, is_expired, document_number_last4 };

    // Sanctioned issuing country -> treated exactly like any other failure.
    const sanctioned = isSanctionedIssuingCountry(verification.issuing_country);

    // Internal-only logging of the true reason. Never returned to the client.
    const internalReasons: string[] = [];
    if (!verification.is_valid_id) internalReasons.push("not_valid_id");
    if (!verification.appears_genuine) internalReasons.push("not_genuine");
    if (verification.is_expired) internalReasons.push("expired");
    if (sanctioned) internalReasons.push(`sanctioned_issuing_country:${verification.issuing_country}`);
    if (verification.name_matches_profile === false) internalReasons.push("name_mismatch");
    if (internalReasons.length > 0) {
      console.log(
        "verify-id failure",
        JSON.stringify({
          user_id: auth.user.id,
          reasons: internalReasons,
          ai_reason: verification.reason,
          document_type: verification.document_type,
          issuing_country: verification.issuing_country,
          confidence: verification.confidence,
        }),
      );
    }

    if (sanctioned) {
      // Make it structurally identical to a generic document failure.
      verification.is_valid_id = false;
      verification.appears_genuine = false;
    }

    // Never leak the specific AI-produced reason to the client.
    if (!verification.is_valid_id || !verification.appears_genuine || verification.is_expired) {
      verification.reason = GENERIC_VERIFICATION_FAILURE_MESSAGE;
    }

    // Persist the verified fields server-side (service role bypasses the
    // protected-columns trigger on `profiles`). Clients are forbidden from
    // writing verification_status / id_document_* directly.
    if (persist === true) {
      if (!verification.is_valid_id || !verification.appears_genuine || verification.is_expired) {
        return new Response(
          JSON.stringify({ error: GENERIC_VERIFICATION_FAILURE_MESSAGE, verification }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (verification.name_matches_profile === false && acknowledge_name_mismatch !== true) {
        return new Response(
          JSON.stringify({ error: GENERIC_VERIFICATION_FAILURE_MESSAGE, verification }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const isoDate = (v: unknown) =>
        typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;

      const admin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const { error: updateError } = await admin
        .from("profiles")
        .update({
          id_document_url: typeof id_document_url === "string" ? id_document_url : null,
          verification_status: "verified",
          id_document_type: verification.document_type || null,
          id_document_country: verification.issuing_country || null,
          id_document_expiry: isoDate(verification.expiry_date),
          id_document_first_name: verification.first_name || null,
          id_document_last_name: verification.last_name || null,
          id_document_dob: isoDate(verification.date_of_birth),
          id_document_number_last4: verification.document_number_last4 || null,
        })
        .eq("user_id", auth.user.id);

      if (updateError) {
        console.error("verify-id persist error:", updateError);
        return new Response(
          JSON.stringify({ error: GENERIC_VERIFICATION_FAILURE_MESSAGE }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(JSON.stringify({ verification }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-id error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
