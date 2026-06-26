import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, ShieldCheck, Wallet, Sparkles, BadgeCheck, Play, Pause, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { landingContent, marketingMeta } from "@/i18n/marketingContent";
import { PhoneMock } from "@/components/marketing/PhoneMock";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import swappupLogo from "@/assets/swappup-logo.png";

export default function Landing() {
  const { locale } = useLanguage();
  const c = landingContent[locale];
  const meta = marketingMeta.landing;
  const icons = [Sparkles, ShieldCheck, BadgeCheck, Wallet];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useAuth();

  // If a signed-in user lands on "/" (e.g. after a mobile Google OAuth full-page
  // redirect back to window.location.origin), route them to the right app page.
  useEffect(() => {
    if (loading || !isAuthenticated || !user) return;
    let cancelled = false;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, address_line1")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const onboardingDone = localStorage.getItem("flyswap_onboarding_complete");
      const profileLooksSetUp = !!(profile?.full_name && profile?.address_line1);
      navigate(onboardingDone && profileLooksSetUp ? "/home" : "/onboarding", { replace: true });
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, loading, user, navigate]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };
  return (
    <MarketingLayout>
      <Helmet>
        <html lang={locale} />
        <title>{meta.title[locale]}</title>
        <meta name="description" content={meta.description[locale]} />
        <link rel="canonical" href="https://swappup.com/" />
        <meta property="og:title" content={meta.title[locale]} />
        <meta property="og:description" content={meta.ogDescription[locale]} />
        <meta property="og:url" content="https://swappup.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={locale === "it" ? "it_IT" : "en_GB"} />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="flex justify-center">
              <img
                src={swappupLogo}
                alt="Swappup"
                className="h-10 w-auto sm:h-12 md:h-14"
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              {c.heroTitle1} <span className="text-primary">{c.heroTitle2}</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground whitespace-pre-line">{c.heroSubtitle}</p>
            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <Button asChild variant="gold" size="lg" className="min-w-44">
                <Link to="/sign-up">
                  {c.ctaGetStarted}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-44">
                <Link to="/login">{c.ctaHaveAccount}</Link>
              </Button>
            </div>
          </div>

          {/* Product screens */}
          <div className="mt-16 grid gap-10 sm:grid-cols-2 sm:gap-6">
            <PhoneMock kind="browse" locale={locale} caption={c.browseCaption} />
            <PhoneMock kind="sell" locale={locale} caption={c.sellCaption} />
          </div>
        </div>
      </section>

      {/* Demo video */}
      <section className="border-t border-border/50 bg-secondary/10">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{c.demoEyebrow}</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{c.demoTitle}</h2>
            <p className="text-muted-foreground whitespace-pre-line">{c.demoSubtitle}</p>
          </div>
          <div className="relative mt-10 overflow-hidden rounded-3xl border border-border/50 bg-background shadow-2xl shadow-primary/10">
            <video
              ref={videoRef}
              key={locale}
              className="block w-full cursor-pointer"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onClick={togglePlay}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={`/videos/swappup-demo-${locale}.mp4?v=9`} type="video/mp4" />
            </video>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause video" : "Play video"}
              className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm ring-1 ring-border/60 transition hover:bg-background"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
            </button>
          </div>
        </div>
      </section>

      {/* Value */}
      <section className="border-t border-border/50 bg-secondary/20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid items-start gap-12 md:grid-cols-2">
            <div className="space-y-5">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{c.sellTitle}</h2>
              <p className="text-muted-foreground leading-relaxed">{c.sellBody}</p>
              <ul className="space-y-3 text-sm">
                {c.sellBullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-5">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{c.buyTitle}</h2>
              <p className="text-muted-foreground leading-relaxed">{c.buyBody}</p>
              <ul className="space-y-3 text-sm">
                {c.buyBullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* USPs */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{c.whyTitle}</h2>
            <p className="text-muted-foreground">{c.whySubtitle}</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {c.why.map(({ title, body }, idx) => {
              const Icon = icons[idx];
              return (
                <div key={title} className="glass rounded-2xl border border-border/50 p-6 space-y-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Get the app */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="space-y-5 text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Smartphone className="h-3.5 w-3.5" />
                {locale === "it" ? "Disponibile su mobile" : "Available on mobile"}
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {locale === "it" ? "Scarica l'app Swappup" : "Get the Swappup app"}
              </h2>
              <p className="text-muted-foreground">
                {locale === "it"
                  ? "Cerca, vendi e acquista biglietti aerei direttamente dal tuo telefono. Inquadra il QR code per installare l'app."
                  : "Search, sell and buy flight tickets right from your phone. Scan the QR code to install the app."}
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row md:items-start md:justify-start sm:justify-center">
                <StoreBadge
                  store="apple"
                  topLine={locale === "it" ? "Scarica su" : "Download on the"}
                  bottomLine="App Store"
                  href="https://swappup.com"
                />
                <StoreBadge
                  store="google"
                  topLine={locale === "it" ? "Disponibile su" : "Get it on"}
                  bottomLine="Google Play"
                  href="https://swappup.com"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {locale === "it"
                  ? "App in arrivo. Nel frattempo apri Swappup nel browser del tuo telefono."
                  : "App coming soon. In the meantime, open Swappup in your phone's browser."}
              </p>
            </div>

            {/* QR code — desktop emphasis */}
            <div className="flex justify-center">
              <div className="glass rounded-3xl border border-border/50 p-6 text-center space-y-4 shadow-2xl shadow-primary/10">
                <div className="rounded-2xl bg-white p-4">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=https%3A%2F%2Fswappup.com"
                    alt={locale === "it" ? "QR code per Swappup" : "QR code for Swappup"}
                    width={240}
                    height={240}
                    loading="lazy"
                    className="h-44 w-44 sm:h-56 sm:w-56"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {locale === "it"
                    ? "Inquadra con la fotocamera del telefono"
                    : "Scan with your phone camera"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/50 bg-gradient-to-b from-secondary/10 to-background">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{c.finalTitle}</h2>
          <p className="mt-3 text-muted-foreground">{c.finalSubtitle}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="gold" size="lg" className="min-w-48">
              <Link to="/sign-up">
                {c.finalCta}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link to="/login">{c.finalLogin}</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

function StoreBadge({
  store,
  topLine,
  bottomLine,
  href,
}: {
  store: "apple" | "google";
  topLine: string;
  bottomLine: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 rounded-xl border border-border/60 bg-foreground px-4 py-2.5 text-background transition hover:bg-foreground/90"
      aria-label={`${topLine} ${bottomLine}`}
    >
      {store === "apple" ? (
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
          <path d="M16.365 1.43c0 1.14-.43 2.22-1.17 3.03-.79.88-2.07 1.55-3.13 1.47-.14-1.12.43-2.28 1.17-3.05.84-.86 2.27-1.5 3.13-1.45zM21 17.36c-.55 1.27-.81 1.83-1.51 2.95-.98 1.55-2.36 3.48-4.07 3.49-1.52.02-1.91-.99-3.97-.98-2.06.01-2.49.99-4.01.97-1.71-.02-3.02-1.76-4-3.31C.84 16.05.55 11.7 2.34 9.36c1.27-1.66 3.27-2.63 5.16-2.63 1.92 0 3.13 1.05 4.72 1.05 1.54 0 2.48-1.05 4.7-1.05 1.68 0 3.45.92 4.71 2.5-4.14 2.27-3.47 8.21.37 8.13z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path fill="#34A853" d="M3.6 20.4c.2.1.5.2.8.2.3 0 .6-.1.9-.3l10-5.8-2.8-2.8L3.6 20.4z" />
          <path fill="#FBBC04" d="M19.7 11.2 16.5 9.4 13.3 12l3.2 3.2 3.2-1.8c.6-.3.9-.9.9-1.6 0-.6-.3-1.3-.9-1.6z" />
          <path fill="#4285F4" d="M3.6 3.6c-.1.2-.1.4-.1.7v15.4c0 .2 0 .4.1.7L13.3 12 3.6 3.6z" />
          <path fill="#EA4335" d="M13.3 12 16.5 9.4 5.3 3.4c-.3-.2-.6-.3-.9-.3-.3 0-.6.1-.8.2L13.3 12z" />
        </svg>
      )}
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[10px] uppercase tracking-wide opacity-80">{topLine}</span>
        <span className="text-sm font-semibold">{bottomLine}</span>
      </span>
    </a>
  );
}