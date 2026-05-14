## Problem

The "Forgot password" form runs `supabase.auth.resetPasswordForEmail(...)` with the correct redirect (`/reset-password`), and the route exists. But no email ever reaches the user.

Diagnosis:
- `notify.swappup.com` is verified for sending.
- The project has **no `auth-email-hook` edge function** (checked `supabase/functions/`).
- `email_send_log` has zero rows — no auth email has ever been sent.

Without the auth email hook, Supabase has nowhere to deliver auth emails on this project, so password reset, signup confirmation, and magic-link emails are silently dropped.

## Fix

1. Scaffold the Lovable auth email templates (creates `supabase/functions/_shared/email-templates/*` and `supabase/functions/auth-email-hook/`).
2. Apply Swappup branding to the templates: dark charcoal + gold accents, white email body, the existing logo from `public/`, "Swappup" wording, EN copy with a translatable layout. Match the recovery email CTA to "Reset your password".
3. Deploy `auth-email-hook` so Supabase routes recovery / signup / magic-link / email-change events through it and the queue.
4. Smoke-test by triggering "Forgot password" from the auth screen and verifying a row lands in `email_send_log` with `status = sent`.

## Small frontend hardening (`src/pages/ResetPassword.tsx`)

Two minor robustness fixes while we're touching the flow:

- The current "fallback to existing session" branch (lines 50-57) treats any pre-existing session as a valid recovery context. If a user is already signed in on the device and clicks the reset link, this could let them update the wrong account. Replace it with: only accept `PASSWORD_RECOVERY` event or an explicit recovery token in the URL — otherwise show "invalid link".
- After a successful `updateUser({ password })`, sign the user out and send them to `/` with a toast asking them to sign in with the new password (matches the toast copy and is the standard UX).

No DB or RLS changes are needed.

## Out of scope

- Transactional (non-auth) emails — not requested.
- Switching providers — Lovable Emails is the right path here since the domain is already delegated.
