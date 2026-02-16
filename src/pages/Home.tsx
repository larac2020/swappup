import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { ListingCard } from "@/components/listings/ListingCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plane, Plus, ArrowRight, Ticket, ShoppingBag, Heart, Loader2, History } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const { data: recommendations = [], isLoading: loadingRecs } = useQuery({
    queryKey: ["recommendations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
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

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative px-4 pt-6 pb-8">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>
          
          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Welcome back,</p>
                <h1 className="text-2xl font-display font-bold">{firstName} ✈️</h1>
              </div>
              <Button variant="gold" size="sm" onClick={() => navigate("/sell")}>
                <Plus className="w-4 h-4" />
                Sell Ticket
              </Button>
            </div>

            {/* Quick Stats - clickable */}
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => navigate("/account/listings")} className="glass rounded-xl p-3 text-center hover:border-primary/30 transition-colors">
                <Ticket className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{myListingsCount}</p>
                <p className="text-xs text-muted-foreground">Active Listings</p>
              </button>
              <button onClick={() => navigate("/account/purchases")} className="glass rounded-xl p-3 text-center hover:border-primary/30 transition-colors">
                <ShoppingBag className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{profile?.transactions_bought ?? 0}</p>
                <p className="text-xs text-muted-foreground">Purchases</p>
              </button>
              <button onClick={() => navigate("/favorites")} className="glass rounded-xl p-3 text-center hover:border-primary/30 transition-colors">
                <Heart className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{favoritesCount}</p>
                <p className="text-xs text-muted-foreground">Favorites</p>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="px-4 space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Recently Searched</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {recentSearches.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/browse?destination=${encodeURIComponent(s.destination_city || "")}`)}
                  className="flex-shrink-0 glass rounded-xl px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                >
                  <p className="font-medium text-sm">{s.destination_city}</p>
                  <p className="text-xs text-muted-foreground">{s.destination_country}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Latest Deals */}
        <div className="px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest Deals</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/browse")}>
              See all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {loadingRecs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  originCity={listing.origin_city}
                  destinationCity={listing.destination_city}
                  destinationCountry={listing.destination_country}
                  departureDate={listing.departure_date}
                  returnDate={listing.return_date ?? undefined}
                  price={Number(listing.price)}
                  originalPrice={listing.original_price ? Number(listing.original_price) : undefined}
                  airline={listing.airline}
                  ticketCount={listing.ticket_count}
                  imageUrl={listing.destination_image_url ?? undefined}
                  tags={listing.tags as string[] ?? []}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 glass rounded-2xl">
              <p className="text-muted-foreground">No listings available yet. Be the first to sell!</p>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="px-4 pb-6">
          <div className="glass rounded-2xl p-6 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-gold shadow-glow">
              <Plane className="w-7 h-7 text-primary-foreground -rotate-45" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Got tickets to sell?</h3>
              <p className="text-sm text-muted-foreground">
                List your unused flight tickets and help other travelers save money.
              </p>
            </div>
            <Button variant="gold" className="w-full" onClick={() => navigate("/sell")}>
              Start Selling
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
