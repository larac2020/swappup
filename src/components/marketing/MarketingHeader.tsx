import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import swappupLogo from "@/assets/swappup-logo.png";
import { useLanguage } from "@/i18n/LanguageContext";
import { headerContent } from "@/i18n/marketingContent";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

export function MarketingHeader() {
  const { isAuthenticated } = useAuth();
  const { locale, setLocale } = useLanguage();
  const c = headerContent[locale];

  return (
    <header
      className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="Swappup home">
          <img src={swappupLogo} alt="Swappup" className="h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-hidden="true" />

        <div className="hidden md:flex items-center gap-2">
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

        {/* Mobile menu */}
        <div className="flex md:hidden items-center gap-1">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={c.menu}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>{c.menu}</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1 text-base">
                <SheetClose asChild>
                  <Link to="/about" className="rounded-md px-3 py-2 hover:bg-secondary">{c.about}</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/faq" className="rounded-md px-3 py-2 hover:bg-secondary">{c.faq}</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/support" className="rounded-md px-3 py-2 hover:bg-secondary">{c.support}</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/terms-and-conditions" className="rounded-md px-3 py-2 hover:bg-secondary">{c.terms}</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/privacy-policy" className="rounded-md px-3 py-2 hover:bg-secondary">{c.privacy}</Link>
                </SheetClose>
              </nav>
              <div className="mt-6 flex flex-col gap-2 border-t border-border/50 pt-6">
                {isAuthenticated ? (
                  <SheetClose asChild>
                    <Button asChild variant="gold" className="w-full">
                      <Link to="/home">{c.openApp}</Link>
                    </Button>
                  </SheetClose>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/login">{c.login}</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild variant="gold" className="w-full">
                        <Link to="/sign-up">{c.signup}</Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
                <div className="mt-4 flex justify-center">
                  <LanguageToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}