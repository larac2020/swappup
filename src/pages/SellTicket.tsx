import { useState, useMemo, useEffect } from "react";
import { LISTING_COLUMNS } from "@/lib/listingColumns";
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
  CheckCircle2, HelpCircle, ChevronLeft, ChevronRight, Trash2
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import TransferabilityCheck, { fareTypes } from "@/components/listings/TransferabilityCheck";
import SellerFeeBreakdown from "@/components/listings/SellerFeeBreakdown";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  getCountries, getCitiesByCountry, getAirportCodesForCity,
  airlines, CityData
} from "@/data/flightData";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/lib/currency";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";

// Mandatory seller declaration version + text. Bump the version whenever the text changes.
const SELLER_DECLARATION_VERSION = "2026-06-17";
const SELLER_DECLARATION_TEXT_EN =
  "I confirm that this booking has not been sold, transferred, or listed elsewhere, and that I have the legal right to transfer it to a buyer.";
const SELLER_DECLARATION_TEXT_IT =
  "Confermo che questa prenotazione non è stata venduta, trasferita o pubblicata altrove e di avere il diritto legale di trasferirla a un acquirente.";

// ---------------------------------------------------------------------------
// Fare-gated airlines: name changes are only permitted on specific fare brands
// (or, for Eurowings, only after the seller confirms with customer service).
// The seller's declaration is stored on the listing for later audit.
// ---------------------------------------------------------------------------
type FareGate = {
  kind: "select" | "attestation";
  options?: { value: string; eligible: boolean }[];
  blockMessage: string;
  blockMessageIt: string;
  attestation?: string;
  attestationIt?: string;
};

const FARE_GATED_AIRLINES: Record<string, FareGate> = {
  condor: {
    kind: "select",
    options: [
      { value: "Flex", eligible: true },
      { value: "Green", eligible: true },
      { value: "VFR", eligible: true },
      { value: "Light", eligible: false },
      { value: "Zero", eligible: false },
      { value: "Classic", eligible: false },
    ],
    blockMessage:
      "Condor only permits name changes on Flex, Green, or VFR fares. Your fare type isn't eligible for resale on Swappup.",
    blockMessageIt:
      "Condor consente il cambio nome solo sulle tariffe Flex, Green o VFR. La tua tariffa non è idonea alla rivendita su Swappup.",
  },
  finnair: {
    kind: "select",
    options: [
      { value: "Business", eligible: true },
      { value: "Business Saver", eligible: true },
      { value: "PRO", eligible: true },
      { value: "Value", eligible: true },
      { value: "Economy", eligible: false },
      { value: "Economy Light", eligible: false },
      { value: "Other", eligible: false },
    ],
    blockMessage:
      "Finnair only permits name changes on Business, Business Saver, PRO, or Value fares. Your fare type isn't eligible for resale on Swappup.",
    blockMessageIt:
      "Finnair consente il cambio nome solo sulle tariffe Business, Business Saver, PRO o Value. La tua tariffa non è idonea alla rivendita su Swappup.",
  },
  eurowings: {
    kind: "attestation",
    blockMessage:
      "You must confirm with Eurowings that your fare permits a name change before listing this ticket.",
    blockMessageIt:
      "Devi confermare con Eurowings che la tua tariffa permette il cambio nome prima di pubblicare questo biglietto.",
    attestation:
      "I confirm I have contacted Eurowings customer service and verified that my specific fare permits a name change to a different passenger",
    attestationIt:
      "Confermo di aver contattato il servizio clienti Eurowings e di aver verificato che la mia tariffa specifica permette il cambio nome a un altro passeggero",
  },
};

function getFareGate(airline: string | undefined | null): { key: string; gate: FareGate } | null {
  const key = (airline || "").trim().toLowerCase();
  const gate = FARE_GATED_AIRLINES[key];
  return gate ? { key, gate } : null;
}


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

/** Train-specific inclusions (no luggage limits, different on-board services). */
export interface TrainInclusions {
  wifi: boolean;
  powerOutlet: boolean;
  seatReservation: boolean;
  loungeAccess: boolean;
  mealOnBoard: boolean;
  bikeAllowed: boolean;
  petAllowed: boolean;
  quietCoach: boolean;
}

export const defaultTrainInclusions: TrainInclusions = {
  wifi: false,
  powerOutlet: false,
  seatReservation: true,
  loungeAccess: false,
  mealOnBoard: false,
  bikeAllowed: false,
  petAllowed: false,
  quietCoach: false,
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
  currency: "EUR",
  ticketCount: "1",
  stopovers: "0",
  returnStopovers: "0",
  additionalNotes: "",
  boostHours: 0 as number, // 0 = no boost; otherwise 24 | 72 | 168
  // Train-only fields
  operator: "",
  trainNumber: "",
  trainClass: "",
  trainType: "",
  travelClass: "",
  returnTravelClass: "",
  trainOriginStation: "",
  trainDestinationStation: "",
  departureTime: "",
  arrivalTime: "",
  returnDepartureTime: "",
  returnArrivalTime: "",
  returnFlightNumber: "",
  bookingReference: "",
});

export default function SellTicket() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, locale } = useLanguage();

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

  // Wizard (3-step) mode is enabled only when creating a new listing.
  const wizard = !isEditMode;
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [isReturn, setIsReturn] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editLoaded, setEditLoaded] = useState(false);

  // Ticket upload is mandatory (except in edit mode where the listing already exists)
  const [ticketUploaded, setTicketUploaded] = useState(false);
  // True only when the parser proved every leg of the itinerary is flown by the
  // same airline. Connections we cannot prove are single-carrier are blocked,
  // because the schema stores a single `airline` and cannot express per-leg carriers.
  const [singleCarrierConfirmed, setSingleCarrierConfirmed] = useState(false);

  // Transferability blocking flags from the in-form check cards
  const [flightTransferBlocked, setFlightTransferBlocked] = useState(false);
  const [flightTransferFee, setFlightTransferFee] = useState<number | null>(null);
  const [flightFeeAcknowledged, setFlightFeeAcknowledged] = useState(true);
  const [nameChangeRiskAck, setNameChangeRiskAck] = useState(false);
  const [sellerDeclarationAck, setSellerDeclarationAck] = useState(false);
  // Fare-type gate (Condor / Finnair dropdown, Eurowings attestation)
  const [declaredFareBrand, setDeclaredFareBrand] = useState("");
  const [fareGateAttested, setFareGateAttested] = useState(false);
  const trainTransferResult: { status?: string; fee?: number | null; blocking?: boolean; acknowledged?: boolean } | null = null;



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

  // Inbound (return) leg add-ons. When `inboundSameAsOutbound` is true, the inbound
  // values mirror outbound automatically and the inbound inputs are hidden.
  const [inboundSharedInclusions, setInboundSharedInclusions] = useState<TicketInclusions>({ ...defaultInclusions });
  const [inboundPerTicketInclusions, setInboundPerTicketInclusions] = useState<TicketInclusions[]>([{ ...defaultInclusions }]);
  const [inboundSameAsOutbound, setInboundSameAsOutbound] = useState(true);

  // Train-specific inclusions (used only when listingType === "train_ticket")
  const [trainInclusions, setTrainInclusions] = useState<TrainInclusions>({ ...defaultTrainInclusions });

  const [formData, setFormData] = useState(getDefaultFormData());

  const ticketCount = parseInt(formData.ticketCount) || 1;

  // Load existing listing for edit mode
  const { data: editListing } = useQuery({
    queryKey: ["editListing", editId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(LISTING_COLUMNS)
        .eq("id", editId!)
        .single();
      if (error) throw error;
      // PNR is not readable through the Data API — sellers fetch their own via RPC.
      const { data: pnr } = await supabase.rpc("get_my_listing_booking_reference", {
        _listing_id: editId!,
      });
      return { ...(data as any), booking_reference: pnr ?? null };
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
        originAirport: (editListing as any).origin_airport || "",
        destinationCountry: editListing.destination_country,
        destinationCity: editListing.destination_city,
        destinationAirport: (editListing as any).destination_airport || "",
        departureDate: new Date(editListing.departure_date),
        returnDate: hasReturn ? new Date(editListing.return_date!) : undefined,
        airline: editListing.airline,
        fareType: "",
        flightNumber: editListing.flight_number || "",
        price: String(Number(editListing.price)),
        originalPrice: editListing.original_price ? String(Number(editListing.original_price)) : "",
        currency: (editListing as any).currency || "EUR",
        ticketCount: String(editListing.ticket_count),
        stopovers: String(editListing.stopovers ?? 0),
        returnStopovers: String((editListing as any).return_stopovers ?? 0),
        additionalNotes: editListing.additional_notes || "",
        boostHours: 0,
        operator: (editListing as any).operator || "",
        trainNumber: (editListing as any).train_number || "",
        trainClass: (editListing as any).train_class || "",
        trainType: (editListing as any).train_type || "",
        travelClass: (editListing as any).travel_class || "",
        returnTravelClass: (editListing as any).return_travel_class || "",
        trainOriginStation: (editListing as any).origin_station || "",
        trainDestinationStation: (editListing as any).destination_station || "",
        departureTime: (editListing as any).departure_time || "",
        arrivalTime: (editListing as any).arrival_time || "",
        returnDepartureTime: (editListing as any).return_departure_time || "",
        returnArrivalTime: (editListing as any).return_arrival_time || "",
        returnFlightNumber: (editListing as any).return_flight_number || "",
        bookingReference: (editListing as any).booking_reference || "",
      });

      const shared: TicketInclusions = {
        luggageIncluded: editListing.luggage_included ?? false,
        carryOnIncluded: editListing.carry_on_included ?? true,
        mealIncluded: editListing.meal_included ?? false,
        speedyBoarding: editListing.speedy_boarding ?? false,
      };
      setSharedInclusions(shared);

      // Hydrate train inclusions from existing listing if present.
      const ti = (editListing as any).train_inclusions;
      if (ti && typeof ti === "object") {
        setTrainInclusions({ ...defaultTrainInclusions, ...ti });
      }

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

      // Inbound inclusions: present in DB only when sellers set them differently.
      const inboundShared: TicketInclusions = {
        luggageIncluded: (editListing as any).return_luggage_included ?? shared.luggageIncluded,
        carryOnIncluded: (editListing as any).return_carry_on_included ?? shared.carryOnIncluded,
        mealIncluded: (editListing as any).return_meal_included ?? shared.mealIncluded,
        speedyBoarding: (editListing as any).return_speedy_boarding ?? shared.speedyBoarding,
      };
      setInboundSharedInclusions(inboundShared);
      const hasOwnInbound =
        hasReturn && (
          (editListing as any).return_travel_class != null ||
          (editListing as any).return_luggage_included != null ||
          (editListing as any).return_carry_on_included != null ||
          (editListing as any).return_meal_included != null ||
          (editListing as any).return_speedy_boarding != null ||
          (editListing as any).return_per_ticket_inclusions != null
        );
      setInboundSameAsOutbound(!hasOwnInbound);
      const rpi = (editListing as any).return_per_ticket_inclusions;
      if (rpi && Array.isArray(rpi)) {
        setInboundPerTicketInclusions(
          rpi.map((t: any) => ({
            luggageIncluded: t.luggageIncluded ?? false,
            carryOnIncluded: t.carryOnIncluded ?? true,
            mealIncluded: t.mealIncluded ?? false,
            speedyBoarding: t.speedyBoarding ?? false,
          }))
        );
      } else {
        setInboundPerTicketInclusions(
          Array(editListing.ticket_count).fill(null).map(() => ({ ...inboundShared }))
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
    setInboundPerTicketInclusions((prev) => {
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
    setInboundSharedInclusions({ ...defaultInclusions });
    setInboundPerTicketInclusions([{ ...defaultInclusions }]);
    setInboundSameAsOutbound(true);
    setFlightVerification(null);
    setFlightTransferBlocked(false);
    setFlightTransferFee(null);
    setTicketUploaded(false);
    setSingleCarrierConfirmed(false);
    setDeclaredFareBrand("");
    setFareGateAttested(false);
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

    // Enforce PDF-only uploads. We rely on the PDF text layer to reliably
    // extract the original total price (used as the resale price cap).
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast({
        title: t("sellUploadPdfOnlyTitle"),
        description: t("sellUploadPdfOnlyDesc"),
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

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
        // Flights only — ignore any train hints from the parser.
        const isTrain = false;
        const resolvedTravelClass: string =
          typeof p.travelClass === "string" ? p.travelClass.toLowerCase() : "";

        // Strict ISO YYYY-MM-DD parsing built in UTC midnight to avoid TZ drift.
        // We deliberately reject any other format so the AI cannot smuggle in
        // ambiguous DD/MM/YYYY values (or a booking date masquerading as travel date).
        const parseIsoDate = (s: unknown): Date | undefined => {
          if (typeof s !== "string") return undefined;
          const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (!m) return undefined;
          const y = +m[1], mo = +m[2], d = +m[3];
          if (mo < 1 || mo > 12 || d < 1 || d > 31) return undefined;
          const dt = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)); // noon UTC for safety
          if (
            dt.getUTCFullYear() !== y ||
            dt.getUTCMonth() !== mo - 1 ||
            dt.getUTCDate() !== d
          ) return undefined;
          return dt;
        };

        // Listings must depart at least 72h in the future.
        const minTs = Date.now() + 72 * 60 * 60 * 1000;
        const parsedDeparture = parseIsoDate(p.departureDate);
        const parsedReturn = parseIsoDate(p.returnDate);

        // Hard fail when the outbound date is missing/invalid OR < 72h away.
        // (A common AI mistake we've seen: returning the booking/purchase date.)
        if (!parsedDeparture || parsedDeparture.getTime() < minTs) {
          setTicketUploaded(false);
          toast({
            title: t("sellToastExpiredTitle"),
            description: parsedDeparture
              ? t("sellToastExpiredDesc", { date: parsedDeparture.toLocaleDateString() })
              : t("sellToastExpiredDesc", { date: "—" }),
            variant: "destructive",
          });
          return;
        }

        // If a return leg is present, it must also be ≥72h away AND on/after outbound.
        if (parsedReturn && (parsedReturn.getTime() < minTs || parsedReturn.getTime() < parsedDeparture.getTime())) {
          setTicketUploaded(false);
          toast({
            title: t("sellToastExpiredTitle"),
            description: t("sellToastExpiredDesc", { date: parsedReturn.toLocaleDateString() }),
            variant: "destructive",
          });
          return;
        }

        const hasReturn = !!parsedReturn;

        // --- Single-carrier itinerary gate -------------------------------
        // The listing schema holds one `airline` for the whole trip, so a
        // connecting itinerary flown by different airlines cannot be
        // represented (or transferability-checked) correctly.
        const normCarrier = (s: unknown) =>
          typeof s === "string" ? s.trim().toLowerCase().replace(/\s+/g, " ") : "";
        const legAirlines = [
          ...(Array.isArray(p.outboundLegAirlines) ? p.outboundLegAirlines : []),
          ...(Array.isArray(p.inboundLegAirlines) ? p.inboundLegAirlines : []),
        ].map(normCarrier).filter(Boolean);
        const distinctCarriers = new Set(legAirlines);
        const outStops = Number.isFinite(p.outboundStopovers) ? Math.max(0, Math.trunc(p.outboundStopovers)) : 0;
        const inStops = Number.isFinite(p.inboundStopovers) ? Math.max(0, Math.trunc(p.inboundStopovers)) : 0;
        const hasConnections = outStops > 0 || inStops > 0 || legAirlines.length > 1;

        if (distinctCarriers.size > 1) {
          setTicketUploaded(false);
          setSingleCarrierConfirmed(false);
          toast({
            title: t("sellToastMultiCarrierTitle"),
            description: t("sellToastMultiCarrierDesc"),
            variant: "destructive",
          });
          return;
        }
        // A connection is only acceptable when the parser listed every leg's
        // carrier and they all matched.
        const expectedLegs = outStops + inStops + (hasReturn ? 2 : 1);
        const carriersProven = legAirlines.length >= expectedLegs && distinctCarriers.size === 1;
        if (hasConnections && !carriersProven) {
          setTicketUploaded(false);
          setSingleCarrierConfirmed(false);
          toast({
            title: t("sellToastMultiCarrierTitle"),
            description: t("sellToastConnectionUnverifiedDesc"),
            variant: "destructive",
          });
          return;
        }
        setSingleCarrierConfirmed(true);

        setIsReturn(hasReturn);
        // Mark upload as satisfied — even if parsing returns partial data, the file was uploaded
        setTicketUploaded(true);

        const parsedCount = p.ticketCount ? String(p.ticketCount) : "1";

        // Normalise time to HH:MM 24h. Accepts "9:5", "09:05", "09:05:30", "09:05Z" → "09:05".
        const normTime = (s: unknown): string => {
          if (typeof s !== "string") return "";
          const m = s.trim().match(/^(\d{1,2}):(\d{2})/);
          if (!m) return "";
          const hh = Math.min(23, Math.max(0, parseInt(m[1], 10)));
          const mm = Math.min(59, Math.max(0, parseInt(m[2], 10)));
          return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
        };

        // Outbound departure time — fall back to legacy `departureTime` field for trains.
        const outboundDepTime =
          normTime(p.outboundDepartureTime) || normTime(p.departureTime);
        const outboundArrTime = normTime(p.outboundArrivalTime);
        const inboundDepTime = normTime(p.inboundDepartureTime);
        const inboundArrTime = normTime(p.inboundArrivalTime);

        setFormData((prev) => ({
          ...prev,
          listingType: isTrain ? "train_ticket" : "flight_ticket",
          originCountry: p.originCountry || "",
          originCity: p.originCity || "",
          destinationCountry: p.destinationCountry || "",
          destinationCity: p.destinationCity || "",
          airline: p.airline || "",
          flightNumber: p.flightNumber || "",
          originalPrice: p.originalPrice?.toString() || "",
          currency: typeof p.priceCurrency === "string" && p.priceCurrency
            ? p.priceCurrency.toUpperCase()
            : prev.currency,
          departureDate: parsedDeparture,
          returnDate: parsedReturn,
          ticketCount: parsedCount,
          travelClass: resolvedTravelClass || "",
          departureTime: outboundDepTime,
          arrivalTime: outboundArrTime,
          returnDepartureTime: inboundDepTime,
          returnArrivalTime: inboundArrTime,
          bookingReference: typeof p.bookingReference === "string" ? p.bookingReference.trim() : "",
          stopovers: String(outStops),
          returnStopovers: String(inStops),
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
      const boostHours = formData.boostHours || 0;
      const bumpedUntil = boostHours > 0
        ? new Date(Date.now() + boostHours * 60 * 60 * 1000).toISOString()
        : null;

      const inclusions = sameInclusions ? sharedInclusions : sharedInclusions;
      const perTicketData = sameInclusions ? null : perTicketInclusions;

      const listingData: Record<string, any> = {
        listing_type: "flight_ticket",
        airline: formData.airline,
        price: parseFloat(formData.price),
        original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        currency: formData.currency || "EUR",
        additional_notes: formData.additionalNotes || null,
      };

      {
        listingData.title = `${formData.destinationCity} Trip`;
        listingData.origin_city = formData.originCity;
        listingData.origin_country = formData.originCountry;
        listingData.destination_city = formData.destinationCity;
        listingData.destination_country = formData.destinationCountry;
        listingData.departure_date = formData.departureDate!.toISOString().split("T")[0];
        listingData.return_date = isReturn && formData.returnDate ? formData.returnDate.toISOString().split("T")[0] : null;
        listingData.flight_number = formData.flightNumber || null;
        listingData.travel_class = formData.travelClass || null;
        listingData.departure_time = formData.departureTime || null;
        listingData.arrival_time = formData.arrivalTime || null;
        listingData.return_flight_number = isReturn ? (formData.returnFlightNumber || null) : null;
        listingData.return_departure_time = isReturn ? (formData.returnDepartureTime || null) : null;
        listingData.return_arrival_time = isReturn ? (formData.returnArrivalTime || null) : null;
        listingData.ticket_count = ticketCount;
        listingData.origin_airport = formData.originAirport || null;
        listingData.destination_airport = formData.destinationAirport || null;
        listingData.luggage_included = sameInclusions ? sharedInclusions.luggageIncluded : perTicketInclusions[0]?.luggageIncluded ?? false;
        listingData.carry_on_included = sameInclusions ? sharedInclusions.carryOnIncluded : perTicketInclusions[0]?.carryOnIncluded ?? true;
        listingData.meal_included = sameInclusions ? sharedInclusions.mealIncluded : perTicketInclusions[0]?.mealIncluded ?? false;
        listingData.speedy_boarding = sameInclusions ? sharedInclusions.speedyBoarding : perTicketInclusions[0]?.speedyBoarding ?? false;
        listingData.stopovers = parseInt(formData.stopovers);
        listingData.return_stopovers = isReturn ? parseInt(formData.returnStopovers) : null;
        listingData.per_ticket_inclusions = (sameInclusions ? null : perTicketInclusions) as any;
        // Inbound cabin & add-ons. When sameAsOutbound (or one-way), don't persist
        // anything inbound-specific so the existing outbound values apply by default.
        if (isReturn && !inboundSameAsOutbound) {
          listingData.return_travel_class = formData.returnTravelClass || null;
          listingData.return_luggage_included = sameInclusions
            ? inboundSharedInclusions.luggageIncluded
            : inboundPerTicketInclusions[0]?.luggageIncluded ?? false;
          listingData.return_carry_on_included = sameInclusions
            ? inboundSharedInclusions.carryOnIncluded
            : inboundPerTicketInclusions[0]?.carryOnIncluded ?? true;
          listingData.return_meal_included = sameInclusions
            ? inboundSharedInclusions.mealIncluded
            : inboundPerTicketInclusions[0]?.mealIncluded ?? false;
          listingData.return_speedy_boarding = sameInclusions
            ? inboundSharedInclusions.speedyBoarding
            : inboundPerTicketInclusions[0]?.speedyBoarding ?? false;
          listingData.return_per_ticket_inclusions = (sameInclusions ? null : inboundPerTicketInclusions) as any;
        } else {
          listingData.return_travel_class = null;
          listingData.return_luggage_included = null;
          listingData.return_carry_on_included = null;
          listingData.return_meal_included = null;
          listingData.return_speedy_boarding = null;
          listingData.return_per_ticket_inclusions = null;
        }
        // Store flight name-change fee SEPARATELY (additive at checkout)
        listingData.name_change_fee = flightTransferFee ?? null;
      }

      // Booking reference / PNR — used to prevent the same booking being listed twice.
      listingData.booking_reference = formData.bookingReference?.trim() || null;

      if (editId) {
        const { error } = await supabase
          .from("listings")
          .update(listingData as any)
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from("listings")
          .insert({
            ...listingData,
            seller_id: profile!.id,
            bumped_until: bumpedUntil,
            name_change_risk_acknowledged_at: new Date().toISOString(),
          } as any)
          .select("id")
          .single();
        if (error) throw error;

        // Persist the mandatory seller declaration for dispute / fraud audit trail.
        try {
          await supabase.from("seller_declarations" as any).insert({
            user_id: user!.id,
            profile_id: profile!.id,
            listing_id: inserted?.id ?? null,
            declaration_version: SELLER_DECLARATION_VERSION,
            declaration_text: locale === "it" ? SELLER_DECLARATION_TEXT_IT : SELLER_DECLARATION_TEXT_EN,
            declaration_locale: locale,
            user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
          } as any);
        } catch {
          // Non-blocking: the listing exists; declaration write failures shouldn't block the user.
        }
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
      // Report duplicate-sale fraud attempts to the server for case tracking.
      const fraudCode =
        msg.includes("BOOKING_ALREADY_SOLD") ? "BOOKING_ALREADY_SOLD" :
        msg.includes("DUPLICATE_BOOKING_FINGERPRINT") ? "DUPLICATE_BOOKING_FINGERPRINT" :
        msg.includes("DUPLICATE_BOOKING_REF") || msg.includes("listings_booking_reference_unique_idx") ? "DUPLICATE_BOOKING_REF" :
        msg.includes("LISTING_LOCKED") ? "LISTING_LOCKED" : null;
      if (fraudCode) {
        supabase.functions.invoke("report-fraud-attempt", {
          body: {
            error_code: fraudCode,
            error_message: msg,
            booking_reference: (formData as any)?.bookingReference || null,
            attempted_listing: {
              airline: (formData as any)?.airline,
              flight_number: (formData as any)?.flightNumber,
              departure_date: (formData as any)?.departureDate,
              origin: (formData as any)?.originAirport || (formData as any)?.originCity,
              destination: (formData as any)?.destinationAirport || (formData as any)?.destinationCity,
            },
          },
        }).catch(() => {});
      }
      if (msg.includes("DUPLICATE_LISTING")) {
        toast({ title: t("sellToastDuplicate"), description: t("sellToastDuplicateDesc"), variant: "destructive" });
      } else if (msg.includes("DUPLICATE_BOOKING_REF") || msg.includes("listings_booking_reference_unique_idx")) {
        toast({
          title: t("sellToastDuplicate"),
          description: "This booking has already been listed on Swappup and cannot be listed again.",
          variant: "destructive",
        });
      } else if (msg.includes("DUPLICATE_BOOKING_FINGERPRINT")) {
        toast({
          title: t("sellToastDuplicate"),
          description: "A very similar booking is already listed on Swappup. The same trip cannot be listed twice.",
          variant: "destructive",
        });
      } else if (msg.includes("BOOKING_ALREADY_SOLD")) {
        toast({
          title: t("sellToastDuplicate"),
          description: "This travel booking has already been sold on Swappup and cannot be listed again.",
          variant: "destructive",
        });
      } else if (msg.includes("LISTING_LOCKED")) {
        toast({
          title: t("sellToastListingBlocked"),
          description: "This listing has been sold and can no longer be modified or relisted.",
          variant: "destructive",
        });
      } else if (msg.includes("RATE_LIMIT")) {
        toast({ title: t("sellToastRateLimit"), description: t("sellToastRateLimitDesc"), variant: "destructive" });
      } else if (msg.includes("PRICE_CAP")) {
        toast({ title: t("sellToastPriceCap"), description: t("sellToastPriceCapDesc"), variant: "destructive" });
      } else if (msg.includes("NOT_TRANSFERABLE")) {
        toast({ title: t("sellToastListingBlocked"), description: t("sellToastBlockedFlight"), variant: "destructive" });
      } else if (msg.includes("ACCOUNT_BANNED")) {
        toast({
          title: "Account banned",
          description: "Your account has been permanently banned and cannot create new listings.",
          variant: "destructive",
        });
      } else if (msg.includes("ACCOUNT_SUSPENDED")) {
        toast({
          title: "Account under review",
          description: "Your account is under fraud review. New listings are blocked until the case is cleared.",
          variant: "destructive",
        });
      } else {
        toast({ title: t("error"), description: msg, variant: "destructive" });
      }
    },
  });

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
    // Connections are only allowed when the uploaded ticket proved a single
    // operating carrier across every leg (no per-leg carrier data in schema).
    if (!isEditMode && formData.listingType === "flight_ticket") {
      const stops = parseInt(formData.stopovers) || 0;
      const retStops = isReturn ? (parseInt(formData.returnStopovers) || 0) : 0;
      if ((stops > 0 || retStops > 0) && !singleCarrierConfirmed) {
        toast({
          title: t("sellToastMultiCarrierTitle"),
          description: t("sellToastConnectionUnverifiedDesc"),
          variant: "destructive",
        });
        return;
      }
    }
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
      // In edit mode, transferability/fee acknowledgement was already validated at creation —
      // don't force the user to re-run the check or re-acknowledge it.
      if (!isEditMode && trainTransferResult?.blocking) {
        toast({
          title: t("sellToastListingBlocked"),
          description: t("sellToastBlockedTrain"),
          variant: "destructive",
        });
        return;
      }
      if (!isEditMode && trainTransferResult && trainTransferResult.status === "allowed" && trainTransferResult.fee !== null && !trainTransferResult.acknowledged) {
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
      if (!isEditMode && flightTransferFee !== null && !flightFeeAcknowledged) {
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
    if (!isEditMode && !isTrain && flightVerification && (flightVerification.status === "mismatch" || flightVerification.status === "not_found")) {
      toast({
        title: t("sellToastListingBlocked"),
        description: t("sellToastBlockedVerify"),
        variant: "destructive",
      });
      return;
    }
    // Mandatory name-change risk acknowledgement (only required when the box is shown).
    const _isTrain = formData.listingType === "train_ticket";
    const _isFlight = formData.listingType === "flight_ticket";
    const _trainHasFee = _isTrain && trainTransferResult?.status === "allowed" && (trainTransferResult.fee ?? 0) > 0;
    const _riskRequired = !isEditMode && (_isFlight || _trainHasFee);
    if (_riskRequired && !nameChangeRiskAck) {
      toast({
        title: t("sellToastListingBlocked"),
        description: t("sellToastNoConfirmRiskNotAck"),
        variant: "destructive",
      });
      return;
    }
    // Mandatory seller declaration (creation only — edits don't re-prompt).
    if (!isEditMode && !sellerDeclarationAck) {
      toast({
        title: t("sellToastListingBlocked"),
        description: locale === "it"
          ? "Devi accettare la dichiarazione del venditore per pubblicare l'annuncio."
          : "You must accept the seller declaration before publishing this listing.",
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(editId ? "/listings" : "/home")}
            >
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
          {/* Stepper (wizard mode only) */}
          {wizard && (
            <div className="flex items-center justify-between gap-2 px-1">
              {[
                { n: 1 as const, label: locale === "it" ? "Carica" : "Upload" },
                { n: 2 as const, label: locale === "it" ? "Rivedi i dati" : "Review details" },
                { n: 3 as const, label: locale === "it" ? "Promuovi e pubblica" : "Boost & publish" },
              ].map((s, idx, arr) => {
                const done = step > s.n;
                const active = step === s.n;
                return (
                  <div key={s.n} className="flex-1 flex items-center gap-2">
                    <div className={cn(
                      "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
                      active && "bg-primary text-primary-foreground border-primary",
                      done && "bg-primary/20 text-primary border-primary/50",
                      !active && !done && "bg-secondary/50 text-muted-foreground border-border"
                    )}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                    </div>
                    <span className={cn(
                      "text-xs font-medium hidden sm:inline",
                      active ? "text-foreground" : "text-muted-foreground"
                    )}>{s.label}</span>
                    {idx < arr.length - 1 && (
                      <div className={cn("h-px flex-1", done ? "bg-primary/50" : "bg-border")} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Upload Ticket — REQUIRED */}
          {!isEditMode && (!wizard || step === 1) && (
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
                <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleTicketUpload} disabled={isUploading} />
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
                      {t("sellUploadHintPdf")}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("sellUploadAutofillHint")}</p>
                  </>
                )}
              </label>

              {/* Inline transferability check — shown as soon as an airline is detected */}
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

              {/* Blocked airline: deep-link to FAQ list of supported airlines */}
              {flightTransferBlocked && (
                <div className="rounded-xl border-2 border-destructive/40 bg-destructive/10 p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-destructive">
                        {locale === "it"
                          ? "Questa compagnia aerea non consente il cambio nome"
                          : "This airline does not allow name changes"}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {locale === "it"
                          ? "Su Swappup puoi vendere solo biglietti di compagnie che permettono il trasferimento del nominativo. Consulta l'elenco delle compagnie supportate e le rispettive tariffe di cambio nome."
                          : "On Swappup you can only sell tickets from airlines that allow name transfers. See the list of supported airlines and their name-change fees."}
                      </p>
                    </div>
                  </div>
                  <Button asChild type="button" variant="outline" size="sm" className="w-full">
                    <Link to="/faq#supported-airlines">
                      <HelpCircle className="w-4 h-4" />
                      {locale === "it" ? "Vedi compagnie supportate e tariffe" : "View supported airlines & fees"}
                    </Link>
                  </Button>
                </div>
              )}

              {/* Step 1 nav */}
              {wizard && (
                <Button
                  type="button"
                  variant="gold"
                  size="lg"
                  className="w-full"
                  disabled={
                    !ticketUploaded ||
                    flightTransferBlocked ||
                    (flightTransferFee !== null && !flightFeeAcknowledged)
                  }
                  onClick={() => setStep(2)}
                >
                  {locale === "it" ? "Continua" : "Continue"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {/* FLIGHT TICKET FORM */}
          {formData.listingType === "flight_ticket" && (!wizard || step === 2) && (
            <>
          {/* Transferability check (edit mode only — wizard renders it in step 1) */}
          {isEditMode && formData.airline && (
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

          {/* Flight Details — unified per-direction layout */}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("sellNumberOfTicketsLabel")}</Label>
                  <Input type="number" min="1" value={formData.ticketCount} onChange={(e) => handleTicketCountChange(e.target.value)} className="bg-secondary/50" required />
                </div>
                <div className="space-y-2 flex flex-col">
                  <Label>{t("sellReturnFlight")}</Label>
                  <div className="flex items-center h-10">
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
                </div>
              </div>

              {ticketCount > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{t("sellSameForAllQ")}</p>
                    <p className="text-xs text-muted-foreground">{t("sellSameForAllHint")}</p>
                  </div>
                  <Switch checked={sameInclusions} onCheckedChange={setSameInclusions} />
                </div>
              )}

              {/* Outbound block */}
              <div className="space-y-4 rounded-xl border border-border/50 p-3">
                <p className="text-sm font-medium text-primary">Outbound flight</p>

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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Departure time</Label>
                    <Input type="time" value={formData.departureTime} onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })} className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Arrival time</Label>
                    <Input type="time" value={formData.arrivalTime} onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })} className="bg-secondary/50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("sellFlightNumber")}</Label>
                    <Input placeholder="e.g. VY8500" value={formData.flightNumber} onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })} className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("sellStopovers")}</Label>
                    <Input type="number" min="0" value={formData.stopovers} onChange={(e) => setFormData({ ...formData, stopovers: e.target.value })} className="bg-secondary/50" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("sellCabinClass")}</Label>
                  <Select value={formData.travelClass} onValueChange={(v) => setFormData({ ...formData, travelClass: v })}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sellCabinClassPlaceholder")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economy">{t("cabinEconomy")}</SelectItem>
                      <SelectItem value="premium_economy">{t("cabinPremiumEconomy")}</SelectItem>
                      <SelectItem value="business">{t("cabinBusiness")}</SelectItem>
                      <SelectItem value="first">{t("cabinFirst")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2 border-t border-border/50 space-y-3">
                  <p className="text-sm font-medium">{t("sellWhatsIncluded")}</p>
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

              {/* Inbound block */}
              {isReturn && (
                <div className="space-y-4 rounded-xl border border-border/50 p-3">
                  <p className="text-sm font-medium text-primary">Inbound flight</p>

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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Departure time</Label>
                      <Input type="time" value={formData.returnDepartureTime} onChange={(e) => setFormData({ ...formData, returnDepartureTime: e.target.value })} className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Arrival time</Label>
                      <Input type="time" value={formData.returnArrivalTime} onChange={(e) => setFormData({ ...formData, returnArrivalTime: e.target.value })} className="bg-secondary/50" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("sellFlightNumber")}</Label>
                      <Input placeholder="e.g. VY8501" value={formData.returnFlightNumber} onChange={(e) => setFormData({ ...formData, returnFlightNumber: e.target.value })} className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("sellStopovers")}</Label>
                      <Input type="number" min="0" value={formData.returnStopovers} onChange={(e) => setFormData({ ...formData, returnStopovers: e.target.value })} className="bg-secondary/50" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Same cabin & add-ons as outbound</p>
                      <p className="text-xs text-muted-foreground">Apply outbound cabin class and add-ons to the return leg</p>
                    </div>
                    <Switch checked={inboundSameAsOutbound} onCheckedChange={setInboundSameAsOutbound} />
                  </div>

                  {!inboundSameAsOutbound && (
                    <>
                      <div className="space-y-2">
                        <Label>{t("sellCabinClass")}</Label>
                        <Select value={formData.returnTravelClass} onValueChange={(v) => setFormData({ ...formData, returnTravelClass: v })}>
                          <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t("sellCabinClassPlaceholder")} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="economy">{t("cabinEconomy")}</SelectItem>
                            <SelectItem value="premium_economy">{t("cabinPremiumEconomy")}</SelectItem>
                            <SelectItem value="business">{t("cabinBusiness")}</SelectItem>
                            <SelectItem value="first">{t("cabinFirst")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="pt-2 border-t border-border/50 space-y-3">
                        <p className="text-sm font-medium">{t("sellWhatsIncluded")}</p>
                        {sameInclusions ? (
                          renderInclusionToggles(inboundSharedInclusions, (field, value) =>
                            setInboundSharedInclusions((prev) => ({ ...prev, [field]: value }))
                          )
                        ) : (
                          <div className="space-y-5">
                            {inboundPerTicketInclusions.map((inc, i) => (
                              <div key={i} className={cn(i > 0 && "pt-4 border-t border-border/50")}>
                                {renderInclusionToggles(
                                  inc,
                                  (field, value) =>
                                    setInboundPerTicketInclusions((prev) =>
                                      prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
                                    ),
                                  t("sellTicketLabelN", { n: i + 1 })
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t("sellPricingHeader")}</h2>
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {getCurrencySymbol(c)} — {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Buyers will see this price converted to their preferred currency, but you'll be paid in {formData.currency}.
                </p>
              </div>
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
              <SellerFeeBreakdown price={formData.price} currency={getCurrencySymbol(formData.currency)} />
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

          {/* Step 2 nav */}
          {wizard && (
            <div className="flex gap-3">
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4" />
                {locale === "it" ? "Indietro" : "Back"}
              </Button>
              <Button
                type="button"
                variant="gold"
                size="lg"
                className="flex-1"
                disabled={
                  !formData.originCity ||
                  !formData.destinationCity ||
                  !formData.airline ||
                  !formData.departureDate ||
                  !formData.price ||
                  !!priceError ||
                  (flightVerification != null && (flightVerification.status === "mismatch" || flightVerification.status === "not_found"))
                }
                onClick={() => setStep(3)}
              >
                {locale === "it" ? "Continua" : "Continue"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
            </>
          )}

          {/* Bump Listing */}
          {(!wizard || step === 3) && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t("sellBoostHeader")}
            </h2>
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium">{t("sellBoostBumpTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("sellBoostChooseDesc")}</p>
                </div>
                <Switch
                  checked={formData.boostHours > 0}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      boostHours: checked ? BOOST_OPTIONS[0].hours : 0,
                    })
                  }
                />
              </div>
            </div>

            {formData.boostHours > 0 && (
            <div className="grid gap-2">
              {BOOST_OPTIONS.map((opt) => {
                const selected = formData.boostHours === opt.hours;
                return (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => setFormData({ ...formData, boostHours: opt.hours })}
                    className={`relative rounded-2xl p-4 text-left transition-all ${
                      selected
                        ? "bg-gradient-to-br from-primary/25 via-primary/10 to-transparent border-2 border-primary ring-2 ring-primary/40 shadow-glow-sm scale-[1.02]"
                        : "glass border border-border/40 hover:border-border"
                    }`}
                  >
                    {selected && (
                      <span className="absolute top-2 right-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground shadow-glow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className={`flex items-center gap-2 ${selected ? "font-semibold text-primary" : "font-medium"}`}>
                          🔥 {t(opt.labelKey)}
                        </p>
                        <p className="text-xs text-muted-foreground">{t("sellBoostBumpDesc")}</p>
                      </div>
                      <span className={`whitespace-nowrap font-bold ${selected ? "text-xl text-primary" : "text-lg text-primary/80"} pr-7`}>
                        €{opt.price.toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            )}

            {formData.boostHours > 0 && (() => {
              const selectedOpt = BOOST_OPTIONS.find((o) => o.hours === formData.boostHours);
              if (!selectedOpt) return null;
              return (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
                  <p className="text-sm font-medium">{t("sellBoostSummaryTitle")}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("sellBoostSummaryDuration")}</span>
                    <span className="font-medium">{t(selectedOpt.labelKey)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-border/60 pt-2">
                    <span className="font-medium">{t("sellBoostSummaryTotal")}</span>
                    <span className="font-bold text-primary">€{selectedOpt.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("sellBoostChargeNotice")}</p>
                </div>
              );
            })()}
          </div>
          )}

          {(!wizard || step === 3) && (() => {
            const blockedByVerification =
              formData.listingType === "flight_ticket" &&
              flightVerification != null &&
              (flightVerification.status === "mismatch" || flightVerification.status === "not_found");
            const isTrain = formData.listingType === "train_ticket";
            const isFlight = formData.listingType === "flight_ticket";
            // Show the name-change risk box only when there's actually a name-change fee at stake.
            const trainHasFee = isTrain && trainTransferResult?.status === "allowed" && (trainTransferResult.fee ?? 0) > 0;
            const showRiskBox = !isEditMode && (isFlight || trainHasFee);
            return (
              <>
                {showRiskBox && (
                  <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{t(isTrain ? "sellNoConfirmRiskTitleTrain" : "sellNoConfirmRiskTitle")}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{t(isTrain ? "sellNoConfirmRiskBodyTrain" : "sellNoConfirmRiskBody")}</p>
                        <p className="text-xs text-muted-foreground italic">{t("sellNoConfirmRiskReassurance")}</p>
                      </div>
                    </div>
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
                        checked={nameChangeRiskAck}
                        onChange={(e) => setNameChangeRiskAck(e.target.checked)}
                      />
                      <span className="text-xs leading-relaxed">{t(isTrain ? "sellNoConfirmRiskAckTrain" : "sellNoConfirmRiskAck")}</span>
                    </label>
                  </div>
                )}
                {!isEditMode && (
                  <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">
                          {locale === "it" ? "Dichiarazione del venditore" : "Seller declaration"}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {locale === "it"
                            ? "Questa dichiarazione è obbligatoria e viene registrata per la risoluzione delle controversie e le indagini antifrode."
                            : "This declaration is mandatory and is recorded for dispute resolution and fraud investigations."}
                        </p>
                      </div>
                    </div>
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
                        checked={sellerDeclarationAck}
                        onChange={(e) => setSellerDeclarationAck(e.target.checked)}
                      />
                      <span className="text-xs leading-relaxed">
                        {locale === "it" ? SELLER_DECLARATION_TEXT_IT : SELLER_DECLARATION_TEXT_EN}
                      </span>
                    </label>
                  </div>
                )}
              <div className="flex gap-3">
                {wizard && (
                  <Button type="button" variant="outline" size="xl" className="flex-1" onClick={() => setStep(2)}>
                    <ChevronLeft className="w-5 h-5" />
                    {locale === "it" ? "Indietro" : "Back"}
                  </Button>
                )}
              <Button
                type="submit"
                variant="gold"
                size="xl"
                className={wizard ? "flex-1" : "w-full"}
                  disabled={createListingMutation.isPending || isVerifyingFlight || blockedByVerification || (showRiskBox && !nameChangeRiskAck) || (!isEditMode && !sellerDeclarationAck)}
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
              </div>
              {isEditMode && editId && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="xl"
                      className="w-full mt-3 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-5 h-5" /> {locale === "it" ? "Elimina annuncio" : "Delete listing"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{locale === "it" ? "Eliminare questo annuncio?" : "Delete this listing?"}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {locale === "it"
                          ? "L'annuncio verrà rimosso definitivamente. Questa azione non può essere annullata."
                          : "This listing will be permanently removed. This action cannot be undone."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{locale === "it" ? "Annulla" : "Cancel"}</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={async () => {
                          const { error } = await supabase.from("listings").delete().eq("id", editId);
                          if (error) {
                            toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
                            return;
                          }
                          toast({ title: locale === "it" ? "Annuncio eliminato" : "Listing deleted" });
                          navigate("/listings");
                        }}
                      >
                        {locale === "it" ? "Elimina" : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              </>
            );
          })()}
        </form>
        )}
      </div>
    </AppLayout>
  );
}
