import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Bell, User, CreditCard, Shield, ChevronRight, ChevronLeft,
  Plane, Loader2, Camera, Upload, Check, X
} from "lucide-react";

type Step = "notifications" | "profile" | "payment" | "verification";

const STEPS: Step[] = ["notifications", "profile", "payment", "verification"];

const stepMeta: Record<Step, { icon: typeof Bell; title: string; description: string }> = {
  notifications: { icon: Bell, title: "Stay in the loop", description: "Get notified about price drops, new listings, and important updates." },
  profile: { icon: User, title: "Your details", description: "Help us personalize your experience." },
  payment: { icon: CreditCard, title: "Payment method", description: "Add a card to buy tickets instantly." },
  verification: { icon: Shield, title: "Verify your identity", description: "Upload your ID to start buying and selling." },
};

export default function Onboarding() {
  const [searchParams] = useSearchParams();
  const initialStep = parseInt(searchParams.get("step") || "0", 10);
  const [currentStep, setCurrentStep] = useState(Math.min(Math.max(initialStep, 0), STEPS.length - 1));
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  // Notification state
  const [notifStatus, setNotifStatus] = useState<"default" | "granted" | "denied" | "unsupported">("default");

  // ID upload
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Payment status from redirect
  const paymentSuccess = searchParams.get("payment") === "success";

  useEffect(() => {
    if (user?.email) setProfileEmail(user.email);
    if (user?.user_metadata?.full_name) setFullName(user.user_metadata.full_name);
  }, [user]);

  useEffect(() => {
    if (!("Notification" in window)) {
      setNotifStatus("unsupported");
    } else {
      setNotifStatus(Notification.permission as "default" | "granted" | "denied");
    }
  }, []);

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const StepIcon = stepMeta[step].icon;

  const requestNotifications = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifStatus(permission as "granted" | "denied" | "default");
    if (permission === "granted") {
      toast({ title: "Notifications enabled!", description: "You'll receive alerts for new deals." });
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone, email: profileEmail })
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Profile saved" });
      goNext();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const setupPayment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-setup-intent");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

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

      toast({ title: "ID uploaded", description: "Your identity verification is pending review." });
      finishOnboarding();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));
  const skip = () => {
    if (currentStep === STEPS.length - 1) {
      finishOnboarding();
    } else {
      goNext();
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem("flyswap_onboarding_complete", "true");
    navigate("/home");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
              <Plane className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">
              <span className="gradient-text">Fly</span>Swap
            </span>
          </div>
          <button onClick={skip} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Skip
          </button>
        </div>
        <Progress value={progress} className="h-1.5" />
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6 flex flex-col">
        <div className="animate-fade-in flex-1 flex flex-col" key={step}>
          {/* Step header */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
              <StepIcon className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold">{stepMeta[step].title}</h1>
            <p className="text-muted-foreground text-sm">{stepMeta[step].description}</p>
          </div>

          {/* Step content */}
          <div className="flex-1">
            {step === "notifications" && (
              <div className="space-y-6">
                <div className="glass rounded-2xl p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center shrink-0">
                      <Bell className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Price drop alerts</h3>
                      <p className="text-sm text-muted-foreground">Know instantly when a ticket you want drops in price.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Sale updates</h3>
                      <p className="text-sm text-muted-foreground">Get notified when someone buys your tickets.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Security alerts</h3>
                      <p className="text-sm text-muted-foreground">Stay informed about account activity.</p>
                    </div>
                  </div>
                </div>

                {notifStatus === "granted" ? (
                  <div className="flex items-center gap-2 justify-center text-success">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Notifications enabled</span>
                  </div>
                ) : notifStatus === "denied" ? (
                  <p className="text-center text-sm text-muted-foreground">
                    Notifications were blocked. You can enable them in your browser settings.
                  </p>
                ) : notifStatus === "unsupported" ? (
                  <p className="text-center text-sm text-muted-foreground">
                    Your browser doesn't support notifications.
                  </p>
                ) : (
                  <Button variant="gold" size="lg" className="w-full" onClick={requestNotifications}>
                    Enable Notifications
                  </Button>
                )}
              </div>
            )}

            {step === "profile" && (
              <div className="glass rounded-2xl p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="h-12 bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="h-12 bg-secondary/50 border-border/50"
                  />
                </div>
              </div>
            )}

            {step === "payment" && (
              <div className="space-y-6">
                {paymentSuccess ? (
                  <div className="glass rounded-2xl p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                      <Check className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-xl font-semibold">Payment method added!</h3>
                    <p className="text-muted-foreground text-sm">You're all set to buy tickets instantly.</p>
                  </div>
                ) : (
                  <div className="glass rounded-2xl p-6 space-y-6">
                    <div className="text-center space-y-2">
                      <CreditCard className="w-12 h-12 text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        You'll be redirected to a secure page to add your card. No charges will be made.
                      </p>
                    </div>
                    <Button variant="gold" size="lg" className="w-full" onClick={setupPayment} disabled={loading}>
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</> : "Add Payment Method"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step === "verification" && (
              <div className="space-y-6">
                <div className="glass rounded-2xl p-6 space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Upload a clear photo of your passport or driving license. This helps keep our marketplace safe.
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

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom actions */}
          <div className="space-y-3 mt-6">
            {step === "profile" && (
              <Button variant="gold" size="lg" className="w-full" onClick={saveProfile} disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save & Continue"}
              </Button>
            )}
            {step === "notifications" && notifStatus !== "default" && (
              <Button variant="gold" size="lg" className="w-full" onClick={goNext}>
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {step === "payment" && paymentSuccess && (
              <Button variant="gold" size="lg" className="w-full" onClick={goNext}>
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {step === "verification" && idFile && (
              <Button variant="gold" size="lg" className="w-full" onClick={uploadId} disabled={uploading}>
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : "Submit & Finish"}
              </Button>
            )}
            {step === "verification" && !idFile && (
              <Button variant="gold" size="lg" className="w-full" onClick={finishOnboarding}>
                Finish Setup
              </Button>
            )}

            {currentStep > 0 && (
              <Button variant="ghost" size="lg" className="w-full text-muted-foreground" onClick={goBack}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
