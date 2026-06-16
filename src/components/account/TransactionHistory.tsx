import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, Loader2, FileText, ArrowUpRight, ArrowDownLeft, Plane, Clock, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useLanguage } from "@/i18n/LanguageContext";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { formatPrice } from "@/lib/currency";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CopyButton } from "./purchaseHelpers";

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const displayCurrency = useDisplayCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = (searchParams.get("type") as "all" | "bought" | "sold") || "all";
  const [filter, setFilter] = useState<"all" | "bought" | "sold">(
    initialFilter === "bought" || initialFilter === "sold" ? initialFilter : "all"
  );
  const [destQuery, setDestQuery] = useState("");
  const [airlineFilter, setAirlineFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [detailsTx, setDetailsTx] = useState<any | null>(null);
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (filter === "all") next.delete("type"); else next.set("type", filter);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", profile?.id],
    queryFn: async () => {
      // Buyer side: full purchase row via RLS.
      const { data: bought, error: bErr } = await supabase
        .from("purchases")
        .select("*, listings(*)")
        .eq("buyer_id", profile!.id)
        .order("created_at", { ascending: false });
      if (bErr) throw bErr;

      // Seller side: PII-masked rows via SECURITY DEFINER RPC.
      const { data: sold, error: sErr } = await supabase.rpc("get_seller_purchases", {
        _statuses: null,
      });
      if (sErr) throw sErr;

      const soldRows = (sold ?? []) as any[];
      const listingIds = Array.from(new Set(soldRows.map((r) => r.listing_id).filter(Boolean)));
      let listingsById = new Map<string, any>();
      if (listingIds.length > 0) {
        const { data: listingRows } = await supabase
          .from("listings")
          .select("*")
          .in("id", listingIds);
        listingsById = new Map((listingRows ?? []).map((l: any) => [l.id, l]));
      }
      const soldEnriched = soldRows.map((r) => ({ ...r, listings: listingsById.get(r.listing_id) ?? null }));

      const all = [...(bought ?? []), ...soldEnriched];
      // Dedup by id and sort newest first.
      const seen = new Set<string>();
      const merged = all.filter((tx) => {
        if (seen.has(tx.id)) return false;
        seen.add(tx.id);
        return true;
      });
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return merged;
    },
    enabled: !!profile?.id,
  });

  const airlines = Array.from(
    new Set(((transactions ?? []) as any[]).map((tx) => tx.listings?.airline).filter(Boolean))
  ) as string[];

  const baseFiltered = (transactions ?? []).filter((tx) => {
    if (filter !== "all") {
      const isBuyer = tx.buyer_id === profile?.id;
      if (filter === "bought" ? !isBuyer : isBuyer) return false;
    }
    const l = tx.listings as any;
    if (destQuery) {
      const q = destQuery.toLowerCase();
      const hay = `${l?.destination_city ?? ""} ${l?.destination_country ?? ""} ${l?.destination_airport ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (airlineFilter !== "all" && l?.airline !== airlineFilter) return false;
    if (dateFrom && new Date(tx.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(tx.created_at) > new Date(`${dateTo}T23:59:59`)) return false;
    return true;
  });
  const hasActiveFilter = !!(destQuery || airlineFilter !== "all" || dateFrom || dateTo);
  const clearFilters = () => { setDestQuery(""); setAirlineFilter("all"); setDateFrom(""); setDateTo(""); };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/account")} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-xl font-display font-bold">{t("transactionsTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("transactionsDesc")}</p>
        </div>
      </div>

      <div className="glass rounded-xl p-1 flex gap-1">
        {([
          { value: "all" as const, label: t("browseAll") },
          { value: "sold" as const, label: t("accountSold") },
          { value: "bought" as const, label: t("transactionsPurchased") },
        ]).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-semibold transition-all",
              filter === opt.value
                ? "bg-primary text-primary-foreground shadow-glow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl p-3 space-y-3">
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className="w-full flex items-center justify-between text-sm font-medium"
        >
          <span className="flex items-center gap-2"><Filter className="w-4 h-4" /> Filters{hasActiveFilter ? ` · ${baseFiltered.length}` : ""}</span>
          {hasActiveFilter && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); clearFilters(); }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            ><X className="w-3 h-3" /> Clear</span>
          )}
        </button>
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              placeholder="Destination (city, country)"
              value={destQuery}
              onChange={(e) => setDestQuery(e.target.value)}
            />
            <Select value={airlineFilter} onValueChange={setAirlineFilter}>
              <SelectTrigger><SelectValue placeholder="Airline" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All airlines</SelectItem>
                {airlines.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !baseFiltered.length ? (
        <div className="glass rounded-2xl p-8 text-center space-y-3">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">{t("transactionsEmpty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {baseFiltered.map((tx) => {
            const isBuyer = tx.buyer_id === profile?.id;
            const listing = tx.listings as any;
            const cur = (listing as any)?.currency || "EUR";
            const handleOpen = () => {
              if (isBuyer) {
                navigate(`/account/purchases?open=${tx.id}`);
              } else {
                setDetailsTx(tx);
              }
            };
            return (
              <button
                type="button"
                key={tx.id}
                onClick={handleOpen}
                className="w-full text-left glass rounded-2xl p-4 hover:bg-foreground/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBuyer ? "bg-destructive/10" : "bg-success/10"}`}>
                    {isBuyer ? <ArrowUpRight className="w-5 h-5 text-destructive" /> : <ArrowDownLeft className="w-5 h-5 text-success" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{listing?.title || "Ticket"}</p>
                    <p className="text-xs text-muted-foreground">
                      {isBuyer ? t("transactionsPurchased") : t("transactionsSold")} · {format(new Date(tx.created_at), "MMM d, yyyy 'at' HH:mm")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isBuyer ? "text-destructive" : "text-success"}`}>{isBuyer ? "-" : "+"}{formatPrice(Number(tx.total_price), cur, displayCurrency)}</p>
                    <Badge variant="outline" className="text-xs">{tx.status}</Badge>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <SaleDetailsDialog tx={detailsTx} onClose={() => setDetailsTx(null)} displayCurrency={displayCurrency} />
    </div>
  );
}

function SaleDetailsDialog({
  tx,
  onClose,
  displayCurrency,
}: {
  tx: any | null;
  onClose: () => void;
  displayCurrency: string;
}) {
  const { t } = useLanguage();
  if (!tx) return null;
  const listing = tx.listings as any;
  const cur = listing?.currency || "EUR";
  const isRoundTrip = !!listing?.return_date;
  const deadline = tx.transfer_deadline ? new Date(tx.transfer_deadline) : null;
  const isExpired = deadline && deadline < new Date();
  const statusTone: Record<string, string> =
    {
      pending_transfer: "bg-warning/10 text-warning border-warning/30",
      transfer_confirmed: "bg-success/10 text-success border-success/30",
      completed: "bg-success/10 text-success border-success/30",
      refunded: "bg-muted text-muted-foreground border-muted",
      pending: "bg-warning/10 text-warning border-warning/30",
    } as const;
  const tone = statusTone[tx.status] || "bg-muted text-muted-foreground border-muted";

  return (
    <Dialog open={!!tx} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass-strong border-border/60 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Plane className="w-5 h-5 text-primary" />
            {t("transactionsSold")} · {listing?.title || "Ticket"}
          </DialogTitle>
          <DialogDescription>
            {format(new Date(tx.created_at), "MMM d, yyyy 'at' HH:mm")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Status */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={`text-xs ${tone}`}>{String(tx.status).replace(/_/g, " ")}</Badge>
            <span className="font-semibold text-success">
              +{formatPrice(Number(tx.total_price), cur, displayCurrency)}
            </span>
          </div>

          {/* Trip */}
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
              {listing?.flight_number ? <span className="font-mono"> · {listing.flight_number}</span> : null}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">{t("purDeparture")}</span>{" "}
              <span className="font-medium text-foreground">
                {listing?.departure_date ? format(new Date(listing.departure_date), "EEE, MMM d, yyyy") : "—"}
                {listing?.departure_time ? ` · ${String(listing.departure_time).slice(0, 5)}` : ""}
                {listing?.arrival_time ? ` → ${String(listing.arrival_time).slice(0, 5)}` : ""}
              </span>
            </p>
            {isRoundTrip && (
              <p className="text-sm">
                <span className="text-muted-foreground">{t("purReturn")}</span>{" "}
                <span className="font-medium text-foreground">
                  {format(new Date(listing.return_date), "EEE, MMM d, yyyy")}
                  {listing?.return_departure_time ? ` · ${String(listing.return_departure_time).slice(0, 5)}` : ""}
                  {listing?.return_arrival_time ? ` → ${String(listing.return_arrival_time).slice(0, 5)}` : ""}
                  {listing?.return_flight_number ? ` · ${listing.return_flight_number}` : ""}
                </span>
              </p>
            )}
            <p className="text-sm">
              <span className="text-muted-foreground">{t("purPassengers")}</span>{" "}
              <span className="font-medium text-foreground">{tx.quantity}</span>
            </p>
          </div>

          {/* Payout breakdown */}
          <div className="rounded-lg bg-secondary/40 p-3 space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("purTicketAmount")}</span>
              <span>{formatPrice(Number(tx.total_price) - Number(tx.name_change_fee || 0), cur, displayCurrency)}</span>
            </div>
            {Number(tx.name_change_fee) > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("purNameChangeFeeLabel")}</span>
                <span>{formatPrice(Number(tx.name_change_fee), cur, displayCurrency)}</span>
              </div>
            )}
            <div className="flex items-center justify-between font-semibold pt-1 border-t border-border/40">
              <span>{t("purchasesTitle") /* fallback label */ ? "Total" : "Total"}</span>
              <span className="text-success">{formatPrice(Number(tx.total_price), cur, displayCurrency)}</span>
            </div>
          </div>

          {/* Transfer status */}
          {tx.status === "pending_transfer" && (
            <div className={`rounded-lg p-3 flex items-start gap-2 ${isExpired ? "bg-destructive/10" : "bg-warning/10"}`}>
              {isExpired ? (
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-warning mt-0.5 shrink-0" />
              )}
              <p className="text-xs">
                {isExpired
                  ? "Transfer deadline expired."
                  : deadline
                    ? `Deadline: ${format(deadline, "MMM d, HH:mm")}`
                    : "Awaiting name change."}
              </p>
            </div>
          )}

          {tx.transfer_confirmed_at && (
            <div className="rounded-lg bg-success/10 p-3 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
              <p className="text-xs">
                Name change confirmed on {format(new Date(tx.transfer_confirmed_at), "MMM d, yyyy 'at' HH:mm")}.
              </p>
            </div>
          )}

          {tx.escrow_status && tx.escrow_status !== "none" && (
            <div className="rounded-lg bg-secondary/40 p-3 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Payout status: <span className="font-medium text-foreground">{tx.escrow_status}</span>
              </p>
            </div>
          )}

          {(tx.transfer_booking_ref || tx.transfer_surname) && (
            <div className="rounded-lg bg-secondary/40 p-3 space-y-1 text-sm">
              <p className="text-xs font-medium text-muted-foreground mb-1">Booking submitted to buyer</p>
              {tx.transfer_booking_ref && (
                <p>
                  <span className="text-muted-foreground">Booking ref: </span>
                  <span className="font-mono font-bold">{tx.transfer_booking_ref}</span>
                  <CopyButton value={tx.transfer_booking_ref} label="Booking reference" />
                </p>
              )}
              {tx.transfer_surname && (
                <p>
                  <span className="text-muted-foreground">Surname: </span>
                  <span className="font-bold">{tx.transfer_surname}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
