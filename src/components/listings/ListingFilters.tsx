import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, X, MapPin, Users, Loader2, Calendar as CalendarIcon, Plane as PlaneIcon, Luggage, UtensilsCrossed, Briefcase, Navigation, Star, Globe } from "lucide-react";
import { format, addDays, subDays, startOfMonth, endOfMonth, addMonths, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { airlines, getUniqueCities, getCountries, getCitiesByCountry } from "@/data/flightData";
import { useLanguage } from "@/i18n/LanguageContext";

type FlexOption = "exact" | "+-1" | "+-3" | "month" | "any";

interface ListingFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterState) => void;
  resultCount: number;
  initialDestination?: string;
  availableDates?: string[];
  allListings?: { departure_date: string; price: number; origin_city: string; origin_country: string; destination_city: string; destination_country: string }[];
  externalFilters?: FilterState | null;
}

export interface FilterState {
  destination: string;
  destinationCountry: string;
  origin: string;
  originCountry: string;
  minPrice: number;
  maxPrice: number;
  ticketCount: number;
  departureDateFrom?: string;
  departureDateTo?: string;
  flexOption: FlexOption;
  airlines: string[];
  luggageIncluded?: boolean;
  mealIncluded?: boolean;
  carryOnIncluded?: boolean;
  directOnly?: boolean;
}

export const defaultFilters: FilterState = {
  destination: "",
  destinationCountry: "",
  origin: "",
  originCountry: "",
  minPrice: 0,
  maxPrice: 2000,
  ticketCount: 0,
  departureDateFrom: undefined,
  departureDateTo: undefined,
  flexOption: "exact",
  airlines: [],
  luggageIncluded: undefined,
  mealIncluded: undefined,
  carryOnIncluded: undefined,
  directOnly: undefined,
};

export function ListingFilters({ onSearch, onFilterChange, resultCount, initialDestination, availableDates = [], allListings = [], externalFilters }: ListingFiltersProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    destination: initialDestination || "",
  });

  // Sync external filters (e.g. from AI search) into local state
  useEffect(() => {
    if (externalFilters) {
      setFilters(externalFilters);
      setPriceRange([externalFilters.minPrice, externalFilters.maxPrice]);
      onFilterChange(externalFilters);
    }
  }, [externalFilters]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFromCountry, setShowFromCountry] = useState(false);
  const [showFromCity, setShowFromCity] = useState(false);
  const [showToCountry, setShowToCountry] = useState(false);
  const [showToCity, setShowToCity] = useState(false);
  const [showAirlineDropdown, setShowAirlineDropdown] = useState(false);
  const [currentLocationCity, setCurrentLocationCity] = useState<string | null>(null);
  const [currentLocationCountry, setCurrentLocationCountry] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<FilterState | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const fromCountryRef = useRef<HTMLDivElement>(null);
  const fromCityRef = useRef<HTMLDivElement>(null);
  const toCountryRef = useRef<HTMLDivElement>(null);
  const toCityRef = useRef<HTMLDivElement>(null);
  const airlineRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile-filters", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, favorite_departure_city, favorite_departure_country")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // All locations from active listings for destination suggestions
  const { data: locations = [] } = useQuery({
    queryKey: ["listing-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("origin_city, origin_country, destination_city, destination_country")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const allCountries = useMemo(() => getCountries(), []);
  const allCities = useMemo(() => getUniqueCities().sort((a, b) => a.city.localeCompare(b.city)), []);

  // Derive from-cities based on selected origin country
  const fromCitiesForCountry = useMemo(() => {
    if (!filters.originCountry || filters.originCountry === "any") return allCities.map(c => c.city);
    return getCitiesByCountry(filters.originCountry);
  }, [filters.originCountry, allCities]);

  // Derive to-cities based on selected dest country
  const toCitiesForCountry = useMemo(() => {
    if (!filters.destinationCountry || filters.destinationCountry === "any") return allCities.map(c => c.city);
    return getCitiesByCountry(filters.destinationCountry);
  }, [filters.destinationCountry, allCities]);

  // Unique destination countries from listings
  const destCountriesFromListings = useMemo(() => {
    const set = new Set(locations.map(l => l.destination_country));
    return [...set].sort();
  }, [locations]);

  // Available date set for calendar highlighting
  const availableDateSet = useMemo(() => {
    return new Set(availableDates);
  }, [availableDates]);

  const requestCurrentLocation = useCallback(() => {
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const city = data.city || data.locality || data.principalSubdivision || "";
          const country = data.countryName || "";
          if (city) {
            setCurrentLocationCity(city);
            setCurrentLocationCountry(country);
            localUpdate({ origin: city, originCountry: country });
            setShowFromCountry(false);
            setShowFromCity(false);
          }
        } catch {
        } finally {
          setGeoLoading(false);
        }
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (fromCountryRef.current && !fromCountryRef.current.contains(e.target as Node)) setShowFromCountry(false);
      if (fromCityRef.current && !fromCityRef.current.contains(e.target as Node)) setShowFromCity(false);
      if (toCountryRef.current && !toCountryRef.current.contains(e.target as Node)) setShowToCountry(false);
      if (toCityRef.current && !toCityRef.current.contains(e.target as Node)) setShowToCity(false);
      if (airlineRef.current && !airlineRef.current.contains(e.target as Node)) setShowAirlineDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (initialDestination) {
      const initial = { ...defaultFilters, destination: initialDestination };
      setPendingFilters(initial);
      onFilterChange(initial);
    }
  }, []);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { label: string; sublabel: string }[] = [];
    const seen = new Set<string>();
    locations.forEach((l) => {
      const key = `${l.destination_city}-${l.destination_country}`;
      if (!seen.has(key) && (l.destination_city.toLowerCase().includes(q) || l.destination_country.toLowerCase().includes(q))) {
        seen.add(key);
        results.push({ label: l.destination_city, sublabel: l.destination_country });
      }
    });
    return results.slice(0, 6);
  }, [searchQuery, locations]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
    setShowSuggestions(value.trim().length > 0);
  };

  const handleSuggestionClick = (label: string, sublabel: string) => {
    setSearchQuery(label);
    onSearch(label);
    setShowSuggestions(false);
  };

  // Local update that updates pending state AND notifies parent for live result count
  const localUpdate = (updates: Partial<FilterState>) => {
    const base = pendingFilters || filters;
    const newFilters = { ...base, ...updates };
    setPendingFilters(newFilters);
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Immediate update for search bar / badges
  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    setPendingFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchClick = () => {
    const toApply = pendingFilters || filters;
    setFilters(toApply);
    onFilterChange(toApply);
    setPendingFilters(null);
    setSheetOpen(false);
  };

  const toggleAirline = (name: string) => {
    const current = (pendingFilters || filters).airlines;
    const newAirlines = current.includes(name)
      ? current.filter(a => a !== name)
      : [...current, name];
    localUpdate({ airlines: newAirlines });
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setPendingFilters(null);
    setPriceRange([0, 2000]);
    onFilterChange(defaultFilters);
  };

  const currentFilters = pendingFilters || filters;

  const activeFilterCount =
    (currentFilters.destination ? 1 : 0) +
    (currentFilters.destinationCountry ? 1 : 0) +
    (currentFilters.origin ? 1 : 0) +
    (currentFilters.originCountry ? 1 : 0) +
    (currentFilters.minPrice > 0 || currentFilters.maxPrice < 2000 ? 1 : 0) +
    (currentFilters.ticketCount > 0 ? 1 : 0) +
    (currentFilters.departureDateFrom ? 1 : 0) +
    (currentFilters.departureDateTo ? 1 : 0) +
    (currentFilters.flexOption !== "exact" ? 1 : 0) +
    currentFilters.airlines.length +
    (currentFilters.luggageIncluded ? 1 : 0) +
    (currentFilters.mealIncluded ? 1 : 0) +
    (currentFilters.carryOnIncluded ? 1 : 0) +
    (currentFilters.directOnly ? 1 : 0);

  // Filtered lists for dropdowns with search
  const [fromCountrySearch, setFromCountrySearch] = useState("");
  const [fromCitySearch, setFromCitySearch] = useState("");
  const [toCountrySearch, setToCountrySearch] = useState("");
  const [toCitySearch, setToCitySearch] = useState("");
  const [airlineSearch, setAirlineSearch] = useState("");

  const filteredFromCountries = useMemo(() => {
    const q = fromCountrySearch.toLowerCase();
    return q ? allCountries.filter(c => c.toLowerCase().includes(q)) : allCountries;
  }, [fromCountrySearch, allCountries]);

  const filteredFromCities = useMemo(() => {
    const q = fromCitySearch.toLowerCase();
    return q ? fromCitiesForCountry.filter(c => c.toLowerCase().includes(q)) : fromCitiesForCountry;
  }, [fromCitySearch, fromCitiesForCountry]);

  const filteredToCountries = useMemo(() => {
    const q = toCountrySearch.toLowerCase();
    return q ? allCountries.filter(c => c.toLowerCase().includes(q)) : allCountries;
  }, [toCountrySearch, allCountries]);

  const filteredToCities = useMemo(() => {
    const q = toCitySearch.toLowerCase();
    return q ? toCitiesForCountry.filter(c => c.toLowerCase().includes(q)) : toCitiesForCountry;
  }, [toCitySearch, toCitiesForCountry]);

  const filteredAirlines = useMemo(() => {
    const q = airlineSearch.toLowerCase();
    return q ? airlines.filter(a => a.name.toLowerCase().includes(q)) : airlines;
  }, [airlineSearch]);

  // Compute cheapest price per month filtered by pending origin/destination
  const datePriceMap = useMemo(() => {
    const map: Record<string, number> = {};
    const f = pendingFilters || filters;
    allListings.forEach(l => {
      if (f.originCountry && f.originCountry !== "any" && !l.origin_country.toLowerCase().includes(f.originCountry.toLowerCase())) return;
      if (f.origin && f.origin !== "any" && !l.origin_city.toLowerCase().includes(f.origin.toLowerCase())) return;
      if (f.destinationCountry && f.destinationCountry !== "any" && !l.destination_country.toLowerCase().includes(f.destinationCountry.toLowerCase())) return;
      if (f.destination && f.destination !== "any" && !l.destination_city.toLowerCase().includes(f.destination.toLowerCase())) return;
      const monthKey = l.departure_date.substring(0, 7);
      const price = Number(l.price);
      if (map[monthKey] === undefined || price < map[monthKey]) {
        map[monthKey] = price;
      }
    });
    return map;
  }, [allListings, pendingFilters, filters]);

  // Calendar modifiers for available dates
  const availableDateObjects = useMemo(() => {
    return availableDates.map(d => new Date(d));
  }, [availableDates]);

  const renderDropdown = (
    ref: React.RefObject<HTMLDivElement>,
    show: boolean,
    searchValue: string,
    setSearchValue: (v: string) => void,
    placeholder: string,
    items: { label: string; value: string; icon?: React.ReactNode; isSeparator?: boolean }[],
    onSelect: (value: string) => void,
    selectedValue?: string
  ) => {
    if (!show) return null;
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-hidden">
        <div className="p-2 border-b border-border">
          <Input
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-8 text-sm bg-secondary/30"
            autoFocus
          />
        </div>
        <div className="max-h-48 overflow-y-auto">
          {items.map((item, i) =>
            item.isSeparator ? (
              <div key={`sep-${i}`} className="px-4 py-1"><Separator /></div>
            ) : (
              <button
                key={`${item.value}-${i}`}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors",
                  selectedValue === item.value && "bg-primary/10 text-primary font-medium"
                )}
                onClick={() => onSelect(item.value)}
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span className="text-sm">{item.label}</span>
              </button>
            )
          )}
        </div>
      </div>
    );
  };

  // Build from-country items
  const fromCountryItems = useMemo(() => {
    const items: { label: string; value: string; icon?: React.ReactNode; isSeparator?: boolean }[] = [];
    // Current location
    items.push({
      label: geoLoading ? t("filterLocating") : currentLocationCountry ? t("filterCurrentLocationLabel", { location: currentLocationCountry }) : t("filterCurrentLocation"),
      value: "__current__",
      icon: <Navigation className="w-3.5 h-3.5 text-primary" />,
    });
    // Favorite country
    const favCountry = (profile as any)?.favorite_departure_country;
    if (favCountry) {
      items.push({
        label: t("filterFavoriteLabel", { name: favCountry }),
        value: favCountry,
        icon: <Star className="w-3.5 h-3.5 text-primary" />,
      });
    }
    // Any
    items.push({ label: t("filterAnyCountry"), value: "any", icon: <Globe className="w-3.5 h-3.5 text-primary" /> });
    items.push({ label: "", value: "", isSeparator: true });
    filteredFromCountries.forEach(c => items.push({ label: c, value: c, icon: <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> }));
    return items;
  }, [filteredFromCountries, profile, geoLoading, currentLocationCountry, allCities]);

  // Build from-city items
  const fromCityItems = useMemo(() => {
    const items: { label: string; value: string; icon?: React.ReactNode; isSeparator?: boolean }[] = [];
    items.push({
      label: geoLoading ? t("filterLocating") : currentLocationCity ? t("filterCurrentLocationLabel", { location: currentLocationCity }) : t("filterCurrentLocation"),
      value: "__current__",
      icon: <Navigation className="w-3.5 h-3.5 text-primary" />,
    });
    if (profile?.favorite_departure_city) {
      items.push({
        label: t("filterFavoriteLabel", { name: profile.favorite_departure_city }),
        value: profile.favorite_departure_city,
        icon: <Star className="w-3.5 h-3.5 text-primary" />,
      });
    }
    items.push({ label: t("filterAnyCity"), value: "any", icon: <Globe className="w-3.5 h-3.5 text-primary" /> });
    items.push({ label: "", value: "", isSeparator: true });
    filteredFromCities.forEach(c => items.push({ label: c, value: c, icon: <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> }));
    return items;
  }, [filteredFromCities, profile, geoLoading, currentLocationCity]);

  // Build to-country items
  const toCountryItems = useMemo(() => {
    const items: { label: string; value: string; icon?: React.ReactNode; isSeparator?: boolean }[] = [];
    items.push({ label: t("filterAnyCountry"), value: "any", icon: <Globe className="w-3.5 h-3.5 text-primary" /> });
    items.push({ label: "", value: "", isSeparator: true });
    filteredToCountries.forEach(c => items.push({ label: c, value: c, icon: <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> }));
    return items;
  }, [filteredToCountries]);

  // Build to-city items
  const toCityItems = useMemo(() => {
    const items: { label: string; value: string; icon?: React.ReactNode; isSeparator?: boolean }[] = [];
    items.push({ label: t("filterAnyCity"), value: "any", icon: <Globe className="w-3.5 h-3.5 text-primary" /> });
    items.push({ label: "", value: "", isSeparator: true });
    filteredToCities.forEach(c => items.push({ label: c, value: c, icon: <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> }));
    return items;
  }, [filteredToCities]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("filterSearchPlaceholder")}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
            className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
              {suggestions.map((s, i) => (
                <button key={i} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors" onClick={() => handleSuggestionClick(s.label, s.sublabel)}>
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
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
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
                <SheetTitle className="text-foreground">{t("filterFilters")}</SheetTitle>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{t("filterResults", { count: resultCount })}</span>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>{t("filterClearAll")}</Button>
                  )}
                </div>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* === FROM === */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <PlaneIcon className="w-4 h-4 text-primary rotate-45" />
                  {t("filterFrom")}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {/* From Country */}
                  <div className="relative" ref={fromCountryRef}>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal text-sm h-10 min-w-0 overflow-hidden [&>*]:min-w-0", !currentFilters.originCountry && "text-muted-foreground")}
                      onClick={() => { setShowFromCountry(!showFromCountry); setShowFromCity(false); }}
                    >
                      <span className="block truncate max-w-full">{currentFilters.originCountry === "any" ? t("filterAny") : currentFilters.originCountry || t("filterCountry")}</span>
                    </Button>
                    {renderDropdown(
                      fromCountryRef, showFromCountry, fromCountrySearch, setFromCountrySearch, t("filterSearchCountry"),
                      fromCountryItems,
                      (val) => {
                        if (val === "__current__") { requestCurrentLocation(); return; }
                        localUpdate({ originCountry: val === "any" ? "any" : val, origin: val === "any" ? "" : "" });
                        setShowFromCountry(false);
                        setFromCountrySearch("");
                      },
                      currentFilters.originCountry
                    )}
                  </div>
                  {/* From City */}
                  <div className="relative" ref={fromCityRef}>
                    <Button
                      variant="outline"
                      disabled={currentFilters.originCountry === "any"}
                      className={cn("w-full justify-start text-left font-normal text-sm h-10", !currentFilters.origin && "text-muted-foreground", currentFilters.originCountry === "any" && "opacity-50 cursor-not-allowed")}
                      onClick={() => { if (currentFilters.originCountry !== "any") { setShowFromCity(!showFromCity); setShowFromCountry(false); } }}
                    >
                      {currentFilters.originCountry === "any" ? t("filterAny") : currentFilters.origin === "any" ? t("filterAny") : currentFilters.origin || t("filterCity")}
                    </Button>
                    {renderDropdown(
                      fromCityRef, showFromCity, fromCitySearch, setFromCitySearch, t("filterSearchCity"),
                      fromCityItems,
                      (val) => {
                        if (val === "__current__") { requestCurrentLocation(); return; }
                        localUpdate({ origin: val === "any" ? "any" : val });
                        setShowFromCity(false);
                        setFromCitySearch("");
                      },
                      currentFilters.origin
                    )}
                  </div>
                </div>
              </div>

              {/* === TO === */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <PlaneIcon className="w-4 h-4 text-primary -rotate-45" />
                  {t("filterTo")}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {/* To Country */}
                  <div className="relative" ref={toCountryRef}>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal text-sm h-10 min-w-0 overflow-hidden [&>*]:min-w-0", !currentFilters.destinationCountry && "text-muted-foreground")}
                      onClick={() => { setShowToCountry(!showToCountry); setShowToCity(false); }}
                    >
                      <span className="block truncate max-w-full">{currentFilters.destinationCountry === "any" ? t("filterAny") : currentFilters.destinationCountry || t("filterCountry")}</span>
                    </Button>
                    {renderDropdown(
                      toCountryRef, showToCountry, toCountrySearch, setToCountrySearch, t("filterSearchCountry"),
                      toCountryItems,
                      (val) => {
                        localUpdate({ destinationCountry: val === "any" ? "any" : val, destination: val === "any" ? "" : "" });
                        setShowToCountry(false);
                        setToCountrySearch("");
                      },
                      currentFilters.destinationCountry
                    )}
                  </div>
                  {/* To City */}
                  <div className="relative" ref={toCityRef}>
                    <Button
                      variant="outline"
                      disabled={currentFilters.destinationCountry === "any"}
                      className={cn("w-full justify-start text-left font-normal text-sm h-10", !currentFilters.destination && "text-muted-foreground", currentFilters.destinationCountry === "any" && "opacity-50 cursor-not-allowed")}
                      onClick={() => { if (currentFilters.destinationCountry !== "any") { setShowToCity(!showToCity); setShowToCountry(false); } }}
                    >
                      {currentFilters.destinationCountry === "any" ? t("filterAny") : currentFilters.destination === "any" ? t("filterAny") : currentFilters.destination || t("filterCity")}
                    </Button>
                    {renderDropdown(
                      toCityRef, showToCity, toCitySearch, setToCitySearch, t("filterSearchCity"),
                      toCityItems,
                      (val) => {
                        localUpdate({ destination: val === "any" ? "any" : val });
                        setShowToCity(false);
                        setToCitySearch("");
                      },
                      currentFilters.destination
                    )}
                  </div>
                </div>
              </div>

              {/* === DATES === */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  {t("filterDates")}
                </Label>

                {/* Flexible date options */}
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: "exact" as FlexOption, label: t("filterExact") },
                    { value: "+-1" as FlexOption, label: t("filterFlex1") },
                    { value: "+-3" as FlexOption, label: t("filterFlex3") },
                    { value: "month" as FlexOption, label: t("filterFlexCheapest") },
                    { value: "any" as FlexOption, label: t("filterFlexAny") },
                  ]).map((opt) => (
                    <Badge
                      key={opt.value}
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-all text-xs",
                        currentFilters.flexOption === opt.value
                          ? "bg-primary/20 border-primary text-primary"
                          : "hover:border-primary/50"
                      )}
                      onClick={() => {
                        localUpdate({
                          flexOption: opt.value,
                          ...(opt.value === "any" ? { departureDateFrom: undefined, departureDateTo: undefined } : {}),
                        });
                      }}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>

                {currentFilters.flexOption === "month" && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{t("filterMonthHint")}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 12 }).map((_, i) => {
                        const month = addMonths(startOfMonth(new Date()), i);
                        const monthKey = format(month, "yyyy-MM");
                        const price = datePriceMap[monthKey];
                        const allPrices = Object.values(datePriceMap).filter(p => p > 0);
                        const minP = allPrices.length ? Math.min(...allPrices) : 0;
                        const maxP = allPrices.length ? Math.max(...allPrices) : 1;
                        
                        // Check selection by comparing YYYY-MM strings (avoids timezone issues)
                        const selectedKey = currentFilters.departureDateFrom 
                          ? currentFilters.departureDateFrom.substring(0, 7) 
                          : null;
                        const isSelected = selectedKey === monthKey;
                        
                        let bgClass = "bg-muted/50 text-muted-foreground";
                        if (price !== undefined) {
                          const ratio = maxP === minP ? 0 : (price - minP) / (maxP - minP);
                          if (ratio <= 0.33) bgClass = "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
                          else if (ratio <= 0.66) bgClass = "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30";
                          else bgClass = "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30";
                        }

                        return (
                          <div
                            key={monthKey}
                            role="button"
                            tabIndex={0}
                            className={cn(
                              "rounded-lg border p-2.5 text-center transition-all cursor-pointer select-none",
                              bgClass,
                              isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                              price === undefined && "opacity-50"
                            )}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const fromDate = `${monthKey}-01`;
                              localUpdate({ departureDateFrom: fromDate, departureDateTo: undefined });
                            }}
                          >
                            <div className="text-xs font-medium">{format(month, "MMM yyyy")}</div>
                            {price !== undefined ? (
                              <div className="text-sm font-bold mt-0.5">€{price}</div>
                            ) : (
                              <div className="text-[10px] mt-0.5">{t("filterNoFlights")}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {currentFilters.departureDateFrom && (
                      <p className="text-xs text-muted-foreground">
                        {t("filterSearchingMonth", { month: format(new Date(currentFilters.departureDateFrom), "MMMM yyyy") })}
                      </p>
                    )}
                  </div>
                )}

                {currentFilters.flexOption !== "any" && currentFilters.flexOption !== "month" && (
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("justify-start text-left font-normal text-sm h-10", !currentFilters.departureDateFrom && "text-muted-foreground")}>
                          {currentFilters.departureDateFrom ? format(new Date(currentFilters.departureDateFrom), "dd MMM yy") : t("filterFrom")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={currentFilters.departureDateFrom ? new Date(currentFilters.departureDateFrom) : undefined}
                          onSelect={(d) => localUpdate({ departureDateFrom: d ? d.toISOString().split("T")[0] : undefined })}
                          className={cn("p-3 pointer-events-auto")}
                          modifiers={{ available: availableDateObjects }}
                          modifiersClassNames={{ available: "!bg-primary/20 font-semibold" }}
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("justify-start text-left font-normal text-sm h-10", !currentFilters.departureDateTo && "text-muted-foreground")}>
                          {currentFilters.departureDateTo ? format(new Date(currentFilters.departureDateTo), "dd MMM yy") : t("filterTo")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={currentFilters.departureDateTo ? new Date(currentFilters.departureDateTo) : undefined}
                          onSelect={(d) => localUpdate({ departureDateTo: d ? d.toISOString().split("T")[0] : undefined })}
                          className={cn("p-3 pointer-events-auto")}
                          modifiers={{ available: availableDateObjects }}
                          modifiersClassNames={{ available: "!bg-primary/20 font-semibold" }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {currentFilters.flexOption !== "exact" && currentFilters.flexOption !== "any" && currentFilters.flexOption !== "month" && currentFilters.departureDateFrom && (
                  <p className="text-xs text-muted-foreground">
                    {currentFilters.flexOption === "+-1" && `Searching ${format(subDays(new Date(currentFilters.departureDateFrom), 1), "dd MMM")} – ${format(addDays(new Date(currentFilters.departureDateFrom), 1), "dd MMM")}`}
                    {currentFilters.flexOption === "+-3" && `Searching ${format(subDays(new Date(currentFilters.departureDateFrom), 3), "dd MMM")} – ${format(addDays(new Date(currentFilters.departureDateFrom), 3), "dd MMM")}`}
                  </p>
                )}
              </div>

              {/* === AIRLINE (multi-select) === */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <PlaneIcon className="w-4 h-4 text-primary" />
                  {t("filterAirline")}
                </Label>
                {currentFilters.airlines.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {currentFilters.airlines.map(a => (
                      <Badge key={a} variant="secondary" className="gap-1 text-xs">
                        {a}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => toggleAirline(a)} />
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="relative" ref={airlineRef}>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal text-sm h-10", currentFilters.airlines.length === 0 && "text-muted-foreground")}
                    onClick={() => setShowAirlineDropdown(!showAirlineDropdown)}
                  >
                    {currentFilters.airlines.length === 0 ? t("filterAnyAirline") : t("filterSelectedCount", { count: currentFilters.airlines.length })}
                  </Button>
                  {showAirlineDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-hidden">
                      <div className="p-2 border-b border-border">
                        <Input
                          placeholder={t("filterSearchAirlines")}
                          value={airlineSearch}
                          onChange={(e) => setAirlineSearch(e.target.value)}
                          className="h-8 text-sm bg-secondary/30"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {/* Any option */}
                        <button
                          className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors", currentFilters.airlines.length === 0 && "bg-primary/10 text-primary font-medium")}
                          onClick={() => { localUpdate({ airlines: [] }); setShowAirlineDropdown(false); setAirlineSearch(""); }}
                        >
                          <Globe className="w-3.5 h-3.5 text-primary" />
                          <span className="text-sm">{t("filterAnyAirline")}</span>
                        </button>
                        <div className="px-4 py-1"><Separator /></div>
                        {filteredAirlines.map((a) => (
                          <button
                            key={a.name}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors",
                              currentFilters.airlines.includes(a.name) && "bg-primary/10 text-primary font-medium"
                            )}
                            onClick={() => toggleAirline(a.name)}
                          >
                            <div className={cn("w-4 h-4 rounded border flex items-center justify-center text-xs", currentFilters.airlines.includes(a.name) ? "bg-primary border-primary text-primary-foreground" : "border-border")}>
                              {currentFilters.airlines.includes(a.name) && "✓"}
                            </div>
                            <span className="text-sm">{a.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <Label className="flex items-center justify-between">
                  <span>{t("filterPrice")}</span>
                  <span className="text-primary font-semibold">€{priceRange[0]} – €{priceRange[1]}</span>
                </Label>
                <Slider
                  value={priceRange}
                  min={0}
                  max={2000}
                  step={25}
                  onValueChange={(value) => {
                    setPriceRange([value[0], value[1]]);
                    localUpdate({ minPrice: value[0], maxPrice: value[1] });
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
                <Label>{t("filterDirectFlights")}</Label>
                <Switch
                  checked={currentFilters.directOnly || false}
                  onCheckedChange={(checked) => localUpdate({ directOnly: checked || undefined })}
                />
              </div>

              {/* Includes */}
              <div className="space-y-3">
                <Label>{t("filterIncludes")}</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm"><Luggage className="w-4 h-4 text-muted-foreground" />{t("filterLuggage")}</div>
                    <Switch checked={currentFilters.luggageIncluded || false} onCheckedChange={(checked) => localUpdate({ luggageIncluded: checked || undefined })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm"><Briefcase className="w-4 h-4 text-muted-foreground" />{t("filterCarryOnShort")}</div>
                    <Switch checked={currentFilters.carryOnIncluded || false} onCheckedChange={(checked) => localUpdate({ carryOnIncluded: checked || undefined })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm"><UtensilsCrossed className="w-4 h-4 text-muted-foreground" />{t("filterMeal")}</div>
                    <Switch checked={currentFilters.mealIncluded || false} onCheckedChange={(checked) => localUpdate({ mealIncluded: checked || undefined })} />
                  </div>
                </div>
              </div>

              {/* Ticket Count */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  {t("filterMinTickets")}
                </Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((count) => (
                    <Button
                      key={count}
                      variant={currentFilters.ticketCount === count ? "default" : "outline"}
                      size="sm"
                      onClick={() => localUpdate({ ticketCount: currentFilters.ticketCount === count ? 0 : count })}
                      className="flex-1"
                    >
                      {count >= 4 ? `${count}+` : count}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Search Button */}
              <Button className="w-full h-12 text-base font-semibold" onClick={handleSearchClick}>
                <Search className="w-4 h-4 mr-2" />
                {t("filterApply")}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">{t("filterResults", { count: resultCount })}</span>
          {filters.originCountry && filters.originCountry !== "any" && (
            <Badge variant="secondary" className="gap-1">
              {t("filterFrom")}: {filters.originCountry}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ originCountry: "", origin: "" })} />
            </Badge>
          )}
          {filters.origin && filters.origin !== "any" && !filters.originCountry && (
            <Badge variant="secondary" className="gap-1">
              {t("filterFrom")}: {filters.origin}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ origin: "" })} />
            </Badge>
          )}
          {filters.destinationCountry && filters.destinationCountry !== "any" && (
            <Badge variant="secondary" className="gap-1">
              {t("filterTo")}: {filters.destinationCountry}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ destinationCountry: "", destination: "" })} />
            </Badge>
          )}
          {filters.destination && filters.destination !== "any" && !filters.destinationCountry && (
            <Badge variant="secondary" className="gap-1">
              {t("filterTo")}: {filters.destination}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ destination: "" })} />
            </Badge>
          )}
          {filters.departureDateFrom && (
            <Badge variant="secondary" className="gap-1">
              {t("filterFrom")}: {format(new Date(filters.departureDateFrom), "dd MMM")}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ departureDateFrom: undefined })} />
            </Badge>
          )}
          {filters.departureDateTo && (
            <Badge variant="secondary" className="gap-1">
              {t("filterUntil")}: {format(new Date(filters.departureDateTo), "dd MMM")}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ departureDateTo: undefined })} />
            </Badge>
          )}
          {filters.flexOption !== "exact" && (
            <Badge variant="secondary" className="gap-1">
              {filters.flexOption === "+-1" && t("filterFlex1")}
              {filters.flexOption === "+-3" && t("filterFlex3")}
              {filters.flexOption === "month" && t("filterFlexCheapest")}
              {filters.flexOption === "any" && t("filterFlexAny")}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ flexOption: "exact" })} />
            </Badge>
          )}
          {filters.airlines.map(a => (
            <Badge key={a} variant="secondary" className="gap-1">
              {a}
              <X className="w-3 h-3 cursor-pointer" onClick={() => {
                const newAirlines = filters.airlines.filter(x => x !== a);
                updateFilters({ airlines: newAirlines });
              }} />
            </Badge>
          ))}
          {(filters.minPrice > 0 || filters.maxPrice < 2000) && (
            <Badge variant="secondary" className="gap-1">
              €{filters.minPrice} – €{filters.maxPrice}
              <X className="w-3 h-3 cursor-pointer" onClick={() => { setPriceRange([0, 2000]); updateFilters({ minPrice: 0, maxPrice: 2000 }); }} />
            </Badge>
          )}
          {filters.directOnly && (
            <Badge variant="secondary" className="gap-1">{t("filterDirectOnly")}<X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ directOnly: undefined })} /></Badge>
          )}
          {filters.luggageIncluded && (
            <Badge variant="secondary" className="gap-1">{t("filterLuggage")}<X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ luggageIncluded: undefined })} /></Badge>
          )}
          {filters.carryOnIncluded && (
            <Badge variant="secondary" className="gap-1">{t("filterCarryOnShort")}<X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ carryOnIncluded: undefined })} /></Badge>
          )}
          {filters.mealIncluded && (
            <Badge variant="secondary" className="gap-1">{t("filterMeal")}<X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ mealIncluded: undefined })} /></Badge>
          )}
        </div>
      )}
    </div>
  );
}
