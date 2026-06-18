import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Mail, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
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
        setError(t("unsubCouldNotComplete"));
        setState("error");
      }
    } catch (e: any) {
      setError(e?.message || t("unsubSomethingWrong"));
      setState("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Brand bar — mirrors PDF/email gold accent */}
      <div className="h-1 w-full bg-primary" />
      <header className="border-b border-border/40 bg-card/40">
        <div className="max-w-md mx-auto flex items-center gap-3 px-6 py-4">
          <div className="w-1 h-7 bg-primary rounded-sm" />
          <div className="leading-tight">
            <p className="text-lg font-bold lowercase tracking-tight">swappup</p>
            <p className="text-[10px] uppercase tracking-[1.5px] text-primary/80 font-semibold">
              {t("unsubBrandLine")}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="glass-strong border border-border/60 rounded-2xl p-8 max-w-md w-full">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">{t("unsubManageTitle")}</h1>
          </div>

          {state === "loading" && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
              <Loader2 className="w-4 h-4 animate-spin" /> {t("unsubChecking")}
            </div>
          )}

          {state === "valid" && (
            <>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {t("unsubConfirmDesc")}
              </p>
              <Button variant="gold" className="w-full" onClick={confirm}>
                {t("unsubConfirmBtn")}
              </Button>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                {t("unsubFineControl")}
              </p>
            </>
          )}

          {state === "submitting" && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
              <Loader2 className="w-4 h-4 animate-spin" /> {t("unsubUpdating")}
            </div>
          )}

          {state === "done" && (
            <div className="py-2 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto text-success mb-3" />
              <p className="text-sm mb-1 font-medium">{t("unsubDoneTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("unsubDoneDesc")}</p>
            </div>
          )}

          {state === "already" && (
            <div className="py-2 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm">{t("unsubAlready")}</p>
            </div>
          )}

          {(state === "invalid" || state === "error") && (
            <div className="py-2 text-center">
              <XCircle className="w-10 h-10 mx-auto text-destructive mb-3" />
              <p className="text-sm">{error || t("unsubInvalid")}</p>
            </div>
          )}

          {/* Always-available shortcut to the in-app preference centre */}
          {isAuthenticated && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-6"
              onClick={() => navigate("/account/notifications")}
            >
              <Settings className="w-4 h-4 mr-2" />
              {t("unsubManageAll")}
            </Button>
          )}
        </div>
      </main>

      <footer className="border-t border-border/40 py-4 px-6 text-center">
        <p className="text-[11px] text-muted-foreground">
          {t("unsubNeedHelp")}{" "}
          <a href="mailto:support@swappup.com" className="text-primary hover:underline">
            support@swappup.com
          </a>
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          {t("unsubFooterNote")}
        </p>
      </footer>
    </div>
  );
}
