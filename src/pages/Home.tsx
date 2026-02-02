import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ListingCard } from "@/components/listings/ListingCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Plane, Plus, ArrowRight, Ticket, TrendingUp, Star } from "lucide-react";

// Mock recommendations based on "search history"
const recommendations = [
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
];

const trendingDestinations = [
  { name: "Dubai", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&auto=format&fit=crop", deals: 24 },
  { name: "Tokyo", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&auto=format&fit=crop", deals: 18 },
  { name: "Bali", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&auto=format&fit=crop", deals: 32 },
  { name: "Paris", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&auto=format&fit=crop", deals: 15 },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Traveler";

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative px-4 pt-6 pb-8">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>
          
          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Welcome back,</p>
                <h1 className="text-2xl font-display font-bold">{firstName} ✈️</h1>
              </div>
              <Button variant="gold" size="sm" onClick={() => navigate("/sell")}>
                <Plus className="w-4 h-4" />
                Sell Ticket
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass rounded-xl p-3 text-center">
                <Ticket className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">0</p>
                <p className="text-xs text-muted-foreground">Active Tickets</p>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" />
                <p className="text-lg font-bold">0</p>
                <p className="text-xs text-muted-foreground">Bought</p>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <Star className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">0</p>
                <p className="text-xs text-muted-foreground">Sold</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trending Destinations */}
        <div className="px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Trending Destinations</h2>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {trendingDestinations.map((dest) => (
              <button
                key={dest.name}
                onClick={() => navigate("/browse")}
                className="flex-shrink-0 group"
              >
                <div className="relative w-28 h-36 rounded-2xl overflow-hidden">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="font-semibold text-foreground">{dest.name}</p>
                    <p className="text-xs text-muted-foreground">{dest.deals} deals</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recommended For You */}
        <div className="px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recommended For You</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/browse")}>
              See all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-4">
            {recommendations.map((listing) => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="px-4 pb-6">
          <div className="glass rounded-2xl p-6 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-gold shadow-glow">
              <Plane className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Got tickets to sell?</h3>
              <p className="text-sm text-muted-foreground">
                List your unused flight tickets and help other travelers save money.
              </p>
            </div>
            <Button variant="gold" className="w-full" onClick={() => navigate("/sell")}>
              Start Selling
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
