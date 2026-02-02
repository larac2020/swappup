import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Plane, 
  Calendar, 
  Users, 
  Luggage, 
  Utensils, 
  Zap, 
  MapPin,
  Clock,
  AlertCircle,
  ShoppingCart,
  Share2,
  Heart
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

// Mock data - in production this would come from database
const mockListing = {
  id: "1",
  title: "Barcelona City Escape",
  originCity: "London",
  originCountry: "UK",
  destinationCity: "Barcelona",
  destinationCountry: "Spain",
  departureDate: "2026-03-15",
  returnDate: "2026-03-22",
  price: 89,
  originalPrice: 145,
  airline: "Vueling",
  flightNumber: "VY8500",
  ticketCount: 2,
  imageUrl: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&auto=format&fit=crop",
  tags: ["city_trip", "romantic"],
  luggageIncluded: true,
  carryOnIncluded: true,
  mealIncluded: false,
  speedyBoarding: true,
  stopovers: 0,
  nameChangeFee: 50,
  additionalNotes: "Perfect for a romantic getaway. The tickets are for morning flights with great views. I'm selling because plans changed last minute.",
  seller: {
    name: "Maria S.",
    transactionsBought: 5,
    transactionsSold: 12,
    verified: true,
  },
};

const tagLabels: Record<string, string> = {
  city_trip: "City Trip",
  beach: "Beach",
  winter_holiday: "Winter Holiday",
  ski_trip: "Ski Trip",
  adventure: "Adventure",
  romantic: "Romantic",
  family: "Family",
  business: "Business",
};

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const listing = mockListing; // In production: fetch by id

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const discount = listing.originalPrice 
    ? Math.round((1 - listing.price / listing.originalPrice) * 100) 
    : 0;

  const handleAddToCart = () => {
    toast({
      title: "Added to cart",
      description: `${listing.title} has been added to your cart.`,
    });
  };

  return (
    <AppLayout showNav={false}>
      <div className="min-h-screen">
        {/* Hero Image */}
        <div className="relative h-72">
          <img
            src={listing.imageUrl}
            alt={listing.destinationCity}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          
          {/* Header Actions */}
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <Button
              variant="glass"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex gap-2">
              <Button variant="glass" size="icon" className="rounded-full">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button variant="glass" size="icon" className="rounded-full">
                <Heart className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Price Badge */}
          <div className="absolute bottom-4 right-4">
            <div className="glass-strong rounded-2xl px-4 py-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">€{listing.price}</span>
                {listing.originalPrice && listing.originalPrice > listing.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    €{listing.originalPrice}
                  </span>
                )}
              </div>
              {discount > 0 && (
                <Badge className="gradient-gold text-primary-foreground border-0 mt-1">
                  Save {discount}%
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-6 space-y-6 -mt-4 relative z-10">
          {/* Route Header */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {listing.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                  {tagLabels[tag] || tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xl">
              <span className="font-display font-bold">{listing.originCity}</span>
              <div className="flex items-center gap-2 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="w-16 h-0.5 bg-gradient-to-r from-primary to-primary/30" />
                <Plane className="w-5 h-5" />
                <div className="w-16 h-0.5 bg-gradient-to-l from-primary to-primary/30" />
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <span className="font-display font-bold">{listing.destinationCity}</span>
            </div>

            <p className="text-muted-foreground">
              {listing.destinationCountry} • {listing.airline}
            </p>
          </div>

          {/* Flight Details */}
          <div className="glass rounded-2xl p-4 space-y-4">
            <h3 className="font-semibold">Flight Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Departure</p>
                  <p className="font-medium">{formatDate(listing.departureDate)}</p>
                </div>
              </div>
              
              {listing.returnDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Return</p>
                    <p className="font-medium">{formatDate(listing.returnDate)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Tickets</p>
                  <p className="font-medium">{listing.ticketCount} available</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Plane className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Flight Number</p>
                  <p className="font-medium">{listing.flightNumber}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Stopovers</p>
                  <p className="font-medium">{listing.stopovers === 0 ? "Direct flight" : `${listing.stopovers} stop(s)`}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Includes */}
          <div className="glass rounded-2xl p-4 space-y-4">
            <h3 className="font-semibold">What's Included</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className={`flex items-center gap-2 ${listing.luggageIncluded ? "text-success" : "text-muted-foreground"}`}>
                <Luggage className="w-5 h-5" />
                <span className="text-sm">Checked Luggage</span>
              </div>
              <div className={`flex items-center gap-2 ${listing.carryOnIncluded ? "text-success" : "text-muted-foreground"}`}>
                <Luggage className="w-5 h-5" />
                <span className="text-sm">Carry-on Bag</span>
              </div>
              <div className={`flex items-center gap-2 ${listing.mealIncluded ? "text-success" : "text-muted-foreground"}`}>
                <Utensils className="w-5 h-5" />
                <span className="text-sm">In-flight Meal</span>
              </div>
              <div className={`flex items-center gap-2 ${listing.speedyBoarding ? "text-success" : "text-muted-foreground"}`}>
                <Zap className="w-5 h-5" />
                <span className="text-sm">Speedy Boarding</span>
              </div>
            </div>
          </div>

          {/* Name Change Fee Warning */}
          {listing.nameChangeFee && (
            <div className="glass rounded-xl p-4 flex gap-3 border-l-4 border-primary">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Name Change Fee: €{listing.nameChangeFee}</p>
                <p className="text-muted-foreground">
                  {listing.airline} charges this fee to change the passenger name. 
                  Please verify on the airline's website as fees may vary.
                </p>
              </div>
            </div>
          )}

          {/* Seller Notes */}
          {listing.additionalNotes && (
            <div className="glass rounded-2xl p-4 space-y-2">
              <h3 className="font-semibold">Seller's Notes</h3>
              <p className="text-sm text-muted-foreground">{listing.additionalNotes}</p>
            </div>
          )}

          {/* Seller Info */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-primary/30">
                <AvatarFallback className="bg-secondary">
                  {listing.seller.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{listing.seller.name}</span>
                  {listing.seller.verified && (
                    <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {listing.seller.transactionsSold} sold • {listing.seller.transactionsBought} bought
                </p>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="sticky bottom-4 flex gap-3">
            <Button variant="gold" size="xl" className="flex-1" onClick={handleAddToCart}>
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
