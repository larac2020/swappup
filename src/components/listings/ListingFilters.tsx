import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, X, MapPin, Tag, Users, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

const tags = [
  { value: "city_trip", label: "City Trip" },
  { value: "beach", label: "Beach" },
  { value: "winter_holiday", label: "Winter Holiday" },
  { value: "ski_trip", label: "Ski Trip" },
  { value: "adventure", label: "Adventure" },
  { value: "romantic", label: "Romantic" },
  { value: "family", label: "Family" },
  { value: "business", label: "Business" },
];

interface ListingFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterState) => void;
  initialDestination?: string;
}

export interface FilterState {
  destination: string;
  origin: string;
  minPrice: number;
  maxPrice: number;
  ticketCount: number;
  tags: string[];
}

const defaultFilters: FilterState = {
  destination: "",
  origin: "",
  minPrice: 0,
  maxPrice: 2000,
  ticketCount: 0,
  tags: [],
};

interface LocationOption {
  city: string;
  country: string;
  type: "origin" | "destination";
}

export function ListingFilters({ onSearch, onFilterChange, initialDestination }: ListingFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    destination: initialDestination || "",
  });
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Fetch user profile for search history
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch all unique locations from listings
  const { data: locations = [] } = useQuery({
    queryKey: ["listing-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("origin_city, origin_country, destination_city, destination_country")
        .eq("is_active", true);
      if (error) throw error;

      const locMap = new Map<string, LocationOption>();
      data.forEach((l) => {
        const oKey = `${l.origin_city}-${l.origin_country}-origin`;
        if (!locMap.has(oKey)) locMap.set(oKey, { city: l.origin_city, country: l.origin_country, type: "origin" });
        const dKey = `${l.destination_city}-${l.destination_country}-destination`;
        if (!locMap.has(dKey)) locMap.set(dKey, { city: l.destination_city, country: l.destination_country, type: "destination" });
      });
      return Array.from(locMap.values());
    },
  });

  const originLocations = useMemo(() => {
    const origins = locations.filter((l) => l.type === "origin");
    // Also include destinations as possible origins (for flexibility)
    const dests = locations.filter((l) => l.type === "destination");
    const map = new Map<string, LocationOption>();
    [...origins, ...dests].forEach((l) => {
      const key = `${l.city}-${l.country}`;
      if (!map.has(key)) map.set(key, { ...l, type: "origin" });
    });
    return Array.from(map.values());
  }, [locations]);

  const destLocations = useMemo(() => {
    const dests = locations.filter((l) => l.type === "destination");
    const origins = locations.filter((l) => l.type === "origin");
    const map = new Map<string, LocationOption>();
    [...dests, ...origins].forEach((l) => {
      const key = `${l.city}-${l.country}`;
      if (!map.has(key)) map.set(key, { ...l, type: "destination" });
    });
    return Array.from(map.values());
  }, [locations]);

  // Search suggestions: combine locations + airlines
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { label: string; sublabel: string }[] = [];
    const seen = new Set<string>();

    locations.forEach((l) => {
      const key = `${l.city}-${l.country}`;
      if (!seen.has(key) && (l.city.toLowerCase().includes(q) || l.country.toLowerCase().includes(q))) {
        seen.add(key);
        results.push({ label: l.city, sublabel: l.country });
      }
    });
    return results.slice(0, 6);
  }, [searchQuery, locations]);

  const filteredFrom = useMemo(() => {
    if (!filters.origin) return originLocations;
    const q = filters.origin.toLowerCase();
    return originLocations.filter((l) => l.city.toLowerCase().includes(q) || l.country.toLowerCase().includes(q));
  }, [filters.origin, originLocations]);

  const filteredTo = useMemo(() => {
    if (!filters.destination) return destLocations;
    const q = filters.destination.toLowerCase();
    return destLocations.filter((l) => l.city.toLowerCase().includes(q) || l.country.toLowerCase().includes(q));
  }, [filters.destination, destLocations]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) setShowFromDropdown(false);
      if (toRef.current && !toRef.current.contains(e.target as Node)) setShowToDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Apply initial destination filter on mount
  useEffect(() => {
    if (initialDestination) {
      onFilterChange({ ...defaultFilters, destination: initialDestination });
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
    setShowSuggestions(value.trim().length > 0);
  };

  const handleSuggestionClick = (label: string, sublabel: string) => {
    setSearchQuery(label);
    onSearch(label);
    setShowSuggestions(false);
    // Save to search history
    saveSearch(label, sublabel);
  };

  const saveSearch = useCallback(async (city: string, country: string) => {
    if (!profile?.id) return;
    try {
      await supabase.from("search_history").insert({
        user_id: profile.id,
        destination_city: city,
        destination_country: country,
      });
    } catch {}
  }, [profile?.id]);

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const selectFrom = (loc: LocationOption) => {
    updateFilters({ origin: loc.city });
    setShowFromDropdown(false);
  };

  const selectTo = (loc: LocationOption) => {
    updateFilters({ destination: loc.city });
    setShowToDropdown(false);
    saveSearch(loc.city, loc.country);
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    updateFilters({ tags: newTags });
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setPriceRange([0, 2000]);
    onFilterChange(defaultFilters);
  };

  const activeFilterCount =
    (filters.destination ? 1 : 0) +
    (filters.origin ? 1 : 0) +
    (filters.minPrice > 0 || filters.maxPrice < 2000 ? 1 : 0) +
    (filters.ticketCount > 0 ? 1 : 0) +
    filters.tags.length;

  return (
    <div className="space-y-4">
      {/* Search Bar with Auto-suggest */}
      <div className="flex gap-3">
        <div className="relative flex-1" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search destinations, airlines..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
            className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                  onClick={() => handleSuggestionClick(s.label, s.sublabel)}
                >
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.sublabel}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-12 w-12 relative">
              <SlidersHorizontal className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md bg-card border-border overflow-y-auto">
            <SheetHeader className="text-left">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-foreground">Filters</SheetTitle>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                )}
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Destination Dropdown */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Destination
                </Label>
                <div className="relative" ref={toRef}>
                  <Input
                    placeholder="City or country"
                    value={filters.destination}
                    onChange={(e) => {
                      updateFilters({ destination: e.target.value });
                      setShowToDropdown(true);
                    }}
                    onFocus={() => setShowToDropdown(true)}
                    className="bg-secondary/50 border-border/50"
                  />
                  {showToDropdown && filteredTo.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                      {filteredTo.map((loc, i) => (
                        <button
                          key={i}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors"
                          onClick={() => selectTo(loc)}
                        >
                          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="text-sm">{loc.city}, {loc.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Origin Dropdown */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  From
                </Label>
                <div className="relative" ref={fromRef}>
                  <Input
                    placeholder="Departure city"
                    value={filters.origin}
                    onChange={(e) => {
                      updateFilters({ origin: e.target.value });
                      setShowFromDropdown(true);
                    }}
                    onFocus={() => setShowFromDropdown(true)}
                    className="bg-secondary/50 border-border/50"
                  />
                  {showFromDropdown && filteredFrom.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                      {filteredFrom.map((loc, i) => (
                        <button
                          key={i}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors"
                          onClick={() => selectFrom(loc)}
                        >
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">{loc.city}, {loc.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <Label className="flex items-center justify-between">
                  <span>Price Range</span>
                  <span className="text-muted-foreground">
                    €{priceRange[0]} - €{priceRange[1]}
                  </span>
                </Label>
                <Slider
                  value={priceRange}
                  min={0}
                  max={2000}
                  step={25}
                  onValueChange={(value) => {
                    setPriceRange(value);
                    updateFilters({ minPrice: value[0], maxPrice: value[1] });
                  }}
                  className="py-4"
                />
              </div>

              {/* Ticket Count */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Minimum Tickets
                </Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((count) => (
                    <Button
                      key={count}
                      variant={filters.ticketCount === count ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilters({ ticketCount: filters.ticketCount === count ? 0 : count })}
                      className="flex-1"
                    >
                      {count}+
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Trip Type
                </Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.value}
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-all",
                        filters.tags.includes(tag.value)
                          ? "bg-primary/20 border-primary text-primary"
                          : "hover:border-primary/50"
                      )}
                      onClick={() => toggleTag(tag.value)}
                    >
                      {tag.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.destination && (
            <Badge variant="secondary" className="gap-1">
              To: {filters.destination}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ destination: "" })} />
            </Badge>
          )}
          {filters.origin && (
            <Badge variant="secondary" className="gap-1">
              From: {filters.origin}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ origin: "" })} />
            </Badge>
          )}
          {(filters.minPrice > 0 || filters.maxPrice < 2000) && (
            <Badge variant="secondary" className="gap-1">
              €{filters.minPrice}-€{filters.maxPrice}
              <X className="w-3 h-3 cursor-pointer" onClick={() => {
                setPriceRange([0, 2000]);
                updateFilters({ minPrice: 0, maxPrice: 2000 });
              }} />
            </Badge>
          )}
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tags.find((t) => t.value === tag)?.label}
              <X className="w-3 h-3 cursor-pointer" onClick={() => toggleTag(tag)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
