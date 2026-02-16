import { Calendar, Plane, Users, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getPrimaryAirportCode, getPrimaryAirportName } from "@/data/flightData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  tags?: string[];
}

const tagColors: Record<string, string> = {
  city_trip: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  beach: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  winter_holiday: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  ski_trip: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  adventure: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  romantic: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  family: "bg-green-500/20 text-green-300 border-green-500/30",
  business: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const formatTag = (tag: string) => {
  return tag.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

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
  tags = [],
}: ListingCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

  const originCode = getPrimaryAirportCode(originCity);
  const destCode = getPrimaryAirportCode(destinationCity);
  const originAirportName = getPrimaryAirportName(originCity);
  const destAirportName = getPrimaryAirportName(destinationCity);

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
        .from("favorites")
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
          .from("favorites")
          .delete()
          .eq("user_id", profile.id)
          .eq("listing_id", id);
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: profile.id, listing_id: id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isFavorited", profile?.id, id] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favoritesCount"] });
      toast({
        title: isFavorited ? "Removed from favorites" : "Added to favorites",
      });
    },
  });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite.mutate();
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
        <div className="relative h-40 overflow-hidden">
          <img
            src={imageUrl || `https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&auto=format&fit=crop`}
            alt={destinationCity}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          
          {/* Price badge */}
          <div className="absolute top-3 right-3">
            <div className="glass-strong rounded-xl px-3 py-1.5">
              <span className="text-lg font-bold text-primary">€{price}</span>
              {originalPrice && originalPrice > price && (
                <span className="ml-2 text-xs text-muted-foreground line-through">
                  €{originalPrice}
                </span>
              )}
            </div>
          </div>

          {/* Discount badge */}
          {discount > 0 && (
            <div className="absolute top-3 left-3">
              <Badge className="gradient-gold text-primary-foreground border-0 font-semibold">
                -{discount}%
              </Badge>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
              {tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={cn("text-xs border", tagColors[tag] || "bg-secondary")}
                >
                  {formatTag(tag)}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Route with airport codes */}
          <div className="flex items-center gap-3">
            <div className="text-center min-w-0">
              {originCode && (
                <span className="text-xs font-bold text-primary">{originCode}</span>
              )}
              <p className="font-semibold text-foreground text-sm truncate">{originCity}</p>
              {originAirportName && originAirportName !== originCity && (
                <p className="text-xs text-muted-foreground truncate">{originAirportName}</p>
              )}
            </div>
            <Plane className="w-4 h-4 text-primary -rotate-45 flex-shrink-0" />
            <div className="text-center min-w-0">
              {destCode && (
                <span className="text-xs font-bold text-primary">{destCode}</span>
              )}
              <p className="font-semibold text-foreground text-sm truncate">{destinationCity}</p>
              {destAirportName && destAirportName !== destinationCity && (
                <p className="text-xs text-muted-foreground truncate">{destAirportName}</p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {formatDate(departureDate)}
                {returnDate && ` - ${formatDate(returnDate)}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{ticketCount} {ticketCount === 1 ? "ticket" : "tickets"}</span>
            </div>
          </div>

          {/* Airline + Favorite */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-sm text-muted-foreground">{airline}</span>
            <button
              onClick={handleFavoriteClick}
              className="p-1 rounded-lg hover:bg-secondary/50 transition-colors"
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
        </div>
      </div>
    </button>
  );
}
