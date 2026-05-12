import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, Loader2, ShoppingBag, Plane, Clock, CheckCircle2, AlertTriangle, ShieldCheck, RotateCcw } from "lucide-react";
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
import { useState } from "react";

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

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id").eq("user_id", user!.id).single();
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

            return (
              <div key={p.id} className="glass rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Plane className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{listing?.title || "Ticket"}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{formatPrice(Number(p.total_price), cur, displayCurrency)}</p>
                    <Badge variant="outline" className={`text-xs ${status.className}`}>{status.label}</Badge>
                  </div>
                </div>

                {/* Price Breakdown */}
                {p.name_change_fee > 0 && (
                  <div className="text-xs text-muted-foreground flex items-center gap-3 px-1">
                    <span>Ticket: {formatPrice(Number(p.total_price) - Number(p.name_change_fee), cur, displayCurrency)}</span>
                    <span>•</span>
                    <span>Name change fee: {formatPrice(Number(p.name_change_fee), cur, displayCurrency)}</span>
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
                    <div className="space-y-1 pl-6">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Booking Ref:</span>{" "}
                        <span className="font-mono font-bold text-foreground">{p.transfer_booking_ref}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Surname:</span>{" "}
                        <span className="font-bold text-foreground">{p.transfer_surname}</span>
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">
                      Use these details to access your booking on the airline's website.
                    </p>
                    {p.escrow_status !== "released" && (
                      <div className="flex flex-col sm:flex-row gap-2 pt-2 pl-6">
                        <Button
                          size="sm" variant="gold" className="gap-2"
                          disabled={releaseMutation.isPending}
                          onClick={() => releaseMutation.mutate(p.id)}
                        >
                          <ShieldCheck className="w-4 h-4" /> Confirm everything is ok
                        </Button>
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
                      </div>
                    )}
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
