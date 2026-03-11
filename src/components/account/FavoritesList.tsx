import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, Loader2, Heart, Plane } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";

export default function FavoritesList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("*, listings(*)").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/account")} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-xl font-display font-bold">{t("favoritesTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("favoritesSaved")}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !favorites?.length ? (
        <div className="glass rounded-2xl p-8 text-center space-y-3">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">{t("favoritesEmpty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((f) => {
            const listing = f.listings as any;
            return (
              <button key={f.id} onClick={() => listing?.id && navigate(`/listing/${listing.id}`)} className="w-full glass rounded-2xl p-4 text-left hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Plane className="w-5 h-5 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{listing?.title || "Listing"}</p>
                    <p className="text-xs text-muted-foreground">{listing?.origin_city} → {listing?.destination_city}</p>
                  </div>
                  <p className="font-semibold text-primary">€{listing?.price}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
