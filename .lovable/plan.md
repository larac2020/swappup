## Current state

The scanner finding is **already partially addressed** — `get-name-change-fee` has both:
- `verify_jwt = true` in `supabase/config.toml`
- An in-function `auth.getUser()` check that returns 401 without a valid session

Anonymous attackers can no longer hit this endpoint. The remaining risk is an **authenticated** user spamming `force_refresh: true` to burn Firecrawl + Lovable AI credits. The scanner's own remediation note (#3) recommends rate-limiting `force_refresh` per airline as the next layer.

## Recommended fix (best practice, defense in depth)

Three small, layered changes:

### 1. Server-side cooldown on `force_refresh` (primary fix)

In `liveLookup` flow, before calling Firecrawl, check the cached row's `last_verified_at`. If a refresh happened in the last **60 minutes**, ignore `force_refresh` and return the cached value with a `refresh_throttled: true` flag. This caps live lookups at ~1/hour per airline+route globally, regardless of who calls it.

No new table needed — the existing `airline_change_fees.last_verified_at` column is the rate-limit source of truth.

### 2. Per-user rate limit on the endpoint (cheap secondary layer)

Add a lightweight per-user throttle: max **10 calls / minute / user** to the function, tracked in a new `edge_function_rate_limits` table (`user_id`, `function_name`, `window_start`, `count`) or reuse an existing pattern if one exists. Returns 429 on excess. Protects against an attacker who tries to rotate airlines.

### 3. Restrict `force_refresh` to staff (optional, strongest)

`force_refresh` is really an admin / data-curation feature. We could gate it behind a `has_role(auth.uid(), 'admin')` check and let normal users only consume the cache (which auto-refreshes at 30-day staleness anyway). This eliminates the abuse surface entirely.

## What I recommend you pick

- **Minimum viable:** Step 1 only. One-file change, eliminates 99% of the credit-burn risk with no schema work.
- **Recommended:** Steps 1 + 3. Cleanest — regular users can never trigger paid calls on demand, and the 30-day staleness check handles legitimate refresh needs automatically.
- **Belt-and-suspenders:** All three. Worth it only if the function will get more endpoints / public-ish surfaces later.

## Also worth doing while we're here

- Mark the `get_name_change_fee_unauth` scanner finding as **fixed** (the auth gate is already in place; the finding is stale).
- Update `@security-memory` to note the cooldown + role gate as the accepted pattern for paid-API edge functions, so the scanner doesn't re-flag this.

## Technical notes

- The cooldown check belongs **before** the Firecrawl fetch in `liveLookup` (or inline in the handler before calling it) so no paid call fires when throttled.
- 429 responses should include `Retry-After` header for good client behavior.
- If we add the rate-limit table, use a `SECURITY DEFINER` RPC `consume_rate_limit(_fn text, _limit int, _window_seconds int)` returning boolean — keeps RLS simple and the logic reusable across other paid-API functions (`verify-id`, `verify-voucher`, `verify-flight`, `parse-ticket`, `ai-search`).

Tell me which option (1, 1+3, or all three) you want and I'll implement it.