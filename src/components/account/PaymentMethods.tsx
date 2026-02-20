import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CreditCard, Loader2, Plus } from "lucide-react";

export default function PaymentMethods() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const addPaymentMethod = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-setup-intent");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/account")} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold">Payment Methods</h1>
          <p className="text-sm text-muted-foreground">Manage your cards</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6">
        <div className="text-center space-y-3 py-4">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Add a payment method to buy tickets instantly. You'll be redirected to a secure page.
          </p>
        </div>

        <Button variant="gold" size="lg" className="w-full" onClick={addPaymentMethod} disabled={loading}>
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</>
          ) : (
            <><Plus className="w-4 h-4 mr-2" /> Add Payment Method</>
          )}
        </Button>
      </div>
    </div>
  );
}
