
## Goal

Persist key ID document fields on the user profile, change the name-mismatch flow from a hard block to a confirm-or-retry choice, and surface expired-document warnings in the Account screen and on `/account/verification`.

## 1. Database — new profile columns

Migration adds nullable columns to `public.profiles`:

- `id_document_type` text (passport / national_id / driving_license / unknown)
- `id_document_country` text (ISO-3166 alpha-2 if detectable, else free text)
- `id_document_expiry` date
- `id_document_first_name` text
- `id_document_last_name` text
- `id_document_dob` date
- `id_document_number_last4` text (last 4 chars of doc number, for support reference — full number is intentionally not stored)

No RLS changes needed — `profiles` already restricts read/update to the owner.

## 2. `verify-id` edge function

Extend the Gemini tool schema with the new fields, all optional except those already required:

- `document_type` (already there)
- `issuing_country` (string, ISO-2 preferred)
- `expiry_date` (string, ISO `YYYY-MM-DD`)
- `first_name`, `last_name`
- `date_of_birth` (`YYYY-MM-DD`)
- `document_number` (full number; used in-memory to derive last4, never persisted by the function itself)

Also add an `is_expired` convenience boolean computed server-side from `expiry_date` vs `now()`. Returned in the existing `verification` payload.

## 3. `IDVerification.tsx` — upload flow

- After `verify-id` returns, if `name_matches_profile === false` (currently aborts) → open a confirm dialog:
  - "The name on the document (X) doesn't match your Swappup name (Y)."
  - Buttons: **"It's correct — proceed"** (continues to upload + save) and **"Upload again"** (resets the picker).
- On successful save, write the new fields to `profiles` alongside `id_document_url` and `verification_status: 'verified'`.
- If `verification.is_expired === true` at upload time → block with toast "This document is expired. Please upload a valid one." (no override; an expired ID is not acceptable proof).
- Add a red expiry banner at the top of the page when the stored `id_document_expiry` is in the past, with text: "Your ID document expired on {date}. Upload a new one to continue using Swappup." plus a CTA scrolling to the upload picker.

## 4. `Account.tsx` — verification entry

- Compute `idExpired = profile?.id_document_expiry && new Date(profile.id_document_expiry) < today`.
- When `idExpired` is true:
  - Show a small red dot / `AlertCircle` next to the "ID Verification" row.
  - Change the section badge from "Verified" to "Expired" with the destructive style.
  - Treat `sectionComplete.verification` as `false` so onboarding still nudges them.

## 5. Translations

Add EN/IT strings:
- `idNameMismatchConfirmTitle`, `idNameMismatchConfirmDesc`
- `idNameMismatchProceed`, `idNameMismatchUploadAgain`
- `idExpiredBanner`, `idExpiredOnDate`
- `accountIdExpired`
- `idDocExpiredBlock`

## Out of scope

- Storing the full ID number, machine-readable zone, or photo crop.
- Re-running verification automatically on a schedule.
- Migrating already-verified profiles — those rows will simply have the new columns null until users re-upload.

## Technical notes

- Use the migration tool for the schema; no GRANT changes needed (the columns sit on an existing table whose grants already cover them).
- Front-end fields go through the existing `profiles` update path in `uploadAndVerifyId`; no new RPC required.
- The expiry banner and the upload-time expired-document block are two distinct paths: banner = stored value expired; block = newly uploaded doc already expired.
