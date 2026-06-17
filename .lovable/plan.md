## Goal

Stop emailing the buyer's full name and email address to the seller. These details must only be visible inside the swappup app (where the seller is authenticated and the data is already gated by `get_seller_purchases()` RPC + escrow status).

## Findings from audit

1. **Main offender — `supabase/functions/stripe-purchase-webhook/index.ts`** (≈lines 116–129): sends `buyerFullName` + `buyerEmail` + `buyerName` to the seller in `purchase-seller-action-required`.
2. **Same pattern — `supabase/functions/reconcile-purchase/index.ts`** (≈lines 150–160): mirror of the webhook used as a fallback. Identical leak.
3. **Email template `purchase-seller-action-required.tsx`**: includes a "Buyer details to use with the airline → Full name" block and uses `{buyer}` in the intro line. The buyer's name/email rendered here must go.
4. **`cancel-escrow/index.ts`** (lines 98): passes buyer's first name (`buyerName`) to the seller in `transfer-buyer-no-confirm-seller`. Lower-risk than full name + email, but still cross-party PII — remove for consistency.
5. **Seller reminders (`seller-reminders/index.ts`)**: already does NOT pass buyer fields — no change needed.
6. **In-app surfaces** (`MyListings.tsx`, `Purchases.tsx`, `TransferConfirmation.tsx`, PDF receipt in `purchaseHelpers.tsx`): already read through `get_seller_purchases()` which gates `buyer_full_name`/`buyer_email` to escrow statuses `authorized|pending_release|released|captured`. Keep as-is — this is the intended in-app exposure.

## Changes

### 1. Template — `supabase/functions/_shared/transactional-email-templates/purchase-seller-action-required.tsx`
- Remove `buyerName`, `buyerFullName`, `buyerEmail` from `Props` and from `previewData`.
- Rewrite EN/IT `intro1/intro2` strings so the sentence reads "Great news! Your ticket has just been sold. You have **24 hours** to update the airline booking with the buyer's name." (no `{buyer}` interpolation).
- Delete the "Buyer details to use with the airline" section entirely (the `buyerDetails` header, `fullName` row, and `originalRef` row are removed). The original booking ref is the seller's own data so it could stay, but to keep the template strictly focused on "go to app for buyer details" we drop the whole block.
- Add a short line above the CTA in both locales: "Open the app to see the buyer's name and reference to use with the airline." / "Apri l'app per vedere il nome e il riferimento dell'acquirente da usare con la compagnia."
- Keep CTA `Confirm the name change in the app` → `/account?tab=sales`.
- Remove the now-unused `buyerDetails`, `fullName`, `originalRef`, `buyer` dictionary entries.

### 2. Webhook — `supabase/functions/stripe-purchase-webhook/index.ts`
- In the `purchase-seller-action-required` invoke (≈line 119–128), remove `buyerFullName`, `buyerEmail`, and `bookingRef` from `templateData`. Keep `sellerName`, `nameChangeFee`, `deadline`, `trip`, `purchaseId`, `orderNumber`.

### 3. Reconcile — `supabase/functions/reconcile-purchase/index.ts`
- Apply the identical edit to the seller-action invoke (remove `buyerFullName`, `buyerEmail`, `bookingRef`).

### 4. Cancel-escrow — `supabase/functions/cancel-escrow/index.ts`
- In the `transfer-buyer-no-confirm-seller` invoke (line ~92–104), drop the `buyerName` field from `templateData`. The corresponding template should display a generic "your buyer" instead — verify and update `transfer-buyer-no-confirm-seller.tsx` to make `buyerName` optional and fall back to a generic noun in EN/IT (small adjustment, same dictionary pattern as the other template).

### 5. Deploy
- Deploy the three edge functions (`stripe-purchase-webhook`, `reconcile-purchase`, `cancel-escrow`) after edits, since email templates are bundled with the send function deployment chain.

## Out of scope / explicitly NOT changed

- Buyer-facing emails that include the buyer's own name (self-PII).
- Confirm-transfer email to the buyer (`buyerName` going to the buyer themselves).
- In-app display of buyer name/email in seller dashboard (`MyListings`, `Purchases`, `TransferConfirmation`, PDF receipt) — these are already correctly gated and are the intended replacement channel.
- The separate `profile_self_flag_bypass` and `transfer_proofs_seller_can_read_buyer_proof` findings — separate fixes.

## Acceptance

- After a Stripe purchase webhook fires, the seller's email contains no buyer name and no buyer email — only trip, deadline, order number, fee, and a CTA directing them to the app.
- The seller can still see buyer name + email inside the app under Account → Sales.
- The "buyer didn't confirm" seller email no longer addresses the buyer by name.
