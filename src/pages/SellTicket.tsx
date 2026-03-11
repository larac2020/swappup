import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Plane, Calendar as CalendarIcon, Plus, Upload,
  Luggage, Utensils, Zap, AlertCircle, Loader2, Sparkles, Pencil,
  ShieldCheck, Ticket, CreditCard
} from "lucide-react";
import TransferabilityCheck, { fareTypes } from "@/components/listings/TransferabilityCheck";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  getCountries, getCitiesByCountry, getAirportCodesForCity,
  airlines, CityData
} from "@/data/flightData";

const creditTypes = [
  { value: "flight_credit", label: "Flight Credit" },
  { value: "airline_voucher", label: "Airline Voucher" },
  { value: "travel_funds", label: "Travel Funds" },
];

const tripTags = [
  { value: "city_trip", label: "City Trip" },
  { value: "beach", label: "Beach" },
  { value: "winter_holiday", label: "Winter Holiday" },
  { value: "ski_trip", label: "Ski Trip" },
  { value: "adventure", label: "Adventure" },
  { value: "romantic", label: "Romantic" },
  { value: "family", label: "Family" },
  { value: "business", label: "Business" },
];

interface TicketInclusions {
  luggageIncluded: boolean;
  carryOnIncluded: boolean;
  mealIncluded: boolean;
  speedyBoarding: boolean;
}

const defaultInclusions: TicketInclusions = {
  luggageIncluded: false,
  carryOnIncluded: true,
  mealIncluded: false,
  speedyBoarding: false,
};

const getDefaultFormData = () => ({
  listingType: "flight_ticket" as "flight_ticket" | "travel_credit",
  originCountry: "",
  originCity: "",
  originAirport: "",
  destinationCountry: "",
  destinationCity: "",
  destinationAirport: "",
  departureDate: undefined as Date | undefined,
  returnDate: undefined as Date | undefined,
  airline: "",
  fareType: "",
  flightNumber: "",
  price: "",
  originalPrice: "",
  ticketCount: "1",
  stopovers: "0",
  additionalNotes: "",
  selectedTags: [] as string[],
  bumpListing: false,
  // Voucher fields
  creditType: "",
  creditValue: "",
  creditCurrency: "EUR",
  creditExpiryDate: undefined as Date | undefined,
});

export default function SellTicket() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { toast } = useToast();
  const { user } = useAuth();

  // Check profile completion for sell gating
  const { data: gateProfile } = useQuery({
    queryKey: ["profile-gate", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isProfileComplete = !!(gateProfile?.full_name && gateProfile?.phone);
  const isAddressComplete = !!(gateProfile?.address_line1 && gateProfile?.city && gateProfile?.postal_code && gateProfile?.country);
  const isVerified = gateProfile?.verification_status === "verified";
  const isPaymentComplete = typeof window !== "undefined" && localStorage.getItem("flyswap_payment_added") === "true";
  const allSectionsComplete = isProfileComplete && isAddressComplete && isVerified && isPaymentComplete;
  const isEditMode = !!editId;

  const [isReturn, setIsReturn] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifyingVoucher, setIsVerifyingVoucher] = useState(false);
  const [voucherVerification, setVoucherVerification] = useState<any>(null);
  const [editLoaded, setEditLoaded] = useState(false);

  // Shared inclusions (used when sameInclusions is true)
  const [sharedInclusions, setSharedInclusions] = useState<TicketInclusions>({ ...defaultInclusions });
  // Per-ticket inclusions (used when sameInclusions is false)
  const [perTicketInclusions, setPerTicketInclusions] = useState<TicketInclusions[]>([{ ...defaultInclusions }]);
  const [sameInclusions, setSameInclusions] = useState(true);

  const [formData, setFormData] = useState(getDefaultFormData());

  const ticketCount = parseInt(formData.ticketCount) || 1;

  // Load existing listing for edit mode
  const { data: editListing } = useQuery({
    queryKey: ["editListing", editId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", editId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!editId,
  });

  // Populate form when edit listing loads
  useEffect(() => {
    if (editListing && !editLoaded) {
      setEditLoaded(true);
      const hasReturn = !!editListing.return_date;
      setIsReturn(hasReturn);

      setFormData({
        listingType: (editListing as any).listing_type || "flight_ticket",
        originCountry: editListing.origin_country,
        originCity: editListing.origin_city,
        originAirport: "",
        destinationCountry: editListing.destination_country,
        destinationCity: editListing.destination_city,
        destinationAirport: "",
        departureDate: new Date(editListing.departure_date),
        returnDate: hasReturn ? new Date(editListing.return_date!) : undefined,
        airline: editListing.airline,
        fareType: "",
        flightNumber: editListing.flight_number || "",
        price: String(Number(editListing.price)),
        originalPrice: editListing.original_price ? String(Number(editListing.original_price)) : "",
        ticketCount: String(editListing.ticket_count),
        stopovers: String(editListing.stopovers ?? 0),
        additionalNotes: editListing.additional_notes || "",
        selectedTags: (editListing.tags as string[]) || [],
        bumpListing: false,
        creditType: (editListing as any).credit_type || "",
        creditValue: (editListing as any).credit_value ? String(Number((editListing as any).credit_value)) : "",
        creditCurrency: (editListing as any).credit_currency || "EUR",
        creditExpiryDate: (editListing as any).credit_expiry_date ? new Date((editListing as any).credit_expiry_date) : undefined,
      });

      const shared: TicketInclusions = {
        luggageIncluded: editListing.luggage_included ?? false,
        carryOnIncluded: editListing.carry_on_included ?? true,
        mealIncluded: editListing.meal_included ?? false,
        speedyBoarding: editListing.speedy_boarding ?? false,
      };
      setSharedInclusions(shared);

      if (editListing.per_ticket_inclusions && Array.isArray(editListing.per_ticket_inclusions)) {
        setSameInclusions(false);
        setPerTicketInclusions(
          (editListing.per_ticket_inclusions as any[]).map((t: any) => ({
            luggageIncluded: t.luggageIncluded ?? false,
            carryOnIncluded: t.carryOnIncluded ?? true,
            mealIncluded: t.mealIncluded ?? false,
            speedyBoarding: t.speedyBoarding ?? false,
          }))
        );
      } else {
        setSameInclusions(true);
        setPerTicketInclusions(
          Array(editListing.ticket_count).fill(null).map(() => ({ ...shared }))
        );
      }
    }
  }, [editListing, editLoaded]);

  // Keep perTicketInclusions array in sync with ticketCount
  const handleTicketCountChange = (newCount: string) => {
    const count = parseInt(newCount) || 1;
    setFormData((prev) => ({ ...prev, ticketCount: newCount }));
    setPerTicketInclusions((prev) => {
      if (count > prev.length) {
        return [...prev, ...Array(count - prev.length).fill(null).map(() => ({ ...defaultInclusions }))];
      }
      return prev.slice(0, count);
    });
  };

  const countries = useMemo(() => getCountries(), []);
  const originCities = useMemo(() => formData.originCountry ? getCitiesByCountry(formData.originCountry) : [], [formData.originCountry]);
  const destinationCities = useMemo(() => formData.destinationCountry ? getCitiesByCountry(formData.destinationCountry) : [], [formData.destinationCountry]);
  const originAirports = useMemo(() => formData.originCity ? getAirportCodesForCity(formData.originCity) : [], [formData.originCity]);
  const destinationAirports = useMemo(() => formData.destinationCity ? getAirportCodesForCity(formData.destinationCity) : [], [formData.destinationCity]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Full reset helper
  const resetForm = () => {
    setFormData(getDefaultFormData());
    setIsReturn(false);
    setSharedInclusions({ ...defaultInclusions });
    setPerTicketInclusions([{ ...defaultInclusions }]);
    setSameInclusions(true);
    setVoucherVerification(null);
  };

  const handleVoucherUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsVerifyingVoucher(true);
    setVoucherVerification(null);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("verify-voucher", {
        body: { image: base64, fileName: file.name },
      });

      if (error) throw error;

      if (data?.verification) {
        const v = data.verification;
        setVoucherVerification(v);

        // Auto-fill form fields from verified data
        if (v.isValid && v.confidenceScore >= 50) {
          setFormData((prev) => ({
            ...prev,
            airline: v.airline || prev.airline,
            creditType: v.creditType || prev.creditType,
            creditValue: v.creditValue ? String(v.creditValue) : prev.creditValue,
            creditCurrency: v.currency || prev.creditCurrency,
            creditExpiryDate: v.expiryDate ? new Date(v.expiryDate) : prev.creditExpiryDate,
          }));
          toast({ title: "Voucher verified! ✅", description: `Confidence: ${v.confidenceScore}%. Details auto-filled.` });
        } else {
          toast({ title: "Verification failed", description: v.flags?.join(", ") || "This document could not be verified.", variant: "destructive" });
        }
      }
    } catch (err: any) {
      console.error("Voucher verify error:", err);
      toast({ title: "Verification failed", description: "Could not verify the voucher. Please try again.", variant: "destructive" });
    } finally {
      setIsVerifyingVoucher(false);
      e.target.value = "";
    }
  };

  const handleTicketUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset everything before populating with new data
    resetForm();

    setIsUploading(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("parse-ticket", {
        body: { image: base64, fileName: file.name },
      });

      if (error) throw error;

      if (data?.parsed) {
        const p = data.parsed;
        const hasReturn = !!p.returnDate;
        setIsReturn(hasReturn);

        const parsedCount = p.ticketCount ? String(p.ticketCount) : "1";

        setFormData((prev) => ({
          ...prev,
          originCountry: p.originCountry || "",
          originCity: p.originCity || "",
          destinationCountry: p.destinationCountry || "",
          destinationCity: p.destinationCity || "",
          airline: p.airline || "",
          flightNumber: p.flightNumber || "",
          originalPrice: p.originalPrice?.toString() || "",
          departureDate: p.departureDate ? new Date(p.departureDate) : undefined,
          returnDate: hasReturn ? new Date(p.returnDate) : undefined,
          ticketCount: parsedCount,
        }));

        // Sync per-ticket array
        const count = parseInt(parsedCount) || 1;
        setPerTicketInclusions(Array(count).fill(null).map(() => ({ ...defaultInclusions })));

        toast({ title: "Ticket parsed!", description: `Detected ${count} ticket${count > 1 ? "s" : ""}. Please review the details below.` });
      }
    } catch (err: any) {
      console.error("Ticket parse error:", err);
      toast({ title: "Could not read ticket", description: "Please fill in the details manually.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      // Reset file input so re-uploading the same file triggers onChange
      e.target.value = "";
    }
  };

  const createListingMutation = useMutation({
    mutationFn: async () => {
      const bumpedUntil = formData.bumpListing
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const inclusions = sameInclusions ? sharedInclusions : sharedInclusions;
      const perTicketData = sameInclusions ? null : perTicketInclusions;

      const isVoucher = formData.listingType === "travel_credit";

      const listingData: Record<string, any> = {
        listing_type: formData.listingType,
        airline: formData.airline,
        price: parseFloat(formData.price),
        original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        additional_notes: formData.additionalNotes || null,
        tags: formData.selectedTags as any,
      };

      if (isVoucher) {
        listingData.title = `${formData.airline} ${creditTypes.find(c => c.value === formData.creditType)?.label || "Credit"}`;
        listingData.credit_type = formData.creditType;
        listingData.credit_value = formData.creditValue ? parseFloat(formData.creditValue) : null;
        listingData.credit_currency = formData.creditCurrency;
        listingData.credit_expiry_date = formData.creditExpiryDate ? formData.creditExpiryDate.toISOString().split("T")[0] : null;
        // Set required flight fields to placeholder values for vouchers
        listingData.origin_city = "N/A";
        listingData.origin_country = "N/A";
        listingData.destination_city = "N/A";
        listingData.destination_country = "N/A";
        listingData.departure_date = formData.creditExpiryDate ? formData.creditExpiryDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
        listingData.ticket_count = 1;
      } else {
        listingData.title = `${formData.destinationCity} ${formData.selectedTags.length > 0 ? tripTags.find(t => t.value === formData.selectedTags[0])?.label || "Trip" : "Trip"}`;
        listingData.origin_city = formData.originCity;
        listingData.origin_country = formData.originCountry;
        listingData.destination_city = formData.destinationCity;
        listingData.destination_country = formData.destinationCountry;
        listingData.departure_date = formData.departureDate!.toISOString().split("T")[0];
        listingData.return_date = isReturn && formData.returnDate ? formData.returnDate.toISOString().split("T")[0] : null;
        listingData.flight_number = formData.flightNumber || null;
        listingData.ticket_count = ticketCount;
        listingData.luggage_included = sameInclusions ? sharedInclusions.luggageIncluded : perTicketInclusions[0]?.luggageIncluded ?? false;
        listingData.carry_on_included = sameInclusions ? sharedInclusions.carryOnIncluded : perTicketInclusions[0]?.carryOnIncluded ?? true;
        listingData.meal_included = sameInclusions ? sharedInclusions.mealIncluded : perTicketInclusions[0]?.mealIncluded ?? false;
        listingData.speedy_boarding = sameInclusions ? sharedInclusions.speedyBoarding : perTicketInclusions[0]?.speedyBoarding ?? false;
        listingData.stopovers = parseInt(formData.stopovers);
        listingData.per_ticket_inclusions = (sameInclusions ? null : perTicketInclusions) as any;
      }

      if (editId) {
        const { error } = await supabase
          .from("listings")
          .update(listingData as any)
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("listings").insert({
          ...listingData,
          seller_id: profile!.id,
          bumped_until: bumpedUntil,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: editId ? "Listing updated!" : "Listing created!",
        description: editId ? "Your changes have been saved." : "Your ticket is now live on the marketplace.",
      });
      navigate(editId ? "/listings" : "/home");
    },
    onError: (error: any) => {
      const msg = error.message || "";
      if (msg.includes("DUPLICATE_LISTING")) {
        toast({ title: "Duplicate listing", description: "You already have an active listing with the same flight number and departure date.", variant: "destructive" });
      } else if (msg.includes("RATE_LIMIT")) {
        toast({ title: "Listing limit reached", description: "You've reached your maximum number of active listings. Deactivate some before creating new ones.", variant: "destructive" });
      } else if (msg.includes("PRICE_CAP")) {
        toast({ title: "Price too high", description: "Selling price cannot exceed the original ticket price.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    },
  });

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter((t) => t !== tag)
        : [...prev.selectedTags, tag],
    }));
  };

  const priceError = formData.price && formData.originalPrice && parseFloat(formData.price) >= parseFloat(formData.originalPrice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      toast({ title: "Error", description: "Profile not loaded yet.", variant: "destructive" });
      return;
    }
    const isVoucher = formData.listingType === "travel_credit";
    if (isVoucher) {
      if (!formData.airline || !formData.creditType || !formData.price) {
        toast({ title: "Missing fields", description: "Please fill in airline, credit type, and selling price.", variant: "destructive" });
        return;
      }
    } else {
      if (!formData.originCity || !formData.destinationCity || !formData.airline || !formData.departureDate) {
        toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
        return;
      }
    }
    if (priceError) {
      toast({ title: "Price too high", description: "Selling price must be lower than the original price.", variant: "destructive" });
      return;
    }
    createListingMutation.mutate();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renderInclusionToggles = (inclusions: TicketInclusions, onChange: (field: keyof TicketInclusions, value: boolean) => void, label?: string) => (
    <div className="space-y-3">
      {label && <p className="text-sm font-medium text-muted-foreground">{label}</p>}
      <div className="flex items-center justify-between">
        <div className={cn("flex items-center gap-3 transition-colors", inclusions.luggageIncluded ? "text-primary" : "text-muted-foreground")}>
          <Luggage className="w-5 h-5" /><span>Checked Luggage</span>
        </div>
        <Switch checked={inclusions.luggageIncluded} onCheckedChange={(v) => onChange("luggageIncluded", v)} />
      </div>
      <div className="flex items-center justify-between">
        <div className={cn("flex items-center gap-3 transition-colors", inclusions.carryOnIncluded ? "text-primary" : "text-muted-foreground")}>
          <Luggage className="w-5 h-5" /><span>Carry-on Bag</span>
        </div>
        <Switch checked={inclusions.carryOnIncluded} onCheckedChange={(v) => onChange("carryOnIncluded", v)} />
      </div>
      <div className="flex items-center justify-between">
        <div className={cn("flex items-center gap-3 transition-colors", inclusions.mealIncluded ? "text-primary" : "text-muted-foreground")}>
          <Utensils className="w-5 h-5" /><span>In-flight Meal</span>
        </div>
        <Switch checked={inclusions.mealIncluded} onCheckedChange={(v) => onChange("mealIncluded", v)} />
      </div>
      <div className="flex items-center justify-between">
        <div className={cn("flex items-center gap-3 transition-colors", inclusions.speedyBoarding ? "text-primary" : "text-muted-foreground")}>
          <Zap className="w-5 h-5" /><span>Speedy Boarding</span>
        </div>
        <Switch checked={inclusions.speedyBoarding} onCheckedChange={(v) => onChange("speedyBoarding", v)} />
      </div>
    </div>
  );

  return (
    <AppLayout showNav={false}>
      <div className="min-h-screen">
        <div className="sticky top-0 z-50 glass-strong border-b border-border/50">
          <div className="flex items-center gap-4 px-4 h-14">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">{editId ? "Edit Listing" : "Create Listing"}</h1>
          </div>
        </div>

        {/* Sell gating - incomplete sections */}
        {!isEditMode && gateProfile && !allSectionsComplete && (
          <div className="px-4 py-6">
            <div className="glass rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Complete your account setup</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    You need to complete all required sections before you can sell tickets.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {!isProfileComplete && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <span className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold">!</span>
                    Personal Information incomplete
                  </div>
                )}
                {!isVerified && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <span className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold">!</span>
                    ID Verification incomplete
                  </div>
                )}
                {!isAddressComplete && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <span className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold">!</span>
                    Address incomplete
                  </div>
                )}
                {!isPaymentComplete && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <span className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold">!</span>
                    Payment method not added
                  </div>
                )}
              </div>
              <Button variant="gold" size="lg" className="w-full" onClick={() => navigate("/account")}>
                Go to Account Settings
              </Button>
            </div>
          </div>
        )}

        {(isEditMode || allSectionsComplete || !gateProfile) && (
        <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
          {/* Listing Type Selector */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">What are you selling?</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, listingType: "flight_ticket" })}
                className={cn(
                  "glass rounded-2xl p-4 flex flex-col items-center gap-2 transition-all border-2",
                  formData.listingType === "flight_ticket"
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:border-primary/30"
                )}
              >
                <Ticket className={cn("w-6 h-6", formData.listingType === "flight_ticket" ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", formData.listingType === "flight_ticket" ? "text-foreground" : "text-muted-foreground")}>Flight Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, listingType: "travel_credit" })}
                className={cn(
                  "glass rounded-2xl p-4 flex flex-col items-center gap-2 transition-all border-2",
                  formData.listingType === "travel_credit"
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:border-primary/30"
                )}
              >
                <CreditCard className={cn("w-6 h-6", formData.listingType === "travel_credit" ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", formData.listingType === "travel_credit" ? "text-foreground" : "text-muted-foreground")}>Travel Credit / Voucher</span>
              </button>
            </div>
          </div>

          {/* VOUCHER FORM */}
          {formData.listingType === "travel_credit" && (
            <>
              {/* Voucher Details */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Credit / Voucher Details
                </h2>
                <div className="glass rounded-2xl p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Airline</Label>
                    <Select value={formData.airline} onValueChange={(v) => setFormData({ ...formData, airline: v })}>
                      <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select airline" /></SelectTrigger>
                      <SelectContent className="bg-popover z-50 max-h-60">
                        {airlines.map((a) => <SelectItem key={a.name} value={a.name}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Credit Type</Label>
                    <Select value={formData.creditType} onValueChange={(v) => setFormData({ ...formData, creditType: v })}>
                      <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {creditTypes.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Credit Value ({formData.creditCurrency})</Label>
                      <Input type="number" min="0" step="0.01" placeholder="200.00" value={formData.creditValue} onChange={(e) => setFormData({ ...formData, creditValue: e.target.value })} className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={formData.creditCurrency} onValueChange={(v) => setFormData({ ...formData, creditCurrency: v })}>
                        <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.creditExpiryDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.creditExpiryDate ? format(formData.creditExpiryDate, "PPP") : "Select expiry date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.creditExpiryDate}
                          onSelect={(date) => setFormData({ ...formData, creditExpiryDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Pricing for voucher */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Pricing</h2>
                <div className="glass rounded-2xl p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Original Value ({formData.creditCurrency})</Label>
                      <Input type="number" min="0" step="0.01" placeholder="200.00" value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Selling Price ({formData.creditCurrency})</Label>
                      <Input type="number" min="1" step="0.01" placeholder="150.00" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className={cn("bg-secondary/50", priceError && "border-destructive")} required />
                    </div>
                  </div>
                  {priceError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Selling price must be lower than the original value
                    </p>
                  )}
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Additional Notes</h2>
                <Textarea
                  placeholder="Add any details about the credit/voucher (restrictions, conditions, how to redeem...)"
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  className="bg-secondary/50 min-h-24"
                />
              </div>
            </>
          )}

          {/* FLIGHT TICKET FORM */}
          {formData.listingType === "flight_ticket" && (
            <>
          {/* Upload Ticket */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload Ticket Confirmation
            </h2>
            <label className="glass rounded-2xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors border-2 border-dashed border-border">
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleTicketUpload} disabled={isUploading} />
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Reading your ticket...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    Upload a photo or screenshot of your ticket confirmation to auto-fill details
                  </p>
                  <p className="text-xs text-muted-foreground">or fill in manually below</p>
                </>
              )}
            </label>
          </div>

          {/* Route */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              Flight Route
            </h2>
            <div className="glass rounded-2xl p-4 space-y-4">
              {/* Origin */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Country</Label>
                  <Select value={formData.originCountry} onValueChange={(v) => setFormData({ ...formData, originCountry: v, originCity: "", originAirport: "" })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>From City</Label>
                  <Select value={formData.originCity} onValueChange={(v) => setFormData({ ...formData, originCity: v, originAirport: "" })} disabled={!formData.originCountry}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {originCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {originAirports.length > 0 && (
                <div className="space-y-2">
                  <Label>From Airport</Label>
                  <Select value={formData.originAirport} onValueChange={(v) => setFormData({ ...formData, originAirport: v })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select airport" /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {originAirports.map((a) => (
                        <SelectItem key={a.airportCode} value={a.airportCode}>{a.airportCode} — {a.airportName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-primary -rotate-45" />
                </div>
              </div>

              {/* Destination */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>To Country</Label>
                  <Select value={formData.destinationCountry} onValueChange={(v) => setFormData({ ...formData, destinationCountry: v, destinationCity: "", destinationAirport: "" })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To City</Label>
                  <Select value={formData.destinationCity} onValueChange={(v) => setFormData({ ...formData, destinationCity: v, destinationAirport: "" })} disabled={!formData.destinationCountry}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {destinationCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {destinationAirports.length > 0 && (
                <div className="space-y-2">
                  <Label>To Airport</Label>
                  <Select value={formData.destinationAirport} onValueChange={(v) => setFormData({ ...formData, destinationAirport: v })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select airport" /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {destinationAirports.map((a) => (
                        <SelectItem key={a.airportCode} value={a.airportCode}>{a.airportCode} — {a.airportName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* One-way / Return toggle + Dates */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Flight Dates
            </h2>
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label>Return flight?</Label>
                <Switch
                  checked={isReturn}
                  onCheckedChange={(checked) => {
                    setIsReturn(checked);
                    if (!checked) {
                      setFormData((prev) => ({ ...prev, returnDate: undefined }));
                    }
                  }}
                />
              </div>
              <div className={cn("grid gap-4", isReturn ? "grid-cols-2" : "grid-cols-1")}>
                <div className="space-y-2">
                  <Label>Departure Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.departureDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.departureDate ? format(formData.departureDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.departureDate}
                        onSelect={(date) => setFormData({ ...formData, departureDate: date })}
                        initialFocus
                        modifiers={{ today: today }}
                        modifiersClassNames={{ today: "text-muted-foreground" }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {isReturn && (
                  <div className="space-y-2">
                    <Label>Return Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.returnDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.returnDate ? format(formData.returnDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.returnDate}
                          onSelect={(date) => setFormData({ ...formData, returnDate: date })}
                          initialFocus
                          modifiers={{ today: today }}
                          modifiersClassNames={{ today: "text-muted-foreground" }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Flight Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Flight Details</h2>
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Airline</Label>
                  <Select value={formData.airline} onValueChange={(v) => setFormData({ ...formData, airline: v, fareType: "" })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select airline" /></SelectTrigger>
                    <SelectContent className="bg-popover z-50 max-h-60">
                      {airlines.map((a) => <SelectItem key={a.name} value={a.name}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fare Type</Label>
                  <Select value={formData.fareType} onValueChange={(v) => setFormData({ ...formData, fareType: v })} disabled={!formData.airline}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select fare" /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {fareTypes.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Transferability Check */}
              {formData.airline && (
                <TransferabilityCheck airline={formData.airline} fareType={formData.fareType || "standard"} />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Flight Number</Label>
                  <Input placeholder="e.g. VY8500" value={formData.flightNumber} onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })} className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>Number of Tickets</Label>
                  <Input type="number" min="1" value={formData.ticketCount} onChange={(e) => handleTicketCountChange(e.target.value)} className="bg-secondary/50" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Tickets</Label>
                  <Input type="number" min="1" value={formData.ticketCount} onChange={(e) => handleTicketCountChange(e.target.value)} className="bg-secondary/50" required />
                </div>
                <div className="space-y-2">
                  <Label>Stopovers</Label>
                  <Input type="number" min="0" value={formData.stopovers} onChange={(e) => setFormData({ ...formData, stopovers: e.target.value })} className="bg-secondary/50" />
                </div>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">What's Included</h2>
            <div className="glass rounded-2xl p-4 space-y-4">
              {ticketCount > 1 && (
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Same for all tickets?</p>
                    <p className="text-xs text-muted-foreground">Toggle off if inclusions differ between tickets</p>
                  </div>
                  <Switch checked={sameInclusions} onCheckedChange={setSameInclusions} />
                </div>
              )}

              {sameInclusions ? (
                renderInclusionToggles(sharedInclusions, (field, value) =>
                  setSharedInclusions((prev) => ({ ...prev, [field]: value }))
                )
              ) : (
                <div className="space-y-5">
                  {perTicketInclusions.map((inc, i) => (
                    <div key={i} className={cn(i > 0 && "pt-4 border-t border-border/50")}>
                      {renderInclusionToggles(
                        inc,
                        (field, value) =>
                          setPerTicketInclusions((prev) =>
                            prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
                          ),
                        `Ticket ${i + 1}`
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Pricing</h2>
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Original Price (€)</Label>
                  <Input type="number" min="0" step="0.01" placeholder="145.00" value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>Your Selling Price (€)</Label>
                  <Input type="number" min="1" step="0.01" placeholder="89.00" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className={cn("bg-secondary/50", priceError && "border-destructive")} required />
                </div>
              </div>
              {priceError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Selling price must be lower than the original price
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Trip Type</h2>
            <div className="flex flex-wrap gap-2">
              {tripTags.map((tag) => (
                <Badge
                  key={tag.value}
                  variant="outline"
                  className={cn("cursor-pointer transition-all py-2 px-3", formData.selectedTags.includes(tag.value) ? "bg-primary/20 border-primary text-primary" : "hover:border-primary/50")}
                  onClick={() => toggleTag(tag.value)}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Additional Notes</h2>
            <Textarea
              placeholder="Add any extra information about your tickets..."
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              className="bg-secondary/50 min-h-24"
            />
          </div>
            </>
          )}

          {/* Bump Listing */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Boost Visibility
            </h2>
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">🔥 Bump to Hot Deals</p>
                  <p className="text-xs text-muted-foreground">
                    Feature your listing in the Hot Deals section on the Home page for 7 days
                  </p>
                </div>
                <Switch
                  checked={formData.bumpListing}
                  onCheckedChange={(checked) => setFormData({ ...formData, bumpListing: checked })}
                />
              </div>
            </div>
          </div>

          <Button type="submit" variant="gold" size="xl" className="w-full" disabled={createListingMutation.isPending}>
            {createListingMutation.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" />{editId ? "Saving..." : "Creating Listing..."}</>
            ) : (
              <>{editId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}{editId ? "Save Changes" : "Create Listing"}</>
            )}
          </Button>
        </form>
        )}
      </div>
    </AppLayout>
  );
}
