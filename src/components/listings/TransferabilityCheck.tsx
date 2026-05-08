import { useMemo, useEffect, useState } from "react";
import { getAirlineData, AirlineData } from "@/data/flightData";
import { CheckCircle2, XCircle, AlertTriangle, Info, ShieldCheck, AlertOctagon, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";

interface TransferabilityCheckProps {
  airline: string;
  fareType: string;
  onResult?: (r: { status: "allowed" | "denied" | "unknown"; blocking: boolean; fee: number | null; acknowledged: boolean }) => void;
}

// Fare type transferability rules per airline category
function getTransferability(airlineData: AirlineData | undefined, fareType: string) {
  if (!airlineData) return null;

  const fee = airlineData.nameChangeFee;
  const isBasicFare = fareType === "basic" || fareType === "light";
  const isFlexFare = fareType === "flex" || fareType === "plus" || fareType === "premium";

  // Airlines that don't allow name changes at all (fee === 0 with restrictive notes)
  const noChangeAirlines = ["British Airways", "Iberia", "Emirates", "Qatar Airways", "Etihad", "Cathay Pacific", "Singapore Airlines"];
  const isNoChange = noChangeAirlines.includes(airlineData.name);

  if (isNoChange) {
    return {
      status: "denied" as const,
      title: "Name change not allowed",
      description: `${airlineData.name} only permits minor spelling corrections. Full name changes are not supported — this ticket may not be transferable.`,
      fee: null,
      warning: "Buyers may not be able to use this ticket. Listing will carry a transferability warning.",
    };
  }

  if (fee === null) {
    return {
      status: "unknown" as const,
      title: "Transferability unknown",
      description: "We don't have transfer policy data for this airline. Please verify with the carrier.",
      fee: null,
      warning: null,
    };
  }

  // Airlines that allow name changes
  let estimatedFee = fee;
  let note = airlineData.nameChangeFeeNote;

  if (isBasicFare) {
    // Basic fares sometimes have higher fees or restrictions
    estimatedFee = Math.round(fee * 1.2); // ~20% more for basic fares
    note = `${note}. Basic fares may have higher fees or restrictions.`;
  } else if (isFlexFare) {
    // Flex fares often have reduced or waived fees
    estimatedFee = Math.round(fee * 0.5);
    note = `${note}. Flexible fares often have reduced name change fees.`;
  }

  return {
    status: "allowed" as const,
    title: "Name change allowed",
    description: note,
    fee: estimatedFee,
    warning: null,
  };
}

const fareTypes = [
  { value: "basic", label: "Basic / Light" },
  { value: "standard", label: "Standard / Regular" },
  { value: "flex", label: "Flex / Plus" },
  { value: "premium", label: "Premium / Business" },
];

export { fareTypes };

export default function TransferabilityCheck({ airline, fareType, onResult }: TransferabilityCheckProps) {
  const { t } = useLanguage();
  const result = useMemo(() => {
    const airlineData = getAirlineData(airline);
    return getTransferability(airlineData, fareType);
  }, [airline, fareType]);

  // Seller must explicitly confirm they've verified the fee.
  // Resets whenever the underlying fee or status changes.
  const [acknowledged, setAcknowledged] = useState(false);
  useEffect(() => {
    setAcknowledged(false);
  }, [result?.status, result?.fee]);

  // Seller-editable override of the estimated fee. Defaults to the lookup value
  // but can always be changed (or set, if the airline is unknown / "no change").
  const [overrideFee, setOverrideFee] = useState<string>("");
  useEffect(() => {
    setOverrideFee(result?.fee != null ? String(result.fee) : "");
  }, [result?.status, result?.fee]);

  const parsedOverride = overrideFee.trim() === "" ? null : Number(overrideFee);
  const effectiveFee =
    parsedOverride !== null && !Number.isNaN(parsedOverride) && parsedOverride >= 0
      ? parsedOverride
      : result?.fee ?? null;

  const requiresAck = effectiveFee !== null && effectiveFee > 0;

  // Propagate to parent so it can disable the publish button when blocking.
  useEffect(() => {
    if (result && onResult) {
      onResult({
        status: result.status,
        // Seller has provided a fee → no longer blocking even if our table said "denied"
        blocking: result.status === "denied" && (effectiveFee === null || effectiveFee === 0),
        fee: effectiveFee,
        acknowledged: requiresAck ? acknowledged : true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.status, result?.fee, acknowledged, requiresAck, effectiveFee]);

  if (!result) return null;

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

  const config = statusConfig[result.status];
  const Icon = config.icon;

  return (
    <div className={cn("rounded-xl border-2 p-4 space-y-3 transition-all animate-in fade-in slide-in-from-top-2 duration-300", config.borderColor, config.bgColor)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", config.iconColor)} />
        <div className="space-y-1 flex-1">
          <p className={cn("font-semibold text-sm", config.titleColor)}>
            {result.status === "allowed" ? "✅ " : result.status === "denied" ? "❌ " : "⚠️ "}
            {result.title}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{result.description}</p>
        </div>
      </div>

      {/* Editable name-change fee — always shown so sellers can override the estimate */}
      <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-2">
        <Label htmlFor="name-change-fee-override" className="text-xs font-medium flex items-center gap-1.5">
          <Pencil className="w-3.5 h-3.5" />
          Name-change fee (per person, per flight)
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">£</span>
          <Input
            id="name-change-fee-override"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            placeholder="0"
            value={overrideFee}
            onChange={(e) => setOverrideFee(e.target.value)}
            className="bg-secondary/50 h-9"
          />
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {result.fee !== null
            ? `Our estimate is £${result.fee}, but fees vary. Enter the actual fee from your airline's website — this is what the buyer will pay on top of the ticket price.`
            : "Enter the fee shown on your airline's website. The buyer will pay this on top of the ticket price."}
        </p>
      </div>

      {result.warning && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-background/60">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">{result.warning}</p>
        </div>
      )}

      {/* Always-visible warning to verify on airline website */}
      <div className="flex items-start gap-2 p-2 rounded-lg bg-background/60">
        <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Name-change fees change frequently. Always confirm the current fee on the airline's official website before listing.
        </p>
      </div>

      {/* Personal-liability warning + confirmation gate */}
      {requiresAck && (
        <div className="rounded-lg border-2 border-destructive/40 bg-destructive/10 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <AlertOctagon className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-foreground leading-relaxed">
              <strong>{t("sellerLiabilityTitle")}</strong> {t("sellerLiabilityDescFlight", { fee: `£${result.fee}` })}
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
