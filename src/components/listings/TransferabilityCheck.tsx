import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, ShieldCheck, AlertOctagon, Flag, Loader2, ExternalLink, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TransferabilityCheckProps {
  airline: string;
  fareType: string;
  onResult?: (r: { status: "allowed" | "denied" | "unknown"; blocking: boolean; fee: number | null; acknowledged: boolean }) => void;
}

const fareTypes = [
  { value: "basic", label: "Basic / Light" },
  { value: "standard", label: "Standard / Regular" },
  { value: "flex", label: "Flex / Plus" },
  { value: "premium", label: "Premium / Business" },
];

export { fareTypes };

type PlatformFee = {
  fee_amount: number;
  fee_max?: number | null;
  currency: string;
  is_transferable: boolean;
  source_url: string | null;
  last_verified_at: string | null;
  confidence: string | null;
  notes?: string | null;
};

function currencySymbol(c: string | undefined) {
  switch ((c || "EUR").toUpperCase()) {
    case "GBP": return "£";
    case "USD": return "$";
    default: return "€";
  }
}

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000);
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export default function TransferabilityCheck({ airline, fareType, onResult }: TransferabilityCheckProps) {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<PlatformFee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const [reporting, setReporting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [proposedFee, setProposedFee] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [reportNote, setReportNote] = useState("");

  // Fetch platform-verified fee whenever airline changes
  useEffect(() => {
    if (!airline) { setPlatform(null); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAcknowledged(false);
    supabase.functions
      .invoke("get-name-change-fee", { body: { airline, route_type: "international" } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) { setError("Could not fetch the verified fee."); setPlatform(null); return; }
        setPlatform({
          fee_amount: Number(data.fee_amount ?? 0),
          fee_max: data.fee_max ?? null,
          currency: data.currency || "EUR",
          is_transferable: data.is_transferable !== false,
          source_url: data.source_url || null,
          last_verified_at: data.last_verified_at || null,
          confidence: data.confidence || null,
          notes: data.notes || null,
        });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [airline]);

  const platformFee = platform ? Number(platform.fee_max ?? platform.fee_amount ?? 0) : null;
  const status: "allowed" | "denied" | "unknown" = !platform
    ? "unknown"
    : platform.is_transferable === false
      ? "denied"
      : "allowed";
  const requiresAck = platformFee !== null && platformFee > 0 && status === "allowed";

  // Propagate to parent
  useEffect(() => {
    if (!onResult) return;
    onResult({
      status,
      blocking: status === "denied",
      fee: status === "allowed" ? platformFee : null,
      acknowledged: requiresAck ? acknowledged : true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, platformFee, acknowledged, requiresAck]);

  async function submitReport() {
    const proposed = Number(proposedFee);
    if (!Number.isFinite(proposed) || proposed < 0) {
      toast({ title: "Enter a valid fee", variant: "destructive" });
      return;
    }
    setReporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("report-name-change-fee", {
        body: {
          airline,
          route_type: "international",
          platform_fee: platformFee,
          proposed_fee: proposed,
          evidence_url: evidenceUrl || null,
          note: reportNote || null,
          currency: platform?.currency || "EUR",
        },
      });
      if (error) throw error;
      const newFee = data?.newFee != null ? Number(data.newFee) : null;
      if (data?.updated && newFee !== null && platform) {
        setPlatform({ ...platform, fee_amount: newFee, fee_max: newFee, source_url: data.source_url ?? platform.source_url, last_verified_at: data.last_verified_at ?? new Date().toISOString() });
        toast({ title: "Fee updated", description: `We re-checked the airline site and updated the fee to ${currencySymbol(platform.currency)}${newFee}.` });
      } else {
        toast({ title: "Report logged", description: `We re-verified the airline site and confirmed ${currencySymbol(platform?.currency)}${platformFee}. Your report is queued for review.` });
      }
      setReportOpen(false); setProposedFee(""); setEvidenceUrl(""); setReportNote("");
    } catch (e) {
      toast({ title: "Could not submit report", description: e instanceof Error ? e.message : "Try again later", variant: "destructive" });
    } finally {
      setReporting(false);
    }
  }

  if (!airline) return null;

  if (loading && !platform) {
    return (
      <div className="rounded-xl border-2 border-border/40 bg-background/40 p-4 flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking the airline's name-change policy…
      </div>
    );
  }

  if (error || !platform) {
    return (
      <div className="rounded-xl border-2 border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5" />
        <div>
          <p className="font-semibold">Couldn't fetch the verified fee</p>
          <p className="text-xs">{error || "Try again in a moment."}</p>
        </div>
      </div>
    );
  }

  const statusConfig = {
    allowed: {
      icon: CheckCircle2,
      borderColor: "border-green-500/30",
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500",
      titleColor: "text-green-600 dark:text-green-400",
    },
    denied: {
      icon: XCircle,
      borderColor: "border-destructive/30",
      bgColor: "bg-destructive/10",
      iconColor: "text-destructive",
      titleColor: "text-destructive",
    },
    unknown: {
      icon: AlertTriangle,
      borderColor: "border-yellow-500/30",
      bgColor: "bg-yellow-500/10",
      iconColor: "text-yellow-500",
      titleColor: "text-yellow-600 dark:text-yellow-400",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;
  const sym = currencySymbol(platform.currency);
  const title = status === "allowed"
    ? "Name change allowed"
    : status === "denied"
      ? "Name change not allowed"
      : "Transferability unknown";
  const description = platform.notes || (status === "denied"
    ? `${airline} does not permit name transfers per the latest check on their site.`
    : `Fee verified from ${airline}'s official policy page.`);

  return (
    <div className={cn("rounded-xl border-2 p-4 space-y-3 transition-all animate-in fade-in slide-in-from-top-2 duration-300", config.borderColor, config.bgColor)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", config.iconColor)} />
        <div className="space-y-1 flex-1">
          <p className={cn("font-semibold text-sm", config.titleColor)}>
            {status === "allowed" ? "✅ " : status === "denied" ? "❌ " : "⚠️ "}
            {title}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Locked platform fee */}
      {status !== "denied" && (
        <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Platform-verified name-change fee
            </Label>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {platform.confidence ? `${platform.confidence} confidence` : ""}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{sym}{platformFee}</span>
            <span className="text-xs text-muted-foreground">per person, per flight</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Last verified {timeAgo(platform.last_verified_at)}</span>
            {platform.source_url && (
              <a href={platform.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                Source <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            This is the amount the buyer pays on top of the ticket price and that you'll use to perform the name change. You cannot edit it — but if you believe it's wrong, flag it below and we'll re-check the airline's site.
          </p>

          {!reportOpen ? (
            <Button
              type="button" size="sm" variant="ghost"
              className="w-full text-xs"
              onClick={() => { setReportOpen(true); setProposedFee(String(platformFee ?? "")); }}
            >
              <Flag className="w-3.5 h-3.5" /> Report this fee as inaccurate
            </Button>
          ) : (
            <div className="rounded-lg border border-border/60 bg-background/80 p-3 space-y-2">
              <p className="text-xs font-medium">Help us fix this</p>
              <div className="space-y-1">
                <Label className="text-[11px]">Fee you see on the airline's site ({sym})</Label>
                <Input
                  type="number" min={0} step="0.01" inputMode="decimal"
                  value={proposedFee} onChange={(e) => setProposedFee(e.target.value)}
                  className="bg-secondary/50 h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Link to the airline's policy page (optional)</Label>
                <Input
                  placeholder="https://…"
                  value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="bg-secondary/50 h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Note (optional)</Label>
                <Textarea
                  rows={2} value={reportNote} onChange={(e) => setReportNote(e.target.value)}
                  className="bg-secondary/50 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="ghost" className="flex-1" onClick={() => setReportOpen(false)} disabled={reporting}>
                  Cancel
                </Button>
                <Button type="button" size="sm" className="flex-1" onClick={submitReport} disabled={reporting}>
                  {reporting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Re-checking…</> : <>Submit & re-check</>}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                We'll automatically re-verify the fee against the airline's official site. If our re-check finds a different number, we'll update the fee on your listing. Your proposed value is logged for review but is not applied directly.
              </p>
            </div>
          )}
        </div>
      )}

      {status === "denied" && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-background/60">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Buyers may not be able to use this ticket. Listing will carry a transferability warning.
          </p>
        </div>
      )}

      {/* Personal-liability warning + confirmation gate */}
      {requiresAck && (
        <div className="rounded-lg border-2 border-destructive/40 bg-destructive/10 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <AlertOctagon className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-foreground leading-relaxed">
              <strong>{t("sellerLiabilityTitle")}</strong> {t("sellerLiabilityDescFlight", { fee: `${sym}${platformFee}` })}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant={acknowledged ? "secondary" : "destructive"}
            className="w-full"
            onClick={() => setAcknowledged((v) => !v)}
          >
            <ShieldCheck className="w-4 h-4" />
            {acknowledged ? t("sellerLiabilityConfirmed") : t("sellerLiabilityConfirmCta")}
          </Button>
        </div>
      )}
    </div>
  );
}
