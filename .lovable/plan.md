# Fix Purchase Flow End-to-End

Implement the 6 critical fixes identified in the audit, in order of dependency.

## 1. Notifications via Edge Function (service role)

Create `supabase/functions/send-notification/index.ts` that validates the caller's JWT, then inserts into `notifications` using the service role (bypassing the RLS that only allows `service_role` to insert).

Replace every direct `supabase.from('notifications').insert(...)` call in `PurchaseDialog.tsx`, `TransferConfirmation.tsx`, and `Purchases.tsx` with `supabase.functions.invoke('send-notification', { body: { user_id, title, message, type, listing_id } })`.

## 2. Real Stripe payment with manual capture (true escrow)

- New edge function `create-purchase-checkout`: validates buyer != seller, validates listing is active and has stock, creates a Stripe Checkout Session in `mode: "payment"` with `payment_intent_data: { capture_method: "manual" }` so funds are authorised but not captured until the buyer confirms receipt. Stores a `pending` purchase row (service role) with `stripe_payment_id` = session id, `escrow_status: "authorized"`, `transfer_deadline` = now + 24h.
- New edge function `stripe-purchase-webhook` handling `checkout.session.completed` → updates purchase to `pending_transfer`, decrements `listings.ticket_count`, sets `is_active = false` if count hits 0, and notifies the seller.
- New edge function `release-escrow`: called when buyer confirms receipt. Captures the PaymentIntent, marks purchase `completed`, increments `profiles.transactions_sold` (seller) and `transactions_bought` (buyer), notifies both parties.
- New edge function `cancel-escrow`: called on seller no-show after deadline or buyer-reported failure. Cancels the PaymentIntent (releases the hold), marks purchase `refunded`, reactivates the listing, notifies buyer.

`PurchaseDialog.tsx` is updated to call `create-purchase-checkout` and redirect to Stripe Checkout instead of inserting purchases directly.

## 3. Listing deactivation + stock guard

Database trigger `before_purchase_insert` on `purchases`:
- Reject if `buyer_id = seller_id` (`SELF_PURCHASE`).
- Reject if listing `is_active = false` or `ticket_count < quantity` (`OUT_OF_STOCK`).

Stock decrement and `is_active` flip happen in the webhook (step 2) using service role.

## 4. Buyer "Confirm receipt" UI

Update `Purchases.tsx`:
- For purchases in `pending_transfer` with `seller_transferred = true`, show a "Confirm I received the ticket" button → calls `release-escrow`.
- Show a "Report problem" button → opens a dialog, calls `cancel-escrow` with reason.
- Show live countdown to `transfer_deadline`; once passed and seller hasn't transferred, show "Request refund" → calls `cancel-escrow`.

## 5. Scheduled deadline enforcement

New edge function `expire-transfers` that selects purchases past `transfer_deadline` still in `pending_transfer` and calls the cancel logic for each. Schedule via `pg_cron` + `pg_net` to run every 15 minutes.

## 6. PII protection

Update `purchases` SELECT RLS so that `buyer_full_name` and `buyer_email` are only returned to the seller AFTER `escrow_status = 'authorized'` (i.e. payment is real). Done by replacing the policy with one that returns the row but masking via a security-definer view `purchases_for_seller` that nulls these fields until payment is authorised. Frontend reads from the view for seller-side displays.

## Technical details

**New tables / migrations**
- Trigger `prevent_self_purchase_and_check_stock` on `purchases` BEFORE INSERT.
- View `purchases_seller_view` (security_invoker) exposing masked PII.
- pg_cron job invoking `expire-transfers` every 15 min.

**New edge functions**
- `send-notification` (verify_jwt in code)
- `create-purchase-checkout`
- `stripe-purchase-webhook` (verify_jwt = false, signature-verified)
- `release-escrow`
- `cancel-escrow`
- `expire-transfers`

**Secrets needed**
- `STRIPE_WEBHOOK_SECRET` — must be added after the webhook function URL is generated and registered in Stripe dashboard.

**Frontend touched**
- `src/components/listings/PurchaseDialog.tsx` — redirect to Stripe instead of direct DB insert.
- `src/components/listings/TransferConfirmation.tsx` — switch notifications to edge function.
- `src/pages/Purchases.tsx` — add confirm/report/refund actions and countdown.
- New page `src/pages/PurchaseSuccess.tsx` and `PurchaseCanceled.tsx` for Stripe redirects.

## Out of scope
- Disputes / partial refunds workflow.
- Multi-currency handling (assumes EUR).
- Email notifications (in-app only for now).
