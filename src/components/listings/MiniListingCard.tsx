import { Plane, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPrimaryAirportCode } from "@/data/flightData";

interface MiniListingCardProps {
  id: string;
  originCity: string;
  destinationCity: string;
  departureDate: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  airline: string;
  listingType?: string;
  creditType?: string;
  title?: string;
}

export function MiniListingCard({
  id,
  originCity,
  destinationCity,
  departureDate,
  price,
  originalPrice,
  imageUrl,
  airline,
  listingType = "flight_ticket",
  creditType,
  title,
}: MiniListingCardProps) {
  const navigate = useNavigate();
  const isVoucher = listingType === "travel_credit";
  const originCode = !isVoucher ? getPrimaryAirportCode(originCity) : "";
  const destCode = !isVoucher ? getPrimaryAirportCode(destinationCity) : "";

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
            alt={isVoucher ? title || airline : destinationCity}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          {/* Price */}
          <div className="absolute bottom-1.5 right-1.5">
            <span className="text-sm font-bold text-primary">€{price}</span>
          </div>
        </div>
        {/* Info */}
        <div className="p-2.5 space-y-1">
          {isVoucher ? (
            <>
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="text-xs font-bold text-primary truncate">{airline}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {creditType?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Credit"}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-primary">{originCode || originCity.slice(0, 3).toUpperCase()}</span>
                <Plane className="w-3 h-3 text-primary -rotate-45 flex-shrink-0" />
                <span className="text-xs font-bold text-primary">{destCode || destinationCity.slice(0, 3).toUpperCase()}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{formatDate(departureDate)} · {airline}</p>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
