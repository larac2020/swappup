import { Helmet } from "react-helmet-async";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { faqContent, marketingMeta } from "@/i18n/marketingContent";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";

export default function Faq() {
  const { locale } = useLanguage();
  const c = faqContent[locale];
  const meta = marketingMeta.faq;
  const location = useLocation();
  const displayCurrency = useDisplayCurrency();

  // Smooth-scroll to anchor (e.g. /faq#supported-airlines) after content renders.
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const t = setTimeout(tryScroll, 100);
    return () => clearTimeout(t);
  }, [location.hash]);

  const { data: supportedAirlines } = useQuery({
    queryKey: ["supported-airlines-fees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("airline_change_fees")
        .select("airline_name, fee_amount, fee_max, currency, is_transferable, route_type, last_verified_at, updated_at")
        .eq("route_type", "international")
        .order("airline_name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const transferable = (supportedAirlines ?? []).filter((a) => a.is_transferable);

  const formatVerified = (a: { last_verified_at?: string | null; updated_at?: string | null }) => {
    const verified = a.last_verified_at ?? a.updated_at;
    return verified
      ? new Date(verified).toLocaleDateString(locale === "it" ? "it-IT" : "en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";
  };

  const linkifyEmail = (text: string): React.ReactNode => {
    const re = /support@swappup\.com/g;
    const parts = text.split(re);
    if (parts.length === 1) return text;
    const nodes: React.ReactNode[] = [];
    parts.forEach((p, i) => {
      nodes.push(p);
      if (i < parts.length - 1) {
        nodes.push(
          <a key={i} href="mailto:support@swappup.com" className="text-primary underline">
            support@swappup.com
          </a>,
        );
      }
    });
    return <>{nodes}</>;
  };

  const renderAnswer = (raw: string): React.ReactNode => {
    if (raw === "signup_link") {
      const s = c.signupLinkAnswer;
      return (
        <>
          {s.before}
          <Link to="/sign-up" className="text-primary underline">{s.link}</Link>
          {s.after}
        </>
      );
    }
    if (raw === "privacy_link") {
      const s = c.privacyLinkAnswer;
      return (
        <>
          {s.before}
          <Link to="/privacy-policy" className="text-primary underline">{s.link}</Link>
          {s.after}
        </>
      );
    }
    return linkifyEmail(raw);
  };

  const answerText = (raw: string): string => {
    if (raw === "signup_link") {
      const s = c.signupLinkAnswer;
      return `${s.before}${s.link}${s.after}`;
    }
    if (raw === "privacy_link") {
      const s = c.privacyLinkAnswer;
      return `${s.before}${s.link}${s.after}`;
    }
    return raw;
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.sections.flatMap((s) =>
      s.items.map((it) => ({
        "@type": "Question",
        name: it.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: answerText(it.a),
        },
      })),
    ),
  };

  return (
    <MarketingLayout>
      <Helmet>
        <html lang={locale} />
        <title>{meta.title[locale]}</title>
        <meta name="description" content={meta.description[locale]} />
        <link rel="canonical" href="https://swappup.com/faq" />
        <meta property="og:title" content={meta.title[locale]} />
        <meta property="og:description" content={meta.ogDescription[locale]} />
        <meta property="og:url" content="https://swappup.com/faq" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={locale === "it" ? "it_IT" : "en_GB"} />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{c.h1}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{c.intro}</p>

        <div className="mt-12 space-y-12">
          {c.sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-semibold text-foreground">
                {section.title}
              </h2>
              <Accordion type="single" collapsible className="mt-4">
                {section.items.map((item, idx) => (
                  <AccordionItem
                    key={item.q}
                    value={`${section.title}-${idx}`}
                    className="border-border/50"
                  >
                    <AccordionTrigger className="text-left text-base font-medium">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {renderAnswer(item.a)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border/50 bg-secondary/30 p-6 text-center">
          <h2 className="text-lg font-semibold">{c.stillNeedHelp.h2}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {linkifyEmail(c.stillNeedHelp.bodyBefore)}
            <Link to="/sign-up" className="text-primary underline">{c.stillNeedHelp.linkText}</Link>
            {c.stillNeedHelp.bodyAfter}
          </p>
        </div>

        {/* Supported airlines & name-change fees */}
        <section id="supported-airlines" className="mt-20 scroll-mt-24">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {locale === "it" ? "Compagnie supportate e tariffe di cambio nome" : "Supported airlines & name-change fees"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {locale === "it"
                  ? "Su Swappup puoi pubblicare biglietti solo delle compagnie elencate qui sotto, perché sono le uniche che consentono il trasferimento del nominativo. La tariffa di cambio nome è verificata sul sito ufficiale della compagnia ed è inclusa in trasparenza al momento dell'acquisto."
                  : "On Swappup you can list tickets only from the airlines below — they are the ones that allow name transfers. The name-change fee is verified against the airline's official policy page and shown transparently at checkout."}
              </p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border/50">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 bg-secondary/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>{locale === "it" ? "Compagnia" : "Airline"}</span>
              <span className="text-right">{locale === "it" ? "Tariffa cambio nome" : "Name-change fee"}</span>
              <span className="text-right">{locale === "it" ? "Verificata il" : "Verified on"}</span>
            </div>
            <ul className="divide-y divide-border/50">
              {!supportedAirlines && (
                <li className="px-4 py-6 text-sm text-muted-foreground">
                  {locale === "it" ? "Caricamento…" : "Loading…"}
                </li>
              )}
              {transferable.map((a) => {
                const fee = Number(a.fee_max ?? a.fee_amount ?? 0);
                const nativeCurrency = (a.currency || "EUR").toUpperCase();
                const display = formatPrice(fee, nativeCurrency, displayCurrency, { decimals: 0 });
                const showNative = nativeCurrency !== displayCurrency && fee > 0;
                return (
                  <li key={a.airline_name} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      {a.airline_name}
                    </span>
                    <span className="text-right text-sm font-semibold tabular-nums leading-tight">
                      <span className="block">{display}</span>
                      {showNative && (
                        <span className="block text-[11px] font-normal text-muted-foreground">
                          {formatPrice(fee, nativeCurrency, nativeCurrency, { decimals: 0 })}
                        </span>
                      )}
                    </span>
                    <span className="text-right text-xs text-muted-foreground tabular-nums">
                      {formatVerified(a)}
                    </span>
                  </li>
                );
              })}
              {supportedAirlines && transferable.length === 0 && (
                <li className="px-4 py-6 text-sm text-muted-foreground">
                  {locale === "it" ? "Elenco in aggiornamento." : "List is being updated."}
                </li>
              )}
            </ul>
          </div>


          <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
            {locale === "it"
              ? `Tariffe per persona, per volo, secondo la policy ufficiale della compagnia. Importi mostrati in ${displayCurrency} (preferenza impostata nel tuo account); la conversione è indicativa e potresti essere addebitato nella valuta originale della compagnia. Se noti una discrepanza, segnalala dalla pagina di pubblicazione: riverifichiamo automaticamente la fonte ufficiale.`
              : `Fees are per person, per flight, taken from the airline's official policy. Amounts shown in ${displayCurrency} (your account preference); the conversion is indicative and you may be charged in the airline's original currency. If you spot a discrepancy, flag it from the listing page — we automatically re-verify against the airline's source.`}
          </p>
        </section>
      </section>
    </MarketingLayout>
  );
}