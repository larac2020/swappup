import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const LS_KEY = "flyswap_onboarding_complete";

export function isProfileOnboarded(profile: { full_name?: string | null; address_line1?: string | null } | null | undefined): boolean {
  return !!(profile?.full_name && profile?.address_line1);
}

/**
 * Read the onboarding flag from the auth session synchronously.
 * NOTE: user_metadata is client-writable, so this is a *routing hint only*.
 * All real gating (listing creation, purchases, ID verification) reads
 * profile data server-side and is protected by RLS + triggers.
 */
export function readOnboardedFromUser(user: User | null | undefined): boolean {
  return !!(user?.user_metadata as { onboarded?: boolean } | undefined)?.onboarded;
}

/**
 * Persist the onboarding flag into auth metadata so future sessions can
 * route synchronously without a profiles round-trip.
 */
export async function markOnboardedInMetadata(): Promise<void> {
  try {
    await supabase.auth.updateUser({ data: { onboarded: true } });
  } catch {
    // best-effort — the DB fallback will still work on next load
  }
}

export async function fetchOnboardingStatus(userId: string): Promise<{ onboarded: boolean }> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, address_line1")
    .eq("user_id", userId)
    .maybeSingle();
  const onboarded = isProfileOnboarded(data);
  try {
    if (onboarded) {
      localStorage.setItem(LS_KEY, "true");
    }
  } catch {
    // ignore storage errors (private mode, etc.)
  }
  // One-shot backfill for legacy users: mirror the DB truth into auth metadata
  // so subsequent loads route without a query.
  if (onboarded) {
    void markOnboardedInMetadata();
  }
  return { onboarded };
}