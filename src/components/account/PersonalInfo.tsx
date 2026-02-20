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

const phonePrefixes = [
  { code: "+44", country: "UK" },
  { code: "+39", country: "IT" },
  { code: "+49", country: "DE" },
  { code: "+33", country: "FR" },
  { code: "+34", country: "ES" },
  { code: "+31", country: "NL" },
  { code: "+32", country: "BE" },
  { code: "+41", country: "CH" },
  { code: "+43", country: "AT" },
  { code: "+351", country: "PT" },
  { code: "+353", country: "IE" },
  { code: "+46", country: "SE" },
  { code: "+47", country: "NO" },
  { code: "+45", country: "DK" },
  { code: "+358", country: "FI" },
  { code: "+48", country: "PL" },
  { code: "+30", country: "GR" },
  { code: "+420", country: "CZ" },
  { code: "+36", country: "HU" },
  { code: "+40", country: "RO" },
  { code: "+1", country: "US" },
];

function splitPhone(fullPhone: string): { prefix: string; number: string } {
  for (const p of phonePrefixes.sort((a, b) => b.code.length - a.code.length)) {
    if (fullPhone.startsWith(p.code)) {
      return { prefix: p.code, number: fullPhone.slice(p.code.length) };
    }
  }
  return { prefix: "+44", number: fullPhone.replace(/^\+?\d{1,3}/, "") };
}

export default function PersonalInfo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+44");
  const [phoneNumber, setPhoneNumber] = useState("");

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
      setFullName(profile.full_name || "");
      setEmail(profile.email || "");
      if (profile.phone) {
        const { prefix, number } = splitPhone(profile.phone);
        setPhonePrefix(prefix);
        setPhoneNumber(number);
      }
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async () => {
      const phone = phoneNumber ? `${phonePrefix}${phoneNumber}` : "";
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, email, phone })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profile updated" });
      navigate("/account");
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
          <h1 className="text-xl font-display font-bold">Personal Information</h1>
          <p className="text-sm text-muted-foreground">Update your personal details</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            className="h-12 bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-12 bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-2">
          <Label>Phone Number</Label>
          <div className="flex gap-2">
            <Select value={phonePrefix} onValueChange={setPhonePrefix}>
              <SelectTrigger className="w-[110px] h-12 bg-secondary/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {phonePrefixes.map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.code} {p.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="7700900000"
              className="h-12 bg-secondary/50 border-border/50 flex-1"
            />
          </div>
        </div>

        <Button
          variant="gold"
          size="lg"
          className="w-full"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
