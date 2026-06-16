import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import { getCountries } from "@/data/flightData";

const countries = getCountries();

const postalCodePatterns: Record<string, { regex: RegExp; hint: string }> = {
  "United Kingdom": { regex: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, hint: "e.g. SW1A 1AA" },
  "Italy": { regex: /^\d{5}$/, hint: "e.g. 00100" },
  "Germany": { regex: /^\d{5}$/, hint: "e.g. 10115" },
  "France": { regex: /^\d{5}$/, hint: "e.g. 75001" },
  "Spain": { regex: /^\d{5}$/, hint: "e.g. 28001" },
  "Netherlands": { regex: /^\d{4}\s?[A-Z]{2}$/i, hint: "e.g. 1012 AB" },
  "Belgium": { regex: /^\d{4}$/, hint: "e.g. 1000" },
  "Switzerland": { regex: /^\d{4}$/, hint: "e.g. 8001" },
  "Austria": { regex: /^\d{4}$/, hint: "e.g. 1010" },
  "Portugal": { regex: /^\d{4}-?\d{3}$/, hint: "e.g. 1000-001" },
  "Ireland": { regex: /^[A-Z\d]{3}\s?[A-Z\d]{4}$/i, hint: "e.g. D02 AF30" },
  "Sweden": { regex: /^\d{3}\s?\d{2}$/, hint: "e.g. 111 22" },
  "Norway": { regex: /^\d{4}$/, hint: "e.g. 0101" },
  "Denmark": { regex: /^\d{4}$/, hint: "e.g. 1000" },
  "Finland": { regex: /^\d{5}$/, hint: "e.g. 00100" },
  "Poland": { regex: /^\d{2}-?\d{3}$/, hint: "e.g. 00-001" },
  "Greece": { regex: /^\d{3}\s?\d{2}$/, hint: "e.g. 104 31" },
  "Czech Republic": { regex: /^\d{3}\s?\d{2}$/, hint: "e.g. 110 00" },
  "Hungary": { regex: /^\d{4}$/, hint: "e.g. 1011" },
  "Romania": { regex: /^\d{6}$/, hint: "e.g. 010011" },
  "United States": { regex: /^\d{5}(-\d{4})?$/, hint: "e.g. 10001" },
  "Canada": { regex: /^[ABCEGHJKLMNPRSTVXY]\d[A-Z]\s?\d[A-Z]\d$/i, hint: "e.g. K1A 0B1" },
  "Australia": { regex: /^\d{4}$/, hint: "e.g. 2000" },
  "New Zealand": { regex: /^\d{4}$/, hint: "e.g. 6011" },
  "Mexico": { regex: /^\d{5}$/, hint: "e.g. 01000" },
  "Brazil": { regex: /^\d{5}-?\d{3}$/, hint: "e.g. 01310-100" },
  "Argentina": { regex: /^[A-Z]?\d{4}[A-Z]{0,3}$/i, hint: "e.g. C1425" },
  "Chile": { regex: /^\d{7}$/, hint: "e.g. 8320000" },
  "Colombia": { regex: /^\d{6}$/, hint: "e.g. 110111" },
  "Peru": { regex: /^\d{5}$/, hint: "e.g. 15001" },
  "Uruguay": { regex: /^\d{5}$/, hint: "e.g. 11000" },
  "Venezuela": { regex: /^\d{4}$/, hint: "e.g. 1010" },
  "Japan": { regex: /^\d{3}-?\d{4}$/, hint: "e.g. 100-0001" },
  "South Korea": { regex: /^\d{5}$/, hint: "e.g. 04524" },
  "China": { regex: /^\d{6}$/, hint: "e.g. 100000" },
  "Taiwan": { regex: /^\d{3}(\d{2})?$/, hint: "e.g. 100" },
  "Hong Kong": { regex: /^.*$/, hint: "Optional" },
  "Singapore": { regex: /^\d{6}$/, hint: "e.g. 238823" },
  "Malaysia": { regex: /^\d{5}$/, hint: "e.g. 50000" },
  "Thailand": { regex: /^\d{5}$/, hint: "e.g. 10100" },
  "Vietnam": { regex: /^\d{5,6}$/, hint: "e.g. 100000" },
  "Indonesia": { regex: /^\d{5}$/, hint: "e.g. 10110" },
  "Philippines": { regex: /^\d{4}$/, hint: "e.g. 1000" },
  "India": { regex: /^\d{6}$/, hint: "e.g. 110001" },
  "Pakistan": { regex: /^\d{5}$/, hint: "e.g. 44000" },
  "Bangladesh": { regex: /^\d{4}$/, hint: "e.g. 1000" },
  "Sri Lanka": { regex: /^\d{5}$/, hint: "e.g. 10100" },
  "Nepal": { regex: /^\d{5}$/, hint: "e.g. 44600" },
  "United Arab Emirates": { regex: /^.*$/, hint: "Optional" },
  "Saudi Arabia": { regex: /^\d{5}(-\d{4})?$/, hint: "e.g. 11564" },
  "Israel": { regex: /^\d{5}(\d{2})?$/, hint: "e.g. 9103401" },
  "Turkey": { regex: /^\d{5}$/, hint: "e.g. 34000" },
  "Egypt": { regex: /^\d{5}$/, hint: "e.g. 11511" },
  "Morocco": { regex: /^\d{5}$/, hint: "e.g. 10000" },
  "South Africa": { regex: /^\d{4}$/, hint: "e.g. 8001" },
  "Nigeria": { regex: /^\d{6}$/, hint: "e.g. 100001" },
  "Kenya": { regex: /^\d{5}$/, hint: "e.g. 00100" },
  "Russian Federation": { regex: /^\d{6}$/, hint: "e.g. 101000" },
  "Ukraine": { regex: /^\d{5}$/, hint: "e.g. 01001" },
  "Belarus": { regex: /^\d{6}$/, hint: "e.g. 220030" },
  "Bulgaria": { regex: /^\d{4}$/, hint: "e.g. 1000" },
  "Croatia": { regex: /^\d{5}$/, hint: "e.g. 10000" },
  "Slovenia": { regex: /^\d{4}$/, hint: "e.g. 1000" },
  "Slovakia": { regex: /^\d{3}\s?\d{2}$/, hint: "e.g. 811 01" },
  "Estonia": { regex: /^\d{5}$/, hint: "e.g. 10111" },
  "Latvia": { regex: /^(LV-)?\d{4}$/i, hint: "e.g. LV-1050" },
  "Lithuania": { regex: /^(LT-)?\d{5}$/i, hint: "e.g. LT-01100" },
  "Iceland": { regex: /^\d{3}$/, hint: "e.g. 101" },
  "Luxembourg": { regex: /^(L-)?\d{4}$/i, hint: "e.g. L-1011" },
  "Malta": { regex: /^[A-Z]{3}\s?\d{4}$/i, hint: "e.g. VLT 1117" },
  "Cyprus": { regex: /^\d{4}$/, hint: "e.g. 1010" },
};

export default function AddressInfo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [postalError, setPostalError] = useState("");

  const { data: profile, isLoading } = useQuery({
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

  useEffect(() => {
    if (profile) {
      setAddressLine1(profile.address_line1 || "");
      setAddressLine2(profile.address_line2 || "");
      setCity(profile.city || "");
      setPostalCode(profile.postal_code || "");
      setCountry(profile.country || "");
    }
  }, [profile]);

  const validatePostalCode = (code: string, selectedCountry: string): boolean => {
    if (!code || !selectedCountry) return true;
    const pattern = postalCodePatterns[selectedCountry];
    if (!pattern) return true;
    return pattern.regex.test(code.trim());
  };

  const postalHint = country && postalCodePatterns[country]?.hint;

  const handleSave = () => {
    if (!validatePostalCode(postalCode, country)) {
      const hint = postalCodePatterns[country]?.hint || "";
      setPostalError(`${t("addressInvalidPostal")} ${hint}`);
      return;
    }
    setPostalError("");
    mutation.mutate();
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          address_line1: addressLine1,
          address_line2: addressLine2,
          city,
          postal_code: postalCode.trim(),
          country,
        })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: t("addressUpdated") });
      navigate("/account");
    },
    onError: (err: any) => {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/account")} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold">{t("addressTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("addressDesc")}</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="country">{t("addressCountry")}</Label>
          <Select value={country} onValueChange={(val) => { setCountry(val); setPostalError(""); }}>
            <SelectTrigger className="h-12 bg-secondary/50 border-border/50">
              <SelectValue placeholder={t("addressSelectCountry")} />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address1">{t("addressLine1")}</Label>
          <Input id="address1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="123 Main Street" className="h-12 bg-secondary/50 border-border/50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address2">{t("addressLine2")}</Label>
          <Input id="address2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Apt 4B" className="h-12 bg-secondary/50 border-border/50" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">{t("addressCity")}</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="London" className="h-12 bg-secondary/50 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postal">{t("addressPostalCode")}</Label>
            <Input
              id="postal"
              value={postalCode}
              onChange={(e) => { setPostalCode(e.target.value); setPostalError(""); }}
              placeholder={postalHint || t("addressPostalCode")}
              className={`h-12 bg-secondary/50 border-border/50 ${postalError ? "border-destructive" : ""}`}
            />
            {postalError && <p className="text-xs text-destructive">{postalError}</p>}
          </div>
        </div>

        <Button variant="gold" size="lg" className="w-full" onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("saving")}</> : t("addressSave")}
        </Button>
      </div>
    </div>
  );
}
