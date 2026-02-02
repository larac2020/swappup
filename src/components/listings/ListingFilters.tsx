import { useState } from "react";
import { Search, SlidersHorizontal, X, Calendar, MapPin, Tag, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

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

export function ListingFilters({ onSearch, onFilterChange }: ListingFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [priceRange, setPriceRange] = useState([0, 2000]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
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
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search destinations, airlines..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
          />
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
              {/* Destination */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Destination
                </Label>
                <Input
                  placeholder="City or country"
                  value={filters.destination}
                  onChange={(e) => updateFilters({ destination: e.target.value })}
                  className="bg-secondary/50 border-border/50"
                />
              </div>

              {/* Origin */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  From
                </Label>
                <Input
                  placeholder="Departure city"
                  value={filters.origin}
                  onChange={(e) => updateFilters({ origin: e.target.value })}
                  className="bg-secondary/50 border-border/50"
                />
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
