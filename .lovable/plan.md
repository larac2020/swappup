## Goal

Send branded swappup emails at 7 key moments in the purchase lifecycle, in addition to the existing in-app notifications.

## Prerequisite: Email infrastructure

The project has no email infrastructure yet (no domain configured, no email tables). Before any template work, we need to:

1. Configure a sender email domain (e.g. `notify.swappup.com`) via the email setup dialog.
2. Provision the email queue, suppression list, unsubscribe tokens, cron dispatcher.
3. Scaffold the transactional email function `send-transactional-email` and the unsubscribe page.

If you already have a preferred sender domain, share it; otherwise the dialog will guide selection. DNS verification can complete in the background — scaffolding and triggers can be wired in parallel.

## Email map (7 triggers)

| # | Event | Recipient | Template | Triggered in |
|---|-------|-----------|----------|--------------|
| 1a | Ticket bought (confirmation) | Buyer | `purchase-buyer-confirmation` | `stripe-purchase-webhook` (checkout.completed) |
| 1b | Ticket sold (action required) | Seller | `purchase-seller-new-sale` | same webhook |
| 2 | Reminder to start name change | Seller | `seller-action-reminder` | new cron `seller-action-reminders` (sent ~1h after purchase if no transfer yet) |
| 3 | 4h before 24h deadline | Seller | `seller-deadline-warning` | same cron (when `transfer_deadline - now ≈ 4h` and not yet transferred) |
| 4 | Name changed → buyer must verify | Buyer | `transfer-completed-buyer` | `TransferConfirmation.tsx` mutation |
| 5 | Buyer confirmed → payout incoming | Seller | `escrow-released-seller` | `release-escrow` edge function |
| 6 | Seller missed deadline (sorry) | Buyer | `transfer-expired-buyer` | `expire-transfers` → `cancel-escrow` |
| 7 | Seller missed deadline (warning) | Seller | `transfer-expired-seller` | same path |

Each template will be a React Email `.tsx` in `supabase/functions/_shared/transactional-email-templates/`, registered in `registry.ts`, brand-styled (charcoal + gold, white body background as required), and accept dynamic `templateData` (names, route, dates, booking ref, deadline, support links).

## Code changes

### New / scaffolded
- `supabase/functions/_shared/transactional-email-templates/` — 7 new templates + updated `registry.ts`.
- `supabase/functions/send-transactional-email/` (scaffolded by tool, not hand-written).
- `supabase/functions/handle-email-unsubscribe/`, `handle-email-suppression/` (scaffolded).
- `supabase/functions/seller-action-reminders/index.ts` — new cron-driven function that scans `purchases` for:
  - status=`pending_transfer`, no transfer yet, ~1h since purchase, no reminder sent → send #2
  - status=`pending_transfer`, `transfer_deadline` between now+3h30m and now+4h30m, no warning sent → send #3
  - Idempotency via two new boolean columns on `purchases`: `seller_reminder_sent`, `seller_warning_sent` (added via migration). Also serves as the dedupe key.
- New `pg_cron` job calling `seller-action-reminders` every 15 minutes.
- `src/pages/EmailUnsubscribe.tsx` (or chosen path) wired into `App.tsx` router.

### Modified
- `supabase/functions/stripe-purchase-webhook/index.ts` — after marking `pending_transfer`, fetch buyer + seller profiles (email, full_name) and listing route/date, invoke `send-transactional-email` twice with idempotency keys `purchase-buyer-${purchaseId}` and `purchase-seller-${purchaseId}`.
- `src/components/listings/TransferConfirmation.tsx` — after the existing `send-notification` call, also invoke `send-transactional-email` with `transfer-completed-buyer` (idempotency `transfer-buyer-${purchaseId}`).
- `supabase/functions/release-escrow/index.ts` — after `notifications.insert`, send `escrow-released-seller` (idempotency `escrow-released-${purchaseId}`).
- `supabase/functions/cancel-escrow/index.ts` — when the cancellation reason is the expiry (`reason` includes `did not complete the name change in time`, or new flag `expired: true` from `expire-transfers`), send #6 to buyer and #7 to seller. Skip these two emails for buyer-initiated refunds.
- `supabase/functions/expire-transfers/index.ts` — pass `{ expired: true }` along with the existing reason so cancel-escrow knows to send the negative pair.

### Database
- Migration: add `seller_reminder_sent boolean default false`, `seller_warning_sent boolean default false` on `purchases`.
- Migration after cron setup: schedule `seller-action-reminders` every 15 min via `pg_cron` + `pg_net` (using anon key + project URL — added via insert tool, not migration tool).

## Brand & content

All templates share a header (gold `#F4A929` accent, charcoal `#0F1116` text, white body), greet by first name, include the route (e.g. `LHR › CDG`), departure date, airline + flight number, and a primary CTA button to the relevant in-app screen (`/account/purchases?open=…` or `/account/listings?sale=…`). Footer: support email + help link + auto unsubscribe link (system-injected).

Tone:
- Positive emails (#1a, #1b, #2, #4, #5): friendly, action-oriented.
- Warning (#3): urgent but reassuring.
- Negative (#6): apologetic, offers to find another listing on the same route.
- Negative (#7): firm but non-punitive, reminds of the 24h rule for next time.

## Out of scope
- No marketing emails, digests, or newsletters.
- No SMS/push.
- No changes to the in-app `notifications` system; emails are additive.
- No template translation (EN only for v1; matches current PDF copy).

## Open questions
1. Sender domain to use — `notify.swappup.com` OK?
2. Support email to print in footer — `support@swappup.com`?
3. For email #6, should we link the buyer to the search page pre-filtered on the same route? (Recommended yes.)
