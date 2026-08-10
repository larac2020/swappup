import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Locale, TranslationKey, t as translate } from "./translations";
import { supabase } from "@/integrations/supabase/client";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem("flyswap_language");
    return (saved === "it" ? "it" : "en") as Locale;
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("flyswap_language", newLocale);
    // Best-effort: persist to the user's profile when signed in
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data.user) return;
        await supabase
          .from("profiles")
          .update({ preferred_language: newLocale })
          .eq("user_id", data.user.id);
      } catch {
        // ignore
      }
    })();
  }, []);

  // One-time sync for users who chose a language before this was persisted
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (cancelled || !data.user) return;
        const saved = localStorage.getItem("flyswap_language");
        const local: Locale = saved === "it" ? "it" : "en";
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_language")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (cancelled || !profile) return;
        if (profile.preferred_language !== local) {
          await supabase
            .from("profiles")
            .update({ preferred_language: local })
            .eq("user_id", data.user.id);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      return translate(locale, key, params);
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
