## Goal
Stop signed-in Google users from landing on the public marketing page after OAuth returns.

## Approach
Go with option (a): change the Google `signInWithOAuth` `redirectTo` in `src/components/auth/AuthForm.tsx` from `${window.location.origin}/` to `${window.location.origin}/home`.

Why (a) over (b):
- `Landing.tsx` already has the authenticated-redirect effect (added earlier), so option (b) is technically already in place — but it still causes a brief flash of the marketing page while `useAuth` + `fetchOnboardingStatus` resolve.
- Sending OAuth straight to `/home` skips the marketing render entirely. `/home` is wrapped in `ProtectedRoute`, which already:
  - waits for the session,
  - calls `fetchOnboardingStatus`,
  - redirects to `/onboarding` if the profile isn't complete, or renders `/home` if it is.
- No new logic, no duplication, no orphan route.

## Change
- `src/components/auth/AuthForm.tsx` line ~424: `redirectTo: \`${window.location.origin}/home\``.

## Out of scope
- Landing's existing authenticated-redirect effect stays (still useful as a safety net for any other path that lands a signed-in user on `/`).
- No changes to Supabase Auth redirect URL allow-list are needed as long as `https://swappup.com/home`, `https://swappup.vercel.app/home`, and the Lovable preview equivalents are covered by the existing wildcard entries (`.../**`) already configured. If any allow-list entry is exact-match only, add the `/home` variant there.

## Verification
- Sign in with Google on the live site → browser returns to `/home` (or is bounced to `/onboarding` by `ProtectedRoute` for incomplete profiles), never rendering the marketing landing page.
- Email/password login unaffected (that path already routes through `Auth.tsx` post-login logic).
