import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import swappupLogo from "@/assets/swappup-logo.png";

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
  const [checkingEmail, setCheckingEmail] = useState(false);
  const { toast } = useToast();

  // Check if email exists on blur (signup mode only)
  const checkEmailExists = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck || mode !== "signup") return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToCheck)) return;

    setCheckingEmail(true);
    try {
      // Attempt signup with a dummy password to check if user exists
      // Supabase returns a specific error for existing users
      const { data, error } = await supabase.auth.signUp({
        email: emailToCheck,
        password: "check_only_dummy_pw_123!",
        options: { emailRedirectTo: "https://dummy.test" },
      });
      
      // If user already exists, Supabase returns the user with identities = []
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setEmailExists(true);
      } else if (error && (error.message?.includes("already registered") || (error as any).code === "user_already_exists")) {
        setEmailExists(true);
      } else {
        setEmailExists(false);
        // Clean up the dummy signup - it won't be verified so it's harmless
      }
    } catch {
      setEmailExists(false);
    } finally {
      setCheckingEmail(false);
    }
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
        if (password.length < 6) {
          toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) {
          if (error.message?.includes("already registered") || (error as any).code === "user_already_exists") {
            setEmailExists(true);
            return;
          }
          throw error;
        }

        // Check if email confirmation is needed
        if (data?.user && !data.session) {
          toast({
            title: "Verify your email",
            description: "We've sent a verification link to your email. Please check your inbox.",
          });
        } else {
          toast({
            title: "Account created!",
            description: "Welcome to SwappUp.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
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
                onBlur={() => mode === "signup" && checkEmailExists(email)}
                className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                required
              />
              {checkingEmail && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
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
                  minLength={6}
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

          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full"
            disabled={loading || (mode === "signup" && emailExists === true)}
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

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <a href="#" className="text-primary hover:underline">Terms of Service</a>
          {" "}and{" "}
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
