import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ListingCard } from "@/components/listings/ListingCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, Plus, Loader2 } from "lucide-react";

export default function MyListings() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const activeListings = listings.filter((l) => l.is_active);
  const inactiveListings = listings.filter((l) => !l.is_active);

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ticket className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-display font-bold">My Listings</h1>
          </div>
          <Button variant="gold" size="sm" onClick={() => navigate("/sell")}>
            <Plus className="w-4 h-4" />
            Sell
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : listings.length > 0 ? (
          <div className="space-y-6">
            {activeListings.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground">Active ({activeListings.length})</h2>
                <div className="space-y-4">
                  {activeListings.map((l) => (
                    <ListingCard
                      key={l.id}
                      id={l.id}
                      title={l.title}
                      originCity={l.origin_city}
                      destinationCity={l.destination_city}
                      destinationCountry={l.destination_country}
                      departureDate={l.departure_date}
                      returnDate={l.return_date ?? undefined}
                      price={Number(l.price)}
                      originalPrice={l.original_price ? Number(l.original_price) : undefined}
                      airline={l.airline}
                      ticketCount={l.ticket_count}
                      imageUrl={l.destination_image_url ?? undefined}
                      tags={l.tags as string[] ?? []}
                    />
                  ))}
                </div>
              </div>
            )}
            {inactiveListings.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground">Inactive ({inactiveListings.length})</h2>
                <div className="space-y-4 opacity-60">
                  {inactiveListings.map((l) => (
                    <ListingCard
                      key={l.id}
                      id={l.id}
                      title={l.title}
                      originCity={l.origin_city}
                      destinationCity={l.destination_city}
                      destinationCountry={l.destination_country}
                      departureDate={l.departure_date}
                      returnDate={l.return_date ?? undefined}
                      price={Number(l.price)}
                      originalPrice={l.original_price ? Number(l.original_price) : undefined}
                      airline={l.airline}
                      ticketCount={l.ticket_count}
                      imageUrl={l.destination_image_url ?? undefined}
                      tags={l.tags as string[] ?? []}
                    />
                  ))}
                </div>
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
    </AppLayout>
  );
}
