
- FX: display conversion reads live ECB rates from `fx_rates` (refreshed weekdays 17:00 UTC by `refresh-fx-rates`, all-or-nothing writes); hardcoded rates in `src/lib/currency.ts` are a stale last-resort fallback only. Why: accurate prices without a paid API.
- `listings.name_change_fee_currency` is set by a DB trigger from `airline_change_fees.currency`, never by the client. Why: the fee is in the airline's currency, not the ticket's, and cannot be spoofed.
