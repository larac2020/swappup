import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, X, MapPin, Tag, Users, Loader2, Calendar as CalendarIcon, Plane as PlaneIcon, Luggage, UtensilsCrossed, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { airlines } from "@/data/flightData";

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
  resultCount: number;
  initialDestination?: string;
}

export interface FilterState {
  destination: string;
  origin: string;
  minPrice: number;
  maxPrice: number;
  ticketCount: number;
  tags: string[];
  departureDateFrom?: string;
  departureDateTo?: string;
  airline: string;
  luggageIncluded?: boolean;
  mealIncluded?: boolean;
  carryOnIncluded?: boolean;
  directOnly?: boolean;
}

const defaultFilters: FilterState = {
  destination: "",
  origin: "",
  minPrice: 0,
  maxPrice: 2000,
  ticketCount: 0,
  tags: [],
  departureDateFrom: undefined,
  departureDateTo: undefined,
  airline: "",
  luggageIncluded: undefined,
  mealIncluded: undefined,
  carryOnIncluded: undefined,
  directOnly: undefined,
};

interface LocationOption {
  city: string;
  country: string;
  type: "origin" | "destination";
}

export function ListingFilters({ onSearch, onFilterChange, resultCount, initialDestination }: ListingFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    destination: initialDestination || "",
  });
  const [maxPrice, setMaxPrice] = useState(2000);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [showAirlineDropdown, setShowAirlineDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);
  const airlineRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

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
    const all = locations;
    const map = new Map<string, LocationOption>();
    all.forEach((l) => {
      const key = `${l.city}-${l.country}`;
      if (!map.has(key)) map.set(key, { ...l, type: "origin" });
    });
    return Array.from(map.values());
  }, [locations]);

  const destLocations = useMemo(() => {
    const all = locations;
    const map = new Map<string, LocationOption>();
    all.forEach((l) => {
      const key = `${l.city}-${l.country}`;
      if (!map.has(key)) map.set(key, { ...l, type: "destination" });
    });
    return Array.from(map.values());
  }, [locations]);

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

  const filteredAirlines = useMemo(() => {
    if (!filters.airline) return airlines;
    const q = filters.airline.toLowerCase();
    return airlines.filter((a) => a.name.toLowerCase().includes(q));
  }, [filters.airline]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) setShowFromDropdown(false);
      if (toRef.current && !toRef.current.contains(e.target as Node)) setShowToDropdown(false);
      if (airlineRef.current && !airlineRef.current.contains(e.target as Node)) setShowAirlineDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  const selectAirline = (name: string) => {
    updateFilters({ airline: name });
    setShowAirlineDropdown(false);
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    updateFilters({ tags: newTags });
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setMaxPrice(2000);
    onFilterChange(defaultFilters);
  };

  const activeFilterCount =
    (filters.destination ? 1 : 0) +
    (filters.origin ? 1 : 0) +
    (filters.maxPrice < 2000 ? 1 : 0) +
    (filters.ticketCount > 0 ? 1 : 0) +
    (filters.departureDateFrom ? 1 : 0) +
    (filters.departureDateTo ? 1 : 0) +
    (filters.airline ? 1 : 0) +
    (filters.luggageIncluded ? 1 : 0) +
    (filters.mealIncluded ? 1 : 0) +
    (filters.carryOnIncluded ? 1 : 0) +
    (filters.directOnly ? 1 : 0) +
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
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{resultCount} results</span>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear all
                    </Button>
                  )}
                </div>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* From (Origin) */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <PlaneIcon className="w-4 h-4 text-primary rotate-45" />
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
                          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="text-sm">{loc.city}, {loc.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* To (Destination) */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <PlaneIcon className="w-4 h-4 text-primary -rotate-45" />
                  To
                </Label>
                <div className="relative" ref={toRef}>
                  <Input
                    placeholder="Destination city"
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

              {/* Departure Date Range */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  Departure Dates
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal text-sm h-10", !filters.departureDateFrom && "text-muted-foreground")}>
                        {filters.departureDateFrom ? format(new Date(filters.departureDateFrom), "dd MMM yy") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.departureDateFrom ? new Date(filters.departureDateFrom) : undefined}
                        onSelect={(d) => updateFilters({ departureDateFrom: d ? d.toISOString().split("T")[0] : undefined })}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal text-sm h-10", !filters.departureDateTo && "text-muted-foreground")}>
                        {filters.departureDateTo ? format(new Date(filters.departureDateTo), "dd MMM yy") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.departureDateTo ? new Date(filters.departureDateTo) : undefined}
                        onSelect={(d) => updateFilters({ departureDateTo: d ? d.toISOString().split("T")[0] : undefined })}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Airline */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <PlaneIcon className="w-4 h-4 text-primary" />
                  Airline
                </Label>
                <div className="relative" ref={airlineRef}>
                  <Input
                    placeholder="Any airline"
                    value={filters.airline}
                    onChange={(e) => {
                      updateFilters({ airline: e.target.value });
                      setShowAirlineDropdown(true);
                    }}
                    onFocus={() => setShowAirlineDropdown(true)}
                    className="bg-secondary/50 border-border/50"
                  />
                  {showAirlineDropdown && filteredAirlines.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                      {filteredAirlines.map((a, i) => (
                        <button
                          key={i}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors"
                          onClick={() => selectAirline(a.name)}
                        >
                          <span className="text-sm">{a.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Max Price (single thumb, starts at max) */}
              <div className="space-y-4">
                <Label className="flex items-center justify-between">
                  <span>Max Price</span>
                  <span className="text-primary font-semibold">€{maxPrice}</span>
                </Label>
                <Slider
                  value={[maxPrice]}
                  min={0}
                  max={2000}
                  step={25}
                  onValueChange={(value) => {
                    setMaxPrice(value[0]);
                    updateFilters({ minPrice: 0, maxPrice: value[0] });
                  }}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>€0</span>
                  <span>€2,000</span>
                </div>
              </div>

              {/* Direct flights only */}
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  Direct flights only
                </Label>
                <Switch
                  checked={filters.directOnly || false}
                  onCheckedChange={(checked) => updateFilters({ directOnly: checked || undefined })}
                />
              </div>

              {/* Included amenities */}
              <div className="space-y-3">
                <Label>Includes</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Luggage className="w-4 h-4 text-muted-foreground" />
                      Luggage
                    </div>
                    <Switch
                      checked={filters.luggageIncluded || false}
                      onCheckedChange={(checked) => updateFilters({ luggageIncluded: checked || undefined })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      Carry-on
                    </div>
                    <Switch
                      checked={filters.carryOnIncluded || false}
                      onCheckedChange={(checked) => updateFilters({ carryOnIncluded: checked || undefined })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <UtensilsCrossed className="w-4 h-4 text-muted-foreground" />
                      Meal
                    </div>
                    <Switch
                      checked={filters.mealIncluded || false}
                      onCheckedChange={(checked) => updateFilters({ mealIncluded: checked || undefined })}
                    />
                  </div>
                </div>
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
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">{resultCount} results</span>
          {filters.origin && (
            <Badge variant="secondary" className="gap-1">
              From: {filters.origin}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ origin: "" })} />
            </Badge>
          )}
          {filters.destination && (
            <Badge variant="secondary" className="gap-1">
              To: {filters.destination}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ destination: "" })} />
            </Badge>
          )}
          {filters.departureDateFrom && (
            <Badge variant="secondary" className="gap-1">
              From: {format(new Date(filters.departureDateFrom), "dd MMM")}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ departureDateFrom: undefined })} />
            </Badge>
          )}
          {filters.departureDateTo && (
            <Badge variant="secondary" className="gap-1">
              Until: {format(new Date(filters.departureDateTo), "dd MMM")}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ departureDateTo: undefined })} />
            </Badge>
          )}
          {filters.airline && (
            <Badge variant="secondary" className="gap-1">
              {filters.airline}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ airline: "" })} />
            </Badge>
          )}
          {filters.maxPrice < 2000 && (
            <Badge variant="secondary" className="gap-1">
              Max €{filters.maxPrice}
              <X className="w-3 h-3 cursor-pointer" onClick={() => {
                setMaxPrice(2000);
                updateFilters({ minPrice: 0, maxPrice: 2000 });
              }} />
            </Badge>
          )}
          {filters.directOnly && (
            <Badge variant="secondary" className="gap-1">
              Direct only
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ directOnly: undefined })} />
            </Badge>
          )}
          {filters.luggageIncluded && (
            <Badge variant="secondary" className="gap-1">
              Luggage
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ luggageIncluded: undefined })} />
            </Badge>
          )}
          {filters.carryOnIncluded && (
            <Badge variant="secondary" className="gap-1">
              Carry-on
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ carryOnIncluded: undefined })} />
            </Badge>
          )}
          {filters.mealIncluded && (
            <Badge variant="secondary" className="gap-1">
              Meal
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ mealIncluded: undefined })} />
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
