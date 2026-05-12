import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, ChevronDown, Loader2, ShoppingBag, Plane, Clock, CheckCircle2, AlertTriangle, ShieldCheck, RotateCcw, Download, FileText, Share2 } from "lucide-react";
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
import { useLanguage } from "@/i18n/LanguageContext";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { formatPrice } from "@/lib/currency";
import { useState, useEffect, useRef } from "react";
import { CopyButton, downloadTicketPdf, downloadReceiptPdf, shareTicket, canShare } from "./purchaseHelpers";

const statusConfig: Record<string, { label: string; className: string }> = {
  pending_transfer: { label: "Awaiting Transfer", className: "bg-warning/10 text-warning border-warning/30" },
  transfer_confirmed: { label: "Transfer Confirmed", className: "bg-success/10 text-success border-success/30" },
  completed: { label: "Completed", className: "bg-success/10 text-success border-success/30" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/30" },
  refunded: { label: "Refunded", className: "bg-muted text-muted-foreground border-muted" },
};

export default function Purchases() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const displayCurrency = useDisplayCurrency();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [reportOpen, setReportOpen] = useState(false);
  const [reportPurchaseId, setReportPurchaseId] = useState<string | null>(null);
  const SUPPORT_EMAIL = "support@swappup.com";

  const [searchParams, setSearchParams] = useSearchParams();
  const initialOpen = searchParams.get("open");
  const [expandedId, setExpandedId] = useState<string | null>(initialOpen);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
      const { data, error } = await supabase.from("purchases").select("*, listings(*)").eq("buyer_id", profile!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const releaseMutation = useMutation({
    mutationFn: async (purchase_id: string) => {
      const { error } = await supabase.functions.invoke("release-escrow", { body: { purchase_id } });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Receipt confirmed", description: "Payment has been released to the seller." });
      qc.invalidateQueries({ queryKey: ["purchases"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ purchase_id, reason }: { purchase_id: string; reason: string }) => {
      const { error } = await supabase.functions.invoke("cancel-escrow", { body: { purchase_id, reason } });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Refund requested", description: "Your payment hold has been released." });
      qc.invalidateQueries({ queryKey: ["purchases"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
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
          {purchases.map((p: any) => {
            const listing = p.listings as any;
            const cur = listing?.currency || "EUR";
            const status = statusConfig[p.status] || statusConfig.pending;
            const isTransferConfirmed = p.status === "transfer_confirmed";
            const isPendingTransfer = p.status === "pending_transfer";
            const deadline = p.transfer_deadline ? new Date(p.transfer_deadline) : null;
            const isExpired = deadline && deadline < new Date();
            const isOpen = expandedId === p.id;
            const route =
              listing?.origin_city && listing?.destination_city
                ? `${listing.origin_city} → ${listing.destination_city}`
                : listing?.title || "Ticket";

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
                        ? format(new Date(listing.departure_date), "EEE, MMM d, yyyy")
                        : format(new Date(p.created_at), "MMM d, yyyy")}
                      {listing?.airline ? ` · ${listing.airline}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-primary">{formatPrice(Number(p.total_price), cur, displayCurrency)}</p>
                    <Badge variant="outline" className={`text-xs ${status.className}`}>{status.label}</Badge>
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
                {/* Price Breakdown + Receipt */}
                <div className="flex flex-wrap items-center gap-2 px-1">
                  {p.name_change_fee > 0 && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2 flex-1 min-w-0">
                      <span>Ticket: {formatPrice(Number(p.total_price) - Number(p.name_change_fee), cur, displayCurrency)}</span>
                      <span>•</span>
                      <span>Name change fee: {formatPrice(Number(p.name_change_fee), cur, displayCurrency)}</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 h-7 ml-auto text-xs"
                    onClick={() => downloadReceiptPdf(p, listing, profile)}
                  >
                    <FileText className="w-3.5 h-3.5" /> Receipt
                  </Button>
                </div>

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
                        {isExpired ? "Transfer deadline expired — refund eligible" : "Waiting for seller to complete name change"}
                      </p>
                      {deadline && !isExpired && (
                        <p className="text-xs text-muted-foreground">Deadline: {format(deadline, "MMM d, HH:mm")}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Transfer Confirmed — Show Ticket Details */}
                {isTransferConfirmed && (
                  <div className="rounded-lg bg-success/10 border border-success/30 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      <p className="text-xs font-medium text-success">Name change confirmed — your ticket details:</p>
                    </div>
                    <div className="space-y-1 pl-6 pb-2 border-b border-success/20">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Route:</span>{" "}
                        <span className="font-medium text-foreground">
                          {listing?.origin_city} ({listing?.origin_airport || listing?.origin_station || "—"})
                          {" → "}
                          {listing?.destination_city} ({listing?.destination_airport || listing?.destination_station || "—"})
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Airline / Operator:</span>{" "}
                        <span className="font-medium text-foreground">{listing?.airline || listing?.operator || "—"}</span>
                      </p>
                      {(listing?.flight_number || listing?.train_number) && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Flight / Train #:</span>{" "}
                          <span className="font-mono font-medium text-foreground">{listing?.flight_number || listing?.train_number}</span>
                          <CopyButton value={listing?.flight_number || listing?.train_number} label="Flight number" />
                        </p>
                      )}
                      <p className="text-sm">
                        <span className="text-muted-foreground">Departure:</span>{" "}
                        <span className="font-medium text-foreground">
                          {listing?.departure_date ? format(new Date(listing.departure_date), "EEE, MMM d, yyyy") : "—"}
                          {listing?.departure_time ? ` · ${listing.departure_time.slice(0, 5)}` : ""}
                        </span>
                      </p>
                      {listing?.return_date && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Return:</span>{" "}
                          <span className="font-medium text-foreground">
                            {format(new Date(listing.return_date), "EEE, MMM d, yyyy")}
                            {listing?.return_departure_time ? ` · ${listing.return_departure_time.slice(0, 5)}` : ""}
                            {listing?.return_flight_number ? ` · ${listing.return_flight_number}` : ""}
                          </span>
                        </p>
                      )}
                      <p className="text-sm">
                        <span className="text-muted-foreground">Passengers:</span>{" "}
                        <span className="font-medium text-foreground">{p.quantity}</span>
                        {listing?.train_class ? <span className="text-muted-foreground"> · Class: <span className="text-foreground font-medium">{listing.train_class}</span></span> : null}
                      </p>
                    </div>
                    <div className="space-y-1 pl-6">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Booking Ref:</span>{" "}
                        <span className="font-mono font-bold text-foreground">{p.transfer_booking_ref}</span>
                        <CopyButton value={p.transfer_booking_ref} label="Booking reference" />
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Surname:</span>{" "}
                        <span className="font-bold text-foreground">{p.transfer_surname}</span>
                        <CopyButton value={p.transfer_surname} label="Surname" />
                      </p>
                      {p.buyer_full_name && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Passenger name on ticket:</span>{" "}
                          <span className="font-bold text-foreground">{p.buyer_full_name}</span>
                          <CopyButton value={p.buyer_full_name} label="Passenger name" />
                        </p>
                      )}
                      {p.transfer_payment_proof_url && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Payment proof:</span>{" "}
                          <a
                            href={p.transfer_payment_proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-primary underline underline-offset-4"
                          >
                            View receipt
                          </a>
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">
                      Use these details to access your booking on the airline's website.
                    </p>
                    <div className="flex flex-row flex-wrap gap-2 pt-2 pl-6">
                      {p.escrow_status !== "released" && (
                        <Button
                          size="sm" variant="gold" className="gap-2"
                          disabled={releaseMutation.isPending}
                          onClick={() => releaseMutation.mutate(p.id)}
                        >
                          <ShieldCheck className="w-4 h-4" /> Confirm everything is ok
                        </Button>
                      )}
                      <Button
                        size="sm" variant="outline" className="gap-2"
                        onClick={() => downloadTicketPdf(p, listing)}
                      >
                        <Download className="w-4 h-4" /> Download ticket PDF
                      </Button>
                      {canShare() && (
                        <Button
                          size="sm" variant="outline" className="gap-2"
                          onClick={() => shareTicket(p, listing)}
                        >
                          <Share2 className="w-4 h-4" /> Share
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
                          <AlertTriangle className="w-4 h-4" /> Report a problem
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
                    onClick={() => cancelMutation.mutate({ purchase_id: p.id, reason: "Seller missed the 24h deadline" })}
                  >
                    <RotateCcw className="w-4 h-4" /> Request refund
                  </Button>
                )}

                {/* Escrow Info */}
                {(p.escrow_status === "held" || p.escrow_status === "authorized") && (
                  <p className="text-xs text-muted-foreground px-1">
                    💰 Payment held in escrow until transfer is confirmed
                  </p>
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
            <DialogTitle>Report a problem</DialogTitle>
            <DialogDescription>
              Sorry you're having trouble with this purchase. Please email our support team
              and we'll look into it right away. Include your order reference and a short
              description of the issue.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <p className="text-muted-foreground">Send an email to:</p>
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
              Close
            </Button>
            <Button
              variant="gold"
              onClick={() => {
                window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                  `Problem with purchase ${reportPurchaseId ?? ""}`,
                )}`;
              }}
            >
              Open email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
