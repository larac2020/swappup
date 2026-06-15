## Problem

After paying on Stripe, the buyer lands on `/login` instead of their new purchase. Two issues compound:

1. **`PurchaseDialog` opens Stripe in a new tab** (`window.open(url, "_blank")`). Stripe's `success_url` then loads `/account/purchases?open=…&success=1` in that new tab. In Lovable preview (and in any browser context where storage is partitioned), the new top-level tab does not share the iframe's `localStorage`, so the Supabase session is missing and `ProtectedRoute` redirects to `/login`.
2. **`ProtectedRoute` discards the intended URL** when redirecting unauthenticated users. Even after re-logging in, the buyer lands on `/home`, never on `/account/purchases?open=…&success=1`, so the existing `reconcile-purchase` safety net never runs and they don't see their ticket.

## Fix

### 1. Top-level redirect to Stripe instead of new tab
In `src/components/listings/PurchaseDialog.tsx`:
- Replace the `window.open(data.url, "_blank")` flow with `window.top!.location.href = data.url` (with `window.location.href` as the fallback). Stripe Checkout supports top-frame navigation from the Lovable preview iframe — the old "iframe blocks redirects to Stripe" comment is stale.
- This keeps the buyer in the same top-level browsing context for the entire round-trip (app → Stripe → app), so the Supabase session in `localStorage` is intact when they return, and `ProtectedRoute` passes.

### 2. Preserve the intended URL through login
In `src/App.tsx` (`ProtectedRoute`) and `src/pages/Auth.tsx`:
- When `ProtectedRoute` redirects to `/login`, pass the current `location.pathname + location.search` as React Router state (`state={{ from: location }}`) and as a `?next=` query param for safety.
- In `Auth.tsx`, after a successful sign-in, read `state.from` (or `?next=`) and `navigate(next, { replace: true })` instead of always going to `/home`. Restrict `next` to same-origin paths starting with `/` to avoid open-redirect.
- `PublicRoute` should also honor `?next=` when an already-authenticated user lands on `/login` (so the Stripe return tab, if the session *is* present, sails straight through to the purchase page rather than `/home`).

### 3. No backend changes
`success_url` and `cancel_url` in `create-purchase-checkout` stay as-is. The `reconcile-purchase` call already wired up in `Purchases.tsx` will now reliably fire on the success redirect because the buyer reaches that route.

## Files to change

- `src/components/listings/PurchaseDialog.tsx` — swap `window.open` for top-level redirect.
- `src/App.tsx` — `ProtectedRoute` passes `from`/`next`; `PublicRoute` honors `next`.
- `src/pages/Auth.tsx` — post-login navigation honors `state.from` / `?next=` with same-origin guard.

## Out of scope

- Stripe webhook configuration (tracked separately).
- The 6 stuck `cs_test_…` purchases (still pending; can be reconciled on request).
