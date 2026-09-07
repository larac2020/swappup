import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isRecoveryActive, subscribeRecovery } from "@/lib/recoveryFlow";

/**
 * Renders a redirect to /reset-password whenever a password-recovery session is
 * in progress, so no other route (Landing, ProtectedRoute, PublicRoute) can see
 * the recovery session as a normal login.
 */
export function RecoveryGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [recovering, setRecovering] = useState(isRecoveryActive());

  useEffect(() => subscribeRecovery(() => setRecovering(isRecoveryActive())), []);

  if (recovering && location.pathname !== "/reset-password") {
    return <Navigate to={`/reset-password${location.search}${location.hash}`} replace />;
  }

  return <>{children}</>;
}

export default RecoveryGate;
