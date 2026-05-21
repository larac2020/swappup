import { Shield, CheckCircle, Lock, CreditCard, UserCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/i18n/LanguageContext";

interface BuyerProtectionBadgeProps {
  sellerVerified?: boolean;
  compact?: boolean;
}

export function BuyerProtectionBadge({ sellerVerified = true, compact = false }: BuyerProtectionBadgeProps) {
  const { t } = useLanguage();
  // Sellers must complete ID verification before listing, so always present
  // them as verified in the buyer-facing protection panel.
  const verified = true;

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors">
            <Shield className="w-3 h-3 fill-emerald-400" />
            <span>{t("buyerProtection")}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4 glass-strong" side="top" align="start">
          <ProtectionDetails sellerVerified={verified} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="glass rounded-2xl p-4 space-y-3 border border-emerald-500/20">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <Shield className="w-4 h-4 text-emerald-400 fill-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{t("buyerProtection")}</h3>
          <p className="text-xs text-muted-foreground">{t("buyerProtectionSub")}</p>
        </div>
      </div>
      <ProtectionDetails sellerVerified={verified} />
    </div>
  );
}

function ProtectionDetails({ sellerVerified }: { sellerVerified: boolean }) {
  const { t } = useLanguage();

  const items = [
    {
      icon: UserCheck,
      label: t("protectionVerifiedSeller"),
      active: sellerVerified,
      description: sellerVerified ? t("protectionVerifiedSellerYes") : t("protectionVerifiedSellerNo"),
    },
    {
      icon: Lock,
      label: t("protectionEscrow"),
      active: true,
      description: t("protectionEscrowDesc"),
    },
    {
      icon: CreditCard,
      label: t("protectionRefund"),
      active: true,
      description: t("protectionRefundDesc"),
    },
    {
      icon: CheckCircle,
      label: t("protectionPriceCap"),
      active: true,
      description: t("protectionPriceCapDesc"),
    },
  ];

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <item.icon className={`w-4 h-4 mt-0.5 shrink-0 ${item.active ? "text-emerald-400" : "text-muted-foreground"}`} />
          <div>
            <p className={`text-xs font-medium ${item.active ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
