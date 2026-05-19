import { Plane, ArrowLeftRight, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPrimaryAirportCode } from "@/data/flightData";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { formatPrice } from "@/lib/currency";

interface MiniListingCardProps {
  id: string;
  originCity: string;
  destinationCity: string;
  departureDate: string;
  returnDate?: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  airline: string;
  listingType?: string;
  creditType?: string;
  title?: string;
  operator?: string;
  currency?: string;
  originAirport?: string;
  destinationAirport?: string;
}

export function MiniListingCard({
  id,
  originCity,
  destinationCity,
  departureDate,
  returnDate,
  price,
  originalPrice,
  imageUrl,
  airline,
  listingType = "flight_ticket",
  creditType,
  title,
  operator,
  currency = "EUR",
  originAirport,
  destinationAirport,
}: MiniListingCardProps) {
  const navigate = useNavigate();
  const displayCurrency = useDisplayCurrency();
  const originCode = originAirport || getPrimaryAirportCode(originCity) || originCity.slice(0, 3).toUpperCase();
  const destCode = destinationAirport || getPrimaryAirportCode(destinationCity) || destinationCity.slice(0, 3).toUpperCase();
  const carrierLabel = airline;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <button
      onClick={() => navigate(`/listing/${id}`)}
      className="flex-shrink-0 w-40 text-left animate-fade-in group"
    >
      <div className="glass rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-glow-sm h-full">
        {/* Image */}
        <div className="relative h-24 overflow-hidden">
          <img
            src={imageUrl || "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400&auto=format&fit=crop"}
            alt={destinationCity || title || carrierLabel}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          {/* Trip type */}
          <div className="absolute top-1.5 left-1.5 glass-strong rounded-md px-1.5 py-0.5 flex items-center gap-1">
            {returnDate ? (
              <ArrowLeftRight className="w-2.5 h-2.5 text-primary" />
            ) : (
              <ArrowRight className="w-2.5 h-2.5 text-primary" />
            )}
            <span className="text-[9px] font-semibold uppercase tracking-wide">{returnDate ? "R/T" : "O/W"}</span>
          </div>
          {/* Price */}
          <div className="absolute bottom-1.5 right-1.5">
            <span className="text-sm font-bold text-primary">{formatPrice(price, currency, displayCurrency)}</span>
          </div>
        </div>
        {/* Info */}
        <div className="p-2.5 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-primary">{originCode}</span>
            <Plane className="w-3 h-3 text-primary -rotate-45 flex-shrink-0" />
            <span className="text-xs font-bold text-primary">{destCode}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{formatDate(departureDate)} · {carrierLabel}</p>
        </div>
      </div>
    </button>
  );
}
