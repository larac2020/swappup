import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import swappupLogo from "@/assets/swappup-logo.png";
import { useLanguage } from "@/i18n/LanguageContext";
import { TERMS_VERSION, PRIVACY_VERSION } from "@/content/legal/version";
import { PasswordChecklist, allCriteriaMet } from "@/components/auth/PasswordChecklist";

type AuthMode = "login" | "signup" | "forgot";

interface AuthFormProps {
  initialMode?: "login" | "signup";
}

export function AuthForm({ initialMode = "login" }: AuthFormProps = {}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
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
      toast({ title: t("authEnterEmailTitle"), description: t("authEnterEmailDesc"), variant: "destructive" });
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      toast({
        title: t("authVerifyEmailSentTitle"),
        description: t("authVerifyEmailSentDesc", { email }),
      });
      setNeedsVerification(true);
    } catch (error: any) {
      toast({ title: t("authCouldntResend"), description: error.message, variant: "destructive" });
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
          title: t("authResetSentTitle"),
          description: t("authResetSentDesc"),
        });
        return;
      }

      if (mode === "signup") {
        if (password !== confirmPassword) {
          toast({ title: t("authPwMismatchTitle"), description: t("authPwMismatchDesc"), variant: "destructive" });
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
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          if (error.message?.includes("already registered") || (error as any).code === "user_already_exists") {
            setEmailExists(true);
            return;
          }
          throw error;
        }

        // Ensure a fresh signup always goes through the onboarding flow
        localStorage.removeItem("flyswap_onboarding_complete");

        // Email verification is required — no session is returned until confirmed
        if (data?.user && !data.session) {
          toast({
            title: t("authCheckInboxTitle"),
            description: t("authCheckInboxDesc"),
          });
          // Reset form back to login mode so they can sign in after verifying
          setMode("login");
          setPassword("");
          setConfirmPassword("");
        } else {
          toast({
            title: t("authAccountCreatedTitle"),
            description: t("authAccountCreatedDesc"),
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
          title: t("authWelcomeBackTitle"),
          description: t("authWelcomeBackDesc"),
        });
      }
    } catch (error: any) {
      toast({
        title: t("error"),
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
              ? t("authSubtitleLogin")
              : mode === "forgot"
              ? t("authSubtitleForgot")
              : t("authSubtitleSignup")}
          </p>
        </div>

        {/* Mode tabs (hidden in forgot mode) */}
        {mode !== "forgot" && (
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-secondary/50 border border-border/50">
            <button
              type="button"
              onClick={() => { setMode("login"); setEmailExists(null); setNeedsVerification(false); }}
              className={`h-10 rounded-lg text-sm font-medium transition-colors ${
                mode === "login" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("authTabSignIn")}
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setEmailExists(null); setNeedsVerification(false); }}
              className={`h-10 rounded-lg text-sm font-medium transition-colors ${
                mode === "signup" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("authTabSignUp")}
            </button>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-5">
          {needsVerification && mode !== "forgot" && (
            <div className="rounded-xl bg-warning/10 border border-warning/30 p-4 space-y-3 animate-fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{t("authVerifyEmailTitle")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("authVerifyEmailContinueDesc", { email })}
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
                {resending ? t("authResendSending") : t("authResendBtn")}
              </Button>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">{t("authEmailLabel")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder={t("authEmailPlaceholder")}
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
                  <p className="text-sm text-foreground">{t("authEmailAlreadyRegistered")}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="gold"
                    size="sm"
                    className="flex-1"
                    onClick={() => setMode("login")}
                  >
                    {t("authLogIn")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setMode("forgot")}
                  >
                    {t("authForgotPasswordBtn")}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">{t("authPwLabel")}</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    {t("authForgotLink")}
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
              {mode === "signup" && (
                <PasswordChecklist password={password} className="pt-1" />
              )}
            </div>
          )}

          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">{t("authConfirmPwLabel")}</Label>
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
                <p className="text-xs text-destructive">{t("authPwMismatchInline")}</p>
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
                {t("authIHaveRead")}{" "}
                <Link to="/terms-and-conditions" target="_blank" className="text-primary hover:underline">{t("authTosLink")}</Link>
                {" "}{t("authAnd")}{" "}
                <Link to="/privacy-policy" target="_blank" className="text-primary hover:underline">{t("authPrivacyLink")}</Link>
              </span>
            </label>
          )}

          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full"
            disabled={
              loading ||
              (mode === "signup" && (emailExists === true || !legalAccepted))
            }
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === "forgot" ? t("authSending") : mode === "login" ? t("authSigningIn") : t("authCreating")}
              </>
            ) : (
              mode === "forgot" ? t("authSendResetLink") : mode === "login" ? t("authSignInCta") : t("authCreateAccountCta")
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs text-muted-foreground">{t("authOr")}</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Google Sign In */}
        <Button
          variant="outline"
          size="lg"
          className="w-full h-12"
          onClick={async () => {
            const { error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${window.location.origin}/`,
                queryParams: {
                  access_type: "offline",
                  prompt: "select_account",
                },
              },
            });
            if (error) {
              toast({ title: t("error"), description: error.message, variant: "destructive" });
            }
          }}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t("authContinueGoogle")}
        </Button>

        {/* Toggle Auth Mode */}
        <div className="text-center">
          <p className="text-muted-foreground">
            {mode === "forgot" ? (
              <>
                {t("authRememberPw")}{" "}
                <button type="button" onClick={() => setMode("login")} className="text-primary hover:text-primary/80 font-medium transition-colors">
                  {t("authSignInLink")}
                </button>
              </>
            ) : null}
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
              {resending ? t("authResendSending") : t("authResendInline")}
            </button>
          </div>
        )}

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground">
          {t("authFooterTerms")}{" "}
          <Link to="/terms-and-conditions" className="text-primary hover:underline">{t("authTosLink")}</Link>
          {" "}{t("authAnd")}{" "}
          <Link to="/privacy-policy" className="text-primary hover:underline">{t("authPrivacyLink")}</Link>
        </p>
      </div>
    </div>
  );
}
