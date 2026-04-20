import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingFilters, FilterState, defaultFilters } from "@/components/listings/ListingFilters";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Calendar as CalendarIcon, Plane, Package, ArrowUpDown, Sparkles, Search, CreditCard, Ticket } from "lucide-react";
import { addDays, subDays, startOfMonth, endOfMonth, format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

type SortOption = "newest" | "price_low" | "price_high" | "date_soon";

export default function Browse() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialDestination = searchParams.get("destination") || "";
  const initialType = searchParams.get("type") || "all";

  const [searchQuery, setSearchQuery] = useState("");
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date_soon");
  const [listingTypeFilter, setListingTypeFilter] = useState<"all" | "flights" | "credits">(
    initialType === "credits" ? "credits" : "all"
  );
  const [aiAppliedFilters, setAiAppliedFilters] = useState<FilterState | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    destination: initialDestination,
  });

  const handleAiSearch = async () => {
    if (!aiSearchQuery.trim()) return;

    setIsAiSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-search", {
        body: { query: aiSearchQuery }
      });

      if (error) throw error;

      console.log("AI search raw response:", JSON.stringify(data));
      
      if (data?.success && data?.params) {
        const params = data.params;
        console.log("AI extracted params:", JSON.stringify(params));
        
        // Update filters based on AI response
        const newFilters: FilterState = {
          ...filters,
          destination: params.destinationCity || filters.destination,
          destinationCountry: params.destinationCountry || filters.destinationCountry,
          departureDateFrom: params.departureDate || filters.departureDateFrom,
          departureDateTo: params.returnDate || filters.departureDateTo,
          minPrice: params.minPrice ?? filters.minPrice,
          maxPrice: params.maxPrice ?? filters.maxPrice,
          ticketCount: params.ticketCount ?? filters.ticketCount,
          tags: params.tags?.length > 0 ? params.tags : filters.tags,
          airlines: params.airlines?.length > 0 ? params.airlines : filters.airlines,
          mealIncluded: params.mealIncluded ?? filters.mealIncluded,
          luggageIncluded: params.luggageIncluded ?? filters.luggageIncluded,
          carryOnIncluded: params.carryOnIncluded ?? filters.carryOnIncluded,
          directOnly: params.directOnly ?? filters.directOnly,
          flexOption: params.flexibility !== undefined 
            ? (params.flexibility === 0 ? "exact" : params.flexibility === 1 ? "+-1" : "+-3")
            : filters.flexOption,
        };
        console.log("New filters being applied:", JSON.stringify(newFilters));
        setFilters(newFilters);
        setAiAppliedFilters(newFilters);

        toast.success(t("browseSearchApplied"));
      } else {
        toast.error(t("browseSearchFailed"));
      }
    } catch (error) {
      console.error("AI search error:", error);
      toast.error(t("browseSearchError"));
    } finally {
      setIsAiSearching(false);
    }
  };

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
      // Listing type filter
      const lt = (listing as any).listing_type || "flight_ticket";
      if (listingTypeFilter === "flights" && lt !== "flight_ticket") return false;
      if (listingTypeFilter === "credits" && lt !== "travel_credit") return false;

      // Text search (optional)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          listing.destination_city.toLowerCase().includes(query) ||
          listing.destination_country.toLowerCase().includes(query) ||
          listing.origin_city.toLowerCase().includes(query) ||
          listing.airline.toLowerCase().includes(query) ||
          listing.title.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // === REQUIRED FILTERS: From / To ===
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

      // === OPTIONAL FILTERS: only apply when explicitly set ===
      const price = Number(listing.price);
      if (filters.minPrice > 0 && price < filters.minPrice) return false;
      if (filters.maxPrice < 2000 && price > filters.maxPrice) return false;

      if (filters.ticketCount > 0) {
        if (filters.ticketCount <= 3) {
          // 1, 2, 3 = exact match
          if (listing.ticket_count !== filters.ticketCount) return false;
        } else {
          // 4+ = minimum
          if (listing.ticket_count < filters.ticketCount) return false;
        }
      }

      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((tag) => listing.tags?.includes(tag as any));
        if (!hasMatchingTag) return false;
      }

      // Dates - only filter if explicitly set
      if (dateRange.from && listing.departure_date < dateRange.from) return false;
      if (dateRange.to && listing.departure_date > dateRange.to) return false;

      // Airlines - only filter if explicitly selected
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
  }, [listings, searchQuery, filters, listingTypeFilter]);

  const sortedListings = useMemo(() => {
    const sorted = [...filteredListings];
    const now = new Date().toISOString().split("T")[0];
    switch (sortBy) {
      case "price_low":
        return sorted.sort((a, b) => Number(a.price) - Number(b.price));
      case "price_high":
        return sorted.sort((a, b) => Number(b.price) - Number(a.price));
      case "date_soon":
        return sorted
          .filter(l => l.departure_date >= now)
          .sort((a, b) => a.departure_date.localeCompare(b.departure_date))
          .concat(sorted.filter(l => l.departure_date < now).sort((a, b) => b.departure_date.localeCompare(a.departure_date)));
      default:
        return sorted;
    }
  }, [filteredListings, sortBy]);

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

    const hasRouteFilter = (filters.origin && filters.origin !== "any") || (filters.destination && filters.destination !== "any") || (filters.originCountry && filters.originCountry !== "any") || (filters.destinationCountry && filters.destinationCountry !== "any");
    const hasDateFilter = !!filters.departureDateFrom || !!filters.departureDateTo || filters.flexOption !== "exact";

    // 1. Same route, different dates — show when any route filter is set
    if (hasRouteFilter) {
      const items = addUnique(listings.filter(l => matchOrigin(l) && matchDest(l) && !matchDates(l)));
      if (items.length > 0) {
        markUsed(items);
        suggestions.push({ title: "Same trip, other dates available", icon: <CalendarIcon className="w-4 h-4" />, items });
      }
    }

    // 2. Same dates, different destinations — show when any date filter is set
    if (hasDateFilter) {
      const items = addUnique(listings.filter(l => matchDates(l) && (!matchDest(l) || !hasRouteFilter)));
      if (items.length > 0) {
        markUsed(items);
        suggestions.push({ title: "Other destinations in your selected dates", icon: <MapPin className="w-4 h-4" />, items });
      }
    }

    // 3. Same route & dates, different airline/amenities
    if (filters.airlines.length > 0 || filters.luggageIncluded || filters.mealIncluded || filters.directOnly) {
      const items = addUnique(listings.filter(l => {
        if (!matchOrigin(l) || !matchDest(l) || !matchDates(l)) return false;
        if (filters.airlines.length > 0 && filters.airlines.some(a => l.airline.toLowerCase() === a.toLowerCase())) return false;
        return true;
      }));
      const amenityItems = addUnique(listings.filter(l => {
        if (!matchOrigin(l) || !matchDest(l) || !matchDates(l)) return false;
        const airlineOk = filters.airlines.length === 0 || filters.airlines.some(a => l.airline.toLowerCase() === a.toLowerCase());
        if (!airlineOk) return false;
        return (filters.luggageIncluded && !l.luggage_included) ||
          (filters.mealIncluded && !l.meal_included) ||
          (filters.directOnly && (l.stopovers ?? 0) > 0);
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
          <h1 className="text-2xl font-display font-bold">{t("browseFindDeals")}</h1>
          <p className="text-muted-foreground">{t("browseSubtitle")}</p>
        </div>

        {/* Listing Type Tabs */}
        <div className="flex gap-2">
          {[
            { value: "all" as const, label: t("browseAll"), icon: <Search className="w-3.5 h-3.5" /> },
            { value: "flights" as const, label: t("browseFlights"), icon: <Ticket className="w-3.5 h-3.5" /> },
            { value: "credits" as const, label: t("browseCreditsVouchers"), icon: <CreditCard className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <Button
              key={tab.value}
              variant={listingTypeFilter === tab.value ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setListingTypeFilter(tab.value)}
            >
              {tab.icon}
              {tab.label}
            </Button>
          ))}
        </div>

        {/* AI Natural Language Search */}
        <div className="glass rounded-xl p-4 border border-border/50 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">{t("browseAiSearch")}</h2>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={t("browseAiPlaceholder")}
              value={aiSearchQuery}
              onChange={(e) => setAiSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleAiSearch} 
              disabled={isAiSearching || !aiSearchQuery.trim()}
              size="icon"
            >
              {isAiSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <ListingFilters
          onSearch={setSearchQuery}
          onFilterChange={setFilters}
          resultCount={filteredListings.length}
          initialDestination={initialDestination}
          availableDates={availableDates}
          allListings={listings}
          externalFilters={aiAppliedFilters}
        />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Sort bar */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t("filterResults", { count: sortedListings.length })}</p>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-44 h-9 text-sm glass border-border/50">
                  <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_soon">{t("browseSortSoonest")}</SelectItem>
                  <SelectItem value="price_low">{t("browseSortPriceLow")}</SelectItem>
                  <SelectItem value="price_high">{t("browseSortPriceHigh")}</SelectItem>
                  <SelectItem value="newest">{t("browseSortNewest")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedListings.map((listing) => (
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
                  listingType={(listing as any).listing_type ?? "flight_ticket"}
                  creditType={(listing as any).credit_type}
                  creditValue={(listing as any).credit_value ? Number((listing as any).credit_value) : undefined}
                  creditCurrency={(listing as any).credit_currency}
                  creditExpiryDate={(listing as any).credit_expiry_date}
                />
              ))}
            </div>

            {sortedListings.length === 0 && (
              <div className="space-y-8">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t("browseNoResults")}</p>
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
                          listingType={(listing as any).listing_type ?? "flight_ticket"}
                          creditType={(listing as any).credit_type}
                          creditValue={(listing as any).credit_value ? Number((listing as any).credit_value) : undefined}
                          creditCurrency={(listing as any).credit_currency}
                          creditExpiryDate={(listing as any).credit_expiry_date}
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
