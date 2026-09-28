import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Trash2, Plane, Calendar, AlertCircle, CreditCard, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { formatPrice, convertAmount, convertFee, isFeeConverted } from "@/lib/currency";

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const displayCurrency = useDisplayCurrency();

  const { data: myProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["cartItems", myProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("cart_items").select("*, listings(*)").eq("user_id", myProfile!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!myProfile?.id,
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartItems"] });
      toast({ title: t("cartRemoved") });
    },
  });

  // Name-change fee is stored in the airline's own currency (name_change_fee_currency).
  // No verified fee → unconfirmed; never substitute a guess.
  const feeUnconfirmed = (listing: any) => !listing || listing.name_change_fee == null;
  const feeInDisplay = (listing: any, qty: number): number => {
    if (feeUnconfirmed(listing)) return 0;
    const from = listing.name_change_fee_currency || listing.currency || "EUR";
    return convertFee(Number(listing.name_change_fee) * qty, from, displayCurrency);
  };
  const anyConvertedFee = cartItems.some((item) => {
    const l = item.listings as any;
    return l && !feeUnconfirmed(l) && Number(l.name_change_fee) > 0 &&
      isFeeConverted(l.name_change_fee_currency || l.currency || "EUR", displayCurrency);
  });

  const subtotal = cartItems.reduce((sum, item) => {
    const listing = item.listings as any;
    if (!listing) return sum;
    const cur = listing.currency || "EUR";
    return sum + convertAmount(Number(listing.price) * item.quantity, cur, displayCurrency);
  }, 0);
  const feesTotal = cartItems.reduce((sum, item) => sum + feeInDisplay(item.listings as any, item.quantity), 0);
  // Service fee is fixed in EUR — convert for display.
  const serviceFee = cartItems.length > 0 ? convertAmount(4.99, "EUR", displayCurrency) : 0;
  const total = subtotal + feesTotal + serviceFee;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <AppLayout>
        <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
            <ShoppingCart className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t("cartEmpty")}</h2>
          <p className="text-muted-foreground mb-6 max-w-xs">{t("cartEmptyDesc")}</p>
          <Button variant="gold" onClick={() => navigate("/browse")}>
            {t("cartBrowseTickets")}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">{t("cartTitle")}</h1>
          <p className="text-muted-foreground">{cartItems.length} {cartItems.length === 1 ? t("cartItem") : t("cartItems_plural")}</p>
        </div>

        <div className="space-y-4">
          {cartItems.map((item) => {
            const listing = item.listings as any;
            if (!listing) return null;
            if (listing.listing_type === "train_ticket") return null;
            const carrier = listing.airline;
            const feeD = feeInDisplay(listing, item.quantity);
            const unconfirmed = feeUnconfirmed(listing);
            return (
              <div key={item.id} className="glass rounded-2xl p-4 space-y-3">
                <div className="flex gap-4">
                  <img
                    src={listing.destination_image_url || "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&auto=format&fit=crop"}
                    alt={listing.destination_city}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{listing.origin_city}</span>
                          <Plane className="w-4 h-4 text-primary rotate-90" />
                          <span className="font-semibold">{listing.destination_city}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{carrier}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeFromCartMutation.mutate(item.id)} disabled={removeFromCartMutation.isPending}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{listing.departure_date}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("priceTicketPrice")}</span>
                    <span>{formatPrice(Number(listing.price) * item.quantity, listing.currency || "EUR", displayCurrency)}</span>
                  </div>
                  {feeD > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">+ {t("priceNameChangeFee")} ({carrier})</span>
                      <span>{formatPrice(feeD, displayCurrency, displayCurrency)}</span>
                    </div>
                  )}
                  {unconfirmed && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">+ {t("priceNameChangeFee")} ({carrier})</span>
                      <span className="text-muted-foreground">{t("feeUnconfirmed")}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1.5 border-t border-border/30">
                    <span className="text-xs text-muted-foreground">{t("cartQty")}: {item.quantity}</span>
                    <span className="text-base font-bold text-primary">{formatPrice(convertAmount(Number(listing.price) * item.quantity, listing.currency || "EUR", displayCurrency) + feeD, displayCurrency, displayCurrency)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="glass rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">{t("cartNameChangeFees")}</p>
            <p className="text-muted-foreground">{t("cartNameChangeDesc")}</p>
            {anyConvertedFee && <p className="text-muted-foreground text-xs mt-2">{t("feeFxDisclaimer")}</p>}
          </div>
        </div>

        {/* Order Summary */}
        <div className="glass rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold">{t("cartOrderSummary")}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("cartSubtotal")}</span>
              <span>{formatPrice(subtotal, displayCurrency, displayCurrency)}</span>
            </div>
            {feesTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("priceNameChangeFee")}</span>
                <span>{formatPrice(feesTotal, displayCurrency, displayCurrency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("cartServiceFee")}</span>
              <span>{formatPrice(serviceFee, displayCurrency, displayCurrency)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border/50 text-base font-semibold">
              <span>{t("cartTotal")}</span>
              <span className="text-primary">{formatPrice(total, displayCurrency, displayCurrency)}</span>
            </div>
          </div>
        </div>

        <Button variant="gold" size="xl" className="w-full">
          <CreditCard className="w-5 h-5 mr-2" />
          {t("cartCheckout")}
        </Button>
      </div>
    </AppLayout>
  );
}
