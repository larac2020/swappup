## Goal

Add proper Terms of Service and Privacy Policy pages — accessible from the Account screen, the Auth signup form, and the purchase flow — and record that users have actually accepted them.

## Recommended approach

Treat the legal copy as **content, not data**: store it in versioned Markdown files in the repo and render it through a single shared `LegalPage` component. This is the standard pattern for SaaS apps because:

- Lawyers can review/diff plain Markdown in PRs.
- No DB round-trip, instantly available offline / on first paint.
- Easy to localize (one file per language).
- Versioning is just a `version` constant — when it changes, users are re-prompted to accept.

A DB-backed CMS is overkill here and would force a non-technical legal review through a custom admin UI.

## What gets built

### 1. Content files (Markdown, per language)

```text
src/content/legal/
  terms.en.md
  terms.it.md
  privacy.en.md
  privacy.it.md
  version.ts        // exports TERMS_VERSION = "2025-04-27", PRIVACY_VERSION = "2025-04-27"
```

Initial copy will be a **standard marketplace template** tailored to Swappup (peer-to-peer ticket resale, escrow flow, ID verification, GDPR — UK/EU). Clearly labeled "Template — review with legal counsel before launch".

### 2. New routes & shared component

- `/terms` and `/privacy` — public routes (no auth wall) so they can be linked from the signup screen and external sources.
- `src/components/legal/LegalPage.tsx` — renders a Markdown file with proper typography (prose styling), back button, "Last updated" date, and language-aware content selection via `useLanguage`.
- Use `react-markdown` + `remark-gfm` (small, already-common deps) for rendering.

### 3. Wire-up across the app

- **AuthForm signup**: replace `href="#"` placeholders with `<Link to="/terms">` / `<Link to="/privacy">` (open in new tab). Add a required checkbox: *"I accept the Terms of Service and Privacy Policy"* — block submit until checked. Save accepted versions to `profiles.terms_accepted_version` / `privacy_accepted_version` + timestamps on signup.
- **Account → Support section**: the existing `/terms` and `/privacy` items already point to these routes — they will start working automatically.
- **PurchaseDialog**: keep existing privacy checkbox but link "privacy risks" text to `/privacy`.
- **Re-acceptance on version bump**: on app load, if the logged-in user's stored accepted version is older than the current `TERMS_VERSION` / `PRIVACY_VERSION`, show a one-time modal asking them to re-accept before continuing.

### 4. Database (one migration)

Add to `profiles`:
- `terms_accepted_version text`
- `terms_accepted_at timestamptz`
- `privacy_accepted_version text`
- `privacy_accepted_at timestamptz`

No new table needed — keeping it on the profile is fine because we only need the *latest* accepted version per user. (If you ever need a full audit trail later, we can add a `legal_acceptances` table.)

### 5. Localization

Both EN and IT versions ship from day one, matching the existing i18n system. The `LegalPage` picks the file based on `language` from `useLanguage()`.

## Out of scope (call out explicitly)

- **Cookie banner / consent management**: separate concern (ePrivacy / GDPR cookies). Can be added next if needed.
- **Legal review**: the initial copy is a template. You will need a lawyer to review before going live, especially for UK/EU consumer-resale rules.
- **DB-backed CMS for editing in-app**: not built — edits happen via PR.

## Files to create / change

**Create**
- `src/content/legal/terms.en.md`, `terms.it.md`, `privacy.en.md`, `privacy.it.md`
- `src/content/legal/version.ts`
- `src/components/legal/LegalPage.tsx`
- `src/components/legal/ReacceptDialog.tsx`
- `src/pages/Terms.tsx`, `src/pages/Privacy.tsx` (thin wrappers)
- One migration for the four new `profiles` columns

**Edit**
- `src/App.tsx` — register `/terms` and `/privacy` as public routes; mount `ReacceptDialog` inside `ProtectedRoute`.
- `src/components/auth/AuthForm.tsx` — real links + required acceptance checkbox + write versions on signup.
- `src/components/listings/PurchaseDialog.tsx` — link the privacy notice text to `/privacy`.
- `src/i18n/translations.ts` — keys for the checkbox, re-accept modal, and page titles.
- `package.json` — add `react-markdown` and `remark-gfm`.
