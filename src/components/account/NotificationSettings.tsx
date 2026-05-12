import { useNavigate } from "react-router-dom";
import { ChevronLeft, Bell, Mail, ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Prefs = {
  push_enabled: boolean;
  reminder_emails: boolean;
  marketing_emails: boolean;
};

const DEFAULTS: Prefs = {
  push_enabled: false,
  reminder_emails: true,
  marketing_emails: false,
};

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unsubLoading, setUnsubLoading] = useState(false);

  useEffect(() => {
    if ("Notification" in window) setPushPermission(Notification.permission);
  }, []);

  // Load prefs
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("push_enabled, reminder_emails, marketing_emails")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setPrefs(data as Prefs);
      setLoading(false);
    })();
  }, [user?.id]);

  const update = async (patch: Partial<Prefs>) => {
    if (!user?.id) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setSaving(true);
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast.error("Couldn't save your preference");
      setPrefs(prefs); // revert
    }
  };

  const togglePush = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm !== "granted") return;
    }
    update({ push_enabled: !prefs.push_enabled });
  };

  // Unsubscribe-from-everything escape hatch
  const handleFullUnsubscribe = async () => {
    if (!user?.email) return;
    if (!confirm("Stop receiving all non-essential emails from swappup? You'll still get critical purchase and security updates.")) return;
    setUnsubLoading(true);
    try {
      // Best-effort: turn off optional categories locally
      await update({ reminder_emails: false, marketing_emails: false });
      toast.success("Email preferences updated");
    } finally {
      setUnsubLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/account")} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold">{t("notificationsTitle")}</h1>
          <p className="text-sm text-muted-foreground">Manage in-app, push and email preferences</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : (
        <>
          {/* In-app / Push */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Bell className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">In-app & push</h2>
            </div>
            <div className="glass rounded-2xl p-4 flex items-center justify-between">
              <div>
                <Label className="font-medium">Push notifications</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Browser push for replies, sales and reminders
                </p>
                {pushPermission === "denied" && (
                  <p className="text-xs text-destructive mt-1">
                    Browser permission is blocked — enable it in your browser settings
                  </p>
                )}
              </div>
              <Switch
                checked={prefs.push_enabled && pushPermission === "granted"}
                onCheckedChange={togglePush}
                disabled={pushPermission === "denied"}
              />
            </div>
          </section>

          {/* Email preference centre */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Mail className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Email preferences</h2>
            </div>

            {/* Always-on essential emails */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Essential transaction emails</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Purchase confirmations, escrow updates, deadline alerts, name-change requests, payouts and refunds. These are required to complete sales safely and can't be turned off.
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">Always on</span>
            </div>

            <div className="glass rounded-2xl divide-y divide-border/50">
              <div className="flex items-center justify-between p-4">
                <div className="flex-1 pr-3">
                  <Label className="font-medium">Reminder emails</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Friendly nudges (e.g. 1h after a sale to start the name change)
                  </p>
                </div>
                <Switch
                  checked={prefs.reminder_emails}
                  onCheckedChange={(v) => update({ reminder_emails: v })}
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex-1 pr-3">
                  <Label className="font-medium">Product updates & tips</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Occasional product news and travel-deal tips
                  </p>
                </div>
                <Switch
                  checked={prefs.marketing_emails}
                  onCheckedChange={(v) => update({ marketing_emails: v })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-1 pt-2">
              <p className="text-xs text-muted-foreground">
                {saving ? "Saving…" : "Changes save automatically"}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullUnsubscribe}
                disabled={unsubLoading}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                {unsubLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ExternalLink className="w-3 h-3 mr-1" />}
                Unsubscribe from optional emails
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
