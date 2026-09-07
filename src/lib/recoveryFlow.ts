import { supabase } from "@/integrations/supabase/client";

/**
 * Global password-recovery guard.
 *
 * A recovery link creates a REAL session (implicit flow, detectSessionInUrl).
 * Without this flag, whichever page the link lands on treats that session as a
 * normal login and bounces the user into the app. We detect recovery from the
 * URL (fragment or query) synchronously at module load — before the Supabase
 * client strips the hash — and from the PASSWORD_RECOVERY auth event, then
 * force routing to /reset-password until the password is actually changed.
 */

const KEY = "swappup_password_recovery";

const listeners = new Set<() => void>();
let active = false;

function readPersisted(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function detectFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const hash = window.location.hash.replace(/^#/, "");
    if (new URLSearchParams(hash).get("type") === "recovery") return true;
    return new URLSearchParams(window.location.search).get("type") === "recovery";
  } catch {
    return false;
  }
}

function notify() {
  for (const fn of listeners) fn();
}

export function beginRecovery() {
  if (active) return;
  active = true;
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // ignore storage errors (private mode, etc.)
  }
  notify();
}

export function endRecovery() {
  active = false;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  notify();
}

export function isRecoveryActive(): boolean {
  return active;
}

export function subscribeRecovery(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

if (typeof window !== "undefined") {
  if (detectFromUrl() || readPersisted()) {
    active = true;
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
  }

  supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") beginRecovery();
    if (event === "SIGNED_OUT") endRecovery();
  });
}
