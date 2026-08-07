## Goal

Eliminate the flash between Google sign-in and landing on `/home` or `/onboarding` by reading onboarding status from the session, and replace the blank spinner with a branded loader.

## Security note (confirmed)

`user_metadata.onboarded` is a **routing hint only**. All real gates remain server-side:
- Listing creation, purchases, and ID verification read `profiles` directly.
- `prevent_protected_profile_updates` trigger locks `has_payment_method` / `verification_status` to the service role.
- If a user tampers with their metadata flag, they just skip the onboarding wizard and hit the same server-side blocks the moment they act.

## Root cause

`ProtectedRoute` / `PublicRoute` in `src/App.tsx` render a spinner until `fetchOnboardingStatus` finishes a `profiles` query. On OAuth return the session hydrates first, then the query runs — producing the flash.

## Changes

### 1. Onboarding status in auth metadata

Update `src/lib/onboardingStatus.ts`:
- `readOnboardedFromUser(user)` — synchronous `user.user_metadata?.onboarded === true`.
- `markOnboardedInMetadata()` — `supabase.auth.updateUser({ data: { onboarded: true } })`.
- Keep `fetchOnboardingStatus` as the legacy DB fallback; when it detects a completed profile, also call `markOnboardedInMetadata()` so the round-trip happens at most once per legacy user.

In `src/pages/Onboarding.tsx`, when the flow reaches the "success" step (profile + address saved), call `markOnboardedInMetadata()` and invalidate `["onboarding-status", user.id]`.

### 2. Prefer metadata in route guards

In `src/App.tsx` (`ProtectedRoute`, `PublicRoute`) and `src/pages/Auth.tsx`:
- Compute `metadataOnboarded = readOnboardedFromUser(user)` synchronously.
- Only run `useQuery(fetchOnboardingStatus)` when `isAuthenticated && !metadataOnboarded`.
- Decision uses `metadataOnboarded || onboardingStatus?.onboarded`.

New Google sign-ups (no flag yet) briefly show the branded loader while the one-time DB check runs, then redirect and write the flag. Returning users route synchronously with no DB call.

### 3. Branded loader

Add `src/components/layout/BrandedLoader.tsx`: full-screen dark background, centered Swappup logo (`@/assets/swappup-logo.png`) with a subtle pulse and the existing gold spinner underneath. Replace the three ad-hoc spinner blocks in `src/App.tsx` and `src/pages/Auth.tsx` with `<BrandedLoader />`.

## Out of scope

- No auth-provider, RLS, or `profiles` schema changes.
- `useProfileCompletion` is unchanged (it drives the account UI, not the onboarding gate).
