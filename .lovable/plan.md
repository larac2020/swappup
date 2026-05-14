## Goal

1. Rename the **favorites** feature to **watchlist** end-to-end (UI labels EN/IT, route, components, hooks, DB table).
2. Email watchlist owners once per day with a digest covering:
   - **Price drops** on any watched listing (any decrease vs. last notified price)
   - **Watched listings no longer available** (sold, deactivated, expired) plus up to 3 similar listings (same origin + destination, departure date within ±7 days of the original)
3. Add a "Watchlist email alerts" toggle in the notification centre (separate from existing reminder/marketing toggles).
4. Every alert email includes a "Manage preferences" link (→ notification centre) and the system one-click unsubscribe footer. Test the unsubscribe flow end-to-end.

## Why these are transactional, not marketing

Each email is triggered by an event on a listing **this specific user explicitly added** to their watchlist, sent only to that user. That fits Lovable's transactional channel (queueing, retries, suppression, GDPR-compliant unsubscribe). No bulk/marketing sends.

## 1. Rename favorites → watchlist

**Database (migration):**
- Rename table `favorites` → `watchlist`
- Recreate the three RLS policies under the new name (`Users can add to their watchlist`, `view`, `remove`)
- No data loss; FK-free table

**Code (kept consistent with DB rename):**
- `src/pages/Favorites.tsx` → `src/pages/Watchlist.tsx`
- `src/components/account/FavoritesList.tsx` → `WatchlistList.tsx`
- Route `/favorites` → `/watchlist` (`App.tsx`); add a redirect from `/favorites` to `/watchlist` so old links don't 404
- All `.from("favorites")` calls → `.from("watchlist")` (Home, ListingDetail, ListingCard, Account, MyListings, Onboarding, PrivacyData, Preferences, Watchlist page)
- Translation keys `favorites.*` → `watchlist.*` (EN + IT) and update all `t("favorites...")` references
- Heart icon UI stays — only labels change ("Add to watchlist", "In your watchlist")

## 2. Watchlist tracking data

**New columns / tables (migration):**
- `watchlist`: add `last_notified_price numeric` and `notified_unavailable_at timestamptz` so the digest can detect new drops vs. previously-emailed drops and only announce removal once.
- `notification_preferences`: add `watchlist_emails boolean default true`.

## 3. Daily digest edge function

**New edge function `watchlist-digest`** (scheduled, service-role):
1. For each user with `watchlist_emails = true` and email not in `suppressed_emails`:
   - Load their watchlist rows joined to `listings`
   - **Price drops:** listing still active AND `listings.price < watchlist.last_notified_price` (or `last_notified_price IS NULL` and price has dropped vs. listing creation snapshot — first run we just seed `last_notified_price` and skip)
   - **Unavailable:** listing inactive/expired AND `notified_unavailable_at IS NULL`. For each, query up to 3 similar active listings: same `origin_city`+`destination_city`, `departure_date BETWEEN original ± 7 days`, exclude same seller, order by price asc.
2. If at least one item exists, invoke `send-transactional-email` with template `watchlist-digest`, idempotency key `watchlist-digest-${user.id}-${YYYY-MM-DD}`.
3. After enqueue, update `last_notified_price` to the current listing price for emailed drops, and set `notified_unavailable_at = now()` for emailed removals.

**Schedule:** pg_cron job invoking the function once per day (e.g. 09:00 UTC) via `net.http_post` (inserted via Supabase insert tool, not migration, since it contains the project anon key).

## 4. Email template

New React Email template `supabase/functions/_shared/transactional-email-templates/watchlist-digest.tsx`, registered in `registry.ts`:
- Brand-matched (charcoal/gold accents, white body background as required)
- Sections: "Price drops on your watchlist" and "No longer available" (each item shows listing summary + new price / similar suggestions list with deep links)
- Header CTA link to `/watchlist`
- Body link "Manage email preferences" → `/account` (notification settings tab)
- System auto-appends the one-click unsubscribe footer

## 5. Notification centre toggle

`src/components/account/NotificationSettings.tsx`:
- Add a new switch row "Watchlist email alerts (price drops, removals, suggestions)" bound to `notification_preferences.watchlist_emails`
- Save with the existing pattern; default `true` for new users (so existing users keep receiving until they opt out — UK GDPR allows transactional sends without prior opt-in but still requires a clear opt-out, which we provide)

## 6. Unsubscribe flow verification

The platform already ships `handle-email-unsubscribe` + `Unsubscribe.tsx` page + `suppressed_emails` table. Plan checks:
- Confirm the digest send goes through `send-transactional-email`, which performs the suppression check before sending (already implemented)
- Confirm the email footer's one-click link routes to the existing `/unsubscribe?token=…` page
- Manual test: send one digest to a test user, click unsubscribe, confirm `suppressed_emails` row appears and a second send is blocked
- Also wire the in-app preference: when a user clicks the email's "Unsubscribe" link, we additionally set `notification_preferences.watchlist_emails = false` for that user (handled in `handle-email-unsubscribe` after the existing suppression insert), so the two states stay in sync

## 7. GDPR/UK compliance notes

- Lawful basis: legitimate interest (user explicitly watchlisted the listing) + clear opt-out
- Preferences live in two authoritative places kept in sync: `notification_preferences.watchlist_emails` (per-user toggle) and `suppressed_emails` (per-email-address hard block). The send function checks both.
- Existing data export (`export-user-data`) and account deletion (`delete-account`) already cover preferences; verify the new column is included in the export payload — add it if missing.

## Out of scope

- True bulk marketing (newsletters, "we miss you", promo blasts) — would require a third-party provider and is not part of this plan
- Push notifications (only email + in-app bell, which already exists)
- Per-listing watchlist mute (can be added later if users complain about noise)

## Technical sequencing

1. Migration: rename table, add columns, add `watchlist_emails` to `notification_preferences`
2. Code rename + route redirect + translation updates
3. New email template + registry entry
4. New `watchlist-digest` edge function
5. Notification centre toggle
6. Update `handle-email-unsubscribe` to also flip `watchlist_emails` to false
7. Schedule pg_cron daily job (via insert tool, not migration)
8. Deploy edge functions, manually trigger once, verify send log + unsubscribe round trip
