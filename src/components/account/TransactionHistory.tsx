import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = (searchParams.get("type") as "all" | "bought" | "sold") || "all";
  const [filter, setFilter] = useState<"all" | "bought" | "sold">(
    initialFilter === "bought" || initialFilter === "sold" ? initialFilter : "all"
  );
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

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !(transactions ?? []).filter((tx) => {
          if (filter === "all") return true;
          const isBuyer = tx.buyer_id === profile?.id;
          return filter === "bought" ? isBuyer : !isBuyer;
        }).length ? (
        <div className="glass rounded-2xl p-8 text-center space-y-3">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">{t("transactionsEmpty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions!.filter((tx) => {
            if (filter === "all") return true;
            const isBuyer = tx.buyer_id === profile?.id;
            return filter === "bought" ? isBuyer : !isBuyer;
          }).map((tx) => {
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
