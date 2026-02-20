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

export default function AddressInfo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

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

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          address_line1: addressLine1,
          address_line2: addressLine2,
          city,
          postal_code: postalCode,
          country,
        })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Address updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
          <h1 className="text-xl font-display font-bold">Address</h1>
          <p className="text-sm text-muted-foreground">Your billing address</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="address1">Address Line 1</Label>
          <Input id="address1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="123 Main Street" className="h-12 bg-secondary/50 border-border/50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address2">Address Line 2 (optional)</Label>
          <Input id="address2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Apt 4B" className="h-12 bg-secondary/50 border-border/50" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" className="h-12 bg-secondary/50 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postal">Postal Code</Label>
            <Input id="postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="10001" className="h-12 bg-secondary/50 border-border/50" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United States" className="h-12 bg-secondary/50 border-border/50" />
        </div>

        <Button variant="gold" size="lg" className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Address"}
        </Button>
      </div>
    </div>
  );
}
