# Finish email localization + add EN/IT preview toggle

## 1. Translate the remaining 5 transactional templates

Apply the same `dict + t(loc, dict, key, vars)` pattern already used in the 4 translated templates to:

- `transfer-confirmed-buyer-verify.tsx`
- `transfer-missed-buyer-apology.tsx`
- `transfer-missed-seller-warning.tsx`
- `transfer-buyer-no-confirm-seller.tsx`
- `escrow-released-seller.tsx`

Each template will:
- Accept an optional `locale: 'en' | 'it'` prop (default `'en'`)
- Define a local `dict = { en: {...}, it: {...} }`
- Replace all hardcoded English strings (subject, preview, headings, body, CTAs) with `t(loc, dict, key, vars)`
- Convert `subject` from a static string into a function `(data) => t(normalizeLocale(data.locale), dict, 'subject', vars)` in the registered `template` export
- Pass `locale` into `<EmailLayout>` so shared chrome (footer, trip card, support links) renders in the right language

## 2. Wire automatic locale lookup on send

In `supabase/functions/send-transactional-email/index.ts`:

- Before rendering the template, look up the recipient's `preferred_language` in `profiles` by `recipientEmail` (using the service role client).
- If found, inject it into `templateData.locale` (only if the caller didn't already pass an explicit `locale`).
- Use `normalizeLocale()` from the shared `i18n.ts` helper to coerce values.
- Fall back to `'en'` when no profile match or no preference is set.
- Pass the resolved locale into both the React render and the `subject` function.

This means every existing call site (`stripe-purchase-webhook`, `seller-reminders`, `expire-transfers`, `release-escrow`, `cancel-escrow`, etc.) automatically sends in the recipient's language with no code changes.

## 3. Add EN/IT toggle to the email preview pane

Update `supabase/functions/preview-transactional-email/index.ts`:
- Already accepts a `locale` query/body param — confirm it's threaded into both `templateData.locale` and the `subject` function.

Update the Cloud preview UI (the section the user is viewing under Cloud → Emails):
- Locate the preview component that calls `preview-transactional-email`.
- Add a small EN / IT segmented toggle above the rendered preview.
- Default to `en`; on change, re-invoke the preview function with the selected locale and re-render.
- Persist the selection in component state only (no DB write).

Note: this UI lives in the Lovable Cloud preview shell, not in the user's app code. If it turns out the preview UI isn't editable from the project (it's a platform surface), the fallback is to expose the toggle by making `preview-transactional-email` honor `?locale=it` so it can be tested via direct URL — and document that for the user.

## 4. Deploy

Deploy edge functions:
- `send-transactional-email`
- `preview-transactional-email`

## Technical notes

- No DB migration needed — `preferred_language` column already exists on `profiles`.
- No new dependencies.
- `subject` becoming a function is already supported by `TemplateEntry` (`string | ((data) => string)`).
- All translations will mirror the tone/structure of the 4 already-translated templates for consistency.
