// Currency utilities for displaying prices in the buyer's preferred currency.
// Listings are stored and charged in the seller's chosen currency.
// Conversion rates are static approximations for display purposes only.

export const SUPPORTED_CURRENCIES = [
  "EUR", "USD", "GBP", "CHF", "CAD", "AUD", "JPY", "CNY", "INR", "BRL", "MXN", "SEK", "NOK", "DKK", "PLN", "TRY", "AED", "SGD", "HKD", "NZD", "ISK", "MYR", "PHP",
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number];

// Approximate FX rates relative to EUR (1 EUR = X currency). Display only.
const RATES_PER_EUR: Record<string, number> = {
  EUR: 1, USD: 1.08, GBP: 0.85, CHF: 0.95, CAD: 1.47, AUD: 1.63, JPY: 168,
  CNY: 7.85, INR: 90, BRL: 5.5, MXN: 18.5, SEK: 11.4, NOK: 11.6, DKK: 7.45,
  PLN: 4.3, TRY: 38, AED: 3.97, SGD: 1.45, HKD: 8.45, NZD: 1.78,
  ISK: 150, MYR: 5.1, PHP: 62,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€", USD: "$", GBP: "£", CHF: "CHF", CAD: "C$", AUD: "A$", JPY: "¥",
  CNY: "¥", INR: "₹", BRL: "R$", MXN: "Mex$", SEK: "kr", NOK: "kr", DKK: "kr",
  PLN: "zł", TRY: "₺", AED: "AED", SGD: "S$", HKD: "HK$", NZD: "NZ$",
  ISK: "kr", MYR: "RM", PHP: "₱",
};

export function getCurrencySymbol(code?: string): string {
  if (!code) return "€";
  return CURRENCY_SYMBOLS[code] || code + " ";
}

export function convertAmount(amount: number, from: string = "EUR", to: string = "EUR"): number {
  if (!amount || from === to) return amount;
  const fromRate = RATES_PER_EUR[from] ?? 1;
  const toRate = RATES_PER_EUR[to] ?? 1;
  const inEur = amount / fromRate;
  return inEur * toRate;
}

export function formatPrice(
  amount: number,
  fromCurrency: string = "EUR",
  toCurrency: string = "EUR",
  opts: { decimals?: number } = {},
): string {
  const converted = convertAmount(Number(amount) || 0, fromCurrency, toCurrency);
  const decimals = opts.decimals ?? (converted >= 100 ? 0 : 2);
  const symbol = getCurrencySymbol(toCurrency);
  const formatted = converted.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  // Symbols like "kr", "AED" read better after the number; €/$ before.
  const prefixSymbols = ["€", "$", "£", "¥", "₹", "₺", "C$", "A$", "R$", "Mex$", "S$", "HK$", "NZ$"];
  return prefixSymbols.includes(symbol) ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
}