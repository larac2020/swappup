## Goal

Keep `airline_change_fees` reliable and current automatically — no manual fee entry — by scraping airline websites on a schedule, with safety rails to prevent bad data from going live.

## How it works today

- `supabase/functions/refresh-airline-fees` already exists. It uses Firecrawl (canonical URL → fallback web search) + Gemini (`google/gemini-2.5-flash`) to extract fee, currency, and transferability for the 5 stalest airlines per run, then upserts into `airline_change_fees`.
- `get-name-change-fee` reads from that table for the listing flow.
- `report-name-change-fee` lets sellers dispute via `name_change_fee_disputes`.
- No cron job is currently scheduling the refresh — it only runs when invoked manually.

## Plan

### 1. Schedule the scraper (the core of your request)

Enable `pg_cron` + `pg_net` and schedule `refresh-airline-fees` every 6 hours:

```
0 */6 * * *  →  POST /functions/v1/refresh-airline-fees
```

With ~35 airlines and 5 per run, every airline is re-verified every ~1–2 days. `last_verified_at` already drives the "stalest first" ordering, so coverage stays even.

### 2. Harden the scraper so bad data never reaches the UI

Edit `supabase/functions/refresh-airline-fees/index.ts`:

- **Canonical source map** — add `AIRLINE_SOURCES` with each airline's official fees page (e.g. Ryanair help centre, BA manage-booking, easyJet name-change page). Scrape canonical URL first; fall back to Firecrawl search only if canonical fails.
- **Confidence gate** — only update `fee_amount` / `currency` when Gemini returns `high` or `medium` confidence. Low-confidence runs only bump `last_verified_at`.
- **Sanity bounds** — reject values outside €0–€500 equivalent.
- **Quarantine large deltas** — if the new fee differs from the stored fee by more than ±40% or ±€50, do NOT overwrite the live row. Instead insert into a new `airline_fee_review_queue` table with status `pending` for human review.
- **Currency preserved** — the function already writes `currency: live.currency || "EUR"`, so the per-airline native currency fix you just shipped (GBP, USD, NOK, ISK, etc.) is respected.

### 3. Audit + review tables (new migration)

```text
airline_change_fee_history    -- append-only log of every run
  airline_code, previous_fee, new_fee, currency,
  source_url, confidence, accepted (bool), run_at

airline_fee_review_queue      -- quarantined changes
  airline_code, current_fee, proposed_fee, currency,
  reason ('large_delta' | 'low_confidence' | 'out_of_bounds'),
  source_url, status ('pending'|'approved'|'rejected'), created_at
```

Both service-role only; no public RLS.

### 4. Small UI touch

Under the FAQ fees table (`src/pages/Faq.tsx`), add a small caption in EN + IT: *"Fees verified automatically every few hours from each airline's official help pages. Conversions to your currency are indicative."*

## Out of scope (call out, don't build now)

- Admin UI for the review queue (you'd approve via SQL for now, or I can build a simple page later).
- Live FX rates — we keep the static `RATES_PER_EUR` table.
- Route-type variants (domestic vs international vs intercontinental per airline).
- Replacing `name_change_fee_disputes` — sellers can still report mismatches; their reports feed the same review queue in a future iteration.

## Technical notes

- Cron SQL is inserted via the Supabase insert tool (not a migration) because it contains the project URL and anon key.
- Firecrawl is already connected (`FIRECRAWL_API_KEY` present). Gemini calls use `LOVABLE_API_KEY` (no extra cost setup).
- Trigger `enforce_listing_transferable` and `enforce_name_change_fee_cap` already protect listings from stale/excessive values — the new safeguards complement them at the data-source level.
