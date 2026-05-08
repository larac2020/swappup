import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { ListingCard } from "@/components/listings/ListingCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Favorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("*, listings(*)").eq("user_id", profile!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-4 space-y-6">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold">{t("favoritesTitle")}</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : favorites.length > 0 ? (
          <div className="space-y-4">
            {favorites.map((fav: any) => {
              const l = fav.listings;
              if (!l) return null;
              return (
                <ListingCard
                  key={fav.id}
                  id={l.id}
                  title={l.title}
                  originCity={l.origin_city}
                  destinationCity={l.destination_city}
                  destinationCountry={l.destination_country}
                  departureDate={l.departure_date}
                  returnDate={l.return_date ?? undefined}
                  price={Number(l.price)}
                  originalPrice={l.original_price ? Number(l.original_price) : undefined}
                  airline={l.airline}
                  ticketCount={l.ticket_count}
                  imageUrl={l.destination_image_url ?? undefined}
                  tags={l.tags as string[] ?? []}
                  listingType={(l as any).listing_type ?? "flight_ticket"}
                  creditType={(l as any).credit_type}
                  creditValue={(l as any).credit_value ? Number((l as any).credit_value) : undefined}
                  creditCurrency={(l as any).credit_currency}
                  creditExpiryDate={(l as any).credit_expiry_date}
                  currency={(l as any).currency || "EUR"}
                  originAirport={(l as any).origin_airport ?? undefined}
                  destinationAirport={(l as any).destination_airport ?? undefined}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 glass rounded-2xl">
            <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t("favoritesEmpty")}</p>
            <p className="text-sm text-muted-foreground/70 mt-1">{t("favoritesEmptyDesc")}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
