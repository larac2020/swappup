## How translations are stored

Translations are **not stored in the database**. They live entirely in the frontend as TypeScript dictionaries:

- `src/i18n/translations.ts` — main `translations` object keyed by locale (`en`, `it`), ~2,000 lines. Used everywhere via `t("key")`.
- `src/i18n/marketingContent.ts` — structured content (headers, footer, About, FAQ, meta tags) keyed by locale, used by the marketing site.
- `src/content/legal/{terms,privacy}.{en,it}.md` — raw markdown files imported via `?raw` for the legal pages.
- `remotion/src/copy.ts` — separate copy for the promo video.

Runtime mechanics (`src/i18n/LanguageContext.tsx`):
- The active locale is held in React state and persisted in `localStorage` under the key `flyswap_language`.
- The toggle (`LanguageToggle`, `MarketingHeader`) only flips that key — no network call, no DB row.
- The only locale-related data that touches the database is the user's notification language preference (used by edge functions when sending emails); it does not drive UI text.

## Pages with missing / partial Italian

Pages that **never call `useLanguage`** and ship English-only strings:

1. **`src/pages/Auth.tsx`** (`/login`, `/sign-up`) — the page shell is empty, but the underlying **`src/components/auth/AuthForm.tsx`** has many hardcoded English strings (toasts like "Enter your email", "Welcome back!", "Account created!", subtitles "Welcome back. Sign in to continue.", "Create an account to start trading tickets.", button labels "Sending…", "Signing in…", "Creating account…", "Resend verification email", etc.). This is the page you noticed.
2. **`src/pages/Onboarding.tsx`** — the entire 6-step mandatory account setup is hardcoded in English (labels, helper text, errors, step titles).
3. **`src/pages/ResetPassword.tsx`** — password reset screen, all copy + toasts in English.
4. **`src/pages/Support.tsx`** — support page hero, search box, FAQ accordion, contact cards.
5. **`src/pages/Unsubscribe.tsx`** — email unsubscribe confirmation states ("loading", "valid", "already", "done", error messages).

Pages that **partially** use translations but still contain hardcoded English:

6. **`src/components/auth/PasswordChecklist.tsx`** — used by sign-up and reset-password; criteria labels are English-only.
7. Various toast `description` strings sprinkled across otherwise-translated pages (`SellTicket`, `Account`, `MyListings`, `ListingDetail`, `Cart`, `Watchlist`) — not a full page, but worth a sweep.

Pages that are **fine** (fully translated): `Landing`, `About`, `Faq`, `Home`, `Browse`, `Cart`, `Watchlist`, `MyListings`, `Account`, `ListingDetail`, `SellTicket` (shell), `NotFound`, plus `Terms`/`Privacy` (via `LegalPage` which picks the IT markdown file).

## Suggested next step

If you want, I can switch to build mode and add Italian translations for the highest-impact gap first — **AuthForm + Auth page** (sign-up/login/forgot-password), since that is the first authenticated touchpoint and the one you hit. After that we can tackle `Onboarding`, then `ResetPassword`, `Support`, `Unsubscribe`, and the `PasswordChecklist` component. Let me know which scope you want and I'll produce a build plan.