import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, Loader2, FileText, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useLanguage } from "@/i18n/LanguageContext";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { formatPrice } from "@/lib/currency";

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const displayCurrency = useDisplayCurrency();

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
      const { data, error } = await supabase.from("purchases").select("*, listings(*)").or(`buyer_id.eq.${profile!.id},seller_id.eq.${profile!.id}`).order("created_at", { ascending: false });
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
          <h1 className="text-xl font-display font-bold">{t("transactionsTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("transactionsDesc")}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !transactions?.length ? (
        <div className="glass rounded-2xl p-8 text-center space-y-3">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">{t("transactionsEmpty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const isBuyer = tx.buyer_id === profile?.id;
            const listing = tx.listings as any;
            const cur = (listing as any)?.currency || "EUR";
            return (
              <div key={tx.id} className="glass rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBuyer ? "bg-destructive/10" : "bg-success/10"}`}>
                    {isBuyer ? <ArrowUpRight className="w-5 h-5 text-destructive" /> : <ArrowDownLeft className="w-5 h-5 text-success" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{listing?.title || "Ticket"}</p>
                    <p className="text-xs text-muted-foreground">
                      {isBuyer ? t("transactionsPurchased") : t("transactionsSold")} · {format(new Date(tx.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isBuyer ? "text-destructive" : "text-success"}`}>{isBuyer ? "-" : "+"}{formatPrice(Number(tx.total_price), cur, displayCurrency)}</p>
                    <Badge variant="outline" className="text-xs">{tx.status}</Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
