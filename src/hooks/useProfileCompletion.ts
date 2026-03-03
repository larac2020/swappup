import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SectionStatus {
  profile: boolean;
  verification: boolean;
  address: boolean;
  payment: boolean;
  preferences: boolean;
}

export function useProfileCompletion() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-completion", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const sections: SectionStatus = {
    profile: !!(profile?.full_name && profile?.phone),
    verification: profile?.verification_status === "verified",
    address: !!(profile?.address_line1 && profile?.city && profile?.postal_code && profile?.country),
    payment: false, // We can't check Stripe from here; we'll assume incomplete for now unless we track it
    preferences: !!(profile?.favorite_departure_city || (profile?.favorite_categories as string[] | null)?.length),
  };

  // Payment: check localStorage as a simple flag for now
  if (typeof window !== "undefined") {
    sections.payment = localStorage.getItem("flyswap_payment_added") === "true";
  }

  const completedCount = Object.values(sections).filter(Boolean).length;
  const totalRequired = 4; // profile, verification, address, payment (preferences is optional)
  const allRequiredComplete = sections.profile && sections.verification && sections.address && sections.payment;

  // Progress: email+password = 10%, then each of 5 steps adds 18% (to reach 100%)
  const progress = 10 + (completedCount / 5) * 90;

  return {
    sections,
    profile,
    isLoading,
    allRequiredComplete,
    progress: Math.min(Math.round(progress), 100),
    completedCount,
  };
}
