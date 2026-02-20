import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Shield, Camera, Upload, Loader2, X, CheckCircle, Clock, XCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function IDVerification() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB allowed.", variant: "destructive" });
      return;
    }
    setIdFile(file);
    setIdPreview(URL.createObjectURL(file));
  };

  const uploadId = async () => {
    if (!idFile || !user) return;
    setUploading(true);
    try {
      const ext = idFile.name.split(".").pop();
      const filePath = `${user.id}/id-document.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("id-documents")
        .upload(filePath, idFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("id-documents")
        .getPublicUrl(filePath);

      await supabase
        .from("profiles")
        .update({
          id_document_url: urlData.publicUrl,
          verification_status: "pending",
        })
        .eq("user_id", user.id);

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIdFile(null);
      setIdPreview(null);
      toast({ title: "ID uploaded", description: "Your verification is pending review." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const statusConfig = {
    verified: { icon: CheckCircle, label: "Verified", className: "bg-success/10 text-success border-success/30" },
    pending: { icon: Clock, label: "Pending Review", className: "bg-warning/10 text-warning border-warning/30" },
    rejected: { icon: XCircle, label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/30" },
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
          <h1 className="text-xl font-display font-bold">ID Verification</h1>
          <p className="text-sm text-muted-foreground">Verify your identity</p>
        </div>
      </div>

      {/* Current status */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-5 h-5 ${status === "verified" ? "text-success" : status === "rejected" ? "text-destructive" : "text-warning"}`} />
          <div className="flex-1">
            <p className="font-medium">Verification Status</p>
            <Badge variant="outline" className={statusConfig[status]?.className}>
              {statusConfig[status]?.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Upload section */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Upload a clear photo of your passport or driving license.
        </p>

        {idPreview ? (
          <div className="relative">
            <img src={idPreview} alt="ID Preview" className="w-full rounded-xl object-cover max-h-48" />
            <button
              onClick={() => { setIdFile(null); setIdPreview(null); }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors"
            >
              <Camera className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Take Photo</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Upload File</span>
            </button>
          </div>
        )}

        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
        <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileSelect} />

        {idFile && (
          <Button variant="gold" size="lg" className="w-full" onClick={uploadId} disabled={uploading}>
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : "Submit Document"}
          </Button>
        )}
      </div>
    </div>
  );
}
