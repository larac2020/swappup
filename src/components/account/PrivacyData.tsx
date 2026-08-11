import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Eye, Trash2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/i18n/LanguageContext";

type DataConsent = {
  id: string; user_id: string;
  consent_analytics: boolean; consent_marketing: boolean; consent_personalisation: boolean;
  updated_at: string;
};

export default function PrivacyData() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const DATA_USAGE_INFO = [
    { title: t("privacyCoreService"), description: t("privacyCoreServiceDesc"), canOptOut: false },
    { title: t("privacyAnalytics"), description: t("privacyAnalyticsDesc"), canOptOut: true, key: "consent_analytics" as const },
    { title: t("privacyMarketing"), description: t("privacyMarketingDesc"), canOptOut: true, key: "consent_marketing" as const },
    { title: t("privacyPersonalisation"), description: t("privacyPersonalisationDesc"), canOptOut: true, key: "consent_personalisation" as const },
  ];

  const { data: consent, isLoading } = useQuery({
    queryKey: ["data-consent", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_consent").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: newData, error: insertError } = await supabase.from("data_consent").insert({ user_id: user!.id }).select().single();
        if (insertError) throw insertError;
        return newData as DataConsent;
      }
      return data as DataConsent;
    },
    enabled: !!user?.id,
  });

  const updateConsent = useMutation({
    mutationFn: async (updates: Partial<Pick<DataConsent, "consent_analytics" | "consent_marketing" | "consent_personalisation">>) => {
      const { error } = await supabase.from("data_consent").update({ ...updates, updated_at: new Date().toISOString() }).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["data-consent"] }); toast.success(t("privacyPrefsUpdated")); },
    onError: () => toast.error(t("privacyPrefsFailed")),
  });

  const requestDeletion = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("delete-account", { body: { userId: user!.id } });
      if (error) {
        let message = "";
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx) message = (JSON.parse(await ctx.text())?.error as string) ?? "";
        } catch { /* fall through to generic message */ }
        throw new Error(message || t("privacyDeleteFailed"));
      }
    },
    onSuccess: async () => { toast.success(t("privacyDeleteSuccess")); await signOut(); navigate("/login"); },
    onError: (e: Error) => toast.error(e.message || t("privacyDeleteFailed")),
  });

  const exportData = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("export-user-data", { body: { userId: user!.id } });
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flyswap-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success(t("privacyExported")),
    onError: () => toast.error(t("privacyExportFailed")),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/account")}><ArrowLeft className="w-5 h-5" /></Button>
        <h1 className="text-xl font-bold">{t("privacyTitle")}</h1>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">{t("privacyHowWeUse")}</h3>
        </div>
        <div className="glass rounded-2xl divide-y divide-border/50">
          {DATA_USAGE_INFO.map((item) => (
            <div key={item.title} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.title}</span>
                {item.canOptOut && item.key && consent && (
                  <Switch checked={consent[item.key]} onCheckedChange={(checked) => updateConsent.mutate({ [item.key]: checked })} disabled={isLoading || updateConsent.isPending} />
                )}
                {!item.canOptOut && <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">{t("required")}</span>}
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">{t("privacyYourRights")}</h3>
        </div>
        <div className="glass rounded-2xl p-4 space-y-3">
          <p className="text-sm text-muted-foreground">{t("privacyYourRightsDesc")}</p>
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={() => exportData.mutate()} disabled={exportData.isPending}>
        {exportData.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
        {t("privacyExport")}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10">
            <Trash2 className="w-4 h-4 mr-2" />{t("privacyDelete")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("privacyDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t("privacyDeleteDesc")}</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>{t("privacyDeleteProfile")}</li>
                <li>{t("privacyDeleteListings")}</li>
                <li>{t("privacyDeletePurchases")}</li>
                <li>{t("privacyDeleteFavorites")}</li>
                <li>{t("privacyDeleteNotifications")}</li>
              </ul>
              <p className="pt-2">{t("privacyDeleteConfirm")}</p>
              <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder={t("privacyDeletePlaceholder")} className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={deleteConfirmText !== "DELETE" || requestDeletion.isPending} onClick={() => requestDeletion.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {requestDeletion.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t("privacyDeletePermanent")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="text-xs text-muted-foreground text-center px-4">{t("privacyContact")}</p>
    </div>
  );
}
