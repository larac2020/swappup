import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingFilters, FilterState } from "@/components/listings/ListingFilters";

// Mock data for demonstration
const mockListings = [
  {
    id: "1",
    title: "Barcelona City Escape",
    originCity: "London",
    destinationCity: "Barcelona",
    destinationCountry: "Spain",
    departureDate: "2026-03-15",
    returnDate: "2026-03-22",
    price: 89,
    originalPrice: 145,
    airline: "Vueling",
    ticketCount: 2,
    imageUrl: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&auto=format&fit=crop",
    tags: ["city_trip", "romantic"],
  },
  {
    id: "2",
    title: "Dubai Luxury Getaway",
    originCity: "Paris",
    destinationCity: "Dubai",
    destinationCountry: "UAE",
    departureDate: "2026-04-01",
    returnDate: "2026-04-08",
    price: 299,
    originalPrice: 450,
    airline: "Emirates",
    ticketCount: 1,
    imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop",
    tags: ["adventure", "business"],
  },
  {
    id: "3",
    title: "Bali Beach Paradise",
    originCity: "Amsterdam",
    destinationCity: "Bali",
    destinationCountry: "Indonesia",
    departureDate: "2026-05-10",
    returnDate: "2026-05-24",
    price: 445,
    originalPrice: 680,
    airline: "KLM",
    ticketCount: 2,
    imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop",
    tags: ["beach", "romantic"],
  },
  {
    id: "4",
    title: "Swiss Alps Adventure",
    originCity: "Berlin",
    destinationCity: "Zurich",
    destinationCountry: "Switzerland",
    departureDate: "2026-02-20",
    returnDate: "2026-02-27",
    price: 125,
    airline: "Swiss Air",
    ticketCount: 4,
    imageUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&auto=format&fit=crop",
    tags: ["ski_trip", "winter_holiday", "family"],
  },
  {
    id: "5",
    title: "Tokyo Experience",
    originCity: "London",
    destinationCity: "Tokyo",
    destinationCountry: "Japan",
    departureDate: "2026-04-15",
    returnDate: "2026-04-25",
    price: 520,
    originalPrice: 750,
    airline: "Japan Airlines",
    ticketCount: 1,
    imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&auto=format&fit=crop",
    tags: ["city_trip", "adventure"],
  },
  {
    id: "6",
    title: "Maldives Escape",
    originCity: "Rome",
    destinationCity: "Male",
    destinationCountry: "Maldives",
    departureDate: "2026-06-01",
    returnDate: "2026-06-10",
    price: 680,
    originalPrice: 920,
    airline: "Qatar Airways",
    ticketCount: 2,
    imageUrl: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&auto=format&fit=crop",
    tags: ["beach", "romantic"],
  },
];

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    destination: "",
    origin: "",
    minPrice: 0,
    maxPrice: 2000,
    ticketCount: 0,
    tags: [],
  });

  const filteredListings = useMemo(() => {
    return mockListings.filter((listing) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          listing.destinationCity.toLowerCase().includes(query) ||
          listing.destinationCountry.toLowerCase().includes(query) ||
          listing.originCity.toLowerCase().includes(query) ||
          listing.airline.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Destination filter
      if (filters.destination) {
        const dest = filters.destination.toLowerCase();
        if (
          !listing.destinationCity.toLowerCase().includes(dest) &&
          !listing.destinationCountry.toLowerCase().includes(dest)
        ) {
          return false;
        }
      }

      // Origin filter
      if (filters.origin) {
        if (!listing.originCity.toLowerCase().includes(filters.origin.toLowerCase())) {
          return false;
        }
      }

      // Price filter
      if (listing.price < filters.minPrice || listing.price > filters.maxPrice) {
        return false;
      }

      // Ticket count filter
      if (filters.ticketCount > 0 && listing.ticketCount < filters.ticketCount) {
        return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((tag) => listing.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [searchQuery, filters]);

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold">Find Tickets</h1>
          <p className="text-muted-foreground">Discover amazing deals from other travelers</p>
        </div>

        {/* Filters */}
        <ListingFilters onSearch={setSearchQuery} onFilterChange={setFilters} />

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredListings.length} {filteredListings.length === 1 ? "ticket" : "tickets"} found
          </p>
        </div>

        {/* Listings Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              {...listing}
            />
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tickets match your filters</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
