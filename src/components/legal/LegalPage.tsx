import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

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
  const navigate = useNavigate();
  const { locale, t } = useLanguage();

  const content = docs[doc][locale] ?? docs[doc].en;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
            aria-label={t("back")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">
            {doc === "terms" ? t("legalTermsTitle") : t("legalPrivacyTitle")}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <p className="mb-6 text-xs text-muted-foreground">
          {t("legalLastUpdated")}: {docs[doc].updated}
        </p>
        <article className="prose prose-invert prose-sm max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-p:text-foreground/90 prose-p:leading-relaxed prose-li:text-foreground/90 prose-strong:text-foreground prose-a:text-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
      </main>
    </div>
  );
}