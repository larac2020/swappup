## Diagnosis

Three real bypasses / bugs today:

1. **`ProtectedRoute` doesn't enforce onboarding.** It only checks authentication. A signed-in Google user who lands on `/home` (deep link, welcome-email link, browser autocomplete, or any redirect target) gets in without ever touching `/onboarding`.
2. **`PublicRoute` on `/login` and `/sign-up`** sends any authenticated user to `/home` (or `?next=`) unconditionally — same bypass.
3. **Redirects rely on the localStorage flag as source of truth.** `Auth.tsx` and `Landing.tsx` both require `localStorage.flyswap_onboarding_complete === "true"` **AND** `profile.full_name && address_line1`. So a returning Google user on a fresh device / cleared storage — LS empty but DB profile complete — gets bounced back to `/onboarding`. The DB should be the source of truth; LS is only a fast-path cache.

The reason your Google signup ended on Landing was #1 + the missing Landing redirect (already fixed). The remaining holes let future Google users still skip onboarding.

## Fix

### 1. New shared helper — `src/lib/onboardingStatus.ts`
Single source of truth. Exports:
- `isProfileOnboarded(profile)` → `!!(profile?.full_name && profile?.address_line1)` (matches the current criterion used everywhere).
- `fetchOnboardingStatus(userId)` → queries `profiles` once and returns `{ onboarded: boolean }`. Also mirrors the result into `localStorage.flyswap_onboarding_complete` so downstream code (e.g. `ProductTour`) stays consistent.

### 2. Extend `ProtectedRoute` in `src/App.tsx` to enforce onboarding
- After the auth check, use react-query (`["onboarding-status", user.id]`) to call `fetchOnboardingStatus`.
- While the query is loading, keep the existing spinner.
- If `onboarded === false` **and** current path is not `/onboarding` → `<Navigate to="/onboarding" replace />`.
- If `onboarded === true` **and** current path **is** `/onboarding` → `<Navigate to="/home" replace />` (prevents completed users from re-entering the wizard).
- No changes to the ReacceptDialog behaviour.

This closes bypass #1 for every protected route in one place (`/home`, `/browse`, `/account`, `/sell`, `/listing/:id`, etc.).

### 3. Fix `PublicRoute` (bypass #2)
Same helper: when an authenticated user hits `/login` or `/sign-up`, resolve onboarding status before redirecting. Route to `/onboarding` if not onboarded, otherwise honor `?next=` or fall back to `/home`.

### 4. Simplify `Landing.tsx` and `Auth.tsx` (bug #3)
Replace the inline profile queries with `fetchOnboardingStatus(user.id)`. Drop the "AND localStorage flag" requirement — the DB decides. Keep the `?next=` / `state.from` handling in `Auth.tsx`; only apply it when onboarded.

### 5. Keep the LS flag as a cache, not a gate
- `Onboarding.tsx` continues to set `flyswap_onboarding_complete = "true"` on success (unchanged).
- `AuthForm.tsx` continues to clear it on signup (unchanged).
- `ProductTour.tsx` guard stays as-is; the helper writing the flag on successful profile checks means returning users on a fresh device still get the tour armed correctly.

## Verification (after build)

Drive Playwright with the injected Supabase session to confirm:
- Direct navigation to `/home` with an unfinished profile → redirects to `/onboarding`.
- Direct navigation to `/onboarding` with a completed profile → redirects to `/home`.
- `/login` while signed in and unfinished → `/onboarding`.
- Landing `/` while signed in and unfinished → `/onboarding` (regression check for last turn's fix).

## Files touched

- `src/lib/onboardingStatus.ts` (new)
- `src/App.tsx` (ProtectedRoute + PublicRoute)
- `src/pages/Landing.tsx` (use helper)
- `src/pages/Auth.tsx` (use helper)

## Out of scope

- Adding a `has_completed_onboarding` boolean column (current field-based check already works and keeps the migration surface small).
- Changing `/onboarding` steps, the welcome email, or the ProductTour trigger.
- Changing OAuth `redirect_uri` (already `window.location.origin`).
