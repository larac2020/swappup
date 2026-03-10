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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type DataConsent = {
  id: string;
  user_id: string;
  consent_analytics: boolean;
  consent_marketing: boolean;
  consent_personalisation: boolean;
  updated_at: string;
};

const DATA_USAGE_INFO = [
  {
    title: "Core Service Data",
    description: "Your profile, listings, and transaction data are processed to provide the FlySwap marketplace service. This is necessary for the contract we have with you.",
    canOptOut: false,
  },
  {
    title: "Analytics",
    description: "We use anonymised usage data (pages visited, search patterns) to improve the platform experience. This helps us understand how features are used.",
    canOptOut: true,
    key: "consent_analytics" as const,
  },
  {
    title: "Marketing Communications",
    description: "Promotional emails about deals, new features, and personalised flight recommendations based on your search history and preferences.",
    canOptOut: true,
    key: "consent_marketing" as const,
  },
  {
    title: "Personalisation",
    description: "Using your browsing and search history to show you more relevant listings, destinations, and recommendations on the platform.",
    canOptOut: true,
    key: "consent_personalisation" as const,
  },
];

export default function PrivacyData() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const { data: consent, isLoading } = useQuery({
    queryKey: ["data-consent", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_consent")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        // Create default consent record
        const { data: newData, error: insertError } = await supabase
          .from("data_consent")
          .insert({ user_id: user!.id })
          .select()
          .single();
        if (insertError) throw insertError;
        return newData as DataConsent;
      }
      return data as DataConsent;
    },
    enabled: !!user?.id,
  });

  const updateConsent = useMutation({
    mutationFn: async (updates: Partial<Pick<DataConsent, "consent_analytics" | "consent_marketing" | "consent_personalisation">>) => {
      const { error } = await supabase
        .from("data_consent")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-consent"] });
      toast.success("Preferences updated");
    },
    onError: () => toast.error("Failed to update preferences"),
  });

  const requestDeletion = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("delete-account", {
        body: { userId: user!.id },
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Account deletion initiated. You will be signed out.");
      await signOut();
      navigate("/");
    },
    onError: () => toast.error("Failed to request account deletion. Please contact support."),
  });

  const exportData = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("export-user-data", {
        body: { userId: user!.id },
      });
      if (error) throw error;
      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flyswap-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success("Data exported successfully"),
    onError: () => toast.error("Failed to export data"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/account")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Privacy & Data</h1>
      </div>

      {/* How we use your data */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">How We Use Your Data</h3>
        </div>
        <div className="glass rounded-2xl divide-y divide-border/50">
          {DATA_USAGE_INFO.map((item) => (
            <div key={item.title} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.title}</span>
                {item.canOptOut && item.key && consent && (
                  <Switch
                    checked={consent[item.key]}
                    onCheckedChange={(checked) =>
                      updateConsent.mutate({ [item.key]: checked })
                    }
                    disabled={isLoading || updateConsent.isPending}
                  />
                )}
                {!item.canOptOut && (
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">Required</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Your rights */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Your Rights</h3>
        </div>
        <div className="glass rounded-2xl p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Under UK GDPR, you have the right to access, rectify, erase, restrict processing, and port your personal data. You can exercise these rights below.
          </p>
        </div>
      </div>

      {/* Export data */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => exportData.mutate()}
        disabled={exportData.isPending}
      >
        {exportData.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        Export My Data
      </Button>

      {/* Delete account */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete My Account & Data
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This action is <strong>permanent and irreversible</strong>. All your data will be deleted, including:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Your profile and personal information</li>
                <li>All your listings</li>
                <li>Purchase and transaction history</li>
                <li>Favorites and search history</li>
                <li>Notification preferences</li>
              </ul>
              <p className="pt-2">Type <strong>DELETE</strong> to confirm.</p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmText !== "DELETE" || requestDeletion.isPending}
              onClick={() => requestDeletion.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {requestDeletion.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="text-xs text-muted-foreground text-center px-4">
        For any data protection enquiries, contact us at privacy@flyswap.com. We aim to respond within 30 days as required under UK GDPR.
      </p>
    </div>
  );
}
