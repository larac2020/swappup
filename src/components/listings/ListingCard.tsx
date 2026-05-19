import { Calendar, Users, Heart, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPrimaryAirportCode, getPrimaryAirportName } from "@/data/flightData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { formatPrice } from "@/lib/currency";

interface ListingCardProps {
  id: string;
  title: string;
  originCity: string;
  destinationCity: string;
  destinationCountry: string;
  departureDate: string;
  returnDate?: string;
  price: number;
  originalPrice?: number;
  airline: string;
  ticketCount: number;
  imageUrl?: string;
  listingType?: string;
  creditType?: string;
  creditValue?: number;
  creditCurrency?: string;
  creditExpiryDate?: string;
  operator?: string;
  currency?: string;
  originAirport?: string;
  destinationAirport?: string;
}

export function ListingCard({
  id,
  title,
  originCity,
  destinationCity,
  destinationCountry,
  departureDate,
  returnDate,
  price,
  originalPrice,
  airline,
  ticketCount,
  imageUrl,
  listingType = "flight_ticket",
  creditType,
  creditValue,
  creditCurrency = "EUR",
  creditExpiryDate,
  operator,
  currency = "EUR",
  originAirport,
  destinationAirport,
}: ListingCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const displayCurrency = useDisplayCurrency();
  const originCode = originAirport || getPrimaryAirportCode(originCity);
  const destCode = destinationAirport || getPrimaryAirportCode(destinationCity);
  const carrierLabel = airline;

  // Get profile
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

  // Check if favorited
  const { data: isFavorited = false } = useQuery({
    queryKey: ["isFavorited", profile?.id, id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("watchlist")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile!.id)
        .eq("listing_id", id);
      if (error) throw error;
      return (count ?? 0) > 0;
    },
    enabled: !!profile?.id,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!profile?.id) return;
      if (isFavorited) {
        await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", profile.id)
          .eq("listing_id", id);
      } else {
        await supabase
          .from("watchlist")
          .insert({ user_id: profile.id, listing_id: id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isFavorited", profile?.id, id] });
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["favoritesCount"] });
      toast({
        title: isFavorited ? "Removed from watchlist" : "Added to watchlist",
      });
    },
  });

  const addToCart = useMutation({
    mutationFn: async () => {
      if (!profile?.id) {
        navigate("/auth");
        throw new Error("Login required");
      }
      // Check if already in cart
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", profile.id)
        .eq("listing_id", id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("cart_items")
          .insert({ user_id: profile.id, listing_id: id, quantity: 1 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cartCount"] });
      toast({ title: "Added to cart" });
    },
    onError: (err) => {
      if (err.message !== "Login required") {
        toast({ title: "Failed to add to cart", variant: "destructive" });
      }
    },
  });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite.mutate();
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart.mutate();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <button
      onClick={() => navigate(`/listing/${id}`)}
      className="w-full text-left group animate-fade-in"
    >
      <div className="glass rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-glow-sm">
        {/* Image */}
        <div className="relative h-32 overflow-hidden">
          <img
            src={imageUrl || `https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&auto=format&fit=crop`}
            alt={destinationCity}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

          {/* Price badge — advertised price only */}
          <div className="absolute top-2 right-2">
            <div className="glass-strong rounded-lg px-2.5 py-1">
              <span className="text-base font-bold text-primary">{formatPrice(price, currency, displayCurrency)}</span>
            </div>
          </div>

          {/* Favorite button */}
          <button
            onClick={handleFavoriteClick}
            className="absolute bottom-2 right-2 p-1.5 rounded-lg glass-strong transition-colors"
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                isFavorited
                  ? "text-primary fill-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {(
            <>
              {/* Route: cities on top, codes with arrow below */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="text-center min-w-0 flex-1">
                    <p className="font-semibold text-foreground text-sm truncate leading-tight">{originCity}</p>
                    {originCode && (
                      <span className="text-[10px] font-bold text-primary tracking-wide">{originCode}</span>
                    )}
                  </div>
                  <span className="text-primary text-sm font-bold flex-shrink-0" aria-label={returnDate ? t("tripRoundTrip") : t("tripOneWay")}>
                    {returnDate ? "⇄" : "→"}
                  </span>
                  <div className="text-center min-w-0 flex-1">
                    <p className="font-semibold text-foreground text-sm truncate leading-tight">{destinationCity}</p>
                    {destCode && (
                      <span className="text-[10px] font-bold text-primary tracking-wide">{destCode}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details + carrier */}
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span className="truncate">
                      {formatDate(departureDate)}
                      {returnDate && ` - ${formatDate(returnDate)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{ticketCount}</span>
                  </div>
                </div>
                <span className="truncate text-right flex-shrink-0 max-w-[40%]">{carrierLabel}</span>
              </div>
            </>
          )}

          {/* View Listing CTA */}
          <Button
            size="sm"
            className="w-full gap-2 h-8 text-xs"
            onClick={(e) => { e.stopPropagation(); navigate(`/listing/${id}`); }}
          >
            <Eye className="w-3.5 h-3.5" />
            {t("cardViewListing")}
          </Button>
        </div>
      </div>
    </button>
  );
}
