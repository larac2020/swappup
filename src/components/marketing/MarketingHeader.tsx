import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import swappupLogo from "@/assets/swappup-logo.png";
import { useLanguage } from "@/i18n/LanguageContext";
import { headerContent } from "@/i18n/marketingContent";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  const { isAuthenticated } = useAuth();
  const { locale, setLocale } = useLanguage();
  const c = headerContent[locale];

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="Swappup home">
          <img src={swappupLogo} alt="Swappup" className="h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-hidden="true" />

        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label={c.languageLabel}
            className="flex items-center gap-0.5 rounded-full border border-border/50 bg-background/40 p-0.5"
          >
            <button
              type="button"
              onClick={() => setLocale("en")}
              aria-label="English"
              aria-pressed={locale === "en"}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-base leading-none transition-opacity",
                locale === "en" ? "bg-secondary opacity-100" : "opacity-50 hover:opacity-100",
              )}
            >
              <span aria-hidden="true">🇬🇧</span>
            </button>
            <button
              type="button"
              onClick={() => setLocale("it")}
              aria-label="Italiano"
              aria-pressed={locale === "it"}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-base leading-none transition-opacity",
                locale === "it" ? "bg-secondary opacity-100" : "opacity-50 hover:opacity-100",
              )}
            >
              <span aria-hidden="true">🇮🇹</span>
            </button>
          </div>
          {isAuthenticated ? (
            <Button asChild variant="gold" size="sm">
              <Link to="/home">{c.openApp}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">{c.login}</Link>
              </Button>
              <Button asChild variant="gold" size="sm">
                <Link to="/sign-up">{c.signup}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}