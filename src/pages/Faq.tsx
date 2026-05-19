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

export default function Faq() {
  const { locale } = useLanguage();
  const c = faqContent[locale];
  const meta = marketingMeta.faq;

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
    return raw;
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
            {c.stillNeedHelp.bodyBefore}
            <Link to="/sign-up" className="text-primary underline">{c.stillNeedHelp.linkText}</Link>
            {c.stillNeedHelp.bodyAfter}
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}