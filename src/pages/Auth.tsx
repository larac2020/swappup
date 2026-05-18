import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useAuth();
  const [routing, setRouting] = useState(false);

  useEffect(() => {
    if (loading || !isAuthenticated || !user) return;
    let cancelled = false;
    setRouting(true);
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, address_line1")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const onboardingDone = localStorage.getItem("flyswap_onboarding_complete");
      const profileLooksSetUp = !!(profile?.full_name && profile?.address_line1);
      if (onboardingDone && profileLooksSetUp) {
        navigate("/home");
      } else {
        navigate("/onboarding");
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, loading, user, navigate]);

  if (loading || routing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <AuthForm />;
}
