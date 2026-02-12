import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { ListingCard } from "@/components/listings/ListingCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plane, Plus, ArrowRight, Ticket, TrendingUp, Star, Loader2 } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Traveler";

  // Fetch user profile for stats
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

  // Fetch active listings for user (as seller)
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

  // Fetch recommended listings (latest active listings)
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

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass rounded-xl p-3 text-center">
                <Ticket className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{myListingsCount}</p>
                <p className="text-xs text-muted-foreground">Active Listings</p>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" />
                <p className="text-lg font-bold">{profile?.transactions_bought ?? 0}</p>
                <p className="text-xs text-muted-foreground">Bought</p>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <Star className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{profile?.transactions_sold ?? 0}</p>
                <p className="text-xs text-muted-foreground">Sold</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended For You */}
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
              <Plane className="w-7 h-7 text-primary-foreground" />
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
