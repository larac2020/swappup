import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();
  return (
    <div
      role="group"
      aria-label="Language"
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
  );
}