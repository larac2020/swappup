## Why no email arrived

The buyer confirmation email (and the seller "action required" email) is sent from inside `stripe-purchase-webhook` when Stripe fires `checkout.session.completed`. Checks against the project show:

- No invocations of `stripe-purchase-webhook` in the edge function logs.
- All recent `purchases` rows are stuck at `status = pending`, `escrow_status = pending`, with a `cs_test_…` (Checkout Session) id — meaning the webhook never ran to flip them to `pending_transfer` / `authorized`.
- `email_send_log` has no rows in the last 2 days, confirming nothing was ever queued.

So the email pipeline itself is fine; the problem is Stripe never reaches our webhook, which means the whole post-payment flow is skipped.

## Plan

### 1. Repair the Stripe webhook (root cause)

- Make sure Stripe has a webhook endpoint pointing to the deployed `stripe-purchase-webhook` function URL.
- Subscribe it to: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_failed`.
- Make sure `STRIPE_WEBHOOK_SECRET` in our secrets matches that endpoint's signing secret (and, if there are separate test/live endpoints, that the correct one is used for whichever Stripe mode payments are being taken in).
- After fixing, do a small test purchase and confirm a row appears in `email_send_log` and the buyer receives the email.

### 2. Add a safety-net reconciliation (defense in depth)

Even with the webhook working, webhooks can be delayed/failed. Add a redundant, idempotent reconciliation so a successful payment is never silently stuck:

- New edge function `reconcile-purchase` (verify_jwt = true):
  - Input: `purchase_id`.
  - Loads the purchase, checks it belongs to the calling buyer, and is still `pending`.
  - Retrieves the Stripe Checkout Session by `stripe_payment_id`. If `payment_status = paid` (or the underlying PaymentIntent is `requires_capture` / `succeeded`), runs the same finalization code path the webhook runs: update purchase status, decrement listing stock, insert seller notification, and invoke `send-transactional-email` for both buyer + seller using the same idempotency keys (`buyer-confirm-<id>`, `seller-action-<id>`) so duplicate sends are impossible if the webhook also fires.
- On the buyer's success redirect (`/account/purchases?open=<id>&success=1`), call `reconcile-purchase` once on mount. If the webhook already ran, this is a no-op.

### 3. Backfill the stuck purchases (optional, on request)

The recent `cs_test_…` purchases are test sessions and look like test data, so by default we won't touch them. If desired, the same `reconcile-purchase` function can be invoked for each stuck purchase to either complete or expire them based on the Stripe session state.

## Technical details

- Files added: `supabase/functions/reconcile-purchase/index.ts` (and a `verify_jwt = true` block in `supabase/config.toml`).
- Files edited: `src/components/account/Purchases.tsx` (or wherever the `?success=1` redirect is handled) to invoke `reconcile-purchase` once with the purchase id from the query string.
- Email logic is **not** changed — same templates, same `send-transactional-email`, same idempotency keys, so this work is purely about making sure the trigger actually runs.

## What I need from you

1. Confirm whether the Stripe webhook for `stripe-purchase-webhook` is currently set up in your Stripe dashboard, and whether you're operating in **test** or **live** mode for these purchases. If you're not sure, I can walk you through verifying it in Stripe.
2. Confirm you want me to also add the client-side reconciliation safety net (recommended).
