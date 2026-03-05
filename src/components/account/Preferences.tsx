import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { getCountries, getCitiesByCountry } from "@/data/flightData";

const tripCategories = [
  { value: "city_trip", label: "City Trip" },
  { value: "beach", label: "Beach" },
  { value: "winter_holiday", label: "Winter Holiday" },
  { value: "ski_trip", label: "Ski Trip" },
  { value: "adventure", label: "Adventure" },
  { value: "romantic", label: "Romantic" },
  { value: "family", label: "Family" },
  { value: "business", label: "Business" },
];

export default function Preferences() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const countries = useMemo(() => getCountries(), []);

  const [favCountry, setFavCountry] = useState("");
  const [favCity, setFavCity] = useState("");
  const [defaultPax, setDefaultPax] = useState("1");
  const [favCategories, setFavCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const favCities = useMemo(
    () => (favCountry ? getCitiesByCountry(favCountry) : []),
    [favCountry]
  );

  // Populate from profile
  useEffect(() => {
    if (profile) {
      if (profile.favorite_departure_city) {
        // Try to find the country for this city
        for (const country of countries) {
          const cities = getCitiesByCountry(country);
          if (cities.includes(profile.favorite_departure_city)) {
            setFavCountry(country);
            break;
          }
        }
        setFavCity(profile.favorite_departure_city);
      }
      if (profile.default_pax) setDefaultPax(String(profile.default_pax));
      if (profile.favorite_categories) setFavCategories(profile.favorite_categories);
    }
  }, [profile, countries]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          favorite_departure_city: favCity || null,
          default_pax: parseInt(defaultPax) || 1,
          favorite_categories: favCategories.length > 0 ? favCategories : null,
        } as any)
        .eq("user_id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile-completion"] });
      toast({ title: "Preferences saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/account")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-display font-bold">Personalization</h1>
          <p className="text-sm text-muted-foreground">Tailor your experience</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Optional</Badge>

        <div className="space-y-1.5">
          <Label>Favorite Departure Country</Label>
          <Select value={favCountry} onValueChange={(v) => { setFavCountry(v); setFavCity(""); }}>
            <SelectTrigger className="h-11 bg-secondary/50 border-border/50"><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent>
              {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {favCountry && (
          <div className="space-y-1.5">
            <Label>Favorite Departure City</Label>
            <Select value={favCity} onValueChange={setFavCity}>
              <SelectTrigger className="h-11 bg-secondary/50 border-border/50"><SelectValue placeholder="Select city" /></SelectTrigger>
              <SelectContent>
                {favCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Default Number of Passengers</Label>
          <Select value={defaultPax} onValueChange={setDefaultPax}>
            <SelectTrigger className="h-11 bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "passenger" : "passengers"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Favorite Categories</Label>
          <div className="flex flex-wrap gap-2">
            {tripCategories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFavCategories((prev) =>
                  prev.includes(cat.value) ? prev.filter((c) => c !== cat.value) : [...prev, cat.value]
                )}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  favCategories.includes(cat.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary border-border/50 text-muted-foreground hover:border-primary/50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button variant="gold" className="w-full" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Preferences"}
      </Button>
    </div>
  );
}
