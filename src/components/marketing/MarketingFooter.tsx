import { Link } from "react-router-dom";
import swappupLogo from "@/assets/swappup-logo.png";
import { useLanguage } from "@/i18n/LanguageContext";
import { footerContent } from "@/i18n/marketingContent";

export function MarketingFooter() {
  const year = new Date().getFullYear();
  const { locale } = useLanguage();
  const c = footerContent[locale];
  return (
    <footer className="border-t border-border/50 bg-background/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src={swappupLogo} alt="Swappup" className="h-10 w-auto" />
            </Link>
            <p className="max-w-sm text-sm text-muted-foreground">{c.tagline}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{c.company}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  {c.about}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  {c.faq}
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="text-muted-foreground hover:text-foreground transition-colors">
                  {c.terms}
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                  {c.privacy}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Swappup Ltd</h3>
            <address className="not-italic text-sm text-muted-foreground leading-relaxed">
              {/* TODO: replace with real registered address */}
              {c.registeredOffice}
              <br />
              {c.addressLine}
              <br />
              {c.companyNo}
            </address>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>{c.rights(year)}</p>
          <p>{c.madeFor}</p>
        </div>
      </div>
    </footer>
  );
}