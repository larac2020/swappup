## What's broken

**1. Back button 404 from edit listing (`/sell?edit=…`)**
`src/pages/SellTicket.tsx:777` navigates to `/my-listings` (doesn't exist) and `/` (lands on Auth via redirect for logged-in users it goes to /home, but it's still wrong intent). The real route is `/listings`.

**2. Notification bell deep-link is wrong**
`src/components/notifications/NotificationBell.tsx:41` sends every notification with a `listing_id` to `/listings` (My Listings) instead of the specific listing detail `/listing/{id}`.

**3. Edit submission already routes correctly** (`/sell?edit=…` → on save → `/listings`, line 604) — no change needed.

**4. Carrier non-transferable is not a hard block on edit**
`src/pages/SellTicket.tsx:684` only enforces `flightTransferBlocked` when `!isEditMode`. So a seller can today edit an existing listing whose airline has flipped to non-transferable and re-save it. Same applies at the DB layer (no constraint).

**5. Name-change DB freshness**
`get-name-change-fee` already refreshes rows older than 30 days on read and upserts via Firecrawl + Lovable AI. It's only triggered when the seller opens the Sell form for that airline. There's no scheduled refresh, so airlines nobody is currently listing can go stale silently.

## Fixes

### Frontend (small, surgical)

- `src/pages/SellTicket.tsx`
  - Line 777: change `navigate(editId ? "/my-listings" : "/")` → `navigate(editId ? "/listings" : "/home")`.
  - Line 684: drop the `!isEditMode` guard for `flightTransferBlocked` — if the airline is currently marked non-transferable, block save in edit mode too. Keep the fee-acknowledgement guard gated on create only (already-published listings shouldn't require re-ack on every edit).
  - When `flightTransferBlocked` is true on an existing listing, also surface a non-dismissable banner at the top of the form explaining the listing can no longer be edited until the airline policy changes, with a one-tap "Deactivate listing" button (sets `is_active=false`).

- `src/components/notifications/NotificationBell.tsx`
  - Line 41: `navigate(`/listing/${notif.listing_id}`)` instead of `/listings`.

- Quick audit pass on remaining back/return buttons in routed pages — already verified: `ListingDetail` → `/listings` ✓, `Support`/`Preferences`/`PrivacyData` → `/account` ✓, `LegalPage` → browser back ✓. No other broken targets found.

### Backend — keep `airline_change_fees` always fresh

Add a scheduled refresh so we don't depend on a seller opening the form:

- New edge function `refresh-airline-fees` (service role): iterates all rows in `airline_change_fees` whose `last_verified_at` is older than 14 days (or `is_transferable` was unknown), calls the existing `liveLookup` logic from `get-name-change-fee` (extract the helper into `_shared/airline-fee-lookup.ts` so both functions share it), upserts the result. Runs in batches of 5 with throttling to stay under Firecrawl quotas.
- Schedule via `pg_cron` daily at 03:00 UTC, invoking `refresh-airline-fees` with the service role key.
- When an airline flips to `is_transferable=false`, also auto-deactivate any active listings on that airline (`UPDATE listings SET is_active=false WHERE airline=… AND is_active=true`) and insert a notification per affected seller explaining why.

### Backend — hard block at the DB layer

- New trigger `enforce_listing_transferable` on `listings` (BEFORE INSERT OR UPDATE): for `listing_type='flight_ticket'` with non-null `airline`, look up `airline_change_fees` (latest row for that normalized code) and `RAISE EXCEPTION 'NOT_TRANSFERABLE: …'` if `is_transferable=false`. This guarantees no client path can bypass the rule. Surface the error in `SellTicket` `onError` next to the existing `DUPLICATE_LISTING` / `RATE_LIMIT` / `PRICE_CAP` toasts.

### Out of scope

- Reworking the Sell form layout, copy, or train flow.
- Backfilling fees for airlines never queried (the daily refresh job will pick them up over time as rows exist).
- Email/notification template changes beyond the auto-deactivation notice.

## Sequence

1. Migration: trigger + indexes on `airline_change_fees(airline_code, route_type)`.
2. Extract `liveLookup` helper, create `refresh-airline-fees`, wire `pg_cron`.
3. SellTicket.tsx fixes (back path + remove edit guard + deactivate banner + new error toast).
4. NotificationBell deep-link fix.
5. Verify: open `/sell?edit=<id>`, hit back → lands on `/listings`; click a listing notification → `/listing/{id}`; try to save a listing on an airline with `is_transferable=false` → blocked with toast.