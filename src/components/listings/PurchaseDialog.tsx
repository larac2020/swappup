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

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: any;
  buyerProfileId: string;
  nameChangeFee: number;
}

export default function PurchaseDialog({ open, onOpenChange, listing, buyerProfileId, nameChangeFee }: PurchaseDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [escrowAccepted, setEscrowAccepted] = useState(false);
  const [nameAccepted, setNameAccepted] = useState(false);
  const [liveFee, setLiveFee] = useState<any>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  const ticketPrice = Number(listing.price);
  const effectiveFee = liveFee?.fee_amount != null ? Number(liveFee.fee_amount) : nameChangeFee;
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
      if (force) toast({ title: "Fee rechecked", description: "Latest published airline fee loaded." });
    } catch (e: any) {
      console.error(e);
      if (force) toast({ title: "Recheck failed", description: e.message, variant: "destructive" });
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
      // Open in new tab — works inside Lovable preview iframe (which blocks top-level redirects to Stripe)
      const win = window.open(data.url, "_blank", "noopener,noreferrer");
      if (!win) {
        // Popup blocked — fall back to top-level redirect
        window.top ? (window.top.location.href = data.url) : (window.location.href = data.url);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
    onError: (error: any) => {
      toast({ title: "Purchase failed", description: error.message, variant: "destructive" });
    },
  });

  const isValid = fullName.trim().length >= 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && privacyAccepted && escrowAccepted && nameAccepted;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/60 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Complete Your Purchase
          </DialogTitle>
          <DialogDescription>
            Your payment will be held in escrow until the seller confirms the name change on the ticket.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Price Breakdown */}
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ticket price</span>
              <span className="font-medium">{fmt(ticketPrice)}</span>
            </div>
            {effectiveFee > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    Name change fee ({listing.airline})
                    {feeLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  </span>
                  <span className="font-medium">{fmt(effectiveFee)}</span>
                </div>
                {liveFee && (
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground/80">
                    <span className="flex items-center gap-1">
                      {liveFee.refresh_failed ? "Cached" : "Live"} ·{" "}
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
                          source <ExternalLink className="w-2.5 h-2.5" />
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
                      Recheck now
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="border-t border-border/50 pt-3 flex items-center justify-between">
              <span className="font-semibold">Total (held in escrow)</span>
              <span className="text-xl font-bold text-primary">{fmt(totalPrice)}</span>
            </div>
            {showConversionNote && (
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                Shown in {displayCurrency}. You will be charged the equivalent of {formatPrice(totalPrice, listingCurrency, listingCurrency)} ({listingCurrency}).
              </p>
            )}
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed pt-1">
              The name-change fee shown is the airline's currently published amount. If the airline
              charges more at transfer time, the seller covers the difference per our Terms.
            </p>
          </div>

          {/* Buyer Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Your Details for Name Change
            </h3>

            <div className="space-y-2">
              <Label htmlFor="buyer-name">Full Name (as per official documents)</Label>
              <Input
                id="buyer-name"
                placeholder="e.g. John Michael Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-secondary/50"
              />
              <p className="text-xs text-muted-foreground">This exact name will be used for the ticket name change.</p>
              <div className="flex items-start gap-2 pt-2 rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                <Checkbox
                  id="name-accept"
                  checked={nameAccepted}
                  onCheckedChange={(c) => setNameAccepted(c === true)}
                  className="mt-0.5"
                />
                <label htmlFor="name-accept" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                  I understand that this name will be used by the seller to complete the name change.
                  I am solely responsible for ensuring the name is correct and release both the seller
                  and Swappup from any liability arising from incorrect or incomplete information provided by me.
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyer-email" className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                Contact Email
              </Label>
              <Input
                id="buyer-email"
                type="email"
                placeholder="your@email.com"
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
                  <p className="text-xs font-medium text-destructive">Privacy Notice</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your name and email will be shared with the seller to complete the name change on the booking. 
                    The platform is not responsible for any misuse of this information by the seller. 
                    By proceeding, you acknowledge and accept this risk. See our{" "}
                    <Link to="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link> for details.
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
                  I understand and accept the privacy risks
                </label>
              </div>
            </div>

            {/* Escrow Terms */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="escrow-accept"
                  checked={escrowAccepted}
                  onCheckedChange={(c) => setEscrowAccepted(c === true)}
                />
                <label htmlFor="escrow-accept" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                  I agree that my payment of <strong>{fmt(totalPrice)}</strong> will be held in escrow until the seller confirms
                  the name change. If not completed within 24 hours, I will receive a full refund.
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
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
              Pay {fmt(totalPrice)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
