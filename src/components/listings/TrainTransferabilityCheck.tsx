import { useMemo, useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getOperator, getOperatorFare, currencySymbol } from "@/data/trainData";

export interface TrainTransferabilityResult {
  status: "allowed" | "denied" | "unknown";
  blocking: boolean;
  fee: number | null;
  currency: string;
}

interface Props {
  operator: string;
  fareClass: string;
  onResult?: (r: TrainTransferabilityResult) => void;
}

export default function TrainTransferabilityCheck({ operator, fareClass, onResult }: Props) {
  const op = useMemo(() => getOperator(operator), [operator]);
  const fare = useMemo(() => getOperatorFare(operator, fareClass), [operator, fareClass]);

  const result = useMemo<TrainTransferabilityResult | null>(() => {
    if (!op) return null;
    if (!fare) {
      return { status: "unknown", blocking: false, fee: null, currency: "EUR" };
    }
    if (fare.transferable === "no") {
      return { status: "denied", blocking: true, fee: null, currency: fare.currency };
    }
    return { status: "allowed", blocking: false, fee: fare.fee, currency: fare.currency };
  }, [op, fare]);

  // Notify parent when the result changes.
  useEffect(() => {
    if (result && onResult) onResult(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.status, result?.blocking, result?.fee, result?.currency]);

  if (!op || !result) return null;

  const statusConfig = {
    allowed: {
      icon: CheckCircle2,
      borderColor: "border-green-500/30",
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500",
      titleColor: "text-green-600 dark:text-green-400",
      title: "Name change allowed",
    },
    denied: {
      icon: XCircle,
      borderColor: "border-destructive/30",
      bgColor: "bg-destructive/10",
      iconColor: "text-destructive",
      titleColor: "text-destructive",
      title: "Not transferable — listing blocked",
    },
    unknown: {
      icon: AlertTriangle,
      borderColor: "border-yellow-500/30",
      bgColor: "bg-yellow-500/10",
      iconColor: "text-yellow-500",
      titleColor: "text-yellow-600 dark:text-yellow-400",
      title: "Transferability unknown",
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
              Estimated name-change fee: <span className="text-primary">{sym}{result.fee}</span>
              <span className="text-xs font-normal text-muted-foreground ml-1">per person</span>
            </p>
          )}
          {result.status === "denied" && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {op.name} {fare?.label ? `(${fare.label})` : ""} does not allow name changes. You cannot resell this ticket on SwappUp.
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
          Name-change fees change frequently. Always confirm the current fee on{" "}
          <a href={op.policyUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-0.5">
            {op.name}'s website <ExternalLink className="w-3 h-3" />
          </a>{" "}
          before listing.
        </p>
      </div>
    </div>
  );
}