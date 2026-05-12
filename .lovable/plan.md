# Plan: per-recipient localized emails (EN + IT)

The app currently picks language client-side from `localStorage`. To send emails in the right language we need to (1) persist that preference server-side, (2) make every email template render in EN or IT, and (3) resolve the recipient's language at send time.

## 1. Persist user language preference

- New migration: add `preferred_language text not null default 'en' check (preferred_language in ('en','it'))` to `public.profiles`.
- Update `src/i18n/LanguageContext.tsx`: when an authenticated user changes language, also write it to `profiles.preferred_language`. On login, hydrate `localStorage` from the profile so the choice follows the account across devices.
- New users: copy the current `localStorage` value into the profile on first auth.

## 2. Translate the 9 transactional templates

Files in `supabase/functions/_shared/transactional-email-templates/`:
- `_layout.tsx` (chrome: "Need help?", footer disclaimer, "Manage email preferences", "Unsubscribe")
- `purchase-buyer-confirmation.tsx`
- `purchase-seller-action-required.tsx`
- `seller-reminder-start.tsx`
- `seller-deadline-warning.tsx`
- `transfer-confirmed-buyer-verify.tsx`
- `transfer-missed-buyer-apology.tsx`
- `transfer-missed-seller-warning.tsx`
- `transfer-buyer-no-confirm-seller.tsx`
- `escrow-released-seller.tsx`

Approach:
- Add a tiny in-file translation helper in `_shared/transactional-email-templates/i18n.ts` exporting `type Locale = 'en' | 'it'` and a `t(locale, dict)` helper. Each template defines a local `dict = { en: {...}, it: {...} }` object — kept inside the template file so copy + translation live together.
- Every component accepts a `locale?: Locale` prop (default `'en'`).
- `_layout.tsx`'s `EmailLayout`, `TripCard`, and the shared `TripDetails` labels (e.g. `escrowAmountLabel`, "Your purchase details", "Order number", "Route", "Departure", "Return", "Airline", "Passengers", "Booking reference", "New name on the booking", "Amount paid…") become locale-aware.
- `subject` becomes a function of `data` (already supported by the registry) so the email subject is also translated based on `data.locale`.
- Each template's `previewData` includes both `locale: 'en'` and we add a sibling preview entry for `it` so the dashboard preview can show both — done by extending `registry.ts`'s `TemplateEntry` to optionally accept `previewVariants?: Record<string, Record<string, any>>`. Non-breaking.

## 3. Resolve recipient language at send time

In `supabase/functions/send-transactional-email/index.ts`:
- After resolving `effectiveRecipient`, look up `profiles.preferred_language` for that email (case-insensitive). Fall back to `templateData.locale` if provided by the caller, then to `'en'`.
- Inject the resolved `locale` into `templateData` before rendering and before calling the `subject` function.

No call-site changes required — the function infers the locale automatically. Callers (escrow flow, expire-transfers, cancel-escrow, seller-reminders, etc.) keep working unchanged.

## 4. Auth emails (signup, magic-link, recovery, invite, email-change, reauthentication)

Auth emails are currently the Lovable defaults — no custom templates exist yet.

- Scaffold the 6 auth templates via the email setup tool.
- Apply the same brand styling already used by the transactional templates (gold/charcoal, swappup wordmark, white body).
- Auth hook only knows the recipient email; it cannot pass `templateData`. So inside `auth-email-hook` we will look up `profiles.preferred_language` by recipient email (same helper as transactional) and pass `locale` as a prop to the React Email component.
- Each of the 6 templates ships an EN + IT dict in the same file, identical pattern to transactional templates.
- Subjects are also localized (the auth-email-hook builds the subject string from a per-template `subject(locale)` helper exported by each template).

## 5. Deploy

- Migration applied automatically.
- Redeploy `send-transactional-email`, `preview-transactional-email`, and `auth-email-hook`.

## Out of scope
- Adding more languages beyond EN/IT (architecture allows it; just not populated).
- Translating Stripe receipt emails (Stripe-managed, not ours).
- Re-translating `src/i18n/translations.ts` (in-app copy already translated).

## Technical notes (for reference)

- Translation lives in template files, not a central JSON, to keep each email's copy + layout co-located and reviewable in one diff. A small `i18n.ts` helper is the only shared piece.
- `subject` already supports `(data) => string` in the registry — no schema change needed for that.
- The `display_from_root` / sender domain config and unsubscribe footer are unchanged.
- `preferred_language` defaults to `'en'` so existing rows stay safe; new IT users who switch language in the UI will be persisted on their next language change.
