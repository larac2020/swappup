import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

export interface PasswordCriteria {
  length: boolean;
  letterAndNumber: boolean;
  special: boolean;
}

export function evaluatePassword(pw: string): PasswordCriteria {
  return {
    length: pw.length >= 8,
    letterAndNumber: /[A-Za-z]/.test(pw) && /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

export function allCriteriaMet(pw: string): boolean {
  const c = evaluatePassword(pw);
  return c.length && c.letterAndNumber && c.special;
}

interface Props {
  password: string;
  className?: string;
}

export function PasswordChecklist({ password, className }: Props) {
  const c = evaluatePassword(password);
  const { t } = useLanguage();
  const items: { ok: boolean; label: string }[] = [
    { ok: c.length, label: t("pwCritLength") },
    { ok: c.letterAndNumber, label: t("pwCritLetterNumber") },
    { ok: c.special, label: t("pwCritSpecial") },
  ];
  return (
    <ul className={cn("space-y-1.5 text-xs", className)} aria-live="polite">
      {items.map((it) => (
        <li
          key={it.label}
          className={cn(
            "flex items-center gap-2 transition-colors",
            it.ok ? "text-emerald-500" : "text-muted-foreground",
          )}
        >
          {it.ok ? (
            <Check className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Circle className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>{it.label}</span>
        </li>
      ))}
    </ul>
  );
}