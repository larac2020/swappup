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
  Ticket, TrainFront, CheckCircle2, Clock
} from "lucide-react";
import TransferabilityCheck, { fareTypes } from "@/components/listings/TransferabilityCheck";
import TrainTransferabilityCheck, { TrainTransferabilityResult } from "@/components/listings/TrainTransferabilityCheck";
import TrainForm from "@/components/listings/TrainForm";
import SellerFeeBreakdown from "@/components/listings/SellerFeeBreakdown";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  getCountries, getCitiesByCountry, getAirportCodesForCity,
  airlines, CityData
} from "@/data/flightData";
import {
  trainOperators, getOperator, getTrainCountries, getTrainCitiesByCountry,
  getStationsForCity, currencySymbol
} from "@/data/trainData";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

const tripTags: { value: string; labelKey: TranslationKey }[] = [
  { value: "city_trip", labelKey: "tagCityTrip" },
  { value: "beach", labelKey: "tagBeach" },
  { value: "winter_holiday", labelKey: "tagWinterHoliday" },
  { value: "ski_trip", labelKey: "tagSkiTrip" },
  { value: "adventure", labelKey: "tagAdventure" },
  { value: "romantic", labelKey: "tagRomantic" },
  { value: "family", labelKey: "tagFamily" },
  { value: "business", labelKey: "tagBusiness" },
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

interface BoostOption {
  hours: number; // 0 = no boost
  labelKey: "boost24h" | "boost3d" | "boost7d";
  price: number; // EUR
}

const BOOST_OPTIONS: BoostOption[] = [
  { hours: 24, labelKey: "boost24h", price: 1.99 },
  { hours: 72, labelKey: "boost3d", price: 3.99 },
  { hours: 168, labelKey: "boost7d", price: 4.99 },
];

const getDefaultFormData = () => ({
  listingType: "flight_ticket" as "flight_ticket" | "train_ticket",
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
  boostHours: 0 as number, // 0 = no boost; otherwise 24 | 72 | 168
  // Train-only fields
  operator: "",
  trainNumber: "",
  trainClass: "",
  trainOriginStation: "",
  trainDestinationStation: "",
  departureTime: "",
});

export default function SellTicket() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

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
  const [editLoaded, setEditLoaded] = useState(false);

  // Ticket upload is mandatory (except in edit mode where the listing already exists)
  const [ticketUploaded, setTicketUploaded] = useState(false);

  // Transferability blocking flags from the in-form check cards
  const [flightTransferBlocked, setFlightTransferBlocked] = useState(false);
  const [flightTransferFee, setFlightTransferFee] = useState<number | null>(null);
  const [flightFeeAcknowledged, setFlightFeeAcknowledged] = useState(true);
  const [trainTransferResult, setTrainTransferResult] = useState<TrainTransferabilityResult | null>(null);

  // Flight schedule verification (Aviationstack via edge function)
  const [isVerifyingFlight, setIsVerifyingFlight] = useState(false);
  const [flightVerification, setFlightVerification] = useState<{
    status: "verified" | "mismatch" | "not_found" | "provider_error" | "error" | "invalid_input";
    flags?: string[];
    verified?: {
      airline?: string | null;
      originIata?: string | null;
      destinationIata?: string | null;
      originAirport?: string | null;
      destinationAirport?: string | null;
    };
    message?: string;
  } | null>(null);

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
      // Existing listing — treat upload requirement as satisfied
      setTicketUploaded(true);
      const hasReturn = !!editListing.return_date;
      setIsReturn(hasReturn);

      setFormData({
        listingType: ((editListing as any).listing_type === "train_ticket" ? "train_ticket" : "flight_ticket") as "flight_ticket" | "train_ticket",
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
        operator: (editListing as any).operator || "",
        trainNumber: (editListing as any).train_number || "",
        trainClass: (editListing as any).train_class || "",
        trainOriginStation: (editListing as any).origin_station || "",
        trainDestinationStation: (editListing as any).destination_station || "",
        departureTime: (editListing as any).departure_time || "",
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
    setFlightVerification(null);
    setFlightTransferBlocked(false);
    setFlightTransferFee(null);
    setTrainTransferResult(null);
    setTicketUploaded(false);
  };

  const verifyFlightSchedule = async (params: {
    airline: string;
    flightNumber: string;
    departureDate: string;
    originCity?: string;
    destinationCity?: string;
    originCountry?: string;
    destinationCountry?: string;
  }) => {
    setIsVerifyingFlight(true);
    setFlightVerification(null);
    try {
      const { data, error } = await supabase.functions.invoke("verify-flight", { body: params });
      if (error) throw error;
      setFlightVerification(data);
      if (data?.status === "verified") {
          toast({ title: t("sellToastFlightVerified"), description: t("sellToastFlightVerifiedDesc") });
      } else if (data?.status === "mismatch") {
        toast({
            title: t("sellToastMismatch"),
            description: t("sellToastMismatchDesc"),
          variant: "destructive",
        });
      } else if (data?.status === "not_found") {
        toast({
            title: t("sellToastNotFound"),
            description: t("sellToastNotFoundDesc"),
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Flight verify error:", err);
      setFlightVerification({ status: "error", message: err?.message || "Verification failed" });
      toast({
          title: t("sellToastVerifyUnavailable"),
          description: t("sellToastVerifyUnavailableDesc"),
        variant: "destructive",
      });
    } finally {
      setIsVerifyingFlight(false);
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
        // Determine ticket kind from AI output (defaults to flight)
        const isTrain = p.ticketKind === "train" || !!p.operator || !!p.trainNumber || !!p.originStation;

        // Reject expired / too-soon tickets at parse time so we never pre-fill an invalid date.
        // Listings must depart at least 72 hours in the future.
        const minTs = Date.now() + 72 * 60 * 60 * 1000;
        const parsedDeparture = p.departureDate ? new Date(p.departureDate) : undefined;
        if (parsedDeparture && (isNaN(parsedDeparture.getTime()) || parsedDeparture.getTime() < minTs)) {
          // Treat as a hard failure — do NOT mark upload as satisfied
          setTicketUploaded(false);
          toast({
            title: t("sellToastExpiredTitle"),
            description: t("sellToastExpiredDesc", { date: parsedDeparture.toLocaleDateString() }),
            variant: "destructive",
          });
          return;
        }

        const hasReturn = !!p.returnDate;
        setIsReturn(hasReturn);
        // Mark upload as satisfied — even if parsing returns partial data, the file was uploaded
        setTicketUploaded(true);

        const parsedCount = p.ticketCount ? String(p.ticketCount) : "1";

        setFormData((prev) => ({
          ...prev,
          listingType: isTrain ? "train_ticket" : "flight_ticket",
          originCountry: p.originCountry || "",
          originCity: p.originCity || "",
          destinationCountry: p.destinationCountry || "",
          destinationCity: p.destinationCity || "",
          airline: isTrain ? (p.operator || "") : (p.airline || ""),
          flightNumber: isTrain ? "" : (p.flightNumber || ""),
          originalPrice: p.originalPrice?.toString() || "",
          departureDate: parsedDeparture,
          returnDate: hasReturn ? new Date(p.returnDate) : undefined,
          ticketCount: parsedCount,
          // Train-only fields
          operator: isTrain ? (p.operator || "") : "",
          trainNumber: isTrain ? (p.trainNumber || "") : "",
          trainClass: isTrain ? (p.trainClass || "") : "",
          trainOriginStation: isTrain ? (p.originStation || "") : "",
          trainDestinationStation: isTrain ? (p.destinationStation || "") : "",
          departureTime: isTrain ? (p.departureTime || "") : "",
        }));

        // Sync per-ticket array
        const count = parseInt(parsedCount) || 1;
        setPerTicketInclusions(Array(count).fill(null).map(() => ({ ...defaultInclusions })));

        toast({
          title: t("sellToastTicketParsed"),
          description: t(isTrain ? "sellToastTicketParsedTrain" : "sellToastTicketParsedFlight", { plural: count > 1 ? `s (${count})` : "" }),
        });

        // Auto-verify against airline schedule (flights only) when we have the minimum required fields
        if (!isTrain && p.airline && p.flightNumber && p.departureDate) {
          await verifyFlightSchedule({
            airline: p.airline,
            flightNumber: p.flightNumber,
            departureDate: p.departureDate,
            originCity: p.originCity,
            destinationCity: p.destinationCity,
            originCountry: p.originCountry,
            destinationCountry: p.destinationCountry,
          });
        }
      }
    } catch (err: any) {
      console.error("Ticket parse error:", err);
      // The file was still uploaded successfully, parsing just failed — count as satisfied
      setTicketUploaded(true);
      toast({ title: t("sellToastCouldNotRead"), description: t("sellToastCouldNotReadDesc"), variant: "destructive" });
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

      const isTrain = formData.listingType === "train_ticket";

      const listingData: Record<string, any> = {
        listing_type: formData.listingType,
        airline: formData.airline,
        price: parseFloat(formData.price),
        original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        additional_notes: formData.additionalNotes || null,
        tags: formData.selectedTags as any,
      };

      if (isTrain) {
        const op = getOperator(formData.operator);
        const fare = op?.fares.find((f) => f.value === formData.trainClass);
        listingData.airline = formData.operator; // store operator name in airline col for legacy compat
        listingData.operator = formData.operator;
        listingData.train_number = formData.trainNumber || null;
        listingData.train_class = formData.trainClass || null;
        listingData.origin_station = formData.trainOriginStation || null;
        listingData.destination_station = formData.trainDestinationStation || null;
        listingData.departure_time = formData.departureTime || null;
        listingData.title = `${formData.destinationCity} Train Trip`;
        listingData.origin_city = formData.originCity;
        listingData.origin_country = formData.originCountry;
        listingData.destination_city = formData.destinationCity;
        listingData.destination_country = formData.destinationCountry;
        listingData.departure_date = formData.departureDate!.toISOString().split("T")[0];
        listingData.return_date = isReturn && formData.returnDate ? formData.returnDate.toISOString().split("T")[0] : null;
        listingData.ticket_count = ticketCount;
        listingData.stopovers = 0;
        // Store name-change fee SEPARATELY (additive at checkout)
        listingData.name_change_fee = fare?.fee ?? 0;
      } else {
        listingData.title = `${formData.destinationCity} ${formData.selectedTags.length > 0 ? t((tripTags.find((tg) => tg.value === formData.selectedTags[0])?.labelKey) || "tagCityTrip") : "Trip"}`;
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
        // Store flight name-change fee SEPARATELY (additive at checkout)
        listingData.name_change_fee = flightTransferFee ?? null;
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
        title: editId ? t("sellToastListingUpdated") : t("sellToastListingCreated"),
        description: editId ? t("sellToastListingUpdatedDesc") : t("sellToastListingCreatedDesc"),
      });
      navigate(editId ? "/listings" : "/home");
    },
    onError: (error: any) => {
      const msg = error.message || "";
      if (msg.includes("DUPLICATE_LISTING")) {
        toast({ title: t("sellToastDuplicate"), description: t("sellToastDuplicateDesc"), variant: "destructive" });
      } else if (msg.includes("RATE_LIMIT")) {
        toast({ title: t("sellToastRateLimit"), description: t("sellToastRateLimitDesc"), variant: "destructive" });
      } else if (msg.includes("PRICE_CAP")) {
        toast({ title: t("sellToastPriceCap"), description: t("sellToastPriceCapDesc"), variant: "destructive" });
      } else {
        toast({ title: t("error"), description: msg, variant: "destructive" });
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
      toast({ title: t("error"), description: t("sellToastProfileNotLoaded"), variant: "destructive" });
      return;
    }
    // Mandatory ticket upload (skipped only in edit mode)
    if (!isEditMode && !ticketUploaded) {
      toast({
        title: t("sellToastUploadRequiredTitle"),
        description: t("sellToastUploadRequiredDesc"),
        variant: "destructive",
      });
      return;
    }
    // Departure must be at least 72 hours in the future
    const minTs = Date.now() + 72 * 60 * 60 * 1000;
    if (formData.departureDate && formData.departureDate.getTime() < minTs) {
      toast({
        title: t("sellToastDepartureTooSoonTitle"),
        description: t("sellToastDepartureTooSoonDesc"),
        variant: "destructive",
      });
      return;
    }
    if (isReturn && formData.returnDate && formData.departureDate && formData.returnDate.getTime() < formData.departureDate.getTime()) {
      toast({
        title: t("sellToastInvalidReturnTitle"),
        description: t("sellToastInvalidReturnDesc"),
        variant: "destructive",
      });
      return;
    }
    const isTrain = formData.listingType === "train_ticket";
    if (isTrain) {
      if (!formData.originCity || !formData.destinationCity || !formData.operator || !formData.trainClass || !formData.departureDate || !formData.price) {
        toast({ title: t("sellMissingFields"), description: t("sellToastMissingTrain"), variant: "destructive" });
        return;
      }
      if (trainTransferResult?.blocking) {
        toast({
          title: t("sellToastListingBlocked"),
          description: t("sellToastBlockedTrain"),
          variant: "destructive",
        });
        return;
      }
      if (trainTransferResult && trainTransferResult.status === "allowed" && trainTransferResult.fee !== null && !trainTransferResult.acknowledged) {
        toast({
          title: t("sellToastListingBlocked"),
          description: t("sellToastFeeNotConfirmed"),
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!formData.originCity || !formData.destinationCity || !formData.airline || !formData.departureDate) {
        toast({ title: t("sellMissingFields"), description: t("sellToastMissingFlight"), variant: "destructive" });
        return;
      }
      if (flightTransferBlocked) {
        toast({
          title: t("sellToastListingBlocked"),
          description: t("sellToastBlockedFlight"),
          variant: "destructive",
        });
        return;
      }
      if (flightTransferFee !== null && !flightFeeAcknowledged) {
        toast({
          title: t("sellToastListingBlocked"),
          description: t("sellToastFeeNotConfirmed"),
          variant: "destructive",
        });
        return;
      }
    }
    if (priceError) {
      toast({ title: t("sellToastPriceCap"), description: t("sellPriceTooHighDesc"), variant: "destructive" });
      return;
    }
    // Block flight listings that failed external schedule verification
    if (!isTrain && flightVerification && (flightVerification.status === "mismatch" || flightVerification.status === "not_found")) {
      toast({
        title: t("sellToastListingBlocked"),
        description: t("sellToastBlockedVerify"),
        variant: "destructive",
      });
      return;
    }
    createListingMutation.mutate();
  };

  // Tickets must depart at least 72 hours from now.
  // We compute the earliest *day* the user is allowed to pick (start of that day).
  const minDepartureDate = useMemo(() => {
    const d = new Date(Date.now() + 72 * 60 * 60 * 1000);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const today = minDepartureDate; // backward-compat for existing references below

  const renderInclusionToggles = (inclusions: TicketInclusions, onChange: (field: keyof TicketInclusions, value: boolean) => void, label?: string) => (
    <div className="space-y-3">
      {label && <p className="text-sm font-medium text-muted-foreground">{label}</p>}
      <div className="flex items-center justify-between">
        <div className={cn("flex items-center gap-3 transition-colors", inclusions.luggageIncluded ? "text-primary" : "text-muted-foreground")}>
          <Luggage className="w-5 h-5" /><span>{t("sellInclLuggage")}</span>
        </div>
        <Switch checked={inclusions.luggageIncluded} onCheckedChange={(v) => onChange("luggageIncluded", v)} />
      </div>
      <div className="flex items-center justify-between">
        <div className={cn("flex items-center gap-3 transition-colors", inclusions.carryOnIncluded ? "text-primary" : "text-muted-foreground")}>
          <Luggage className="w-5 h-5" /><span>{t("sellInclCarryOn")}</span>
        </div>
        <Switch checked={inclusions.carryOnIncluded} onCheckedChange={(v) => onChange("carryOnIncluded", v)} />
      </div>
      <div className="flex items-center justify-between">
        <div className={cn("flex items-center gap-3 transition-colors", inclusions.mealIncluded ? "text-primary" : "text-muted-foreground")}>
          <Utensils className="w-5 h-5" /><span>{t("sellInclMeal")}</span>
        </div>
        <Switch checked={inclusions.mealIncluded} onCheckedChange={(v) => onChange("mealIncluded", v)} />
      </div>
      <div className="flex items-center justify-between">
        <div className={cn("flex items-center gap-3 transition-colors", inclusions.speedyBoarding ? "text-primary" : "text-muted-foreground")}>
          <Zap className="w-5 h-5" /><span>{t("sellInclSpeedy")}</span>
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
            <h1 className="font-semibold">{editId ? t("sellHeaderEdit") : t("sellHeaderCreate")}</h1>
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
                  <h2 className="font-semibold text-lg">{t("sellGateTitle")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("sellGateDesc")}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {!isProfileComplete && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <span className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold">!</span>
                    {t("sellGatePersonalIncomplete")}
                  </div>
                )}
                {!isVerified && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <span className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold">!</span>
                    {t("sellGateIdIncomplete")}
                  </div>
                )}
                {!isAddressComplete && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <span className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold">!</span>
                    {t("sellGateAddressIncomplete")}
                  </div>
                )}
                {!isPaymentComplete && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <span className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold">!</span>
                    {t("sellGatePaymentIncomplete")}
                  </div>
                )}
              </div>
              <Button variant="gold" size="lg" className="w-full" onClick={() => navigate("/account")}>
                {t("sellGateGoToAccount")}
              </Button>
            </div>
          </div>
        )}

        {(isEditMode || allSectionsComplete || !gateProfile) && (
        <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
          {/* Listing Type Selector */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t("sellWhatSelling")}</h2>
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
                <span className={cn("text-sm font-medium", formData.listingType === "flight_ticket" ? "text-foreground" : "text-muted-foreground")}>{t("flightTicket")}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, listingType: "train_ticket" })}
                className={cn(
                  "glass rounded-2xl p-4 flex flex-col items-center gap-2 transition-all border-2",
                  formData.listingType === "train_ticket"
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:border-primary/30"
                )}
              >
                <TrainFront className={cn("w-6 h-6", formData.listingType === "train_ticket" ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-sm font-medium", formData.listingType === "train_ticket" ? "text-foreground" : "text-muted-foreground")}>{t("trainTicket")}</span>
              </button>
            </div>
          </div>

          {/* Upload Ticket — REQUIRED for both flights & trains */}
          {!isEditMode && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                {t("sellUploadHeader")}
                <span className="text-xs font-normal text-destructive">{t("sellUploadRequired")}</span>
              </h2>
              <label
                className={cn(
                  "glass rounded-2xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-colors border-2 border-dashed",
                  ticketUploaded ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
                )}
              >
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleTicketUpload} disabled={isUploading} />
                {isUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">{t("sellUploadReading")}</p>
                  </>
                ) : ticketUploaded ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                    <p className="text-sm font-medium">{t("sellUploadDone")}</p>
                    <p className="text-xs text-muted-foreground">{t("sellUploadReplace")}</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      {t("sellUploadHint")}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("sellUploadAutofillHint")}</p>
                  </>
                )}
              </label>
            </div>
          )}

          {/* TRAIN TICKET FORM */}
          {formData.listingType === "train_ticket" && (
            <TrainForm
              formData={formData}
              setFormData={setFormData}
              isReturn={isReturn}
              setIsReturn={setIsReturn}
              priceError={!!priceError}
              today={minDepartureDate}
              onTransferResult={setTrainTransferResult}
              transferResult={trainTransferResult}
            />
          )}

          {/* FLIGHT TICKET FORM */}
          {formData.listingType === "flight_ticket" && (
            <>
          {/* Flight schedule verification status */}
          {(isVerifyingFlight || flightVerification) && (
            <div>
              <div className={cn(
                "rounded-xl border-2 p-4 space-y-2 animate-in fade-in slide-in-from-top-2",
                isVerifyingFlight
                  ? "border-primary/30 bg-primary/5"
                  : flightVerification?.status === "verified"
                    ? "border-green-500/30 bg-green-500/10"
                    : flightVerification?.status === "error" || flightVerification?.status === "provider_error"
                      ? "border-yellow-500/30 bg-yellow-500/10"
                      : "border-destructive/30 bg-destructive/10"
              )}>
                {isVerifyingFlight ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <p className="text-sm">{t("sellVerifyingTitle")}</p>
                  </div>
                ) : flightVerification?.status === "verified" ? (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-green-600 dark:text-green-400">{t("sellVerifiedTitle")}</p>
                      <p className="text-xs text-muted-foreground">
                        {flightVerification.verified?.airline} · {flightVerification.verified?.originIata} → {flightVerification.verified?.destinationIata}
                      </p>
                    </div>
                  </div>
                ) : flightVerification?.status === "mismatch" ? (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <p className="font-semibold text-sm text-destructive">{t("sellMismatchTitle")}</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        {flightVerification.flags?.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                      <p className="text-xs text-destructive font-medium">{t("sellMismatchBlock")}</p>
                    </div>
                  </div>
                ) : flightVerification?.status === "not_found" ? (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-destructive">{t("sellNotFoundTitle")}</p>
                      <p className="text-xs text-muted-foreground">{flightVerification.message ?? t("sellNotFoundDesc")}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-yellow-700 dark:text-yellow-300">{t("sellVerifyUnavailableTitle")}</p>
                      <p className="text-xs text-muted-foreground">{flightVerification?.message ?? t("sellVerifyUnavailableDesc")}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Route */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              {t("sellFlightRoute")}
            </h2>
            <div className="glass rounded-2xl p-4 space-y-4">
              {/* Origin */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("sellFromCountry")}</Label>
                  <Select value={formData.originCountry} onValueChange={(v) => setFormData({ ...formData, originCountry: v, originCity: "", originAirport: "" })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sellSelectCountry")} /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("sellFromCity")}</Label>
                  <Select value={formData.originCity} onValueChange={(v) => setFormData({ ...formData, originCity: v, originAirport: "" })} disabled={!formData.originCountry}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sellSelectCity")} /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {originCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {originAirports.length > 0 && (
                <div className="space-y-2">
                  <Label>{t("sellFromAirport")}</Label>
                  <Select value={formData.originAirport} onValueChange={(v) => setFormData({ ...formData, originAirport: v })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sellSelectAirport")} /></SelectTrigger>
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
                  <Label>{t("sellToCountry")}</Label>
                  <Select value={formData.destinationCountry} onValueChange={(v) => setFormData({ ...formData, destinationCountry: v, destinationCity: "", destinationAirport: "" })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sellSelectCountry")} /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("sellToCity")}</Label>
                  <Select value={formData.destinationCity} onValueChange={(v) => setFormData({ ...formData, destinationCity: v, destinationAirport: "" })} disabled={!formData.destinationCountry}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sellSelectCity")} /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {destinationCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {destinationAirports.length > 0 && (
                <div className="space-y-2">
                  <Label>{t("sellToAirport")}</Label>
                  <Select value={formData.destinationAirport} onValueChange={(v) => setFormData({ ...formData, destinationAirport: v })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sellSelectAirport")} /></SelectTrigger>
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
              {t("sellFlightDates")}
            </h2>
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label>{t("sellReturnFlight")}</Label>
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
                  <Label>{t("sellDepartureDate")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.departureDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.departureDate ? format(formData.departureDate, "PPP") : t("sellSelectDate")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.departureDate}
                        onSelect={(date) => setFormData({ ...formData, departureDate: date })}
                        initialFocus
                        disabled={(date) => date < minDepartureDate}
                        modifiers={{ today: today }}
                        modifiersClassNames={{ today: "text-muted-foreground" }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {isReturn && (
                  <div className="space-y-2">
                    <Label>{t("sellReturnDate")}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.returnDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.returnDate ? format(formData.returnDate, "PPP") : t("sellSelectDate")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.returnDate}
                          onSelect={(date) => setFormData({ ...formData, returnDate: date })}
                          initialFocus
                          disabled={(date) => date < (formData.departureDate ?? minDepartureDate)}
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
            <h2 className="text-lg font-semibold">{t("sellFlightDetails")}</h2>
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("sellAirline")}</Label>
                  <Select value={formData.airline} onValueChange={(v) => setFormData({ ...formData, airline: v, fareType: "" })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sellSelectAirline")} /></SelectTrigger>
                    <SelectContent className="bg-popover z-50 max-h-60">
                      {airlines.map((a) => <SelectItem key={a.name} value={a.name}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("sellFareType")}</Label>
                  <Select value={formData.fareType} onValueChange={(v) => setFormData({ ...formData, fareType: v })} disabled={!formData.airline}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sellSelectFare")} /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {fareTypes.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Transferability Check */}
              {formData.airline && (
                <TransferabilityCheck
                  airline={formData.airline}
                  fareType={formData.fareType || "standard"}
                  onResult={(r) => {
                    setFlightTransferBlocked(r.blocking);
                    setFlightTransferFee(r.fee);
                    setFlightFeeAcknowledged(r.acknowledged);
                  }}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("sellFlightNumber")}</Label>
                  <Input placeholder="e.g. VY8500" value={formData.flightNumber} onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })} className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>{t("sellNumberOfTicketsLabel")}</Label>
                  <Input type="number" min="1" value={formData.ticketCount} onChange={(e) => handleTicketCountChange(e.target.value)} className="bg-secondary/50" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("sellNumberOfTicketsLabel")}</Label>
                  <Input type="number" min="1" value={formData.ticketCount} onChange={(e) => handleTicketCountChange(e.target.value)} className="bg-secondary/50" required />
                </div>
                <div className="space-y-2">
                  <Label>{t("sellStopovers")}</Label>
                  <Input type="number" min="0" value={formData.stopovers} onChange={(e) => setFormData({ ...formData, stopovers: e.target.value })} className="bg-secondary/50" />
                </div>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t("sellWhatsIncluded")}</h2>
            <div className="glass rounded-2xl p-4 space-y-4">
              {ticketCount > 1 && (
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{t("sellSameForAllQ")}</p>
                    <p className="text-xs text-muted-foreground">{t("sellSameForAllHint")}</p>
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
                        t("sellTicketLabelN", { n: i + 1 })
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t("sellPricingHeader")}</h2>
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("sellOriginalPrice")}</Label>
                  <Input type="number" min="0" step="0.01" placeholder="145.00" value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>{t("sellYourPrice")}</Label>
                  <Input type="number" min="1" step="0.01" placeholder="89.00" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className={cn("bg-secondary/50", priceError && "border-destructive")} required />
                </div>
              </div>
              {priceError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {t("sellPriceLowerError")}
                </p>
              )}
              <SellerFeeBreakdown price={formData.price} />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t("sellTripTypeHeader")}</h2>
            <div className="flex flex-wrap gap-2">
              {tripTags.map((tag) => (
                <Badge
                  key={tag.value}
                  variant="outline"
                  className={cn("cursor-pointer transition-all py-2 px-3", formData.selectedTags.includes(tag.value) ? "bg-primary/20 border-primary text-primary" : "hover:border-primary/50")}
                  onClick={() => toggleTag(tag.value)}
                >
                  {t(tag.labelKey)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t("sellAdditionalNotesHeader")}</h2>
            <Textarea
              placeholder={t("sellNotesPlaceholderFlight")}
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
              {t("sellBoostHeader")}
            </h2>
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{t("sellBoostBumpTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("sellBoostBumpDesc")}</p>
                </div>
                <Switch
                  checked={formData.bumpListing}
                  onCheckedChange={(checked) => setFormData({ ...formData, bumpListing: checked })}
                />
              </div>
            </div>
          </div>

          {(() => {
            const blockedByVerification =
              formData.listingType === "flight_ticket" &&
              flightVerification != null &&
              (flightVerification.status === "mismatch" || flightVerification.status === "not_found");
            return (
              <Button
                type="submit"
                variant="gold"
                size="xl"
                className="w-full"
                disabled={createListingMutation.isPending || isVerifyingFlight || blockedByVerification}
              >
                {createListingMutation.isPending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />{editId ? t("sellSubmitSaving") : t("sellSubmitCreating")}</>
                ) : isVerifyingFlight ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />{t("sellSubmitVerifying")}</>
                ) : blockedByVerification ? (
                  <><AlertCircle className="w-5 h-5" />{t("sellSubmitBlocked")}</>
                ) : (
                  <>{editId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}{editId ? t("sellSubmitUpdate") : t("sellHeaderCreate")}</>
                )}
              </Button>
            );
          })()}
        </form>
        )}
      </div>
    </AppLayout>
  );
}
