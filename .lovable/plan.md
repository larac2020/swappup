# Plan: post-signup redirect + welcome email

## 1. Fix the post-signup redirect

**Problem.** On mobile, `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` does a full-page redirect back to `/`. `Landing` is a public route with no auth-aware logic, so authenticated users just stay there instead of going to `/home` or `/onboarding`.

**Fix.** Make `Landing` route authenticated users the same way `Auth.tsx` does:

- In `src/pages/Landing.tsx`, read `useAuth()`.
- While `loading`, render the existing landing (no flash) or a small spinner — match the pattern in `Auth.tsx`.
- Once `isAuthenticated && user` is true, fetch the profile (`full_name`, `address_line1`) and:
  - If `localStorage.flyswap_onboarding_complete` is set AND profile looks set up → `navigate("/home", { replace: true })`.
  - Otherwise → `navigate("/onboarding", { replace: true })`.
- Do this in a `useEffect`, with a `cancelled` guard, mirroring `Auth.tsx` exactly so behavior stays consistent.

No change to `AuthForm.tsx`, `useAuth.ts`, or the OAuth call itself. This also fixes the case of an authenticated user manually navigating to `/`.

## 2. Welcome email on first profile creation

Sent once per user, for both email and Google sign-ups. Triggered server-side from the existing `handle_new_user` flow so it can't be skipped by the client closing the tab.

### 2a. New template

Create `supabase/functions/_shared/transactional-email-templates/welcome.tsx`:

- React Email component matching the brand (dark accent, gold CTA — same style tokens as the existing transactional templates).
- Props: `{ recipient: string; firstName?: string; siteUrl: string }`.
- Subject: "Welcome to Swappup".
- One CTA button → `${siteUrl}/onboarding` ("Complete your account").
- Short copy: welcome, what Swappup is, next step (finish 6-step onboarding to unlock buying/selling).
- Register in `_shared/transactional-email-templates/registry.ts` under template name `welcome`.

### 2b. Trigger from new profile

Add a `welcome_email_sent_at timestamptz` column on `public.profiles` (idempotency guard).

Update the existing `public.handle_new_user()` trigger function so that after the `INSERT INTO profiles`, it enqueues a call to the `send-transactional-email` Edge Function via `pg_net.http_post`, passing:

```json
{
  "templateName": "welcome",
  "recipientEmail": "<NEW.email>",
  "idempotencyKey": "welcome-<NEW.id>",
  "templateData": { "siteUrl": "https://swappup.com" }
}
```

Headers: service-role key from Vault (already used by other infra), `Content-Type: application/json`. The `idempotencyKey` plus the new `welcome_email_sent_at` check guarantees one send even on retries.

After a successful enqueue, set `welcome_email_sent_at = now()` on the new profile row.

### 2c. Deploy

Deploy `send-transactional-email` (no code change needed but redeploy picks up the new registry entry).

## Out of scope

- No email-verification email for Google sign-ups (Google already verified the address).
- No change to `auth-email-hook` or default Supabase auth emails.
- No change to OAuth `redirect_uri`.

## Technical notes

- Files touched: `src/pages/Landing.tsx`, `supabase/functions/_shared/transactional-email-templates/welcome.tsx` (new), `supabase/functions/_shared/transactional-email-templates/registry.ts`, one SQL migration (add column + update `handle_new_user`), redeploy `send-transactional-email`.
- The DB trigger uses `pg_net` (already enabled — used elsewhere for cron). Service-role key is read from the existing `email_queue_service_role_key` vault secret.
- `Landing` auth check uses the same `profiles` query shape as `Auth.tsx` to avoid divergent routing logic.
