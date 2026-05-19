import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, ShieldCheck, Wallet, Sparkles, BadgeCheck, Play, Pause, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { landingContent, marketingMeta } from "@/i18n/marketingContent";
import { PhoneMock } from "@/components/marketing/PhoneMock";
import { useRef, useState } from "react";
import swappupLogo from "@/assets/swappup-logo.png";

export default function Landing() {
  const { locale } = useLanguage();
  const c = landingContent[locale];
  const meta = marketingMeta.landing;
  const icons = [Sparkles, ShieldCheck, BadgeCheck, Wallet];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
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