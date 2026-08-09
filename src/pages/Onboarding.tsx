import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  User, CreditCard, Shield, MapPin, Sparkles, CheckCircle,
  Loader2, Camera, Upload, X, ChevronRight,
  Search, Plane, AlertCircle
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCountries, getCitiesByCountry } from "@/data/flightData";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import swappupLogo from "@/assets/swappup-logo.png";
import { markOnboardedInMetadata } from "@/lib/onboardingStatus";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";

type Step = "personal" | "verification" | "address" | "payment" | "preferences" | "success";

const STEPS: Step[] = ["personal", "verification", "address", "payment", "preferences", "success"];

const stepProgress: Record<Step, number> = {
  personal: 20,
  verification: 40,
  address: 60,
  payment: 80,
  preferences: 100,
  success: 100,
};

const phonePrefixes = [
  { code: "+44", country: "UK" }, { code: "+39", country: "IT" }, { code: "+49", country: "DE" },
  { code: "+33", country: "FR" }, { code: "+34", country: "ES" }, { code: "+31", country: "NL" },
  { code: "+32", country: "BE" }, { code: "+41", country: "CH" }, { code: "+43", country: "AT" },
  { code: "+351", country: "PT" }, { code: "+353", country: "IE" }, { code: "+46", country: "SE" },
  { code: "+47", country: "NO" }, { code: "+45", country: "DK" }, { code: "+358", country: "FI" },
  { code: "+48", country: "PL" }, { code: "+30", country: "GR" }, { code: "+1", country: "US" },
];

const addressCountries = [
  "United Kingdom", "Italy", "Germany", "France", "Spain", "Netherlands", "Belgium",
  "Switzerland", "Austria", "Portugal", "Ireland", "Sweden", "Norway", "Denmark",
  "Finland", "Poland", "Greece", "Czech Republic", "Hungary", "Romania", "United States",
];

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
  "United States": { regex: /^\d{5}(-\d{4})?$/, hint: "e.g. 10001" },
};

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [skippedSteps, setSkippedSteps] = useState<Set<Step>>(new Set());
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  // Personal info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+44");
  const [phoneNumber, setPhoneNumber] = useState("");

  // ID verification
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Address
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [postalError, setPostalError] = useState("");

  // Payment
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Preferences
  const [favCity, setFavCity] = useState("");
  const [favCountry, setFavCountry] = useState("");
  const [defaultPax, setDefaultPax] = useState("1");

  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (user?.email) setProfileEmail(user.email);
    if (profile) {
      if (profile.full_name) {
        const parts = profile.full_name.split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
      }
      if (profile.phone) {
        for (const p of phonePrefixes.sort((a, b) => b.code.length - a.code.length)) {
          if (profile.phone.startsWith(p.code)) {
            setPhonePrefix(p.code);
            setPhoneNumber(profile.phone.slice(p.code.length));
            break;
          }
        }
      }
      if (profile.address_line1) setAddressLine1(profile.address_line1);
      if (profile.address_line2) setAddressLine2(profile.address_line2);
      if (profile.city) setCity(profile.city);
      if (profile.postal_code) setPostalCode(profile.postal_code);
      if (profile.country) setCountry(profile.country);
    }
  }, [user, profile]);

  const step = STEPS[currentStep];
  const baseProgress = currentStep === 0 ? 10 : stepProgress[STEPS[currentStep - 1]] || 10;
  const targetProgress = stepProgress[step];
  const progress = step === "success" ? 100 : baseProgress;

  const countries = useMemo(() => getCountries(), []);
  const favCities = useMemo(() => favCountry ? getCitiesByCountry(favCountry) : [], [favCountry]);

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));

  const handleSkip = () => {
    if (step !== "success") {
      setSkippedSteps((prev) => new Set(prev).add(step));
    }
    goNext();
  };

  const handleClose = () => {
    if (step === "success") {
      navigate("/account");
    } else {
      // Mark remaining steps as skipped
      localStorage.setItem("flyswap_onboarding_complete", "true");
      navigate("/home");
    }
  };

  // Save personal info
  const savePersonal = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const phone = phoneNumber ? `${phonePrefix}${phoneNumber}` : "";
      const { error } = await supabase.from("profiles")
        .update({ full_name: fullName, phone, email: profileEmail })
        .eq("user_id", user.id);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: t("onbPersonalSaved") });
      goNext();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Upload + verify ID
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: t("onbFileTooLarge"), description: t("onbFileTooLargeDesc"), variant: "destructive" });
      return;
    }
    setIdFile(file);
    setIdPreview(URL.createObjectURL(file));
    setVerifyResult(null);
  };

  const uploadAndVerifyId = async () => {
    if (!idFile || !user) return;
    setUploading(true);
    try {
      // Convert to base64 for AI verification
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(idFile);
      });

      // AI verification
      const { data: aiResult, error: aiError } = await supabase.functions.invoke("verify-id", {
        body: { image: base64 },
      });

      if (aiError) throw aiError;

      const verification = aiResult?.verification;
      setVerifyResult(verification);

      if (!verification?.is_valid_id || !verification?.appears_genuine) {
        toast({
          title: t("onbDocNotAccepted"),
          description: verification?.reason || t("onbDocNotAcceptedFallback"),
          variant: "destructive",
        });
        return;
      }

      // Upload to storage
      const ext = idFile.name.split(".").pop();
      const filePath = `${user.id}/id-document.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("id-documents")
        .upload(filePath, idFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("id-documents").getPublicUrl(filePath);

      // Persist verification server-side via the edge function (service role).
      // The client is no longer allowed to write verification_status / id_document_*.
      const { error: persistError } = await supabase.functions.invoke("verify-id", {
        body: {
          image: base64,
          persist: true,
          id_document_url: urlData.publicUrl,
          acknowledge_name_mismatch: true,
        },
      });
      if (persistError) throw persistError;

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: t("onbIdVerifiedTitle"), description: t("onbIdVerifiedDesc", { type: verification.document_type }) });
      goNext();
    } catch (err: any) {
      toast({ title: t("onbVerifyFailed"), description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Save address
  const saveAddress = async () => {
    if (!user) return;
    if (postalCode && country && postalCodePatterns[country]) {
      if (!postalCodePatterns[country].regex.test(postalCode.trim())) {
        setPostalError(t("onbInvalidPostal", { hint: postalCodePatterns[country].hint }));
        return;
      }
    }
    setPostalError("");
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        address_line1: addressLine1, address_line2: addressLine2,
        city, postal_code: postalCode.trim(), country,
      }).eq("user_id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: t("onbAddressSaved") });
      goNext();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Setup payment
  const setupPayment = async () => {
    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-setup-intent");
      if (error) throw error;
      if (data?.url) {
        localStorage.setItem("flyswap_payment_added", "true");
        window.open(data.url, "_blank");
        toast({ title: t("onbCompletePaymentTitle"), description: t("onbCompletePaymentDesc") });
      }
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setPaymentLoading(false);
    }
  };

  // Save preferences
  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        favorite_departure_city: favCity || null,
        default_pax: parseInt(defaultPax) || 1,
        favorite_categories: null,
      } as any).eq("user_id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      goNext();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const finishSetup = () => {
    localStorage.setItem("flyswap_onboarding_complete", "true");
    void markOnboardedInMetadata();
    queryClient.invalidateQueries({ queryKey: ["onboarding-status", user?.id] });
  };

  const stepIcons: Record<Step, typeof User> = {
    personal: User, verification: Shield, address: MapPin,
    payment: CreditCard, preferences: Sparkles, success: CheckCircle,
  };
  const StepIcon = stepIcons[step];

  const stepTitleKeys: Record<Step, { title: TranslationKey; desc: TranslationKey }> = {
    personal: { title: "onbStepPersonalTitle", desc: "onbStepPersonalDesc" },
    verification: { title: "onbStepVerificationTitle", desc: "onbStepVerificationDesc" },
    address: { title: "onbStepAddressTitle", desc: "onbStepAddressDesc" },
    payment: { title: "onbStepPaymentTitle", desc: "onbStepPaymentDesc" },
    preferences: { title: "onbStepPreferencesTitle", desc: "onbStepPreferencesDesc" },
    success: { title: "onbStepSuccessTitle", desc: "onbStepSuccessDesc" },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <img src={swappupLogo} alt="Swappup" className="h-8 w-auto" />
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step !== "success" && (
          <>
            <Progress value={progress} className="h-1.5" />
            <div className="flex items-center gap-1">
              {STEPS.slice(0, 5).map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < currentStep ? "bg-primary" : i === currentStep ? "bg-primary/60" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-right">{t("onbPercentComplete", { n: Math.round(progress) })}</p>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6 flex flex-col overflow-y-auto">
        <div className="animate-fade-in flex-1 flex flex-col" key={step}>
          {/* Step header */}
          <div className="text-center space-y-3 mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20">
              <StepIcon className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-display font-bold">{t(stepTitleKeys[step].title)}</h1>
            <p className="text-muted-foreground text-sm">{t(stepTitleKeys[step].desc)}</p>
          </div>

          {/* Step content */}
          <div className="flex-1">
            {step === "personal" && (
              <div className="glass rounded-2xl p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t("onbFirstName")}</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className="h-11 bg-secondary/50 border-border/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("onbLastName")}</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className="h-11 bg-secondary/50 border-border/50" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("onbEmail")}</Label>
                  <Input type="email" value={profileEmail} readOnly className="h-11 bg-secondary/30 border-border/50 text-muted-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("onbPhone")}</Label>
                  <div className="flex gap-2">
                    <Select value={phonePrefix} onValueChange={setPhonePrefix}>
                      <SelectTrigger className="w-[100px] h-11 bg-secondary/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {phonePrefixes.map((p) => (
                          <SelectItem key={p.code} value={p.code}>{p.code} {p.country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d]/g, ""))}
                      placeholder="7700900000" className="h-11 bg-secondary/50 border-border/50 flex-1" />
                  </div>
                </div>
              </div>
            )}

            {step === "verification" && (
              <div className="glass rounded-2xl p-5 space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  {t("onbVerifyHelp")}
                </p>
                {idPreview ? (
                  <div className="relative">
                    <img src={idPreview} alt="ID Preview" className="w-full rounded-xl object-cover max-h-48" />
                    <button onClick={() => { setIdFile(null); setIdPreview(null); setVerifyResult(null); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors">
                      <Camera className="w-8 h-8 text-muted-foreground" /><span className="text-sm text-muted-foreground">{t("onbTakePhoto")}</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors">
                      <Upload className="w-8 h-8 text-muted-foreground" /><span className="text-sm text-muted-foreground">{t("onbUploadFile")}</span>
                    </button>
                  </div>
                )}
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileSelect} />

                {verifyResult && !verifyResult.is_valid_id && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm">{verifyResult.reason || t("onbInvalidIdFallback")}</p>
                  </div>
                )}
                {verifyResult?.is_valid_id && verifyResult?.appears_genuine && (
                  <div className="rounded-xl bg-success/10 border border-success/30 p-3 flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <p className="text-sm text-success">{t("onbDocVerified", { type: verifyResult.document_type })}</p>
                  </div>
                )}
              </div>
            )}

            {step === "address" && (
              <div className="glass rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t("onbBillingSame")}</Label>
                  <Switch checked={sameAsBilling} onCheckedChange={setSameAsBilling} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("onbCountry")}</Label>
                  <Select value={country} onValueChange={(v) => { setCountry(v); setPostalError(""); }}>
                    <SelectTrigger className="h-11 bg-secondary/50 border-border/50"><SelectValue placeholder={t("onbSelectCountry")} /></SelectTrigger>
                    <SelectContent>
                      {addressCountries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("onbAddressLine1")}</Label>
                  <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="123 Main Street" className="h-11 bg-secondary/50 border-border/50" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("onbAddressLine2Optional")}</Label>
                  <Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Apt 4B" className="h-11 bg-secondary/50 border-border/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t("onbCity")}</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="London" className="h-11 bg-secondary/50 border-border/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("onbPostal")}</Label>
                    <Input value={postalCode} onChange={(e) => { setPostalCode(e.target.value); setPostalError(""); }}
                      placeholder={postalCodePatterns[country]?.hint || t("onbPostalDefaultPh")}
                      className={`h-11 bg-secondary/50 border-border/50 ${postalError ? "border-destructive" : ""}`} />
                    {postalError && <p className="text-xs text-destructive">{postalError}</p>}
                  </div>
                </div>
              </div>
            )}

            {step === "payment" && (
              <div className="glass rounded-2xl p-5 space-y-5">
                <div className="text-center space-y-2">
                  <CreditCard className="w-12 h-12 text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    {t("onbPaymentDesc")}
                  </p>
                </div>
                <Button variant="gold" size="lg" className="w-full" onClick={setupPayment} disabled={paymentLoading}>
                  {paymentLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("onbRedirecting")}</> : t("onbAddPaymentMethod")}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {t("onbSecureRedirect")}
                </p>
              </div>
            )}

            {step === "preferences" && (
              <div className="glass rounded-2xl p-5 space-y-4">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{t("onbOptionalBadge")}</Badge>
                <div className="space-y-1.5">
                  <Label>{t("onbFavCountry")}</Label>
                  <Select value={favCountry} onValueChange={(v) => { setFavCountry(v); setFavCity(""); }}>
                    <SelectTrigger className="h-11 bg-secondary/50 border-border/50"><SelectValue placeholder={t("onbSelectCountry")} /></SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {favCountry && (
                  <div className="space-y-1.5">
                    <Label>{t("onbFavCity")}</Label>
                    <Select value={favCity} onValueChange={setFavCity}>
                      <SelectTrigger className="h-11 bg-secondary/50 border-border/50"><SelectValue placeholder={t("onbSelectCity")} /></SelectTrigger>
                      <SelectContent>
                        {favCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>{t("onbDefaultPax")}</Label>
                  <Select value={defaultPax} onValueChange={setDefaultPax}>
                    <SelectTrigger className="h-11 bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((n) => <SelectItem key={n} value={String(n)}>{n} {n === 1 ? t("onbPaxOne") : t("onbPaxMany")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="space-y-6 text-center">
                <div className="w-20 h-20 rounded-full gradient-gold flex items-center justify-center mx-auto shadow-glow">
                  <CheckCircle className="w-10 h-10 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">{t("onbCongrats")}</h2>
                  <p className="text-muted-foreground">{t("onbCongratsDesc")}</p>
                </div>
                {skippedSteps.size > 0 && (
                  <div className="rounded-xl bg-warning/10 border border-warning/30 p-3 text-sm text-left">
                    <p className="font-medium text-warning mb-1">{t("onbSkippedTitle")}</p>
                    <p className="text-muted-foreground">{t("onbSkippedDesc")}</p>
                  </div>
                )}
                <div className="space-y-3">
                  {allRequiredComplete ? (
                    <Button variant="gold" size="lg" className="w-full" onClick={() => { finishSetup(); navigate("/sell"); }}>
                      <Plane className="w-4 h-4 mr-2" /> {t("onbStartSelling")}
                    </Button>
                  ) : (
                    <Button variant="gold" size="lg" className="w-full" onClick={() => { finishSetup(); navigate("/account"); }}>
                      <User className="w-4 h-4 mr-2" /> {t("onbCompleteProfile")}
                    </Button>
                  )}
                  <Button variant="outline" size="lg" className="w-full" onClick={() => { finishSetup(); navigate("/browse"); }}>
                    <Search className="w-4 h-4 mr-2" /> {t("onbExplore")}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom actions */}
          {step !== "success" && (
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="flex-1" onClick={handleSkip}>
                {t("onbSkip")}
              </Button>
              {step === "personal" && (
                <Button variant="gold" className="flex-1" onClick={savePersonal} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("onbNext")} <ChevronRight className="w-4 h-4 ml-1" /></>}
                </Button>
              )}
              {step === "verification" && idFile && (
                <Button variant="gold" className="flex-1" onClick={uploadAndVerifyId} disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("onbVerifyAndNext")} <ChevronRight className="w-4 h-4 ml-1" /></>}
                </Button>
              )}
              {step === "verification" && !idFile && (
                <Button variant="gold" className="flex-1" onClick={goNext} disabled>
                  {t("onbNext")} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
              {step === "address" && (
                <Button variant="gold" className="flex-1" onClick={saveAddress} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("onbNext")} <ChevronRight className="w-4 h-4 ml-1" /></>}
                </Button>
              )}
              {step === "payment" && (
                <Button variant="gold" className="flex-1" onClick={goNext}>
                  {t("onbNext")} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
              {step === "preferences" && (
                <Button variant="gold" className="flex-1" onClick={savePreferences} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("onbFinish")} <ChevronRight className="w-4 h-4 ml-1" /></>}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
