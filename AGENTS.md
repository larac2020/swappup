
- FX: display conversion reads live ECB rates from `fx_rates` (refreshed weekdays 17:00 UTC by `refresh-fx-rates`, all-or-nothing writes); hardcoded rates in `src/lib/currency.ts` are a stale last-resort fallback only. Why: accurate prices without a paid API.
- `listings.name_change_fee_currency` is set by a DB trigger from `airline_change_fees.currency`, never by the client. Why: the fee is in the airline's currency, not the ticket's, and cannot be spoofed.
- Name-change fees are always treated as being in `listings.name_change_fee_currency` and shown via `convertFee`/`formatFee` (round up to minor unit), display only. Why: the fee is in the airline's currency, and converted amounts must never leave the seller short.
- Buyer screens show prices in the buyer's display currency; seller screens keep the listing (or airline) currency as the headline with display currency as a secondary approximation. Why: the listing currency is what is charged and paid out.
