import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

function getDeviceFingerprint(): string {
  try {
    const key = "swappup_device_fp";
    let fp = localStorage.getItem(key);
    if (!fp) {
      fp = `${crypto.randomUUID()}-${navigator.platform || ""}-${navigator.language || ""}-${screen.width}x${screen.height}`;
      localStorage.setItem(key, fp);
    }
    return fp;
  } catch {
    return "";
  }
}

function logSession() {
  try {
    supabase.functions.invoke("log-session", {
      body: { device_fp: getDeviceFingerprint() },
    });
  } catch {
    // best-effort
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (event === "SIGNED_IN" && session?.user) {
          // defer to avoid blocking auth callbacks
          setTimeout(() => logSession(), 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        setTimeout(() => logSession(), 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
}
