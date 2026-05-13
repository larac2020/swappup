import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Clock, User, Plane, AlertTriangle, Upload, FileCheck2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface TransferConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: any;
}

export default function TransferConfirmation({ open, onOpenChange, purchase }: TransferConfirmationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Pre-populate with original booking ref and buyer's surname
  const buyerSurname = purchase?.buyer_full_name?.split(" ").pop() || "";
  const [bookingRef, setBookingRef] = useState(purchase?.original_booking_ref || "");
  const [surname, setSurname] = useState(buyerSurname);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!proofFile) throw new Error("Please upload a payment confirmation for the name change fee.");
      const maxBytes = 8 * 1024 * 1024;
      if (proofFile.size > maxBytes) throw new Error("File too large (max 8MB).");
      const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
      if (!allowed.includes(proofFile.type)) throw new Error("Unsupported file type. Use PNG, JPG, WEBP or PDF.");

      setUploading(true);
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not authenticated");
      const ext = proofFile.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${uid}/${purchase.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("transfer-proofs")
        .upload(path, proofFile, { upsert: false, contentType: proofFile.type });
      setUploading(false);
      if (upErr) throw upErr;

      const { error } = await supabase
        .from("purchases")
        .update({
          transfer_booking_ref: bookingRef.trim(),
          transfer_surname: surname.trim(),
          transfer_confirmed_at: new Date().toISOString(),
          status: "transfer_confirmed",
          escrow_status: "pending_release",
          seller_transferred: true,
          transfer_payment_proof_url: path,
          // Buyer has 48h from this moment to verify the booking and release payment.
          // After that the system will auto-cancel the sale and notify both parties.
          escrow_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", purchase.id);
      if (error) throw error;

      // Notify buyer
      const { data: buyerProfile } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .eq("id", purchase.buyer_id)
        .single();

      if (buyerProfile) {
        await supabase.functions.invoke("send-notification", {
          body: {
            user_id: buyerProfile.user_id,
            title: "Transfer confirmed — please verify your ticket",
            message: `The seller has confirmed the name change and uploaded a payment proof. Booking ref: ${bookingRef.trim()}. Surname: ${surname.trim()}. Open your purchases to verify and release payment.`,
            type: "transfer_confirmed",
            listing_id: purchase.listing_id,
          },
        });

        // Email 4 — buyer verification needed
        const recipient = buyerProfile.email || purchase.buyer_email;
        if (recipient) {
          const { data: listing } = await supabase
            .from("listings")
            .select("origin_city, origin_country, destination_city, destination_country, departure_date, airline, flight_number")
            .eq("id", purchase.listing_id)
            .single();
          const { data: sellerProfile } = await supabase
            .from("profiles").select("full_name").eq("id", purchase.seller_id).single();
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "transfer-confirmed-buyer-verify",
              recipientEmail: recipient,
              idempotencyKey: `buyer-verify-${purchase.id}`,
              templateData: {
                buyerName: (purchase.buyer_full_name || buyerProfile.full_name || "").split(" ")[0],
                newBookingRef: bookingRef.trim(),
                surname: surname.trim(),
                trip: listing ? {
                  origin: `${listing.origin_city}${listing.origin_country ? `, ${listing.origin_country}` : ""}`,
                  destination: `${listing.destination_city}${listing.destination_country ? `, ${listing.destination_country}` : ""}`,
                  departureDate: listing.departure_date,
                  airline: listing.airline,
                  flightNumber: listing.flight_number,
                } : undefined,
              },
            },
          }).catch((e) => console.error("email buyer-verify failed", e));
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mySales"] });
      onOpenChange(false);
      toast({
        title: "Transfer confirmed!",
        description: "The buyer has been notified with the ticket details. Payment will be released shortly.",
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!purchase) return null;

  const deadline = purchase.transfer_deadline ? new Date(purchase.transfer_deadline) : null;
  const isExpired = deadline && deadline < new Date();
  const hoursLeft = deadline ? Math.max(0, Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60))) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/60 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Plane className="w-5 h-5 text-primary" />
            Confirm Name Change Transfer
          </DialogTitle>
          <DialogDescription>
            Complete the name change and submit the updated booking details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Deadline Warning */}
          <div className={`rounded-xl p-3 flex items-center gap-3 ${isExpired ? "bg-destructive/10 border border-destructive/30" : "bg-warning/10 border border-warning/30"}`}>
            <Clock className={`w-5 h-5 shrink-0 ${isExpired ? "text-destructive" : "text-warning"}`} />
            <div>
              <p className={`text-sm font-medium ${isExpired ? "text-destructive" : "text-warning"}`}>
                {isExpired ? "Deadline expired" : `${hoursLeft}h remaining`}
              </p>
              <p className="text-xs text-muted-foreground">
                {isExpired
                  ? "The transfer deadline has passed. The buyer may request a refund."
                  : `Deadline: ${deadline ? format(deadline, "MMM d, yyyy HH:mm") : "N/A"}`}
              </p>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="glass rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Buyer Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Full Name</span>
                <span className="font-medium text-sm">{purchase.buyer_full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="font-medium text-sm">{purchase.buyer_email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Name Change Fee</span>
                <span className="font-medium text-sm text-primary">€{Number(purchase.name_change_fee).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Transfer Details Form */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Updated Booking Details</h3>

            <div className="space-y-2">
              <Label htmlFor="booking-ref">New Booking Reference</Label>
              <Input
                id="booking-ref"
                placeholder="e.g. ABC123"
                value={bookingRef}
                onChange={(e) => setBookingRef(e.target.value)}
                className="bg-secondary/50 font-mono"
              />
              <p className="text-xs text-muted-foreground">The booking reference after the name change has been completed.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="surname">Surname for Ticket Access</Label>
              <Input
                id="surname"
                placeholder="e.g. Smith"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="bg-secondary/50"
              />
              <p className="text-xs text-muted-foreground">Pre-filled with the buyer's surname. Adjust only if the airline used a different format.</p>
            </div>
          </div>

          {/* Payment proof upload */}
          <div className="space-y-2">
            <Label htmlFor="payment-proof" className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-primary" />
              Payment Confirmation (required)
            </Label>
            <div className="glass rounded-xl p-3 border border-border/60 space-y-2">
              <p className="text-xs text-muted-foreground">
                Upload a screenshot or PDF receipt from the airline confirming you paid the name-change fee
                (€{Number(purchase.name_change_fee).toFixed(2)}). This protects the buyer and is required to release escrow.
              </p>
              <Input
                id="payment-proof"
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="bg-secondary/50 file:text-foreground"
              />
              {proofFile && (
                <p className="text-xs text-primary flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {proofFile.name} ({(proofFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
          </div>

          {/* Validation Info */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              By confirming, you certify the name change has been completed with the airline, the booking is
              accessible using the details above, and the uploaded receipt is genuine. False or fabricated
              proofs may lead to refunds, account suspension, and legal action.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              className="flex-1 gap-2"
              disabled={!bookingRef.trim() || !surname.trim() || !proofFile || isExpired || confirmMutation.isPending || uploading}
              onClick={() => confirmMutation.mutate()}
            >
              {(confirmMutation.isPending || uploading) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {uploading ? "Uploading proof…" : "Confirm Transfer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
