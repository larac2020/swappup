# Plan: Watchlist alerts as transactional + label rename

## 1. Treat watchlist updates as transactional emails

Reclassify the watchlist digest from "marketing" to **transactional**. Rationale: each email is triggered by a specific event on a listing the recipient explicitly added to their own watchlist (price drop, listing no longer available). The recipient took an action that produces this notification → it qualifies as transactional under CAN-SPAM/GDPR/ISP standards.

Concrete changes vs. the previously approved plan:

- **Send via existing `send-transactional-email`** (one invocation per recipient, with per-user `idempotencyKey`). No new generic sender function.
- **New template** `supabase/functions/_shared/transactional-email-templates/watchlist-digest.tsx` registered in `registry.ts`. Brand-styled, sections for price drops + unavailable listings (with up to 3 similar listings, ±7 days, same origin/destination).
- **Unsubscribe footer is system-managed** — we will NOT add our own unsubscribe link in the template body (the platform appends a compliant footer + one-click token automatically). The "Manage preferences" link in the body remains and points to `/account/notifications`.
- **Suppression respected automatically** by `send-transactional-email` (checks `suppressed_emails`).
- **Per-user preference toggle** `notification_preferences.watchlist_emails` (default `true`) controls whether the digest function enqueues a send for that user. The `handle-email-unsubscribe` flow already adds to `suppressed_emails`; we additionally flip `watchlist_emails = false` for the matching profile so the preference centre stays in sync.
- **Daily aggregator** `watchlist-digest` edge function (pg_cron 09:00 UTC, service role): scans watchlist rows, detects price drops vs `last_notified_price` and unavailable listings, builds per-user payload, then calls `send-transactional-email` once per eligible user. After enqueue, updates `last_notified_price` / `notified_unavailable_at`. **Not a marketing loop** — each send is one recipient, one event window, expected by the recipient.
- **Notification centre toggle** in `NotificationSettings.tsx` bound to `watchlist_emails`, labeled as a transactional alert (e.g. "Watchlist alerts"), separate from the marketing toggle.

Everything else from the prior approved plan (rename favorites → watchlist across UI + code + DB, new tracking columns, similar-listing suggestions ±7 days) stays the same.

## 2. Rename label

In `src/components/account/NotificationSettings.tsx` line 184, change:
- "Product updates & tips" → **"Product updates & offers"**

Same change in the Italian translation if a matching string exists (none found in current grep — the label is hardcoded in the component, so a single edit is enough). If we later move it to translations, both EN and IT will use "offers"/"offerte".

## Out of scope
True bulk marketing (newsletters, promo blasts), push notifications, per-listing watchlist mute.
