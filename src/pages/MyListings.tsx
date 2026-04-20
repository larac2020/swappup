import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getPrimaryAirportCode } from "@/data/flightData";
import {
  Ticket, Plus, Loader2, Search, Eye, Heart, Rocket,
  Plane, Calendar, Users, Pencil, ToggleLeft, ToggleRight,
  Sparkles, Clock, Flame, CreditCard, AlertTriangle, CheckCircle2,
  ArrowRightLeft
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import TransferConfirmation from "@/components/listings/TransferConfirmation";
import { format } from "date-fns";
import { useLanguage } from "@/i18n/LanguageContext";

interface BoostOption {
  label: string;
  labelKey: "boost24h" | "boost3d" | "boost7d";
  duration: string;
  hours: number;
  price: string;
}

const boostOptions: BoostOption[] = [
  { label: "24 hours", labelKey: "boost24h", duration: "24h", hours: 24, price: "1.99" },
  { label: "3 days", labelKey: "boost3d", duration: "3d", hours: 72, price: "3.99" },
  { label: "1 week", labelKey: "boost7d", duration: "7d", hours: 168, price: "4.99" },
];

export default function MyListings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedBoostOption, setSelectedBoostOption] = useState<BoostOption | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["myListings", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_id", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Fetch view counts for all user listings
  const listingIds = listings.map((l) => l.id);
  const { data: viewCounts = {} } = useQuery({
    queryKey: ["listingViewCounts", listingIds],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const lid of listingIds) {
        const { count, error } = await supabase
          .from("listing_views")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", lid);
        if (!error) counts[lid] = count ?? 0;
      }
      return counts;
    },
    enabled: listingIds.length > 0,
  });

  // Fetch favorite counts for all user listings
  const { data: favCounts = {} } = useQuery({
    queryKey: ["listingFavCounts", listingIds],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const lid of listingIds) {
        const { count, error } = await supabase
          .from("favorites")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", lid);
        if (!error) counts[lid] = count ?? 0;
      }
      return counts;
    },
    enabled: listingIds.length > 0,
  });

  // Fetch pending sales (purchases where this user is the seller)
  const { data: pendingSales = [] } = useQuery({
    queryKey: ["mySales", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*, listings(*)")
        .eq("seller_id", profile!.id)
        .in("status", ["pending_transfer", "transfer_confirmed"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("listings")
        .update({ is_active: !isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myListings"] });
      toast({ title: t("boostUpdated") });
    },
  });

  const boostMutation = useMutation({
    mutationFn: async ({ id, hours }: { id: string; hours: number }) => {
      const bumpedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from("listings")
        .update({ bumped_until: bumpedUntil })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myListings"] });
      setConfirmDialogOpen(false);
      setBoostDialogOpen(false);
      setSelectedBoostOption(null);
      toast({ title: t("boostSuccess"), description: t("boostSuccessDesc") });
    },
  });

  const handleBoostSelect = (opt: BoostOption) => {
    setSelectedBoostOption(opt);
    setBoostDialogOpen(false);
    setConfirmDialogOpen(true);
  };

  const handleConfirmBoost = () => {
    if (selectedListingId && selectedBoostOption) {
      boostMutation.mutate({ id: selectedListingId, hours: selectedBoostOption.hours });
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const isBoosted = (listing: (typeof listings)[0]) =>
    listing.bumped_until && new Date(listing.bumped_until) > new Date();

  // Filter
  const q = searchQuery.toLowerCase();
  const filtered = listings.filter((l) =>
    !q ||
    l.destination_city.toLowerCase().includes(q) ||
    l.origin_city.toLowerCase().includes(q) ||
    l.airline.toLowerCase().includes(q) ||
    l.destination_country.toLowerCase().includes(q) ||
    l.origin_country.toLowerCase().includes(q)
  );

  const activeListings = filtered.filter((l) => l.is_active);
  const inactiveListings = filtered.filter((l) => !l.is_active);

  const renderListingCard = (l: (typeof listings)[0]) => {
    const originCode = getPrimaryAirportCode(l.origin_city);
    const destCode = getPrimaryAirportCode(l.destination_city);
    const boosted = isBoosted(l);
    const views = viewCounts[l.id] ?? 0;
    const favs = favCounts[l.id] ?? 0;

    return (
      <div
        key={l.id}
        className={cn(
          "glass rounded-2xl overflow-hidden animate-fade-in transition-all",
          boosted && "border-primary/40 shadow-glow-sm"
        )}
      >
        {/* Top section: route + price */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="text-center shrink-0">
                {originCode && (
                  <span className="text-xs font-bold text-primary">{originCode}</span>
                )}
                <p className="font-semibold text-foreground text-sm">{l.origin_city}</p>
              </div>
              <Plane className="w-4 h-4 text-primary -rotate-45 shrink-0" />
              <div className="text-center shrink-0">
                {destCode && (
                  <span className="text-xs font-bold text-primary">{destCode}</span>
                )}
                <p className="font-semibold text-foreground text-sm">{l.destination_city}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-lg font-bold text-primary">€{Number(l.price)}</span>
              {l.original_price && Number(l.original_price) > Number(l.price) && (
                <p className="text-xs text-muted-foreground line-through">€{Number(l.original_price)}</p>
              )}
            </div>
          </div>

          {/* Date + tickets + airline */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {formatDate(l.departure_date)}
                {l.return_date && ` – ${formatDate(l.return_date)}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{l.ticket_count}</span>
            </div>
            <span className="text-xs">{l.airline}</span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="w-3.5 h-3.5" />
              <span>{t("myListingsViews", { count: views, plural: views !== 1 ? "s" : "" })}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Heart className="w-3.5 h-3.5" />
              <span>{t("myListingsFavs", { count: favs, plural: favs !== 1 ? "s" : "" })}</span>
            </div>
            {boosted && (
              <Badge className="gradient-gold text-primary-foreground border-0 text-xs gap-1">
                <Flame className="w-3 h-3" />
                {t("myListingsBoosted")}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex border-t border-border/50">
          <button
            onClick={() => navigate(`/listing/${l.id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {t("myListingsView")}
          </button>
          <div className="w-px bg-border/50" />
          <button
            onClick={() => navigate(`/sell?edit=${l.id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            {t("myListingsEdit")}
          </button>
          <div className="w-px bg-border/50" />
          <button
            onClick={() => {
              setSelectedListingId(l.id);
              setBoostDialogOpen(true);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm text-primary hover:bg-primary/10 transition-colors"
          >
            <Rocket className="w-4 h-4" />
            {t("myListingsBoost")}
          </button>
          <div className="w-px bg-border/50" />
          <button
            onClick={() => toggleActiveMutation.mutate({ id: l.id, isActive: l.is_active ?? true })}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
          >
            {l.is_active ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4" />}
            {l.is_active ? t("myListingsActive") : t("myListingsInactive")}
          </button>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ticket className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-display font-bold">{t("myListingsTitle")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="gold" size="sm" onClick={() => navigate("/sell")}>
              <Plus className="w-4 h-4" />
              {t("myListingsSell")}
            </Button>
          </div>
        </div>

        {/* Search */}
        {listings.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("myListingsSearchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary/50"
            />
          </div>
        )}

        {/* Stats summary */}
        {listings.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{listings.filter((l) => l.is_active).length}</p>
              <p className="text-xs text-muted-foreground">{t("myListingsActive")}</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                {Object.values(viewCounts).reduce((a, b) => a + b, 0)}
              </p>
              <p className="text-xs text-muted-foreground">{t("myListingsTotalViews")}</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                {Object.values(favCounts).reduce((a, b) => a + b, 0)}
              </p>
              <p className="text-xs text-muted-foreground">{t("myListingsTotalFavorites")}</p>
            </div>
          </div>
        )}

        {/* Pending Sales / Transfer Confirmations */}
        {pendingSales.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              {t("myListingsPendingTransfers")} ({pendingSales.length})
            </h2>
            {pendingSales.map((sale: any) => {
              const listing = sale.listings as any;
              const deadline = sale.transfer_deadline ? new Date(sale.transfer_deadline) : null;
              const isExpired = deadline && deadline < new Date();
              const hoursLeft = deadline ? Math.max(0, Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60))) : 0;
              const isConfirmed = sale.status === "transfer_confirmed";

              return (
                <div key={sale.id} className={cn(
                  "glass rounded-2xl p-4 space-y-3",
                  isExpired && "border-destructive/30",
                  isConfirmed && "border-success/30"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{listing?.title || t("myListingsTicket")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("myListingsBuyer")}: {sale.buyer_full_name} • €{Number(sale.total_price).toFixed(2)}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn("text-xs", 
                      isConfirmed ? "bg-success/10 text-success border-success/30" : 
                      isExpired ? "bg-destructive/10 text-destructive border-destructive/30" :
                      "bg-warning/10 text-warning border-warning/30"
                    )}>
                      {isConfirmed ? t("myListingsConfirmed") : isExpired ? t("myListingsExpired") : t("myListingsHoursLeft", { hours: hoursLeft })}
                    </Badge>
                  </div>

                  {!isConfirmed && !isExpired && (
                    <Button
                      variant="gold"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => {
                        setSelectedSale(sale);
                        setTransferDialogOpen(true);
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {t("myListingsConfirmNameChange")}
                    </Button>
                  )}

                  {isConfirmed && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>{t("myListingsBookingRef")}: <span className="font-mono font-bold">{sale.transfer_booking_ref}</span></p>
                      <p>{t("myListingsConfirmedAt")}: {sale.transfer_confirmed_at ? format(new Date(sale.transfer_confirmed_at), "MMM d, HH:mm") : "N/A"}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}


        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : listings.length > 0 ? (
          <div className="space-y-6">
            {activeListings.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground">
                  {t("myListingsActive")} ({activeListings.length})
                </h2>
                <div className="space-y-3">
                  {activeListings.map(renderListingCard)}
                </div>
              </div>
            )}
            {inactiveListings.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground">
                  {t("myListingsInactive")} ({inactiveListings.length})
                </h2>
                <div className="space-y-3 opacity-60">
                  {inactiveListings.map(renderListingCard)}
                </div>
              </div>
            )}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>{t("myListingsNoMatch", { query: searchQuery })}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 glass rounded-2xl">
            <Ticket className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t("myListingsNoListings")}</p>
            <p className="text-sm text-muted-foreground/70 mt-1">{t("myListingsStartSelling")}</p>
            <Button variant="gold" className="mt-4" onClick={() => navigate("/sell")}>
              <Plus className="w-4 h-4 mr-1" />
              {t("myListingsCreateListing")}
            </Button>
          </div>
        )}
      </div>

      {/* Boost Dialog */}
      <Dialog open={boostDialogOpen} onOpenChange={setBoostDialogOpen}>
        <DialogContent className="glass-strong border-border/60 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Rocket className="w-5 h-5 text-primary" />
              {t("boostTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("boostDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {boostOptions.map((opt) => (
              <button
                key={opt.duration}
                onClick={() => handleBoostSelect(opt)}
                className="w-full glass rounded-xl p-4 flex items-center justify-between hover:border-primary/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{t(opt.labelKey)}</p>
                    <p className="text-xs text-muted-foreground">{t("myListingsBoostFor", { label: t(opt.labelKey).toLowerCase() })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">€{opt.price}</span>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={(open) => {
        setConfirmDialogOpen(open);
        if (!open) setSelectedBoostOption(null);
      }}>
        <DialogContent className="glass-strong border-border/60 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 text-primary" />
              {t("boostConfirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("boostConfirmDesc")}
            </DialogDescription>
          </DialogHeader>

          {selectedBoostOption && (
            <div className="space-y-4 pt-2">
              {/* Summary */}
              <div className="glass rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("myListingsBoostDuration")}</span>
                  <span className="font-medium">{t(selectedBoostOption.labelKey)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("myListingsBoostPaymentMethod")}</span>
                  <span className="font-medium text-sm">
                    {localStorage.getItem("flyswap_payment_added") === "true"
                      ? t("myListingsCardOnFile")
                      : t("myListingsNoCardSaved")
                    }
                  </span>
                </div>
                <div className="border-t border-border/50 pt-3 flex items-center justify-between">
                  <span className="font-semibold">{t("boostTotal")}</span>
                  <span className="text-xl font-bold text-primary">€{selectedBoostOption.price}</span>
                </div>
              </div>

              {localStorage.getItem("flyswap_payment_added") !== "true" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{t("myListingsAddPaymentWarning")}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setConfirmDialogOpen(false);
                    setSelectedBoostOption(null);
                  }}
                >
                  {t("cancel")}
                </Button>
                <Button
                  variant="gold"
                  className="flex-1 gap-2"
                  disabled={
                    boostMutation.isPending ||
                    localStorage.getItem("flyswap_payment_added") !== "true"
                  }
                  onClick={handleConfirmBoost}
                >
                  {boostMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {t("myListingsConfirmAndPay")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Confirmation Dialog */}
      <TransferConfirmation
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        purchase={selectedSale}
      />
    </AppLayout>
  );
}
