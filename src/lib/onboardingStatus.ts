import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "flyswap_onboarding_complete";

export function isProfileOnboarded(profile: { full_name?: string | null; address_line1?: string | null } | null | undefined): boolean {
  return !!(profile?.full_name && profile?.address_line1);
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
  return { onboarded };
}