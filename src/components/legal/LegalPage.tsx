import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from "@/i18n/LanguageContext";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

import termsEn from "@/content/legal/terms.en.md?raw";
import termsIt from "@/content/legal/terms.it.md?raw";
import privacyEn from "@/content/legal/privacy.en.md?raw";
import privacyIt from "@/content/legal/privacy.it.md?raw";
import { TERMS_LAST_UPDATED, PRIVACY_LAST_UPDATED } from "@/content/legal/version";

type Doc = "terms" | "privacy";

interface LegalPageProps {
  doc: Doc;
}

const docs: Record<Doc, { en: string; it: string; updated: string }> = {
  terms: { en: termsEn, it: termsIt, updated: TERMS_LAST_UPDATED },
  privacy: { en: privacyEn, it: privacyIt, updated: PRIVACY_LAST_UPDATED },
};

export default function LegalPage({ doc }: LegalPageProps) {
  const { locale, t } = useLanguage();

  const content = docs[doc][locale] ?? docs[doc].en;

  return (
    <MarketingLayout>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {doc === "terms" ? t("legalTermsTitle") : t("legalPrivacyTitle")}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("legalLastUpdated")}: {docs[doc].updated}
        </p>
        <article className="prose prose-invert mt-10 max-w-none prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-10 prose-h3:text-lg prose-p:text-foreground/90 prose-p:leading-relaxed prose-li:text-foreground/90 prose-strong:text-foreground prose-a:text-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
        <p className="mt-10 border-t border-border/50 pt-6 text-xs text-muted-foreground">
          SWAPPUP LTD — Company No. 17169674 — 1 Yabsley Street, London, E14 9RG, UK
        </p>
      </section>
    </MarketingLayout>
  );
}