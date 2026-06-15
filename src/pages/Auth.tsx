import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AuthProps {
  initialMode?: "login" | "signup";
}

export default function Auth({ initialMode = "login" }: AuthProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
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
      // Honor ?next= (or router state.from) so post-Stripe returns land back on
      // the purchase confirmation page instead of /home.
      const params = new URLSearchParams(location.search);
      const rawNext = params.get("next");
      const stateFrom = (location.state as any)?.from;
      const fromPath = stateFrom
        ? `${stateFrom.pathname || ""}${stateFrom.search || ""}${stateFrom.hash || ""}`
        : null;
      const candidate = rawNext || fromPath;
      const safeNext =
        candidate && candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : null;

      if (onboardingDone && profileLooksSetUp) {
        navigate(safeNext || "/home", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, loading, user, navigate, location]);

  if (loading || routing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <AuthForm initialMode={initialMode} />;
}
