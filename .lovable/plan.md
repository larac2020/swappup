## What's happening today
All airline fees were seeded as **EUR** with hard-coded euro amounts. The FAQ table renders that raw value (e.g. `€115.00 EUR`) and ignores the viewer's preferred currency, so a UK user never sees GBP.

Two separate issues are bundled in "are prices in the right currency?":

1. **Storage currency** — every row says EUR, even for airlines that publish in another currency (BA / easyJet → GBP, Delta / United / American → USD, Norwegian → NOK, etc.). The auto-refresh job we discussed will fix this over time because the extractor returns the currency it found on the official page — but the current seed is wrong.
2. **Display currency** — even when the row's currency is correct, the FAQ doesn't convert it to the viewer's `preferred_currency`. The app already has `useDisplayCurrency()` + `formatPrice(amount, from, to)` (`src/lib/currency.ts`) used elsewhere; the FAQ just isn't using them.

## Plan

### 1. Fix the seeded native currencies (data only)
Update the existing rows so the stored currency matches what the airline actually publishes:

| Currency | Airlines |
|---|---|
| EUR (keep) | Ryanair, Wizz Air, Vueling, Volotea, Air Europa, Iberia, ITA Airways, TAP Air Portugal, Eurowings, Aer Lingus, Pegasus, SunExpress, PLAY |
| GBP | British Airways, easyJet |
| USD | Delta, United, American Airlines, flydubai (publishes in AED but quoted in USD on intl site — keep as USD for now) |
| NOK | Norwegian |
| ISK | Icelandair |
| MYR | AirAsia |
| AUD | Jetstar |
| SGD | Scoot |
| PHP | Cebu Pacific |
| INR | IndiGo |
| CHF | Swiss |

Fees themselves stay as the same rough amount but expressed in the native currency (e.g. BA stored as £0 non-transferable, Norwegian as 500 NOK, etc.). The amounts will be replaced with precise values by the auto-refresh job (separate plan); this step just gets the currency field right so display conversion works immediately.

Also extend `SUPPORTED_CURRENCIES` + `RATES_PER_EUR` + `CURRENCY_SYMBOLS` in `src/lib/currency.ts` with `ISK`, `MYR`, `PHP` (the rest are already there).

### 2. Make the FAQ table show the viewer's currency
In `src/pages/Faq.tsx`:

- Call `useDisplayCurrency()` to get the target currency.
- Replace the hand-rolled `{sym}{Number(fee).toFixed(2)} {CURRENCY}` with `formatPrice(fee, a.currency, displayCurrency)`.
- Add a small caption under the table: *"Fees shown in your preferred currency (set in Account). Conversion is indicative; you'll be charged in the airline's currency."* (EN + IT).
- For signed-out marketing visitors `useDisplayCurrency()` falls back to EUR, which is the expected default.

### 3. (Carry-over from previous turn) Make the auto-refresh job currency-aware
When we ship the cron-driven refresh, the Gemini extraction prompt already asks for `currency` in ISO code, and the upsert writes it to the row. We just need to make sure the harden-step in the previous plan **does not** force-overwrite currency to EUR (today's code does `currency: live.currency || "EUR"` which is fine) — so no extra work, just call it out so a future edit doesn't regress it.

## Out of scope
- Live FX rates (we keep the static table for display; payments still happen in the airline's currency at checkout).
- Per-route currency variants (e.g. Ryanair publishing in GBP for UK departures) — `route_type` already exists on the table if we ever want to split.
