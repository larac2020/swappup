import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingFilters, FilterState } from "@/components/listings/ListingFilters";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function Browse() {
  const [searchParams] = useSearchParams();
  const initialDestination = searchParams.get("destination") || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    destination: initialDestination,
    origin: "",
    minPrice: 0,
    maxPrice: 2000,
    ticketCount: 0,
    tags: [],
  });

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          listing.destination_city.toLowerCase().includes(query) ||
          listing.destination_country.toLowerCase().includes(query) ||
          listing.origin_city.toLowerCase().includes(query) ||
          listing.airline.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (filters.destination) {
        const dest = filters.destination.toLowerCase();
        if (
          !listing.destination_city.toLowerCase().includes(dest) &&
          !listing.destination_country.toLowerCase().includes(dest)
        ) {
          return false;
        }
      }

      if (filters.origin) {
        if (!listing.origin_city.toLowerCase().includes(filters.origin.toLowerCase())) {
          return false;
        }
      }

      if (listing.price < filters.minPrice || listing.price > filters.maxPrice) {
        return false;
      }

      if (filters.ticketCount > 0 && listing.ticket_count < filters.ticketCount) {
        return false;
      }

      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((tag) => listing.tags?.includes(tag as any));
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [listings, searchQuery, filters]);

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Find Tickets</h1>
          <p className="text-muted-foreground">Discover amazing deals from other travelers</p>
        </div>

        <ListingFilters
          onSearch={setSearchQuery}
          onFilterChange={setFilters}
          initialDestination={initialDestination}
        />

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredListings.length} {filteredListings.length === 1 ? "ticket" : "tickets"} found
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
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
        )}

        {!isLoading && filteredListings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tickets match your filters</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
