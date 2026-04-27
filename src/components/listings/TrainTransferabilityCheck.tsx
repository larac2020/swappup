import { useMemo, useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, ExternalLink, ShieldCheck, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getOperator, getOperatorFare, currencySymbol } from "@/data/trainData";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";

export interface TrainTransferabilityResult {
  status: "allowed" | "denied" | "unknown";
  blocking: boolean;
  fee: number | null;
  currency: string;
  acknowledged: boolean;
}

interface Props {
  operator: string;
  fareClass: string;
  onResult?: (r: TrainTransferabilityResult) => void;
}

export default function TrainTransferabilityCheck({ operator, fareClass, onResult }: Props) {
  const { t } = useLanguage();
  const op = useMemo(() => getOperator(operator), [operator]);
  const fare = useMemo(() => getOperatorFare(operator, fareClass), [operator, fareClass]);

  const result = useMemo<TrainTransferabilityResult | null>(() => {
    if (!op) return null;
    if (!fare) {
      return { status: "unknown", blocking: false, fee: null, currency: "EUR", acknowledged: true };
    }
    if (fare.transferable === "no") {
      return { status: "denied", blocking: true, fee: null, currency: fare.currency, acknowledged: true };
    }
    return { status: "allowed", blocking: false, fee: fare.fee, currency: fare.currency, acknowledged: true };
  }, [op, fare]);

  // Seller must explicitly confirm they've verified the fee.
  const [acknowledged, setAcknowledged] = useState(false);
  useEffect(() => {
    setAcknowledged(false);
  }, [result?.status, result?.fee]);

  const requiresAck = result?.status === "allowed" && result.fee !== null;

  // Notify parent when the result changes.
  useEffect(() => {
    if (result && onResult) {
      onResult({
        ...result,
        acknowledged: requiresAck ? acknowledged : true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.status, result?.blocking, result?.fee, result?.currency, acknowledged, requiresAck]);

  if (!op || !result) return null;

  const statusConfig = {
    allowed: {
      icon: CheckCircle2,
      borderColor: "border-green-500/30",
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500",
      titleColor: "text-green-600 dark:text-green-400",
      title: t("trainTransferAllowed"),
    },
    denied: {
      icon: XCircle,
      borderColor: "border-destructive/30",
      bgColor: "bg-destructive/10",
      iconColor: "text-destructive",
      titleColor: "text-destructive",
      title: t("trainTransferDenied"),
    },
    unknown: {
      icon: AlertTriangle,
      borderColor: "border-yellow-500/30",
      bgColor: "bg-yellow-500/10",
      iconColor: "text-yellow-500",
      titleColor: "text-yellow-600 dark:text-yellow-400",
      title: t("trainTransferUnknown"),
    },
  } as const;

  const cfg = statusConfig[result.status];
  const Icon = cfg.icon;
  const sym = currencySymbol(result.currency);

  return (
    <div className={cn("rounded-xl border-2 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300", cfg.borderColor, cfg.bgColor)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", cfg.iconColor)} />
        <div className="space-y-1 flex-1">
          <p className={cn("font-semibold text-sm", cfg.titleColor)}>{cfg.title}</p>
          {result.status === "allowed" && result.fee !== null && (
            <p className="text-base font-bold text-foreground">
              {t("trainTransferEstimatedFee")} <span className="text-primary">{sym}{result.fee}</span>
              <span className="text-xs font-normal text-muted-foreground ml-1">{t("trainTransferPerPerson")}</span>
            </p>
          )}
          {result.status === "denied" && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("trainTransferDeniedDesc", { operator: op.name, fare: fare?.label ? `(${fare.label})` : "" })}
            </p>
          )}
          {result.status === "allowed" && fare?.note && (
            <p className="text-xs text-muted-foreground leading-relaxed">{fare.note}</p>
          )}
        </div>
      </div>

      {/* Always-visible warning to verify on operator's website */}
      <div className="flex items-start gap-2 p-2 rounded-lg bg-background/60">
        <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("trainTransferAlwaysCheck")}{" "}
          <a href={op.policyUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-0.5">
            {t("trainTransferOperatorWebsite", { operator: op.name })} <ExternalLink className="w-3 h-3" />
          </a>{" "}
          {t("trainTransferBeforeListing")}
        </p>
      </div>

      {/* Personal-liability warning + confirmation gate */}
      {requiresAck && (
        <div className="rounded-lg border-2 border-destructive/40 bg-destructive/10 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <AlertOctagon className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-foreground leading-relaxed">
              <strong>{t("sellerLiabilityTitle")}</strong> {t("sellerLiabilityDescTrain", { fee: `${sym}${result.fee}` })}
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