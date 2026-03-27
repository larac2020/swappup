import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, Loader2, ShoppingBag, Plane, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useLanguage } from "@/i18n/LanguageContext";

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
                    <p className="font-semibold text-primary">€{Number(p.total_price).toFixed(2)}</p>
                    <Badge variant="outline" className={`text-xs ${status.className}`}>{status.label}</Badge>
                  </div>
                </div>

                {/* Price Breakdown */}
                {p.name_change_fee > 0 && (
                  <div className="text-xs text-muted-foreground flex items-center gap-3 px-1">
                    <span>Ticket: €{(Number(p.total_price) - Number(p.name_change_fee)).toFixed(2)}</span>
                    <span>•</span>
                    <span>Name change fee: €{Number(p.name_change_fee).toFixed(2)}</span>
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
                  </div>
                )}

                {/* Escrow Info */}
                {p.escrow_status === "held" && (
                  <p className="text-xs text-muted-foreground px-1">
                    💰 Payment held in escrow until transfer is confirmed
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
