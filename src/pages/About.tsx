import { Helmet } from "react-helmet-async";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { aboutContent, marketingMeta } from "@/i18n/marketingContent";

export default function About() {
  const { locale } = useLanguage();
  const c = aboutContent[locale];
  const meta = marketingMeta.about;
  return (
    <MarketingLayout>
      <Helmet>
        <html lang={locale} />
        <title>{meta.title[locale]}</title>
        <meta name="description" content={meta.description[locale]} />
        <link rel="canonical" href="https://swappup.com/about" />
        <meta property="og:title" content={meta.title[locale]} />
        <meta property="og:description" content={meta.ogDescription[locale]} />
        <meta property="og:url" content="https://swappup.com/about" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={locale === "it" ? "it_IT" : "en_GB"} />
      </Helmet>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{c.h1}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{c.intro}</p>

        <div className="prose prose-invert mt-10 max-w-none prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-10 prose-p:text-foreground/90 prose-p:leading-relaxed">
          {c.sections.map((s) => (
            <div key={s.h2}>
              <h2>{s.h2}</h2>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}