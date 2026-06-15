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
import { useLanguage } from "@/i18n/LanguageContext";

interface ReportSellerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reporterProfileId: string;
  sellerProfileId: string;
  sellerName: string;
  listingId?: string;
}

const REASON_VALUES = [
  { value: "fake_listing", key: "rsReasonFake" as const },
  { value: "price_manipulation", key: "rsReasonPrice" as const },
  { value: "non_transferable", key: "rsReasonNT" as const },
  { value: "impersonation", key: "rsReasonImp" as const },
  { value: "off_platform", key: "rsReasonOff" as const },
  { value: "harassment", key: "rsReasonHarass" as const },
  { value: "other", key: "rsReasonOther" as const },
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
  const { t } = useLanguage();
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      if (!reason) throw new Error(t("rsSelectReason"));
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
        title: t("rsSubmitted"),
        description: t("rsSubmittedDesc"),
      });
      setReason("");
      setDetails("");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        title: t("rsFailed"),
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
            {t("rsTitle", { name: sellerName })}
          </DialogTitle>
          <DialogDescription>{t("rsDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="report-reason">{t("rsReason")}</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="report-reason">
                <SelectValue placeholder={t("rsReasonPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {REASON_VALUES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {t(r.key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-details">{t("rsDetails")}</Label>
            <Textarea
              id="report-details"
              placeholder={t("rsDetailsPlaceholder")}
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
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => submit.mutate()}
            disabled={submit.isPending || !reason}
          >
            {submit.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("rsSubmitting")}
              </>
            ) : (
              <>
                <Flag className="w-4 h-4 mr-2" />
                {t("rsSubmit")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
