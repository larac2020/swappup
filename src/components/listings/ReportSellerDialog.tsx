import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Flag, Loader2 } from "lucide-react";

interface ReportSellerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reporterProfileId: string;
  sellerProfileId: string;
  sellerName: string;
  listingId?: string;
}

const REASONS = [
  { value: "fake_listing", label: "Fake or fraudulent listing" },
  { value: "price_manipulation", label: "Suspicious pricing" },
  { value: "non_transferable", label: "Ticket likely not transferable" },
  { value: "impersonation", label: "Impersonation / stolen identity" },
  { value: "off_platform", label: "Asked to pay outside the platform" },
  { value: "harassment", label: "Harassment or abusive behaviour" },
  { value: "other", label: "Other" },
];

export function ReportSellerDialog({
  open,
  onOpenChange,
  reporterProfileId,
  sellerProfileId,
  sellerName,
  listingId,
}: ReportSellerDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      if (!reason) throw new Error("Please select a reason");
      const { error } = await supabase.from("seller_reports").insert({
        reporter_id: reporterProfileId,
        seller_id: sellerProfileId,
        listing_id: listingId ?? null,
        reason,
        details: details.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Report submitted",
        description: "Thanks — our trust & safety team will review it.",
      });
      setReason("");
      setDetails("");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        title: "Could not submit report",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            Report {sellerName}
          </DialogTitle>
          <DialogDescription>
            Help us keep SwappUp safe. Reports are confidential and reviewed by
            our trust &amp; safety team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="report-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="report-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-details">Additional details (optional)</Label>
            <Textarea
              id="report-details"
              placeholder="Describe what happened..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={1000}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submit.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => submit.mutate()}
            disabled={submit.isPending || !reason}
          >
            {submit.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Flag className="w-4 h-4 mr-2" />
                Submit report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
