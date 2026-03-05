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

  // Compute cheapest price per month for heatmap — filtered by current origin/destination
  const datePriceMap = useMemo(() => {
    const map: Record<string, number> = {};
    listings.forEach(l => {
      // Filter by origin
      if (filters.originCountry && filters.originCountry !== "any" && !l.origin_country.toLowerCase().includes(filters.originCountry.toLowerCase())) return;
      if (filters.origin && filters.origin !== "any" && !l.origin_city.toLowerCase().includes(filters.origin.toLowerCase())) return;
      // Filter by destination
      if (filters.destinationCountry && filters.destinationCountry !== "any" && !l.destination_country.toLowerCase().includes(filters.destinationCountry.toLowerCase())) return;
      if (filters.destination && filters.destination !== "any" && !l.destination_city.toLowerCase().includes(filters.destination.toLowerCase())) return;

      const monthKey = l.departure_date.substring(0, 7);
      const price = Number(l.price);
      if (map[monthKey] === undefined || price < map[monthKey]) {
        map[monthKey] = price;
      }
    });
    return map;
  }, [listings, filters.origin, filters.originCountry, filters.destination, filters.destinationCountry]);

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

      // Toggle filters are optional: only EXCLUDE if toggled ON and listing lacks it
      if (filters.luggageIncluded === true && !listing.luggage_included) return false;
      if (filters.carryOnIncluded === true && !listing.carry_on_included) return false;
      if (filters.mealIncluded === true && !listing.meal_included) return false;
      if (filters.directOnly === true && (listing.stopovers ?? 0) > 0) return false;

      return true;
    });
  }, [listings, searchQuery, filters]);

  // Helper matchers for suggestions
  const matchOrigin = (l: typeof listings[0]) => {
    if (filters.originCountry && filters.originCountry !== "any" && !l.origin_country.toLowerCase().includes(filters.originCountry.toLowerCase())) return false;
    if (filters.origin && filters.origin !== "any" && !l.origin_city.toLowerCase().includes(filters.origin.toLowerCase())) return false;
    return true;
  };
  const matchDest = (l: typeof listings[0]) => {
    if (filters.destinationCountry && filters.destinationCountry !== "any" && !l.destination_country.toLowerCase().includes(filters.destinationCountry.toLowerCase())) return false;
    if (filters.destination && filters.destination !== "any" && !l.destination_city.toLowerCase().includes(filters.destination.toLowerCase())) return false;
    return true;
  };
  const matchDates = (l: typeof listings[0]) => {
    const dateRange = getDateRange(filters);
    if (dateRange.from && l.departure_date < dateRange.from) return false;
    if (dateRange.to && l.departure_date > dateRange.to) return false;
    return true;
  };

  // Smart "no results" suggestions — clearly separated sections
  const noResultSuggestions = useMemo(() => {
    if (filteredListings.length > 0 || listings.length === 0) return null;

    const suggestions: { title: string; icon: React.ReactNode; items: typeof listings }[] = [];
    const usedIds = new Set<string>();

    const addUnique = (items: typeof listings, max = 6) => {
      return items.filter(l => !usedIds.has(l.id)).slice(0, max);
    };
    const markUsed = (items: typeof listings) => {
      items.forEach(l => usedIds.add(l.id));
    };

    // 1. Same route, different dates
    if (filters.origin || filters.destination) {
      const items = addUnique(listings.filter(l => matchOrigin(l) && matchDest(l) && !matchDates(l)));
      if (items.length > 0) {
        markUsed(items);
        suggestions.push({ title: "Same route, different dates", icon: <CalendarIcon className="w-4 h-4" />, items });
      }
    }

    // 2. Same origin & dates, different destination
    if (filters.origin && filters.origin !== "any") {
      const items = addUnique(listings.filter(l => matchOrigin(l) && matchDates(l) && !matchDest(l)));
      if (items.length > 0) {
        markUsed(items);
        const city = filters.origin;
        suggestions.push({ title: `From ${city}, same dates, other destinations`, icon: <MapPin className="w-4 h-4" />, items });
      }
    }

    // 3. Same route & dates, different airline/amenities
    if (filters.airlines.length > 0 || filters.luggageIncluded || filters.mealIncluded || filters.directOnly) {
      const items = addUnique(listings.filter(l => {
        if (!matchOrigin(l) || !matchDest(l) || !matchDates(l)) return false;
        // Must differ in airline or amenities from what was filtered
        if (filters.airlines.length > 0 && filters.airlines.some(a => l.airline.toLowerCase() === a.toLowerCase())) return false;
        return true;
      }));
      // Also include same route/dates but different amenities
      const amenityItems = addUnique(listings.filter(l => {
        if (!matchOrigin(l) || !matchDest(l) || !matchDates(l)) return false;
        // Matches airline but lacks required amenities
        const airlineOk = filters.airlines.length === 0 || filters.airlines.some(a => l.airline.toLowerCase() === a.toLowerCase());
        if (!airlineOk) return false;
        const amenityMismatch = 
          (filters.luggageIncluded && !l.luggage_included) ||
          (filters.mealIncluded && !l.meal_included) ||
          (filters.directOnly && (l.stopovers ?? 0) > 0);
        return amenityMismatch;
      }));
      const combined = addUnique([...items, ...amenityItems]);
      if (combined.length > 0) {
        markUsed(combined);
        suggestions.push({ title: "Same route & dates, other airlines or options", icon: <Plane className="w-4 h-4" />, items: combined });
      }
    }

    // 4. Fallback: cheapest available
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
          allListings={listings}
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
