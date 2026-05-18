import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Check } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import swappupLogo from "@/assets/swappup-logo.png";
import { useLanguage } from "@/i18n/LanguageContext";
import { TERMS_VERSION, PRIVACY_VERSION } from "@/content/legal/version";

type AuthMode = "login" | "signup" | "forgot";

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [resending, setResending] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleResendVerification = async () => {
    if (!email) {
      toast({ title: "Enter your email", description: "Please enter your email above first.", variant: "destructive" });
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth` },
      });
      if (error) throw error;
      toast({
        title: "Verification email sent",
        description: `We've sent a new verification link to ${email}.`,
      });
      setNeedsVerification(true);
    } catch (error: any) {
      toast({ title: "Couldn't resend", description: error.message, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNeedsVerification(false);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({
          title: "Reset link sent",
          description: "Check your email for a password reset link.",
        });
        return;
      }

      if (mode === "signup") {
        if (password !== confirmPassword) {
          toast({ title: "Passwords don't match", description: "Please make sure both passwords are the same.", variant: "destructive" });
          return;
        }
        if (password.length < 8) {
          toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: "destructive" });
          return;
        }
        if (!/[A-Za-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
          toast({
            title: "Password requirements not met",
            description: "Password must contain at least one letter, one number, and one special character.",
            variant: "destructive",
          });
          return;
        }
        if (!legalAccepted) {
          toast({ title: t("error"), description: t("legalMustAccept"), variant: "destructive" });
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });

        if (error) {
          if (error.message?.includes("already registered") || (error as any).code === "user_already_exists") {
            setEmailExists(true);
            return;
          }
          const code = (error as any).code;
          const lower = (error.message || "").toLowerCase();
          if (code === "weak_password" || lower.includes("weak") || lower.includes("password should")) {
            toast({
              title: "Password requirements not met",
              description: "Password must be at least 8 characters and include a letter, a number, and a special character.",
              variant: "destructive",
            });
            return;
          }
          throw error;
        }

        // Ensure a fresh signup always goes through the onboarding flow
        localStorage.removeItem("flyswap_onboarding_complete");

        // Email verification is required — no session is returned until confirmed
        if (data?.user && !data.session) {
          toast({
            title: "Check your inbox",
            description: "We've sent a verification link to your email. Click it to activate your account.",
          });
          // Reset form back to login mode so they can sign in after verifying
          setMode("login");
          setPassword("");
          setConfirmPassword("");
        } else {
          toast({
            title: "Account created!",
            description: "Welcome to SwappUp.",
          });
        }

        // Record accepted versions on the user's profile (created by handle_new_user trigger)
        if (data?.user) {
          const now = new Date().toISOString();
          await supabase
            .from("profiles")
            .update({
              terms_accepted_version: TERMS_VERSION,
              terms_accepted_at: now,
              privacy_accepted_version: PRIVACY_VERSION,
              privacy_accepted_at: now,
            })
            .eq("user_id", data.user.id);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          const msg = (error.message || "").toLowerCase();
          if (
            msg.includes("email not confirmed") ||
            msg.includes("not verified") ||
            (error as any).code === "email_not_confirmed"
          ) {
            // Defensive: ensure no partial session is kept
            await supabase.auth.signOut();
            setNeedsVerification(true);
            return;
          }
          throw error;
        }
        // Belt-and-braces: if somehow a session exists without a confirmed email, block it.
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user && !userData.user.email_confirmed_at) {
          await supabase.auth.signOut();
          setNeedsVerification(true);
          return;
        }
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo & Header */}
        <div className="text-center space-y-4">
          <img
            src={swappupLogo}
            alt="SwappUp"
            className="mx-auto h-24 w-auto"
          />
          <p className="text-muted-foreground">
            {mode === "login"
              ? "Welcome back. Sign in to continue."
              : mode === "forgot"
              ? "Enter your email to receive a reset link."
              : "Create an account to start trading tickets."}
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-5">
          {needsVerification && mode !== "forgot" && (
            <div className="rounded-xl bg-warning/10 border border-warning/30 p-4 space-y-3 animate-fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Verify your email to continue</p>
                  <p className="text-xs text-muted-foreground">
                    We sent a verification link to <span className="text-foreground">{email}</span>. You need to confirm it before you can sign in or buy and sell on swappup.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="gold"
                size="sm"
                className="w-full"
                onClick={handleResendVerification}
                disabled={resending}
              >
                {resending ? "Sending..." : "Resend verification email"}
              </Button>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailExists(null); }}
                className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                required
              />
            </div>

            {/* Email exists prompt */}
            {mode === "signup" && emailExists && (
              <div className="rounded-xl bg-warning/10 border border-warning/30 p-4 space-y-3 animate-fade-in">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">This email is already registered.</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="gold"
                    size="sm"
                    className="flex-1"
                    onClick={() => setMode("login")}
                  >
                    Log In
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setMode("forgot")}
                  >
                    Forgot Password
                  </Button>
                </div>
              </div>
            )}
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                  required
                  minLength={mode === "signup" ? 8 : 6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 pr-10 h-12 bg-secondary/50 border-border/50 focus:border-primary ${
                    confirmPassword && password !== confirmPassword ? "border-destructive" : ""
                  }`}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords don't match</p>
              )}
            </div>
          )}

          {mode === "signup" && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
              <Checkbox
                checked={legalAccepted}
                onCheckedChange={(c) => setLegalAccepted(c === true)}
                className="mt-0.5"
              />
              <span className="leading-relaxed">
                I have read and accept the{" "}
                <Link to="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link to="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>
              </span>
            </label>
          )}

          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full"
            disabled={loading || (mode === "signup" && (emailExists === true || !legalAccepted))}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === "forgot" ? "Sending..." : mode === "login" ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              mode === "forgot" ? "Send Reset Link" : mode === "login" ? "Sign In" : "Create Account"
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Google Sign In */}
        <Button
          variant="outline"
          size="lg"
          className="w-full h-12"
          onClick={async () => {
            const { error } = await lovable.auth.signInWithOAuth("google", {
              redirect_uri: window.location.origin,
            });
            if (error) {
              toast({ title: "Error", description: error.message, variant: "destructive" });
            }
          }}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>

        {/* Toggle Auth Mode */}
        <div className="text-center">
          <p className="text-muted-foreground">
            {mode === "forgot" ? (
              <>
                Remember your password?{" "}
                <button type="button" onClick={() => setMode("login")} className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Sign in
                </button>
              </>
            ) : mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button type="button" onClick={() => { setMode("signup"); setEmailExists(null); }} className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => setMode("login")} className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Resend verification email */}
        {mode !== "forgot" && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending}
              className="text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-60"
            >
              {resending ? "Sending..." : "Didn't get the email? Resend verification link"}
            </button>
          </div>
        )}

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
          {" "}and{" "}
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
