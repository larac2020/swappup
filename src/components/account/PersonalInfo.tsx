import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";

const phonePrefixes = [
  { code: "+44", country: "UK" }, { code: "+39", country: "IT" }, { code: "+49", country: "DE" },
  { code: "+33", country: "FR" }, { code: "+34", country: "ES" }, { code: "+31", country: "NL" },
  { code: "+32", country: "BE" }, { code: "+41", country: "CH" }, { code: "+43", country: "AT" },
  { code: "+351", country: "PT" }, { code: "+353", country: "IE" }, { code: "+46", country: "SE" },
  { code: "+47", country: "NO" }, { code: "+45", country: "DK" }, { code: "+358", country: "FI" },
  { code: "+48", country: "PL" }, { code: "+30", country: "GR" }, { code: "+420", country: "CZ" },
  { code: "+36", country: "HU" }, { code: "+40", country: "RO" }, { code: "+1", country: "US" },
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
  const { t } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+44");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
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
      const { error } = await supabase.from("profiles").update({ full_name: fullName, email, phone }).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: t("personalProfileUpdated") });
      navigate("/account");
    },
    onError: (err: any) => {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    },
  });

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: t("authPasswordsDontMatch"), description: t("authPasswordsDontMatchDesc"), variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: t("authPasswordTooShort"), description: t("authPasswordTooShortDesc"), variant: "destructive" });
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: t("personalPasswordUpdated") });
      setShowPasswordSection(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/account")} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-xl font-display font-bold">{t("personalInfoTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("personalInfoDesc")}</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fullName">{t("personalFullName")}</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="h-12 bg-secondary/50 border-border/50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("personalEmail")}</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-secondary/50 border-border/50" />
        </div>
        <div className="space-y-2">
          <Label>{t("personalPhone")}</Label>
          <div className="flex gap-2">
            <Select value={phonePrefix} onValueChange={setPhonePrefix}>
              <SelectTrigger className="w-[110px] h-12 bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {phonePrefixes.map((p) => <SelectItem key={p.code} value={p.code}>{p.code} {p.country}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d]/g, ""))} placeholder="7700900000" className="h-12 bg-secondary/50 border-border/50 flex-1" />
          </div>
        </div>
        <Button variant="gold" size="lg" className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("saving")}</> : t("personalSaveChanges")}
        </Button>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-display font-semibold">{t("personalPassword")}</h2>
            <p className="text-sm text-muted-foreground">••••••••</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowPasswordSection(!showPasswordSection)}>
            {showPasswordSection ? t("cancel") : t("personalChangePassword")}
          </Button>
        </div>
        {showPasswordSection && (
          <div className="space-y-4 pt-2 border-t border-border/50">
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("personalNewPassword")}</Label>
              <div className="relative">
                <Input id="newPassword" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12 bg-secondary/50 border-border/50 pr-12" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("personalConfirmNewPassword")}</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 bg-secondary/50 border-border/50 pr-12" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && <p className="text-sm text-destructive">{t("authPasswordsDontMatch")}</p>}
            </div>
            <Button variant="gold" size="lg" className="w-full" onClick={handleChangePassword} disabled={passwordLoading || !newPassword || newPassword !== confirmPassword}>
              {passwordLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("resetUpdating")}</> : t("personalUpdatePassword")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
