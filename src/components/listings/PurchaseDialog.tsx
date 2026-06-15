import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, ShieldCheck, User, Mail, CreditCard, RefreshCw, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { formatPrice } from "@/lib/currency";
import { useLanguage } from "@/i18n/LanguageContext";

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: any;
  buyerProfileId: string;
  nameChangeFee: number;
}

export default function PurchaseDialog({ open, onOpenChange, listing, buyerProfileId, nameChangeFee }: PurchaseDialogProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [escrowAccepted, setEscrowAccepted] = useState(false);
  const [nameAccepted, setNameAccepted] = useState(false);
  const [liveFee, setLiveFee] = useState<any>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  const ticketPrice = Number(listing.price);
  // Always use the fee shown on the listing detail page so the escrow total matches exactly.
  // The live-fee fetch below is informational only (shows source/last-verified date and lets
  // the buyer recheck), but it must not change the amount we display or charge here.
  const effectiveFee = nameChangeFee;
  const totalPrice = ticketPrice + effectiveFee;
  const listingCurrency = (listing as any).currency || "EUR";
  const displayCurrency = useDisplayCurrency();
  const fmt = (amount: number) => formatPrice(amount, listingCurrency, displayCurrency);
  const showConversionNote = displayCurrency !== listingCurrency;

  const fetchFee = async (force = false) => {
    if (!listing?.airline) return;
    setFeeLoading(true);
    try {
      const routeType =
        listing.origin_country && listing.destination_country &&
        listing.origin_country === listing.destination_country
          ? "domestic"
          : "international";
      const { data, error } = await supabase.functions.invoke("get-name-change-fee", {
        body: { airline: listing.airline, route_type: routeType, force_refresh: force },
      });
      if (error) throw error;
      setLiveFee(data);
      if (force) toast({ title: t("pdFeeRechecked"), description: t("pdFeeRecheckedDesc") });
    } catch (e: any) {
      console.error(e);
      if (force) toast({ title: t("pdRecheckFailed"), description: e.message, variant: "destructive" });
    } finally {
      setFeeLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchFee(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, listing?.id]);

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-purchase-checkout", {
        body: {
          listing_id: listing.id,
          full_name: fullName.trim(),
          email: email.trim(),
          name_change_fee: effectiveFee,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("Checkout session could not be created");
      // Top-level redirect so the buyer returns to the same browsing context
      // (preserving the Supabase session in localStorage). Opening Stripe in a
      // new tab caused storage-partitioned sessions and a bounce to /login on return.
      try {
        if (window.top) {
          window.top.location.href = data.url;
        } else {
          window.location.href = data.url;
        }
      } catch {
        window.location.href = data.url;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
    onError: (error: any) => {
      toast({ title: t("pdPurchaseFailed"), description: error.message, variant: "destructive" });
    },
  });

  const isValid = fullName.trim().length >= 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && privacyAccepted && escrowAccepted && nameAccepted;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/60 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {t("pdTitle")}
          </DialogTitle>
          <DialogDescription>{t("pdDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Price Breakdown */}
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("pdTicketPrice")}</span>
              <span className="font-medium">{fmt(ticketPrice)}</span>
            </div>
            {effectiveFee > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    {t("pdNameChangeFee")} ({listing.airline})
                    {feeLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  </span>
                  <span className="font-medium">{fmt(effectiveFee)}</span>
                </div>
                {liveFee && (
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground/80">
                    <span className="flex items-center gap-1">
                      {liveFee.refresh_failed ? t("pdCached") : t("pdLive")} ·{" "}
                      {liveFee.last_verified_at
                        ? new Date(liveFee.last_verified_at).toLocaleDateString()
                        : "—"}
                      {liveFee.source_url && (
                        <a
                          href={liveFee.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-0.5"
                        >
                          {t("pdSource")} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => fetchFee(true)}
                      disabled={feeLoading}
                      className="text-primary hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${feeLoading ? "animate-spin" : ""}`} />
                      {t("pdRecheckNow")}
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="border-t border-border/50 pt-3 flex items-center justify-between">
              <span className="font-semibold">{t("pdTotalHeld")}</span>
              <span className="text-xl font-bold text-primary">{fmt(totalPrice)}</span>
            </div>
            {showConversionNote && (
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                {t("pdConvNote", { display: displayCurrency, amount: formatPrice(totalPrice, listingCurrency, listingCurrency), listing: listingCurrency })}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed pt-1">{t("pdFeeDisclaimer")}</p>
          </div>

          {/* Buyer Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              {t("pdDetailsHeading")}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="buyer-name">{t("pdFullName")}</Label>
              <Input
                id="buyer-name"
                placeholder={t("pdFullNamePlaceholder")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-secondary/50"
              />
              <p className="text-xs text-muted-foreground">{t("pdFullNameHelp")}</p>
              <div className="flex items-start gap-2 pt-2 rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                <Checkbox
                  id="name-accept"
                  checked={nameAccepted}
                  onCheckedChange={(c) => setNameAccepted(c === true)}
                  className="mt-0.5"
                />
                <label htmlFor="name-accept" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                  {t("pdNameAccept")}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyer-email" className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                {t("pdEmailLabel")}
              </Label>
              <Input
                id="buyer-email"
                type="email"
                placeholder={t("pdEmailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary/50"
              />
            </div>

            {/* Privacy Disclaimer */}
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-destructive">{t("pdPrivacyTitle")}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("pdPrivacyBodyPrefix")}
                    <Link to="/privacy" target="_blank" className="text-primary hover:underline">{t("pdPrivacyBodyLink")}</Link>
                    {t("pdPrivacyBodySuffix")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="privacy-accept"
                  checked={privacyAccepted}
                  onCheckedChange={(c) => setPrivacyAccepted(c === true)}
                />
                <label htmlFor="privacy-accept" className="text-xs text-muted-foreground cursor-pointer">
                  {t("pdPrivacyAccept")}
                </label>
              </div>
            </div>

            {/* Payment hold terms */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="escrow-accept"
                  checked={escrowAccepted}
                  onCheckedChange={(c) => setEscrowAccepted(c === true)}
                />
                <label htmlFor="escrow-accept" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                  {t("pdEscrowAcceptPrefix")}<strong>{fmt(totalPrice)}</strong>{t("pdEscrowAcceptSuffix")}
                </label>
              </div>
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed pt-2">
                <strong>{t("pdEscrowImportant")}</strong>{t("pdEscrowImportantBody")}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="gold"
              className="flex-1 gap-2"
              disabled={!isValid || purchaseMutation.isPending}
              onClick={() => purchaseMutation.mutate()}
            >
              {purchaseMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              {t("pdPay", { amount: fmt(totalPrice) })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
