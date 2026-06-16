import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Shield, Camera, Upload, Loader2, X, CheckCircle, Clock, XCircle, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";

export default function IDVerification() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: t("idFileTooLarge"), description: t("idFileTooLargeDesc"), variant: "destructive" });
      return;
    }
    setIdFile(file);
    setIdPreview(URL.createObjectURL(file));
    setVerifyResult(null);
  };

  const uploadAndVerifyId = async () => {
    if (!idFile || !user) return;
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(idFile);
      });

      // AI verification
      const { data: aiResult, error: aiError } = await supabase.functions.invoke("verify-id", {
        body: { image: base64, profileName: profile?.full_name || "" },
      });
      if (aiError) throw aiError;

      const verification = aiResult?.verification;
      setVerifyResult(verification);

      if (!verification?.is_valid_id || !verification?.appears_genuine) {
        toast({
          title: t("idDocumentNotAccepted"),
          description: verification?.reason || "Please upload a valid identity document.",
          variant: "destructive",
        });
        return;
      }

      if (verification?.name_matches_profile === false) {
        toast({
          title: t("idNameMismatch"),
          description: `The name on the document ("${verification.extracted_name || "unknown"}") does not match your profile name ("${profile?.full_name || "not set"}"). Please update your Personal Information first.`,
          variant: "destructive",
        });
        return;
      }

      // Upload to storage
      const ext = idFile.name.split(".").pop();
      const filePath = `${user.id}/id-document.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("id-documents").upload(filePath, idFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("id-documents").getPublicUrl(filePath);

      await supabase.from("profiles").update({
        id_document_url: urlData.publicUrl,
        verification_status: "verified",
      }).eq("user_id", user.id);

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIdFile(null);
      setIdPreview(null);
      toast({ title: t("idVerifiedToast"), description: `${verification.document_type} accepted.` });
      navigate("/account");
    } catch (err: any) {
      toast({ title: t("idVerificationFailed"), description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const statusConfig = {
    verified: { icon: CheckCircle, label: t("idVerified"), className: "bg-success/10 text-success border-success/30" },
    pending: { icon: Clock, label: t("idPending"), className: "bg-warning/10 text-warning border-warning/30" },
    rejected: { icon: XCircle, label: t("idRejected"), className: "bg-destructive/10 text-destructive border-destructive/30" },
  };

  const status = (profile?.verification_status as keyof typeof statusConfig) || "pending";
  const StatusIcon = statusConfig[status]?.icon || Clock;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/account")} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold">{t("idTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("idDesc")}</p>
        </div>
      </div>

      {/* Current status */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-5 h-5 ${status === "verified" ? "text-success" : status === "rejected" ? "text-destructive" : "text-warning"}`} />
          <div className="flex-1">
            <p className="font-medium">{t("idStatus")}</p>
            <Badge variant="outline" className={statusConfig[status]?.className}>
              {statusConfig[status]?.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Upload section */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <Alert className="bg-accent/50 border-accent">
          <Info className="w-4 h-4" />
          <AlertDescription className="text-sm">
            {t("idNameMustMatch")}
          </AlertDescription>
        </Alert>

        <p className="text-sm text-muted-foreground text-center">
          {t("idUploadDesc")}
        </p>

        {idPreview ? (
          <div className="relative">
            <img src={idPreview} alt="ID Preview" className="w-full max-h-[70vh] rounded-xl object-contain bg-secondary/40" />
            <button
              onClick={() => { setIdFile(null); setIdPreview(null); setVerifyResult(null); }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors">
              <Camera className="w-8 h-8 text-muted-foreground" /><span className="text-sm text-muted-foreground">{t("idTakePhoto")}</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground" /><span className="text-sm text-muted-foreground">{t("idUploadFile")}</span>
            </button>
          </div>
        )}

        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
        <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileSelect} />

        {verifyResult && !verifyResult.is_valid_id && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm">{verifyResult.reason || "This doesn't appear to be a valid ID document."}</p>
          </div>
        )}

        {verifyResult && verifyResult.is_valid_id && verifyResult.name_matches_profile === false && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm">
              Name mismatch: the document shows "<strong>{verifyResult.extracted_name}</strong>" but your profile name is "<strong>{profile?.full_name || "not set"}</strong>". Please update your Personal Information first.
            </p>
          </div>
        )}

        {idFile && (
          <Button variant="gold" size="lg" className="w-full" onClick={uploadAndVerifyId} disabled={uploading}>
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("idVerifying")}</> : t("idVerifySubmit")}
          </Button>
        )}
      </div>
    </div>
  );
}
