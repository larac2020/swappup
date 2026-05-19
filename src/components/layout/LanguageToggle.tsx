import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "en" as const, flag: "🇬🇧", label: "EN" },
  { value: "it" as const, flag: "🇮🇹", label: "IT" },
];

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();
  return (
    <div
      role="group"
      aria-label="Language"
      className="flex items-center gap-1 rounded-full border border-border/50 bg-background/80 backdrop-blur p-1 shadow-sm"
    >
      {OPTIONS.map((o) => {
        const active = locale === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setLocale(o.value)}
            aria-label={o.label}
            aria-pressed={active}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span aria-hidden="true">{o.flag}</span>
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}