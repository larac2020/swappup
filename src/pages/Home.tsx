import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { MiniListingCard } from "@/components/listings/MiniListingCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plane, Plus, ArrowRight, Ticket, ShoppingBag, Heart, Loader2, History, Flame, Star, Zap, Sparkles, TrainFront, AlertCircle, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useLanguage } from "@/i18n/LanguageContext";

type ListingTypeFilter = "all" | "flight_ticket" | "train_ticket";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [typeFilter, setTypeFilter] = useState<ListingTypeFilter>("all");

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Traveler";

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

  const { data: myListingsCount = 0 } = useQuery({
    queryKey: ["myListingsCount", profile?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", profile!.id)
        .eq("is_active", true);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile?.id,
  });

  const { data: favoritesCount = 0 } = useQuery({
    queryKey: ["favoritesCount", profile?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile?.id,
  });

  const { data: recentSearches = [] } = useQuery({
    queryKey: ["recentSearches", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_history")
        .select("*")
        .eq("user_id", profile!.id)
        .order("searched_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      const seen = new Set<string>();
      return data.filter((s) => {
        const key = `${s.destination_city}-${s.destination_country}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 4);
    },
    enabled: !!profile?.id,
  });

  // Hot Deals (bumped listings)
  const { data: hotDeals = [], isLoading: loadingHot } = useQuery({
    queryKey: ["hotDeals"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("is_active", true)
        .gte("bumped_until", now)
        .order("bumped_until", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  // Under €100
  const { data: budgetDeals = [], isLoading: loadingBudget } = useQuery({
    queryKey: ["budgetDeals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("is_active", true)
        .lte("price", 100)
        .order("price", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  // Last minute deals (next 7 days)
  const { data: lastMinuteDeals = [], isLoading: loadingLastMinute } = useQuery({
    queryKey: ["lastMinuteDeals"],
    queryFn: async () => {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("is_active", true)
        .gte("departure_date", today.toISOString().split("T")[0])
        .lte("departure_date", nextWeek.toISOString().split("T")[0])
        .order("departure_date", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  // Most popular (most favorited)
  const { data: popularListings = [], isLoading: loadingPopular } = useQuery({
    queryKey: ["popularListings"],
    queryFn: async () => {
      const { data: favs, error: favErr } = await supabase
        .from("favorites")
        .select("listing_id");
      if (favErr) throw favErr;

      const counts: Record<string, number> = {};
      favs.forEach((f) => {
        counts[f.listing_id] = (counts[f.listing_id] || 0) + 1;
      });

      const topIds = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);

      if (topIds.length === 0) return [];

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .in("id", topIds)
        .eq("is_active", true);
      if (error) throw error;
      return (data || []).sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
    },
  });

  // From favorite city
  const { data: fromFavCity = [], isLoading: loadingFavCity } = useQuery({
    queryKey: ["fromFavCity", profile?.favorite_departure_city],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("is_active", true)
        .eq("origin_city", profile!.favorite_departure_city!)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.favorite_departure_city,
  });

  // Latest deals
  const { data: latestDeals = [], isLoading: loadingLatest } = useQuery({
    queryKey: ["recommendations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  // Pending sales awaiting seller's name-change / transfer action
  const { data: pendingSales = [] } = useQuery({
    queryKey: ["pendingSellerTransfers", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("id, listing_id, transfer_deadline, listings(title, origin_city, destination_city)")
        .eq("seller_id", profile!.id)
        .eq("seller_transferred", false)
        .in("status", ["paid", "pending_transfer"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile?.id,
  });

  // Filter listings client-side based on the selected type filter.
  const applyTypeFilter = (rows: any[]): any[] => {
    if (typeFilter === "all") {
      // Hide travel credits everywhere; show only flights and trains.
      return rows.filter((r) => {
        const t = r.listing_type || "flight_ticket";
        return t === "flight_ticket" || t === "train_ticket";
      });
    }
    return rows.filter((r) => (r.listing_type || "flight_ticket") === typeFilter);
  };

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    listings: any[],
    isLoading: boolean,
    browseLink?: string
  ) => {
    const filtered = applyTypeFilter(listings);
    if (!isLoading && filtered.length === 0) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
          {browseLink && (
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => navigate(browseLink)}>
              {t("seeAll")}
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 px-4 scrollbar-hide">
            {filtered.map((listing) => (
              <MiniListingCard
                key={listing.id}
                id={listing.id}
                originCity={listing.origin_city}
                destinationCity={listing.destination_city}
                departureDate={listing.departure_date}
                price={Number(listing.price)}
                originalPrice={listing.original_price ? Number(listing.original_price) : undefined}
                airline={listing.airline}
                imageUrl={listing.destination_image_url ?? undefined}
                listingType={(listing as any).listing_type ?? "flight_ticket"}
                creditType={(listing as any).credit_type}
                title={listing.title}
                operator={(listing as any).operator}
                currency={(listing as any).currency || "EUR"}
                originAirport={(listing as any).origin_airport ?? undefined}
                destinationAirport={(listing as any).destination_airport ?? undefined}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative px-4 pt-6 pb-4">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>
          
          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{t("homeWelcomeBack")}</p>
                <h1 className="text-xl font-display font-bold">{firstName} ✈️</h1>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <Button variant="gold" size="sm" onClick={() => navigate("/sell")}>
                  <Plus className="w-4 h-4" />
                  {t("sell")}
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => navigate("/listings")} className="glass rounded-xl p-2.5 text-center hover:border-primary/30 transition-colors">
                <Ticket className="w-4 h-4 text-primary mx-auto mb-0.5" />
                <p className="text-base font-bold">{myListingsCount}</p>
                <p className="text-[10px] text-muted-foreground">{t("homeListings")}</p>
              </button>
              <button onClick={() => navigate("/account/transactions?type=sold")} className="glass rounded-xl p-2.5 text-center hover:border-primary/30 transition-colors">
                <Tag className="w-4 h-4 text-primary mx-auto mb-0.5" />
                <p className="text-base font-bold">{profile?.transactions_sold ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">{t("accountSold")}</p>
              </button>
              <button onClick={() => navigate("/account/purchases")} className="glass rounded-xl p-2.5 text-center hover:border-primary/30 transition-colors">
                <ShoppingBag className="w-4 h-4 text-primary mx-auto mb-0.5" />
                <p className="text-base font-bold">{profile?.transactions_bought ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">{t("homePurchases")}</p>
              </button>
              <button onClick={() => navigate("/account/favorites")} className="glass rounded-xl p-2.5 text-center hover:border-primary/30 transition-colors">
                <Heart className="w-4 h-4 text-primary mx-auto mb-0.5" />
                <p className="text-base font-bold">{favoritesCount}</p>
                <p className="text-[10px] text-muted-foreground">{t("homeFavorites")}</p>
              </button>
            </div>
          </div>
        </div>

        {/* Segmented Type Filter — always visible */}
        <div className="px-4">
          {pendingSales.length > 0 && (
            <div className="mb-3 space-y-2">
              {pendingSales.map((sale: any) => {
                const deadline = sale.transfer_deadline ? new Date(sale.transfer_deadline) : null;
                const hoursLeft = deadline ? Math.max(0, Math.round((deadline.getTime() - Date.now()) / 3600000)) : null;
                const route = sale.listings ? `${sale.listings.origin_city} → ${sale.listings.destination_city}` : sale.listings?.title;
                return (
                  <button
                    key={sale.id}
                    onClick={() => navigate(`/account/purchases?sale=${sale.id}`)}
                    className="w-full text-left rounded-xl p-3 border border-primary/40 bg-primary/10 hover:bg-primary/15 transition-colors flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Ticket sold — complete the name change</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {route}
                        {hoursLeft !== null && ` • ${hoursLeft}h left to transfer`}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary mt-1" />
                  </button>
                );
              })}
            </div>
          )}
          <div className="glass rounded-xl p-1 flex gap-1">
            {([
              { value: "all" as const, label: t("browseAll"), icon: <Sparkles className="w-3.5 h-3.5" /> },
              { value: "flight_ticket" as const, label: t("browseFlights"), icon: <Plane className="w-3.5 h-3.5 -rotate-45" /> },
              { value: "train_ticket" as const, label: t("browseTrains"), icon: <TrainFront className="w-3.5 h-3.5" /> },
            ]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTypeFilter(opt.value)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
                  typeFilter === opt.value
                    ? "bg-primary text-primary-foreground shadow-glow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-4">
              <History className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">{t("homeRecentlySearched")}</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 px-4 scrollbar-hide">
              {recentSearches.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/browse?destination=${encodeURIComponent(s.destination_city || "")}`)}
                  className="flex-shrink-0 glass rounded-lg px-3 py-2 text-left hover:bg-secondary/50 transition-colors"
                >
                  <p className="font-medium text-xs">{s.destination_city}</p>
                  <p className="text-[10px] text-muted-foreground">{s.destination_country}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hot Deals (bumped) */}
        {renderSection(
          t("homeHotDeals"),
          <Sparkles className="w-4 h-4 text-primary" />,
          hotDeals,
          loadingHot,
          "/browse"
        )}

        {/* From Favorite City */}
        {profile?.favorite_departure_city && renderSection(
          t("homeFromCity", { city: profile.favorite_departure_city }),
          <Plane className="w-4 h-4 text-primary" />,
          fromFavCity,
          loadingFavCity,
          `/browse?origin=${encodeURIComponent(profile.favorite_departure_city)}`
        )}

        {/* Under €100 */}
        {renderSection(
          t("homeUnder100"),
          <Zap className="w-4 h-4 text-primary" />,
          budgetDeals,
          loadingBudget,
          "/browse"
        )}

        {/* Last Minute */}
        {renderSection(
          t("homeLastMinute"),
          <Flame className="w-4 h-4 text-primary" />,
          lastMinuteDeals,
          loadingLastMinute,
          "/browse"
        )}

        {/* Most Popular */}
        {renderSection(
          t("homeMostPopular"),
          <Star className="w-4 h-4 text-primary" />,
          popularListings,
          loadingPopular,
          "/browse"
        )}

        {/* Latest */}
        {renderSection(
          t("homeJustAdded"),
          <ArrowRight className="w-4 h-4 text-primary" />,
          latestDeals,
          loadingLatest,
          "/browse"
        )}

        {/* CTA Section */}
        <div className="px-4 pb-6">
          <div className="glass rounded-xl p-4 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl gradient-gold shadow-glow">
              <Plane className="w-5 h-5 text-primary-foreground -rotate-45" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">{t("homeGotTickets")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("homeGotTicketsDesc")}
              </p>
            </div>
            <Button variant="gold" className="w-full" size="sm" onClick={() => navigate("/sell")}>
              {t("homeStartSelling")}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
