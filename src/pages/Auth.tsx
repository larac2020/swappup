import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { fetchOnboardingStatus, readOnboardedFromUser } from "@/lib/onboardingStatus";
import { BrandedLoader } from "@/components/layout/BrandedLoader";

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
      const metadataOnboarded = readOnboardedFromUser(user);
      const onboarded = metadataOnboarded
        ? true
        : (await fetchOnboardingStatus(user.id)).onboarded;
      if (cancelled) return;
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

      if (onboarded) {
        navigate(safeNext || "/home", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, loading, user, navigate, location]);

  if (loading || routing) {
    return <BrandedLoader />;
  }

  return <AuthForm initialMode={initialMode} />;
}
