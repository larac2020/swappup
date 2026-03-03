import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CreditCard, Loader2, CheckCircle } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function CardForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      const { error, setupIntent } = await stripe.confirmCardSetup(
        (window as any).__setupClientSecret,
        { payment_method: { card: cardElement } }
      );

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else if (setupIntent?.status === "succeeded") {
        toast({ title: "Card saved", description: "Your payment method has been added." });
        onSuccess();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="glass rounded-xl p-4 border border-border">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "hsl(var(--foreground))",
                "::placeholder": { color: "hsl(var(--muted-foreground))" },
              },
              invalid: { color: "hsl(var(--destructive))" },
            },
          }}
        />
      </div>
      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={!stripe || loading}>
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
        ) : (
          "Save Card"
        )}
      </Button>
    </form>
  );
}

export default function PaymentMethods() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSetupIntent = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("create-setup-intent");
        if (error) throw error;
        if (data?.clientSecret) {
          setClientSecret(data.clientSecret);
          (window as any).__setupClientSecret = data.clientSecret;
        }
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchSetupIntent();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/account")} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold">Payment Methods</h1>
          <p className="text-sm text-muted-foreground">Add your card details below</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6">
        {saved ? (
          <div className="text-center space-y-3 py-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="font-semibold">Card saved successfully!</p>
            <Button variant="outline" onClick={() => { setSaved(false); setLoading(true); supabase.functions.invoke("create-setup-intent").then(({ data }) => { if (data?.clientSecret) { setClientSecret(data.clientSecret); (window as any).__setupClientSecret = data.clientSecret; } setLoading(false); }); }}>
              Add another card
            </Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <div className="text-center space-y-1 pb-2">
              <CreditCard className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Your card details are handled securely by Stripe.</p>
            </div>
            <CardForm onSuccess={() => setSaved(true)} />
          </Elements>
        ) : (
          <p className="text-center text-sm text-destructive">Failed to initialize. Please try again.</p>
        )}
      </div>
    </div>
  );
}
