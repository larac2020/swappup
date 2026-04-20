import { Plane, TrainFront } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPrimaryAirportCode } from "@/data/flightData";
import { getPrimaryStationCode } from "@/data/trainData";

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
  operator?: string;
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
  operator,
}: MiniListingCardProps) {
  const navigate = useNavigate();
  const isTrain = listingType === "train_ticket";
  const originCode = isTrain
    ? getPrimaryStationCode(originCity) || originCity.slice(0, 3).toUpperCase()
    : getPrimaryAirportCode(originCity) || originCity.slice(0, 3).toUpperCase();
  const destCode = isTrain
    ? getPrimaryStationCode(destinationCity) || destinationCity.slice(0, 3).toUpperCase()
    : getPrimaryAirportCode(destinationCity) || destinationCity.slice(0, 3).toUpperCase();
  const carrierLabel = isTrain ? (operator || airline) : airline;
  const RouteIcon = isTrain ? TrainFront : Plane;

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
          {/* Price */}
          <div className="absolute bottom-1.5 right-1.5">
            <span className="text-sm font-bold text-primary">€{price}</span>
          </div>
        </div>
        {/* Info */}
        <div className="p-2.5 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-primary">{originCode}</span>
            <RouteIcon className={isTrain ? "w-3 h-3 text-primary flex-shrink-0" : "w-3 h-3 text-primary -rotate-45 flex-shrink-0"} />
            <span className="text-xs font-bold text-primary">{destCode}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{formatDate(departureDate)} · {carrierLabel}</p>
        </div>
      </div>
    </button>
  );
}
