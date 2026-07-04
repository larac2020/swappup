import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Joyride, { CallBackProps, STATUS, EVENTS, ACTIONS, Step, TooltipRenderProps } from "react-joyride";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";

const LS_KEY = "swappup_tour_complete";
const BELL_STEP_INDEX = 2;

export function ProductTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [showPermissions, setShowPermissions] = useState(false);
  const [optMarketing, setOptMarketing] = useState(false);
  const [optLocation, setOptLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile-tour", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("tour_completed_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Auto-start only on /home, only once per user
  useEffect(() => {
    if (!user || !profile) return;
    if (location.pathname !== "/home") return;
    const localDone = localStorage.getItem(LS_KEY) === "1";
    const dbDone = !!(profile as any)?.tour_completed_at;
    const onboardingDone = localStorage.getItem("flyswap_onboarding_complete") === "true";
    if (!onboardingDone) return;
    if (localDone || dbDone) return;
    // Delay slightly so target elements have mounted
    const id = setTimeout(() => {
      setStepIndex(0);
      setRun(true);
    }, 600);
    return () => clearTimeout(id);
  }, [user, profile, location.pathname]);

  // Listen for manual replay event
  useEffect(() => {
    const handler = () => {
      navigate("/home");
      setTimeout(() => {
        setStepIndex(0);
        setRun(true);
      }, 400);
    };
    window.addEventListener("swappup:replay-tour", handler);
    return () => window.removeEventListener("swappup:replay-tour", handler);
  }, [navigate]);

  const steps: Step[] = useMemo(
    () => [
      {
        target: "body",
        placement: "center",
        title: t("tourWelcomeTitle"),
        content: t("tourWelcomeBody"),
        disableBeacon: true,
      },
      {
        target: '[data-tour="stats"]',
        title: t("tourStatsTitle"),
        content: t("tourStatsBody"),
        disableBeacon: true,
      },
      {
        target: '[data-tour="bell"]',
        title: t("tourBellTitle"),
        content: t("tourBellBody"),
        disableBeacon: true,
      },
      {
        target: '[data-tour="sell-btn"]',
        title: t("tourSellTitle"),
        content: t("tourSellBody"),
        disableBeacon: true,
      },
      {
        target: '[data-tour="nav-search"]',
        title: t("tourSearchTitle"),
        content: t("tourSearchBody"),
        placement: "top",
        disableBeacon: true,
      },
      {
        target: '[data-tour="nav-listings"]',
        title: t("tourListingsTitle"),
        content: t("tourListingsBody"),
        placement: "top",
        disableBeacon: true,
      },
      {
        target: '[data-tour="nav-account"]',
        title: t("tourAccountTitle"),
        content: t("tourAccountBody"),
        placement: "top",
        disableBeacon: true,
      },
    ],
    [t],
  );

  const requestPushPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      if (Notification.permission === "default") {
        const result = await Notification.requestPermission();
        if (result === "granted" && user) {
          await supabase
            .from("notification_preferences")
            .upsert({ user_id: user.id, push_enabled: true }, { onConflict: "user_id" });
        }
      }
    } catch (err) {
      // silent — user can opt in later from Account → Notifications
    }
  }, [user]);

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, action, index } = data;

      // Track step navigation
      if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
        setStepIndex(nextIndex);
      }

      const finished: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
      if (finished.includes(status)) {
        setRun(false);
        setShowPermissions(true);
      }
    },
    [requestPushPermission],
  );

  const finishTour = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Persist completion
      await supabase
        .from("profiles")
        .update({ tour_completed_at: new Date().toISOString() } as any)
        .eq("user_id", user.id);
      localStorage.setItem(LS_KEY, "1");

      // Save marketing email preference (notification_preferences + data_consent)
      await supabase
        .from("notification_preferences")
        .upsert({ user_id: user.id, marketing_emails: optMarketing }, { onConflict: "user_id" });
      await supabase
        .from("data_consent")
        .upsert({ user_id: user.id, consent_marketing: optMarketing }, { onConflict: "user_id" });

      // Request browser geolocation if user opted in
      if (optLocation && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => undefined,
          () => undefined,
          { timeout: 8000 },
        );
      }

      queryClient.invalidateQueries({ queryKey: ["profile-tour"] });
      toast({ title: t("tourDoneTitle"), description: t("tourDoneBody") });
      setShowPermissions(false);
      navigate("/account");
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [user, optMarketing, optLocation, navigate, queryClient, toast, t]);

  const dismissWithoutSaving = useCallback(async () => {
    if (!user) return;
    // Still mark complete so it doesn't reappear automatically
    await supabase
      .from("profiles")
      .update({ tour_completed_at: new Date().toISOString() } as any)
      .eq("user_id", user.id);
    localStorage.setItem(LS_KEY, "1");
    queryClient.invalidateQueries({ queryKey: ["profile-tour"] });
    setShowPermissions(false);
  }, [user, queryClient]);

  const TourTooltip = useCallback(
    ({
      index,
      step,
      backProps,
      primaryProps,
      closeProps,
      tooltipProps,
      isLastStep,
      size,
    }: TooltipRenderProps) => {
      const handlePrimary = async (e: React.MouseEvent<HTMLButtonElement>) => {
        // Request push permission from within the user gesture
        if (index === BELL_STEP_INDEX) {
          await requestPushPermission();
        }
        primaryProps.onClick(e as any);
      };
      return (
        <div
          {...tooltipProps}
          className="relative w-[320px] max-w-[92vw] rounded-2xl bg-[hsl(220_18%_10%)] text-[hsl(40_20%_95%)] shadow-2xl border border-white/5 overflow-hidden"
        >
          {/* Segmented progress bar */}
          <div className="flex gap-1 px-5 pt-5">
            {Array.from({ length: size }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= index ? "bg-[hsl(38_92%_55%)]" : "bg-white/10",
                )}
              />
            ))}
          </div>

          {/* Close (X) */}
          <button
            {...closeProps}
            aria-label={t("close")}
            className="absolute top-3 right-3 p-1 rounded-md text-white/50 hover:text-white/90 hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="px-5 pt-4 pb-5">
            {step.title && (
              <h3 className="text-base font-bold mb-2 pr-6">{step.title}</h3>
            )}
            <div className="text-sm leading-relaxed text-white/80">{step.content}</div>

            <div className="flex justify-between items-center gap-2 mt-5">
              {index > 0 ? (
                <button
                  {...backProps}
                  className="px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition"
                >
                  {t("back")}
                </button>
              ) : (
                <span />
              )}
              <button
                {...primaryProps}
                onClick={handlePrimary}
                className="px-4 py-2 rounded-lg bg-[hsl(38_92%_55%)] text-[hsl(220_18%_10%)] text-sm font-semibold hover:bg-[hsl(38_92%_60%)] transition"
              >
                {isLastStep ? t("tourFinish") : t("next")}
              </button>
            </div>
          </div>
        </div>
      );
    },
    [t, requestPushPermission],
  );

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        disableScrolling={false}
        callback={handleCallback}
        tooltipComponent={TourTooltip}
        locale={{
          back: t("back"),
          close: t("close"),
          last: t("tourFinish"),
          next: t("next"),
          skip: t("skip"),
        }}
        styles={{
          options: {
            primaryColor: "hsl(38 92% 55%)",
            backgroundColor: "hsl(220 18% 10%)",
            textColor: "hsl(40 20% 95%)",
            arrowColor: "hsl(220 18% 10%)",
            overlayColor: "rgba(8, 10, 16, 0.78)",
            zIndex: 10000,
          },
        }}
      />

      <Dialog open={showPermissions} onOpenChange={(o) => !o && dismissWithoutSaving()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("tourPermsTitle")}</DialogTitle>
            <DialogDescription>{t("tourPermsDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border/50">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">{t("tourPermsMarketingTitle")}</Label>
                  <p className="text-xs text-muted-foreground">{t("tourPermsMarketingDesc")}</p>
                </div>
              </div>
              <Switch checked={optMarketing} onCheckedChange={setOptMarketing} />
            </div>

            <div className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border/50">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">{t("tourPermsLocationTitle")}</Label>
                  <p className="text-xs text-muted-foreground">{t("tourPermsLocationDesc")}</p>
                </div>
              </div>
              <Switch checked={optLocation} onCheckedChange={setOptLocation} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={dismissWithoutSaving} disabled={saving}>
              {t("tourPermsSkip")}
            </Button>
            <Button variant="gold" onClick={finishTour} disabled={saving}>
              {t("tourPermsFinish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}