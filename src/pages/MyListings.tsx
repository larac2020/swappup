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

interface BoostOption {
  label: string;
  duration: string;
  hours: number;
  price: string;
}

const boostOptions: BoostOption[] = [
  { label: "24 hours", duration: "24h", hours: 24, price: "1.99" },
  { label: "3 days", duration: "3d", hours: 72, price: "3.99" },
  { label: "1 week", duration: "7d", hours: 168, price: "4.99" },
];

export default function MyListings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
      toast({ title: "Listing updated" });
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
      toast({ title: "Listing boosted!", description: "Your ad is now more visible." });
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
              <span>{views} view{views !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Heart className="w-3.5 h-3.5" />
              <span>{favs} favorite{favs !== 1 ? "s" : ""}</span>
            </div>
            {boosted && (
              <Badge className="gradient-gold text-primary-foreground border-0 text-xs gap-1">
                <Flame className="w-3 h-3" />
                Boosted
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
            View
          </button>
          <div className="w-px bg-border/50" />
          <button
            onClick={() => navigate(`/sell?edit=${l.id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
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
            Boost
          </button>
          <div className="w-px bg-border/50" />
          <button
            onClick={() => toggleActiveMutation.mutate({ id: l.id, isActive: l.is_active ?? true })}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
          >
            {l.is_active ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4" />}
            {l.is_active ? "Active" : "Inactive"}
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
            <h1 className="text-2xl font-display font-bold">My Listings</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="gold" size="sm" onClick={() => navigate("/sell")}>
              <Plus className="w-4 h-4" />
              Sell
            </Button>
          </div>
        </div>

        {/* Search */}
        {listings.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by city, country, airline..."
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
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                {Object.values(viewCounts).reduce((a, b) => a + b, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Views</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                {Object.values(favCounts).reduce((a, b) => a + b, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Favorites</p>
            </div>
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
                  Active ({activeListings.length})
                </h2>
                <div className="space-y-3">
                  {activeListings.map(renderListingCard)}
                </div>
              </div>
            )}
            {inactiveListings.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground">
                  Inactive ({inactiveListings.length})
                </h2>
                <div className="space-y-3 opacity-60">
                  {inactiveListings.map(renderListingCard)}
                </div>
              </div>
            )}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No listings match "{searchQuery}"</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 glass rounded-2xl">
            <Ticket className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No listings yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Start selling your unused tickets</p>
            <Button variant="gold" className="mt-4" onClick={() => navigate("/sell")}>
              <Plus className="w-4 h-4 mr-1" />
              Create Listing
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
              Boost Your Listing
            </DialogTitle>
            <DialogDescription>
              Get more visibility in the "Hot Deals" section and appear at the top of search results.
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
                    <p className="font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">Boost for {opt.label.toLowerCase()}</p>
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
              Confirm Payment
            </DialogTitle>
            <DialogDescription>
              Please review and confirm your boost purchase.
            </DialogDescription>
          </DialogHeader>

          {selectedBoostOption && (
            <div className="space-y-4 pt-2">
              {/* Summary */}
              <div className="glass rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Boost duration</span>
                  <span className="font-medium">{selectedBoostOption.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment method</span>
                  <span className="font-medium text-sm">
                    {localStorage.getItem("flyswap_payment_added") === "true"
                      ? "💳 Card on file"
                      : "⚠️ No card saved"
                    }
                  </span>
                </div>
                <div className="border-t border-border/50 pt-3 flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">€{selectedBoostOption.price}</span>
                </div>
              </div>

              {localStorage.getItem("flyswap_payment_added") !== "true" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>You need to add a payment method first. Go to Account → Payment Methods.</p>
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
                  Cancel
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
                  Confirm & Pay
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
