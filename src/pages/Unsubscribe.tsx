import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: ANON_KEY } },
        );
        const data = await res.json();
        if (data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("invalid");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if ((data as any)?.success || (data as any)?.reason === "already_unsubscribed") {
        setState("done");
      } else {
        setError("Could not complete unsubscribe.");
        setState("error");
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
      setState("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="glass-strong border border-border/60 rounded-2xl p-8 max-w-md w-full text-center">
        <Mail className="w-10 h-10 mx-auto text-primary mb-3" />
        <h1 className="text-xl font-semibold mb-2">Email preferences</h1>

        {state === "loading" && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking your link…
          </div>
        )}

        {state === "valid" && (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              Confirm to stop receiving non-essential emails from Swappup. You'll still get critical
              transaction updates required to complete purchases or sales.
            </p>
            <Button variant="gold" className="w-full" onClick={confirm}>Confirm unsubscribe</Button>
          </>
        )}

        {state === "submitting" && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Updating your preferences…
          </div>
        )}

        {state === "done" && (
          <div className="py-4">
            <CheckCircle2 className="w-10 h-10 mx-auto text-success mb-2" />
            <p className="text-sm">You've been unsubscribed. We're sorry to see you go.</p>
          </div>
        )}

        {state === "already" && (
          <div className="py-4">
            <CheckCircle2 className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm">You're already unsubscribed — no further action needed.</p>
          </div>
        )}

        {(state === "invalid" || state === "error") && (
          <div className="py-4">
            <XCircle className="w-10 h-10 mx-auto text-destructive mb-2" />
            <p className="text-sm">{error || "This unsubscribe link is invalid or has expired."}</p>
          </div>
        )}
      </div>
    </div>
  );
}