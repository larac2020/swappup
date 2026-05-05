import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Returns the buyer's preferred display currency (defaults to EUR).
 * Listings are stored in the seller's currency; we convert on display.
 */
export function useDisplayCurrency(): string {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["preferred-currency", user?.id],
    queryFn: async () => {
      if (!user?.id) return "EUR";
      const { data } = await supabase
        .from("profiles")
        .select("preferred_currency")
        .eq("user_id", user.id)
        .maybeSingle();
      return (data as any)?.preferred_currency || "EUR";
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
  return data || "EUR";
}