import { useLanguage } from "@/i18n/LanguageContext";
import { Wallet } from "lucide-react";

export const SELLER_FEE_RATE = 0.20;

interface Props {
  price: string;
  currency?: string;
}

/**
 * Shows the seller-side fee breakdown for a listing:
 *   - Listing price (what the buyer pays for the ticket itself)
 *   - Platform fee (20%)
 *   - Net payout to the seller
 *
 * Buyer-side fees (e.g. operator name-change fees) are intentionally
 * not shown here — this component is seller-only.
 */
export default function SellerFeeBreakdown({ price, currency = "€" }: Props) {
  const { t } = useLanguage();
  const value = parseFloat(price);
  const valid = !isNaN(value) && value > 0;

  const fee = valid ? value * SELLER_FEE_RATE : 0;
  const payout = valid ? value - fee : 0;

  const fmt = (n: number) =>
    `${currency}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Wallet className="w-4 h-4 text-primary" />
        {t("sellFeeBreakdownTitle")}
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("sellFeeListingPrice")}</span>
          <span className="font-medium">{valid ? fmt(value) : "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {t("sellFeePlatformFee", { pct: String(Math.round(SELLER_FEE_RATE * 100)) })}
          </span>
          <span className="font-medium text-destructive">
            {valid ? `− ${fmt(fee)}` : "—"}
          </span>
        </div>
        <div className="border-t border-border/60 pt-2 flex justify-between">
          <span className="font-medium">{t("sellFeeYouReceive")}</span>
          <span className="font-semibold text-primary">
            {valid ? fmt(payout) : "—"}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("sellFeeNote", { pct: String(Math.round(SELLER_FEE_RATE * 100)) })}
      </p>
    </div>
  );
}
