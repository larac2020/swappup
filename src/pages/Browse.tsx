import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingFilters, FilterState, defaultFilters } from "@/components/listings/ListingFilters";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Calendar as CalendarIcon, Plane, Package } from "lucide-react";
import { addDays, subDays, startOfMonth, endOfMonth, format } from "date-fns";

export default function Browse() {
  const [searchParams] = useSearchParams();
  const initialDestination = searchParams.get("destination") || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    destination: initialDestination,
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

  // Extract available departure dates for calendar highlighting
  const availableDates = useMemo(() => {
    return [...new Set(listings.map(l => l.departure_date))];
  }, [listings]);

  // Compute cheapest price per month for heatmap
  const datePriceMap = useMemo(() => {
    const map: Record<string, number> = {};
    listings.forEach(l => {
      const monthKey = l.departure_date.substring(0, 7); // YYYY-MM
      const price = Number(l.price);
      if (map[monthKey] === undefined || price < map[monthKey]) {
        map[monthKey] = price;
      }
    });
    return map;
  }, [listings]);

  // Compute effective date range based on flex option
  const getDateRange = (f: FilterState) => {
    let from = f.departureDateFrom;
    let to = f.departureDateTo;

    if (f.flexOption === "any") return { from: undefined, to: undefined };

    if (from) {
      if (f.flexOption === "+-1") {
        from = subDays(new Date(from), 1).toISOString().split("T")[0];
        to = to || addDays(new Date(f.departureDateFrom!), 1).toISOString().split("T")[0];
      } else if (f.flexOption === "+-3") {
        from = subDays(new Date(from), 3).toISOString().split("T")[0];
        to = to || addDays(new Date(f.departureDateFrom!), 3).toISOString().split("T")[0];
      } else if (f.flexOption === "month") {
        const d = new Date(from);
        from = startOfMonth(d).toISOString().split("T")[0];
        to = endOfMonth(d).toISOString().split("T")[0];
      }
    }

    return { from, to };
  };

  const filteredListings = useMemo(() => {
    const dateRange = getDateRange(filters);

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

      // Origin country
      if (filters.originCountry && filters.originCountry !== "any") {
        if (!listing.origin_country.toLowerCase().includes(filters.originCountry.toLowerCase())) return false;
      }

      // Origin city
      if (filters.origin && filters.origin !== "any") {
        if (!listing.origin_city.toLowerCase().includes(filters.origin.toLowerCase())) return false;
      }

      // Destination country
      if (filters.destinationCountry && filters.destinationCountry !== "any") {
        if (!listing.destination_country.toLowerCase().includes(filters.destinationCountry.toLowerCase())) return false;
      }

      // Destination city
      if (filters.destination && filters.destination !== "any") {
        if (!listing.destination_city.toLowerCase().includes(filters.destination.toLowerCase())) return false;
      }

      if (listing.price < filters.minPrice || listing.price > filters.maxPrice) return false;
      if (filters.ticketCount > 0 && listing.ticket_count < filters.ticketCount) return false;

      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((tag) => listing.tags?.includes(tag as any));
        if (!hasMatchingTag) return false;
      }

      if (dateRange.from && listing.departure_date < dateRange.from) return false;
      if (dateRange.to && listing.departure_date > dateRange.to) return false;

      // Airlines (multi-select)
      if (filters.airlines.length > 0) {
        if (!filters.airlines.some(a => listing.airline.toLowerCase() === a.toLowerCase())) return false;
      }

      if (filters.luggageIncluded && !listing.luggage_included) return false;
      if (filters.carryOnIncluded && !listing.carry_on_included) return false;
      if (filters.mealIncluded && !listing.meal_included) return false;
      if (filters.directOnly && (listing.stopovers ?? 0) > 0) return false;

      return true;
    });
  }, [listings, searchQuery, filters]);

  // Smart "no results" suggestions
  const noResultSuggestions = useMemo(() => {
    if (filteredListings.length > 0 || listings.length === 0) return null;

    const suggestions: { title: string; icon: React.ReactNode; items: typeof listings }[] = [];

    // 1. Other dates for the same route
    if ((filters.departureDateFrom || filters.departureDateTo) && (filters.origin || filters.destination)) {
      const otherDates = listings.filter(l => {
        const matchOrigin = !filters.origin || filters.origin === "any" || l.origin_city.toLowerCase().includes(filters.origin.toLowerCase());
        const matchDest = !filters.destination || filters.destination === "any" || l.destination_city.toLowerCase().includes(filters.destination.toLowerCase());
        return matchOrigin && matchDest;
      }).slice(0, 6);
      if (otherDates.length > 0) {
        suggestions.push({ title: "Same route, different dates", icon: <CalendarIcon className="w-4 h-4" />, items: otherDates });
      }
    }

    // 2. Other destinations from the same origin city
    if (filters.origin && filters.origin !== "any") {
      const otherDest = listings.filter(l =>
        l.origin_city.toLowerCase().includes(filters.origin.toLowerCase()) &&
        (filters.destination && filters.destination !== "any" ? !l.destination_city.toLowerCase().includes(filters.destination.toLowerCase()) : true)
      ).slice(0, 6);
      if (otherDest.length > 0) {
        suggestions.push({ title: `Other destinations from ${filters.origin}`, icon: <MapPin className="w-4 h-4" />, items: otherDest });
      }
    }

    // 3. Other airlines on the same route
    if (filters.airlines.length > 0 && (filters.origin || filters.destination)) {
      const otherAirlines = listings.filter(l => {
        const matchOrigin = !filters.origin || filters.origin === "any" || l.origin_city.toLowerCase().includes(filters.origin.toLowerCase());
        const matchDest = !filters.destination || filters.destination === "any" || l.destination_city.toLowerCase().includes(filters.destination.toLowerCase());
        return matchOrigin && matchDest && !filters.airlines.some(a => l.airline.toLowerCase() === a.toLowerCase());
      }).slice(0, 6);
      if (otherAirlines.length > 0) {
        suggestions.push({ title: "Other airlines on this route", icon: <Plane className="w-4 h-4" />, items: otherAirlines });
      }
    }

    // 4. Same route without add-on filters
    if (filters.luggageIncluded || filters.mealIncluded || filters.carryOnIncluded) {
      const withoutAddons = listings.filter(l => {
        const matchOrigin = !filters.origin || filters.origin === "any" || l.origin_city.toLowerCase().includes(filters.origin.toLowerCase());
        const matchDest = !filters.destination || filters.destination === "any" || l.destination_city.toLowerCase().includes(filters.destination.toLowerCase());
        return matchOrigin && matchDest;
      }).slice(0, 6);
      if (withoutAddons.length > 0) {
        suggestions.push({ title: "Same route without add-on filters", icon: <Package className="w-4 h-4" />, items: withoutAddons });
      }
    }

    // 5. Fallback: show cheapest available listings if no other suggestions generated
    if (suggestions.length === 0) {
      const cheapest = [...listings]
        .sort((a, b) => Number(a.price) - Number(b.price))
        .slice(0, 6);
      if (cheapest.length > 0) {
        suggestions.push({ title: "Cheapest available flights", icon: <Package className="w-4 h-4" />, items: cheapest });
      }
    }

    return suggestions.length > 0 ? suggestions : null;
  }, [filteredListings, listings, filters]);

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
          resultCount={filteredListings.length}
          initialDestination={initialDestination}
          availableDates={availableDates}
          datePriceMap={datePriceMap}
        />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
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

            {filteredListings.length === 0 && (
              <div className="space-y-8">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tickets match your filters</p>
                </div>

                {noResultSuggestions && noResultSuggestions.map((section, idx) => (
                  <div key={idx} className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      {section.icon}
                      {section.title}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {section.items.map((listing) => (
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
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
