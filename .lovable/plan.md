
# RLS & Storage Audit (read-only, no changes)

Verified live against the database. Nothing below has been modified.

## 1. `public.purchases`

- **RLS:** enabled.
- **Policies:**
  - **SELECT** — "Buyers can view their own purchases": only the buyer (matched via `profiles.user_id = auth.uid()`) can read a row. **Sellers have no direct SELECT policy.**
  - **INSERT** — blocked for all clients (`with_check = false`). Only service role (edge functions) can insert.
  - **UPDATE** — blocked for all clients (`using = false`). Only service role can update.
  - **DELETE** — blocked for all clients.
- **Cross-user access:** Buyers can only see their own rows. Sellers read their sales exclusively via the `get_seller_purchases()` SECURITY DEFINER RPC, which whitelists non-PII columns (buyer email/name and payment identifiers excluded). All writes are server-side only.
- **Flags:** None. This is the correct pattern — client is read-only + PII-safe, mutations go through edge functions.

## 2. `public.fraud_cases`

- **RLS:** enabled.
- **Policies:**
  - **SELECT** — "Seller can view own fraud case": a seller can read a case where they are the `seller_id`.
  - **ALL (SELECT/INSERT/UPDATE/DELETE)** — "Admins manage fraud cases": users with `has_role(auth.uid(), 'admin')` have full access.
- **Cross-user access:** A non-admin authenticated user cannot see anyone else's case. Only admins can write. Creation from the app happens through SECURITY DEFINER RPCs (`admin_ban_seller`, `admin_resolve_fraud_case`) and the `report-fraud-attempt` edge function.
- **Flags:** None. Note the `ALL` admin policy relies on the `user_roles` table + `has_role()` (correct separated-role pattern — no self-elevation vector).

## 3. `public.profiles`

- **RLS:** enabled.
- **Policies:**
  - **SELECT** — "Users can view their own profile": `auth.uid() = user_id`.
  - **INSERT** — "Users can insert their own profile": `with_check auth.uid() = user_id`.
  - **UPDATE** — "Users can update their own profile": `auth.uid() = user_id`. **No `WITH CHECK`**, but column-level protection is enforced by the `prevent_protected_profile_updates` BEFORE UPDATE trigger, which rejects non-service-role writes to `has_payment_method`, `verification_status`, transaction counters, ID document fields, `account_status`, `payouts_frozen`, and `fraud_case_id`.
  - **DELETE** — none (denied by default).
- **Cross-user access:** A user can only read/update their own profile row. Sensitive fields cannot be self-elevated (guarded by trigger). Public reads of other users' names/avatars go through the `get_public_profiles()` SECURITY DEFINER RPC.
- **Flags to be aware of** (not necessarily bugs):
  - The UPDATE policy has no `WITH CHECK`, so in theory a user could try to change `user_id` to another UUID. In practice this is blocked because the row-level `USING` clause still requires `auth.uid() = user_id` on the *old* row and the trigger rejects protected-column changes — but adding `WITH CHECK (auth.uid() = user_id)` would be belt-and-suspenders and worth considering before external testing.
  - Because there is no admin SELECT policy, admins cannot see other users' profiles from a normal client session; admin flows currently rely on edge functions using the service role.

## 4. Storage bucket `id-documents`

- **Public:** `false` — direct URLs return 400/403; access requires a signed URL or an authenticated request that passes RLS.
- **Policies on `storage.objects`:**
  - **SELECT / INSERT / UPDATE / DELETE** — all scoped to `(storage.foldername(name))[1] = auth.uid()::text`, i.e. files must live under `{userId}/...`.
- **Cross-user access:** An authenticated user cannot list, read, overwrite, or delete another user's ID document. Server-side verification uses the service role, which bypasses RLS as expected.
- **Flags:** Policies target the `public` role rather than `authenticated`. `auth.uid()` is `NULL` for anon so the `=` clause fails and nothing leaks, but tightening the role to `authenticated` would be cleaner. Not a live vulnerability.

## 5. Storage bucket `transfer-proofs`

- **Public:** `false`.
- **Policies on `storage.objects`:**
  - **SELECT (buyers)** — allowed only if a `purchases` row exists where `transfer_payment_proof_url` or `name_change_proof_url` ends with the object name AND the requesting user is the buyer.
  - **SELECT (sellers)** — allowed only for objects where the first path segment equals the seller's `auth.uid()` (i.e. they uploaded it).
  - **INSERT / UPDATE (sellers)** — restricted to `{sellerUserId}/{purchaseId}-...` paths AND requires a matching `purchases` row where the seller owns it.
  - **DELETE** — sellers can delete only files under their own `{userId}/` folder.
- **Cross-user access:** Buyers see only proofs tied to purchases where they are the buyer. Sellers see only files they themselves uploaded — they cannot read buyer-uploaded proofs. Path-based checks are anchored to `auth.uid()`.
- **Flags:**
  - Buyer SELECT uses a `LIKE '%' || objects.name` match against the stored URL. Because seller uploads are constrained by INSERT policy to `{sellerId}/{purchaseId}-...` paths, name collisions across purchases are effectively impossible, so this is safe in practice — but exact-match on the stored path would be marginally more robust.
  - Same "role = public" vs. `authenticated` observation as above.

## Overall verdict

No open cross-tenant read/write paths on any of the five surfaces. Storage buckets are private and correctly owner-scoped. Main tightening opportunities before external testing (all optional, none blocking):

1. Add `WITH CHECK (auth.uid() = user_id)` to the profiles UPDATE policy.
2. Change storage policies from role `public` to role `authenticated`.
3. Consider exact-path match (instead of `LIKE '%'||name`) in the buyer transfer-proof SELECT policy.

If you'd like, I can turn any of those three into a follow-up plan.
