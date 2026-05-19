## Goal
Lock down the `purchases` table so no client (buyer or seller) can insert or modify rows directly — all mutations must flow through service-role edge functions. Fix the four related `purchases` / endpoint findings from the latest scan in one pass.

## Approach: Forbid all client modification

We will **not** try to restrict fields per-role. Postgres RLS cannot limit columns on UPDATE, and field-level triggers add complexity without benefit because every legitimate state change already has a dedicated edge function (`stripe-purchase-webhook`, `confirm-transfer`, `release-escrow`, `cancel-escrow`, `expire-transfers`). Service-role calls bypass RLS, so locking clients out fully is safe.

## Changes

### 1. Migration: lock down `purchases` RLS
- Drop the existing `"Users can create purchases"` INSERT policy (it targets `public` and lets clients craft arbitrary rows).
- Add explicit deny policies for authenticated users:
  ```sql
  CREATE POLICY "No client inserts on purchases"
    ON public.purchases FOR INSERT TO authenticated WITH CHECK (false);
  CREATE POLICY "No client updates on purchases"
    ON public.purchases FOR UPDATE TO authenticated USING (false);
  CREATE POLICY "No client deletes on purchases"
    ON public.purchases FOR DELETE TO authenticated USING (false);
  ```
- Keep existing buyer/seller SELECT policies untouched.
- Service role bypasses RLS, so `create-purchase-checkout` and all state-change functions continue working.

### 2. Edge function: `get-name-change-fee`
- Add `verify_jwt = true` in `supabase/config.toml`.
- Add `await userClient.auth.getUser()` check at top of handler.
- (Optional follow-up, not in this plan) Rate-limit `force_refresh` per airline.

### 3. Edge functions: scrub raw error messages
In the 10 listed functions, replace `(e as Error).message` in catch blocks with a generic `"An unexpected error occurred"` and keep `console.error(e)` for server-side logging. Known validation errors (e.g. `"Missing fields"`, `"Listing unavailable"`) stay as-is since they're intentional user feedback.

Files: `create-purchase-checkout`, `release-escrow`, `confirm-transfer`, `cancel-escrow`, `export-user-data`, `delete-account`, `create-setup-intent`, `check-payment-method`, `verify-flight`, `report-name-change-fee`.

### 4. Ignore the false positive
`flight_verifications_no_select_policy` is informational only — no client policy means no client access, which is correct. Mark as ignored with reason.

## Verification
1. Re-run Lovable security scan — expect `purchases_*` and `get_name_change_fee_unauth` cleared.
2. Run `supabase--linter` — confirm no new warnings.
3. Manual check from the browser console while logged in:
   ```js
   await supabase.from('purchases').update({status:'completed'}).eq('id', anyId)
   // → expect 0 rows affected / permission denied
   await supabase.from('purchases').insert({...})
   // → expect RLS violation
   ```
4. Smoke test: complete a purchase end-to-end (checkout → webhook → transfer confirm → escrow release) to confirm service-role paths still work.

## External review options (for your reference, not in scope)
- **`pgrls` / `pgTAP`** — write SQL assertions like "role authenticated cannot UPDATE purchases" that run in CI on every migration.
- **`pg_permissions` extension** — diff actual privileges against an expected manifest.
- **Third-party pen test** — Cure53, Trail of Bits, or NCC Group for a formal review if you're handling significant payment volume.
- **Supabase's own advisor** + this scanner cover ~90% of common RLS mistakes; the remaining gap is business-logic flaws that need human review.

## Out of scope
- Column-level RLS via triggers (rejected — edge functions already enforce this).
- Rate-limiting `get-name-change-fee` (separate follow-up).
- Changes to other tables — this plan only touches `purchases` policies and the listed edge functions.
