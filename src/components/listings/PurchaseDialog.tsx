import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, ShieldCheck, User, Mail, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: any;
  buyerProfileId: string;
  nameChangeFee: number;
}

export default function PurchaseDialog({ open, onOpenChange, listing, buyerProfileId, nameChangeFee }: PurchaseDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [escrowAccepted, setEscrowAccepted] = useState(false);

  const ticketPrice = Number(listing.price);
  const totalPrice = ticketPrice + nameChangeFee;

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const transferDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from("purchases").insert({
        buyer_id: buyerProfileId,
        seller_id: listing.seller_id,
        listing_id: listing.id,
        quantity: 1,
        total_price: totalPrice,
        status: "pending_transfer",
        escrow_status: "held",
        escrow_deadline: transferDeadline,
        buyer_full_name: fullName.trim(),
        buyer_email: email.trim(),
        name_change_fee: nameChangeFee,
        transfer_deadline: transferDeadline,
        original_booking_ref: listing.flight_number || null,
      });
      if (error) throw error;

      // Create notification for seller
      const { data: sellerProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("id", listing.seller_id)
        .single();

      if (sellerProfile) {
        await supabase.from("notifications").insert({
          user_id: sellerProfile.user_id,
          title: "New Sale — Action Required",
          message: `Your listing "${listing.title}" has been purchased. You have 24 hours to complete the name change and confirm the transfer.`,
          type: "sale",
          listing_id: listing.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      onOpenChange(false);
      setFullName("");
      setEmail("");
      setPrivacyAccepted(false);
      setEscrowAccepted(false);
      toast({
        title: "Purchase submitted!",
        description: "Payment is held in escrow. The seller has 24 hours to complete the name change.",
      });
    },
    onError: (error: any) => {
      toast({ title: "Purchase failed", description: error.message, variant: "destructive" });
    },
  });

  const isValid = fullName.trim().length >= 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && privacyAccepted && escrowAccepted;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/60 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Complete Your Purchase
          </DialogTitle>
          <DialogDescription>
            Your payment will be held in escrow until the seller confirms the name change on the ticket.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Price Breakdown */}
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ticket price</span>
              <span className="font-medium">€{ticketPrice.toFixed(2)}</span>
            </div>
            {nameChangeFee > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Name change fee ({listing.airline})</span>
                <span className="font-medium">€{nameChangeFee.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-border/50 pt-3 flex items-center justify-between">
              <span className="font-semibold">Total (held in escrow)</span>
              <span className="text-xl font-bold text-primary">€{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Your Details for Name Change
            </h3>

            <div className="space-y-2">
              <Label htmlFor="buyer-name">Full Name (as per official documents)</Label>
              <Input
                id="buyer-name"
                placeholder="e.g. John Michael Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-secondary/50"
              />
              <p className="text-xs text-muted-foreground">This exact name will be used for the ticket name change.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyer-email" className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                Contact Email
              </Label>
              <Input
                id="buyer-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary/50"
              />
            </div>

            {/* Privacy Disclaimer */}
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-destructive">Privacy Notice</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your name and email will be shared with the seller to complete the name change on the booking. 
                    The platform is not responsible for any misuse of this information by the seller. 
                    By proceeding, you acknowledge and accept this risk.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="privacy-accept"
                  checked={privacyAccepted}
                  onCheckedChange={(c) => setPrivacyAccepted(c === true)}
                />
                <label htmlFor="privacy-accept" className="text-xs text-muted-foreground cursor-pointer">
                  I understand and accept the privacy risks
                </label>
              </div>
            </div>

            {/* Escrow Terms */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="escrow-accept"
                  checked={escrowAccepted}
                  onCheckedChange={(c) => setEscrowAccepted(c === true)}
                />
                <label htmlFor="escrow-accept" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                  I agree that my payment of <strong>€{totalPrice.toFixed(2)}</strong> will be held in escrow until the seller confirms 
                  the name change. If not completed within 24 hours, I will receive a full refund.
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              className="flex-1 gap-2"
              disabled={!isValid || purchaseMutation.isPending}
              onClick={() => purchaseMutation.mutate()}
            >
              {purchaseMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Pay €{totalPrice.toFixed(2)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
