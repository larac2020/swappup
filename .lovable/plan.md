## Cleanup: remove redundant Redirect URL allow-list entries

Two entries in **Cloud → Users → Authentication Settings → Redirect URLs** are already fully covered by their `/**` siblings and can be safely removed:

1. `https://swappup.com/*` — subsumed by `https://swappup.com/**`
2. `https://swappup.vercel.app` — subsumed by `https://swappup.vercel.app/**`

## What I will do

- Update the project's auth configuration to remove those two entries only.
- Leave all 8 other entries untouched (including `https://swappup.com/**`, `https://swappup.vercel.app/**`, Lovable-hosted, and preview URLs).
- Leave Site URL (`https://swappup.com`) unchanged.

## What I will NOT do

- No code changes (no `AuthForm.tsx`, no `Landing.tsx` edits).
- No changes to Google provider credentials or callback URLs.
- No DB migration, no edge function deploy.

## Verification

- Re-list the redirect URLs after the change and confirm the count dropped from 10 to 8 and neither removed entry is present.
- No user-facing behavior change expected — the remaining `/**` entries already permit every URL the removed entries permitted.
