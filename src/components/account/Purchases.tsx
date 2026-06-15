import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, ChevronDown, Loader2, ShoppingBag, Plane, Clock, CheckCircle2, AlertTriangle, ShieldCheck, RotateCcw, Download, FileText, Share2, PartyPopper, Mail, UserCheck, BellRing } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it as itLocale, enUS } from "date-fns/locale";
import { useLanguage } from "@/i18n/LanguageContext";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { formatPrice } from "@/lib/currency";
import { useState, useEffect, useRef } from "react";
import { CopyButton, downloadTicketPdf, downloadReceiptPdf, shareTicket, canShare } from "./purchaseHelpers";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";

const statusClass: Record<string, string> = {
  pending_transfer: "bg-warning/10 text-warning border-warning/30",
  transfer_confirmed: "bg-success/10 text-success border-success/30",
  completed: "bg-success/10 text-success border-success/30",
  pending: "bg-warning/10 text-warning border-warning/30",
  refunded: "bg-muted text-muted-foreground border-muted",
};
const statusKey: Record<string, "purStatusAwaiting" | "purStatusTransferConfirmed" | "purStatusCompleted" | "purStatusPending" | "purStatusRefunded"> = {
  pending_transfer: "purStatusAwaiting",
  transfer_confirmed: "purStatusTransferConfirmed",
  completed: "purStatusCompleted",
  pending: "purStatusPending",
  refunded: "purStatusRefunded",
};

export default function Purchases() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const dfLocale = locale === "it" ? itLocale : enUS;
  const displayCurrency = useDisplayCurrency();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [reportOpen, setReportOpen] = useState(false);
  const [reportPurchaseId, setReportPurchaseId] = useState<string | null>(null);
  const SUPPORT_EMAIL = "support@swappup.com";

  const [searchParams, setSearchParams] = useSearchParams();
  const initialOpen = searchParams.get("open");
  const justPurchased = searchParams.get("success") === "1";
  const [expandedId, setExpandedId] = useState<string | null>(initialOpen);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [destQuery, setDestQuery] = useState("");
  const [airlineFilter, setAirlineFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (initialOpen && cardRefs.current[initialOpen]) {
      cardRefs.current[initialOpen]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOpen]);

  const toggleExpanded = (id: string) => {
    setExpandedId((cur) => {
      const next = cur === id ? null : id;
      const params = new URLSearchParams(searchParams);
      if (next) params.set("open", next);
      else params.delete("open");
      setSearchParams(params, { replace: true });
      return next;
    });
  };

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: purchases, isLoading } = useQuery({
    queryKey: ["purchases", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*, listings(*)")
        .eq("buyer_id", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as any[];
      if (rows.length === 0) return rows;
      // Enrich with seller's public profile (safe fields only).
      const sellerIds = Array.from(new Set(rows.map((r) => r.seller_id).filter(Boolean)));
      if (sellerIds.length === 0) return rows;
      const { data: sellers } = await supabase.rpc("get_public_profiles", {
        _profile_ids: sellerIds,
      });
      const byId = new Map(((sellers ?? []) as any[]).map((s) => [s.id, s]));
      return rows.map((r) => ({ ...r, seller: byId.get(r.seller_id) ?? null }));
    },
    enabled: !!profile?.id,
  });

  const airlines = Array.from(
    new Set(((purchases ?? []) as any[]).map((p) => p.listings?.airline).filter(Boolean))
  ) as string[];

  const filteredPurchases = ((purchases ?? []) as any[]).filter((p) => {
    const l = p.listings as any;
    if (destQuery) {
      const q = destQuery.toLowerCase();
      const hay = `${l?.destination_city ?? ""} ${l?.destination_country ?? ""} ${l?.destination_airport ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (airlineFilter !== "all" && l?.airline !== airlineFilter) return false;
    if (dateFrom && new Date(p.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(p.created_at) > new Date(`${dateTo}T23:59:59`)) return false;
    return true;
  });
  const hasActiveFilter = !!(destQuery || airlineFilter !== "all" || dateFrom || dateTo);
  const clearFilters = () => { setDestQuery(""); setAirlineFilter("all"); setDateFrom(""); setDateTo(""); };

  const releaseMutation = useMutation({
    mutationFn: async (purchase_id: string) => {
      const { error } = await supabase.functions.invoke("release-escrow", { body: { purchase_id } });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("purReceiptConfirmed"), description: t("purReceiptConfirmedDesc") });
      qc.invalidateQueries({ queryKey: ["purchases"] });
    },
    onError: (e: any) => toast({ title: t("purFailed"), description: e.message, variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ purchase_id, reason }: { purchase_id: string; reason: string }) => {
      const { error } = await supabase.functions.invoke("cancel-escrow", { body: { purchase_id, reason } });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("purRefundRequested"), description: t("purRefundRequestedDesc") });
      qc.invalidateQueries({ queryKey: ["purchases"] });
    },
    onError: (e: any) => toast({ title: t("purFailed"), description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/account")} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-xl font-display font-bold">{t("purchasesTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("purchasesDesc")}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !purchases?.length ? (
        <div className="glass rounded-2xl p-8 text-center space-y-3">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">{t("purchasesEmpty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {justPurchased && (
            <div className="glass-strong rounded-2xl p-5 space-y-4 border border-primary/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <PartyPopper className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display font-semibold text-lg">{t("purConfirmedTitle")}</h2>
                  <p className="text-sm text-muted-foreground">{t("purConfirmedDesc")}</p>
                </div>
                <button
                  type="button"
                  aria-label={t("purDismiss")}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.delete("success");
                    setSearchParams(params, { replace: true });
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span><span className="font-medium">{t("purStepEmail")}</span>{t("purStepEmailRest")}</span>
                </li>
                <li className="flex gap-3">
                  <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span><span className="font-medium">{t("purStep24h")}</span>{t("purStep24hRest")}</span>
                </li>
                <li className="flex gap-3">
                  <BellRing className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span><span className="font-medium">{t("purStepNotified")}</span>{t("purStepNotifiedRest")}</span>
                </li>
                <li className="flex gap-3">
                  <UserCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span><span className="font-medium">{t("purStepConfirm")}</span>{t("purStepConfirmRest")}</span>
                </li>
              </ol>
            </div>
          )}
          <div className="glass rounded-2xl p-3 space-y-3">
            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              className="w-full flex items-center justify-between text-sm font-medium"
            >
              <span className="flex items-center gap-2"><Filter className="w-4 h-4" /> {t("purFilters")}{hasActiveFilter ? ` · ${filteredPurchases.length}/${purchases.length}` : ""}</span>
              {hasActiveFilter && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); clearFilters(); }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                ><X className="w-3 h-3" /> {t("purClear")}</span>
              )}
            </button>
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  placeholder={t("purDestPlaceholder")}
                  value={destQuery}
                  onChange={(e) => setDestQuery(e.target.value)}
                />
                <Select value={airlineFilter} onValueChange={setAirlineFilter}>
                  <SelectTrigger><SelectValue placeholder={t("purAirline")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("purAllAirlines")}</SelectItem>
                    {airlines.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("purPurchasedFrom")}</label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("purPurchasedTo")}</label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>
            )}
          </div>
          {filteredPurchases.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
              {t("purNoMatch")}
            </div>
          ) : filteredPurchases.map((p: any) => {
            const listing = p.listings as any;
            const cur = listing?.currency || "EUR";
            const statusCls = statusClass[p.status] || statusClass.pending;
            const statusLabel = t(statusKey[p.status] || statusKey.pending);
            const isTransferConfirmed = p.status === "transfer_confirmed";
            const isPendingTransfer = p.status === "pending_transfer";
            const isPending = p.status === "pending";
            const isRefunded = p.status === "refunded";
            const hasCredentials = !!(p.transfer_booking_ref || p.transfer_surname);
            const deadline = p.transfer_deadline ? new Date(p.transfer_deadline) : null;
            const isExpired = deadline && deadline < new Date();
            const isOpen = expandedId === p.id;
            const isRoundTrip = !!listing?.return_date;
            const route =
              listing?.origin_city && listing?.destination_city
                ? `${listing.origin_city} ${isRoundTrip ? "↔" : "→"} ${listing.destination_city}`
                : listing?.title || t("purTicket");

            return (
              <div
                key={p.id}
                ref={(el) => (cardRefs.current[p.id] = el)}
                className="glass rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleExpanded(p.id)}
                  aria-expanded={isOpen}
                  aria-controls={`purchase-details-${p.id}`}
                  className="w-full text-left p-4 flex items-center gap-3 hover:bg-foreground/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Plane className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{route}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {listing?.departure_date
                        ? format(new Date(listing.departure_date), "EEE, MMM d, yyyy", { locale: dfLocale })
                        : format(new Date(p.created_at), "MMM d, yyyy", { locale: dfLocale })}
                      {listing?.airline ? ` · ${listing.airline}` : ""}
                      {` · ${t("purPurchasedAt", { date: format(new Date(p.created_at), "MMM d, yyyy · HH:mm", { locale: dfLocale }) })}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-primary">{formatPrice(Number(p.total_price), cur, displayCurrency)}</p>
                    <Badge variant="outline" className={`text-xs ${statusCls}`}>{statusLabel}</Badge>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <div
                  id={`purchase-details-${p.id}`}
                  className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                {/* Trip details — always visible */}
                <div className="rounded-lg bg-secondary/40 p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("purTripDetails")}</p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t("purRoute")}</span>{" "}
                    <span className="font-medium text-foreground">
                      {listing?.origin_city || "—"}
                      {listing?.origin_airport ? ` (${listing.origin_airport})` : ""}
                      {` ${isRoundTrip ? "↔" : "→"} `}
                      {listing?.destination_city || "—"}
                      {listing?.destination_airport ? ` (${listing.destination_airport})` : ""}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t("purAirlineLabel")}</span>{" "}
                    <span className="font-medium text-foreground">{listing?.airline || "—"}</span>
                  </p>
                  {listing?.flight_number && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">{t("purFlightNumber")}</span>{" "}
                      <span className="font-mono font-medium text-foreground">{listing.flight_number}</span>
                      <CopyButton value={listing.flight_number} label="Flight number" />
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t("purDeparture")}</span>{" "}
                    <span className="font-medium text-foreground">
                      {listing?.departure_date ? format(new Date(listing.departure_date), "EEE, MMM d, yyyy", { locale: dfLocale }) : "—"}
                      {listing?.departure_time ? ` · ${listing.departure_time.slice(0, 5)}` : ""}
                      {listing?.arrival_time ? ` → ${listing.arrival_time.slice(0, 5)}` : ""}
                    </span>
                  </p>
                  {isRoundTrip && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">{t("purReturn")}</span>{" "}
                      <span className="font-medium text-foreground">
                        {format(new Date(listing.return_date), "EEE, MMM d, yyyy", { locale: dfLocale })}
                        {listing?.return_departure_time ? ` · ${listing.return_departure_time.slice(0, 5)}` : ""}
                        {listing?.return_arrival_time ? ` → ${listing.return_arrival_time.slice(0, 5)}` : ""}
                        {listing?.return_flight_number ? ` · ${listing.return_flight_number}` : ""}
                      </span>
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t("purPassengers")}</span>{" "}
                    <span className="font-medium text-foreground">{p.quantity}</span>
                  </p>
                </div>

                {/* Price Breakdown + Receipt */}
                <div className="flex flex-wrap items-center gap-2 px-1">
                  {p.name_change_fee > 0 && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2 flex-1 min-w-0">
                      <span>{t("purTicketAmount")} {formatPrice(Number(p.total_price) - Number(p.name_change_fee), cur, displayCurrency)}</span>
                      <span>•</span>
                      <span>{t("purNameChangeFeeLabel")} {formatPrice(Number(p.name_change_fee), cur, displayCurrency)}</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 h-7 ml-auto text-xs"
                    onClick={() => downloadReceiptPdf(p, listing, profile)}
                  >
                    <FileText className="w-3.5 h-3.5" /> {t("purReceipt")}
                  </Button>
                </div>

                {/* Pending payment hint */}
                {isPending && (
                  <div className="rounded-lg bg-warning/10 p-3 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <p className="text-xs text-warning">{t("purPaymentProcessing")}</p>
                  </div>
                )}

                {/* Refunded info */}
                {isRefunded && (
                  <div className="rounded-lg bg-muted/50 p-3 flex items-start gap-2">
                    <RotateCcw className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">{t("purRefundedInfo")}</p>
                  </div>
                )}

                {/* Pending Transfer Status */}
                {isPendingTransfer && (
                  <div className={`rounded-lg p-3 flex items-start gap-2 ${isExpired ? "bg-destructive/10" : "bg-warning/10"}`}>
                    {isExpired ? (
                      <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className={`text-xs font-medium ${isExpired ? "text-destructive" : "text-warning"}`}>
                        {isExpired ? t("purDeadlineExpired") : t("purWaitingSeller")}
                      </p>
                      {deadline && !isExpired && (
                        <p className="text-xs text-muted-foreground">{t("purDeadline")} {format(deadline, "MMM d, HH:mm", { locale: dfLocale })}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Booking credentials — shown whenever transfer details exist (transfer_confirmed or completed) */}
                {hasCredentials && (
                  <div className={`rounded-lg p-3 space-y-2 ${isTransferConfirmed ? "bg-success/10 border border-success/30" : "bg-secondary/40"}`}>
                    {isTransferConfirmed && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                        <p className="text-xs font-medium text-success">{t("purNameChangeConfirmed")}</p>
                      </div>
                    )}
                    {!isTransferConfirmed && (
                      <p className="text-xs font-medium text-muted-foreground">{t("purBookingDetails")}</p>
                    )}
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">{t("purBookingRef")}</span>{" "}
                        <span className="font-mono font-bold text-foreground">{p.transfer_booking_ref}</span>
                        <CopyButton value={p.transfer_booking_ref} label="Booking reference" />
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">{t("purSurname")}</span>{" "}
                        <span className="font-bold text-foreground">{p.transfer_surname}</span>
                        <CopyButton value={p.transfer_surname} label="Surname" />
                      </p>
                      {p.buyer_full_name && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">{t("purPassengerName")}</span>{" "}
                          <span className="font-bold text-foreground">{p.buyer_full_name}</span>
                          <CopyButton value={p.buyer_full_name} label="Passenger name" />
                        </p>
                      )}
                      {p.transfer_payment_proof_url && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">{t("purPaymentProof")}</span>{" "}
                          <a
                            href={p.transfer_payment_proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-primary underline underline-offset-4"
                          >
                            {t("purViewReceipt")}
                          </a>
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{t("purBookingDisclaimer")}</p>
                    <div className="flex flex-row flex-wrap gap-2 pt-2">
                      {p.escrow_status !== "released" && (
                        <Button
                          size="sm" variant="gold" className="gap-2"
                          disabled={releaseMutation.isPending}
                          onClick={() => releaseMutation.mutate(p.id)}
                        >
                          <ShieldCheck className="w-4 h-4" /> {t("purConfirmOk")}
                        </Button>
                      )}
                      <Button
                        size="sm" variant="outline" className="gap-2"
                        onClick={() => downloadTicketPdf(p, listing, p.seller, profile)}
                      >
                        <Download className="w-4 h-4" /> {t("purDownloadPdf")}
                      </Button>
                      {canShare() && (
                        <Button
                          size="sm" variant="outline" className="gap-2"
                          onClick={() => shareTicket(p, listing)}
                        >
                          <Share2 className="w-4 h-4" /> {t("purShare")}
                        </Button>
                      )}
                      {p.escrow_status !== "released" && (
                        <Button
                          size="sm" variant="outline" className="gap-2"
                          disabled={cancelMutation.isPending}
                          onClick={() => {
                            setReportPurchaseId(p.id);
                            setReportOpen(true);
                          }}
                        >
                          <AlertTriangle className="w-4 h-4" /> {t("purReportProblem")}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Refund button when seller missed deadline */}
                {isPendingTransfer && isExpired && (
                  <Button
                    size="sm" variant="outline" className="gap-2"
                    disabled={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate({ purchase_id: p.id, reason: t("purRefundReasonMissed") })}
                  >
                    <RotateCcw className="w-4 h-4" /> {t("purRequestRefund")}
                  </Button>
                )}

                {/* Escrow Info */}
                {(p.escrow_status === "held" || p.escrow_status === "authorized") && (
                  <p className="text-xs text-muted-foreground px-1">{t("purEscrowHeld")}</p>
                )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("purReportTitle")}</DialogTitle>
            <DialogDescription>{t("purReportDesc")}</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <p className="text-muted-foreground">{t("purSendEmailTo")}</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                `Problem with purchase ${reportPurchaseId ?? ""}`,
              )}`}
              className="font-semibold text-foreground underline underline-offset-4"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              {t("close")}
            </Button>
            <Button
              variant="gold"
              onClick={() => {
                window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                  `Problem with purchase ${reportPurchaseId ?? ""}`,
                )}`;
              }}
            >
              {t("purOpenEmail")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
