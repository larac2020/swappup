## Problem

The email verification link sends users to the Lovable preview domain instead of `swappup.com` after clicking "Verify Email".

## Root cause

The confirmation link in the email is built by Supabase Auth. It opens a Supabase verify endpoint, which then redirects the browser to whatever URL was passed as `emailRedirectTo` at signup — and falls back to the project's **Site URL** if that URL isn't on the allow-list.

Two things are causing the Lovable redirect:

1. **Supabase Site URL** is still set to the Lovable preview/sandbox URL (default when Cloud was provisioned), not `https://swappup.com`.
2. **Redirect allow-list** likely does not include `https://swappup.com/*`, so even though `AuthForm.tsx` passes `emailRedirectTo: \`${window.location.origin}/\``, Supabase rejects it and falls back to the (wrong) Site URL.

The email template itself is fine — it just renders `payload.data.url` which Supabase generates.

## Fix

1. Update Supabase Auth configuration:
   - **Site URL** → `https://swappup.com`
   - **Additional Redirect URLs** → add:
     - `https://swappup.com/*`
     - `https://id-preview--8667995e-0eb4-4dee-8a0e-18230d650bad.lovable.app/*` (so the in-editor preview still works)
     - `http://localhost:*/*` (local dev, optional)

2. Keep `emailRedirectTo: \`${window.location.origin}/\`` in `src/components/auth/AuthForm.tsx` (no code change needed). With the allow-list updated, Supabase will honor it; users who signed up on swappup.com get sent back to swappup.com, users in the preview get sent back to the preview.

3. No change to `auth-email-hook` or `signup.tsx` — they correctly forward the URL Supabase generates.

## Technical notes

- Site URL / redirect URL changes are done via the auth configuration tool (no migration, no code edit).
- Existing verification emails already sent will still redirect to the old Site URL — only newly-sent emails get the fix.
- After the change, ask a tester to request a fresh verification email to confirm the link lands on `swappup.com`.
