import { Calendar, MapPin, Plane, Users, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

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
          {/* Route */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{originCity}</span>
            <Plane className="w-4 h-4 text-primary rotate-90" />
            <span className="font-semibold text-foreground">{destinationCity}</span>
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

          {/* Airline */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-sm text-muted-foreground">{airline}</span>
            <MapPin className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </button>
  );
}
