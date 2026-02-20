import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, Loader2, ShoppingBag, Plane } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Purchases() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const { data: purchases, isLoading } = useQuery({
    queryKey: ["purchases", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*, listings(*)")
        .eq("buyer_id", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/account")} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold">Purchases</h1>
          <p className="text-sm text-muted-foreground">Your bought tickets</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !purchases?.length ? (
        <div className="glass rounded-2xl p-8 text-center space-y-3">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No purchases yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((p) => (
            <div key={p.id} className="glass rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{(p.listings as any)?.title || "Ticket"}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">€{p.total_price}</p>
                  <Badge variant="outline" className={`text-xs ${p.status === "completed" ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30"}`}>
                    {p.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
