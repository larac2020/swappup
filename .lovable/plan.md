# Security hardening — round 2

The first pass closed anonymous access. This round addresses cross-user data leaks **between authenticated users** that the rescan flagged.

## Findings to fix

1. **Profiles** — every authenticated user can read every profile, including email, phone, full address, postal code, ID document URL, verification status.
2. **Purchases** — sellers can read buyer PII (`buyer_email`, `buyer_full_name`, `stripe_payment_id`, `transfer_payment_proof_url`, etc.) on purchase rows.
3. **Flight verifications** — all authenticated users can read `raw_response` (raw third-party API payloads).
4. **Listing views** — sellers can see `viewer_id` for each view, which (combined with profile leaks) deanonymises viewers.

## Plan

### 1. Profiles → owner-only base table + safe public view

- Tighten the SELECT policy on `profiles` to **own row only** (`user_id = auth.uid()`).
- Create a `public_profiles` view exposing only non-sensitive columns:
  `id, user_id, full_name, avatar_url, verification_status, transactions_bought, transactions_sold, created_at`
  Grant `SELECT` to `authenticated`.
- Refactor the two places that read someone else's profile to query `public_profiles` instead:
  - `src/pages/ListingDetail.tsx` (seller card — currently `select("*")` on seller row)
  - `src/components/listings/TransferConfirmation.tsx` (seller full name)
  - any other cross-user reads found during implementation
- Own-profile reads (`Account`, `PersonalInfo`, `AddressInfo`, `Onboarding`, `Watchlist`, `Home`, `MyListings`, `SellTicket`, `Preferences`, `IDVerification`, `useProfileCompletion`, `useDisplayCurrency`, `ReacceptDialog`, `AuthForm`) continue to hit `profiles` directly — they already filter by `user_id = auth.uid()`.

### 2. Purchases → split buyer vs seller visibility

- Replace the single SELECT policy with two:
  - Buyers can read their own purchase rows (all columns).
  - Sellers can read their sales rows, but **only via a `seller_purchases` view** that masks buyer-side PII (`buyer_email`, `buyer_full_name`, `stripe_payment_id`, `transfer_payment_proof_url`, `original_booking_ref`).
- The view exposes the columns sellers actually need to fulfil a transfer (listing_id, quantity, total_price, status, escrow_status, escrow_deadline, transfer_deadline, seller_transferred flags, name_change_fee, transfer_booking_ref/surname provided by buyer for the rename, created_at).
- Update seller-facing reads (e.g. `Account` → `TransactionHistory`, `MyListings` order panels) to query `seller_purchases` when the user is acting as seller. Buyer-facing reads continue using `purchases`.

### 3. Flight verifications → service-role only

- Drop the authenticated SELECT policy; keep only `service_role` ALL.
- Confirm the app does not read this table from the client (it's populated and consumed by the `verify-flight` edge function). Any client read becomes an edge-function call.

### 4. Listing views → aggregate only

- Drop the seller SELECT policy that exposes `viewer_id`.
- Add a `SECURITY DEFINER` function `get_listing_view_counts(listing_ids uuid[])` returning `(listing_id, view_count, unique_viewer_count)` callable by `authenticated` and filtered to listings the caller owns.
- Update `MyListings` (and any analytics surface) to call this function instead of selecting rows from `listing_views`.

### Technical notes

- All new policies scoped to the `authenticated` role.
- `public_profiles` and `seller_purchases` are simple SQL views built on the base tables; they inherit RLS unless created with `security_invoker = true`. We'll use `WITH (security_invoker = on)` so the underlying RLS still applies, then add permissive policies on the base tables for these specific cross-user reads (e.g. `profiles` SELECT for authenticated limited via the view's column projection won't help on its own — so the safer pattern is `security_invoker = off` plus tight `GRANT SELECT` on the view only, which is what we'll do).
- `get_listing_view_counts` will be `SECURITY DEFINER`, `SET search_path = public`, and verify ownership via a join to `listings`/`profiles`.
- After the migration, the Supabase types file regenerates and a few TS reads need updating in the same pass — listed above.

## Out of scope

- Splitting profiles into separate `profiles_private` table (more invasive; the owner-only + view approach achieves the same protection).
- Buyer/seller chat or messaging changes.
- Re-issuing existing `id_document_url` values as signed URLs (column is already hidden from PostgREST; backend uses service role). We can address re-issuance in a follow-up if you want truly time-limited URLs.
