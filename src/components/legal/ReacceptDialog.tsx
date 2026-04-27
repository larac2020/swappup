import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { TERMS_VERSION, PRIVACY_VERSION } from "@/content/legal/version";
import { ExternalLink } from "lucide-react";

export default function ReacceptDialog() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [needsReaccept, setNeedsReaccept] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("terms_accepted_version, privacy_accepted_version")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled || error || !data) return;

      const termsStale = (data.terms_accepted_version ?? "") !== TERMS_VERSION;
      const privacyStale = (data.privacy_accepted_version ?? "") !== PRIVACY_VERSION;
      if (termsStale || privacyStale) setNeedsReaccept(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  const handleAccept = async () => {
    if (!user) return;
    setSaving(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({
        terms_accepted_version: TERMS_VERSION,
        terms_accepted_at: now,
        privacy_accepted_version: PRIVACY_VERSION,
        privacy_accepted_at: now,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }
    setNeedsReaccept(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setNeedsReaccept(false);
  };

  return (
    <Dialog open={needsReaccept} onOpenChange={() => { /* not dismissable */ }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t("legalReacceptTitle")}</DialogTitle>
          <DialogDescription>{t("legalReacceptDesc")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 text-sm">
          <Link to="/terms" target="_blank" className="inline-flex items-center gap-1.5 text-primary hover:underline">
            {t("legalReviewTerms")} <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Link to="/privacy" target="_blank" className="inline-flex items-center gap-1.5 text-primary hover:underline">
            {t("legalReviewPrivacy")} <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <Checkbox checked={accepted} onCheckedChange={(c) => setAccepted(c === true)} className="mt-0.5" />
          <span className="text-muted-foreground">{t("legalAcceptCheckbox")}</span>
        </label>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={handleSignOut} disabled={saving}>
            {t("legalSignOut")}
          </Button>
          <Button variant="gold" className="flex-1" onClick={handleAccept} disabled={!accepted || saving}>
            {saving ? t("loading") : t("legalAcceptAndContinue")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}