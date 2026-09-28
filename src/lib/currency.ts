// Currency utilities for displaying prices in the buyer's preferred currency.
// Listings are stored and charged in the seller's chosen currency.
// Live rates come from the fx_rates table (ECB reference rates, refreshed
// weekdays by the refresh-fx-rates function).
import { supabase } from "@/integrations/supabase/client";

// Launch market: UK + EU/EEA, plus USD.
export const SUPPORTED_CURRENCIES = [
  "EUR", "GBP", "USD", "CHF", "SEK", "NOK", "DKK", "PLN", "ISK", "TRY", "CZK", "HUF", "RON", "BGN",
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number];

// !!! STALE APPROXIMATIONS — LAST-RESORT FALLBACK ONLY !!!
// Used only if fx_rates is empty or unreachable. Do not treat as accurate.
const FALLBACK_RATES_PER_EUR: Record<string, number> = {
  EUR: 1, GBP: 0.85, USD: 1.08, CHF: 0.95, SEK: 11.4, NOK: 11.6, DKK: 7.45,
  PLN: 4.3, ISK: 150, TRY: 38, CZK: 25, HUF: 395, RON: 4.97, BGN: 1.95583,
};

// Live rates, loaded once per session from fx_rates.
let liveRates: Record<string, number> | null = null;
let loading: Promise<void> | null = null;

export function loadFxRates(): Promise<void> {
  if (loading) return loading;
  loading = (async () => {
    try {
      const { data, error } = await supabase.from("fx_rates" as any).select("currency_code, rate_per_eur");
      if (error || !data || data.length === 0) {
        loading = null; // allow a retry later
        return;
      }
      const map: Record<string, number> = {};
      for (const r of data as any[]) {
        const v = Number(r.rate_per_eur);
        if (Number.isFinite(v) && v > 0) map[r.currency_code] = v;
      }
      if (Object.keys(map).length) liveRates = map;
    } catch {
      loading = null;
    }
  })();
  return loading;
}

if (typeof window !== "undefined") void loadFxRates();

function rateFor(code: string): number {
  return liveRates?.[code] ?? FALLBACK_RATES_PER_EUR[code] ?? 1;
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€", GBP: "£", USD: "$", CHF: "CHF", SEK: "kr", NOK: "kr", DKK: "kr",
  PLN: "zł", ISK: "kr", TRY: "₺", CZK: "Kč", HUF: "Ft", RON: "lei", BGN: "лв",
};

export function getCurrencySymbol(code?: string): string {
  if (!code) return "€";
  return CURRENCY_SYMBOLS[code] || code + " ";
}

export function convertAmount(amount: number, from: string = "EUR", to: string = "EUR"): number {
  if (!amount || from === to) return amount;
  const inEur = amount / rateFor(from);
  return inEur * rateFor(to);
}

export function formatPrice(
  amount: number,
  fromCurrency: string = "EUR",
  toCurrency: string = "EUR",
  opts: { decimals?: number } = {},
): string {
  const converted = convertAmount(Number(amount) || 0, fromCurrency, toCurrency);
  const decimals = opts.decimals ?? 2;
  const symbol = getCurrencySymbol(toCurrency);
  const formatted = converted.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  // Symbols like "kr", "Kč" read better after the number; €/$/£ before.
  const prefixSymbols = ["€", "$", "£", "₺"];
  return prefixSymbols.includes(symbol) ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
}
