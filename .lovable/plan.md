## Goal

When a buyer clicks "Buy", fetch a fresh, real-time name-change fee from the airline (instead of relying only on the seller's earlier estimate) and show it before payment is confirmed.

## Honest reality check

Airlines do **not** publish a clean public API for name-change fees. There are only three viable ways to get a "live" number, each with trade-offs:

1. **Curated fee table (recommended baseline).** Maintain a `airline_change_fees` table (per airline, fare class, route type) that we update from each airline's official fee schedule. "Live" = always read from DB at purchase time, so updates propagate instantly. Reliable, fast, no scraping risk.
2. **AI-assisted lookup via web search.** At purchase time, call an edge function that uses Lovable AI + a web search/scrape (Firecrawl connector) against the specific airline's "name change / correction" help page, and asks the model to extract the current fee for that fare type. Closer to "live" but: slow (5–15s), can fail, airlines word things ambiguously, and may return ranges.
3. **Hybrid (recommended).** Use the curated table as the source of truth; refresh individual airline rows on-demand via the AI+scrape path when stale (e.g. >30 days) or when the buyer explicitly taps "Recheck fee".

I recommend the **hybrid** approach. True per-booking live pricing from airline.com is not feasible without the PNR + the seller's airline credentials, which we don't have and shouldn't ask for.

## Scope of changes

### Database
- New table `airline_change_fees` (airline_code, route_type [domestic/intl], fare_class nullable, fee_amount, currency, source_url, last_verified_at).
- Seed with the airlines already referenced in `flightData.ts`.
- RLS: public read, admin-only write.

### Edge function: `get-name-change-fee`
- Input: `{ airline_code, route_type, fare_class? }`.
- Reads from `airline_change_fees`. If row missing or `last_verified_at` older than 30 days, calls the refresh path.
- Refresh path: Firecrawl scrape of the airline's official fee page → Lovable AI (Gemini 2.5 Flash) extracts the fee → upsert into the table.
- Returns `{ fee, currency, last_verified_at, source_url, confidence }`.

### Edge function: `refresh-name-change-fee` (admin/cron)
- Same logic, but iterates all airlines. Wired to a scheduled run (weekly).

### Frontend — `PurchaseDialog.tsx`
- On open, call `get-name-change-fee` and show:
  - Fee amount + "verified <date>" + link to source.
  - A "Recheck now" button that re-invokes the function ignoring cache.
  - A clear disclaimer: *"This is the published airline fee. If the airline charges more at transfer time, the seller is responsible per our Terms."*
- Block "Confirm purchase" until the fetch resolves (with a timeout fallback to the cached value).

### Frontend — `TransferabilityCheck.tsx` / `TrainTransferabilityCheck.tsx`
- Replace the seller-side estimate source with the same `get-name-change-fee` function so seller and buyer see consistent numbers.

### Connectors / secrets
- Requires the **Firecrawl** connector (currently not connected). I'll prompt to connect it before deploying the refresh path.
- Uses existing `LOVABLE_API_KEY` for the AI extraction.

### i18n
- New strings in `src/i18n/translations.ts` for "Live fee check", "Verified on", "Recheck now", disclaimer, error fallback.

## Out of scope
- Real per-PNR pricing from airline.com (not possible without seller's airline account).
- Train operator scraping beyond what `TrainTransferabilityCheck` already supports — same hybrid pattern, separate table `train_change_fees` if you want it included (say the word).

## Open questions
1. Confirm hybrid approach (curated table + on-demand refresh via Firecrawl + AI) vs. pure curated table only.
2. OK to require connecting the **Firecrawl** connector? Without it, we fall back to curated-table-only.
3. Include trains in the same change, or flights only for now?
