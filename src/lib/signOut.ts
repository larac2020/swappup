import { supabase } from "@/integrations/supabase/client";

// Local-only, device-scoped flags that must not leak to the next person
// signing in on a shared device. Language stays: it's a UI preference.
const LOCAL_FLAGS = [
  "flyswap_onboarding_complete",
  "flyswap_payment_added",
  "swappup_device_fp",
  "swappup_tour_complete",
];

function clearLocalState() {
  try {
    for (const key of LOCAL_FLAGS) localStorage.removeItem(key);
    // Remove any leftover Supabase auth session keys (current or legacy).
    const stale: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (/^sb-.*-auth-token/.test(k) || k.startsWith("supabase.auth.")) stale.push(k);
    }
    for (const k of stale) localStorage.removeItem(k);
  } catch {
    // ignore storage errors (private mode, etc.)
  }
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && (/^sb-.*-auth-token/.test(k) || k.startsWith("supabase.auth."))) {
        sessionStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Sign out without depending on a server round-trip succeeding.
 * scope: "local" revokes only the local session; if it still errors
 * (rate limit, offline), we clear the stored session ourselves.
 */
export async function signOutEverywhereLocal(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // fall through to manual cleanup
  }
  clearLocalState();
}
