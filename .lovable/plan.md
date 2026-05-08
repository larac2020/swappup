
# Trustworthy name-change fee (anti-overcharge)

## Problem

Today the seller types the name-change fee in a free input. Because the buyer pays this fee on top of the ticket price (held in escrow), a seller can inflate it and pocket the difference. We need a flow where the platform is the source of truth, and the seller can only contest — not freely set — the amount.

## New flow

```text
1. Seller picks airline + fare type
2. Platform calls get-name-change-fee → returns { fee, currency, source_url, confidence, last_verified_at }
3. UI shows a LOCKED suggested fee (read-only) with the source link & "verified X days ago"
4. Seller has two choices:
   a) "This is correct" → fee is locked in, listing proceeds
   b) "Report as inaccurate" → opens a small form (proposed fee + optional screenshot URL/note),
      triggers a background re-verification (force_refresh on get-name-change-fee)
5. After re-verification:
   - If the re-checked platform fee differs from the original → use the new platform fee, notify seller
   - If platform fee is unchanged → keep platform fee; seller's proposal is recorded as a
     "fee dispute" for moderation but NOT applied to the listing
6. Hard cap: listing.name_change_fee can NEVER exceed the most recent platform-verified fee
   for that airline+route. Enforced by a DB trigger so it can't be bypassed via the API.
```

The seller therefore can never push the fee above what the platform's automated verification finds on the airline's official site.

## Changes

### Database
- New table `name_change_fee_disputes`: `id, listing_id (nullable), seller_id, airline_code, route_type, platform_fee, proposed_fee, evidence_url, note, status (open/resolved/rejected), created_at, resolved_at`. RLS: sellers can insert/select their own; service role manages.
- New trigger `enforce_name_change_fee_cap` on `listings` BEFORE INSERT/UPDATE: if `name_change_fee` is set, look up the latest `airline_change_fees` row for that airline+route and reject if `name_change_fee > fee_amount` (or `fee_max` when present). Raises `FEE_CAP` error.

### Edge functions
- `get-name-change-fee` (existing) — already supports `force_refresh`; reuse as-is.
- New `report-name-change-fee` — validates JWT, inserts a `name_change_fee_disputes` row, calls `get-name-change-fee` with `force_refresh: true`, returns `{ updated: boolean, newFee, oldFee }` so the UI can react immediately.

### Frontend
- `src/components/listings/TransferabilityCheck.tsx`
  - Replace the editable `Input` with a read-only "Platform-verified fee" card showing fee, currency, source link, and last verified date.
  - Add two buttons: "This is correct" (acknowledge) and "Report as inaccurate".
  - "Report as inaccurate" opens a small inline form (proposed fee + evidence URL + note) → calls `report-name-change-fee`. While loading, show "Re-checking the airline website…". On response, refresh the displayed platform fee; if it changed, surface a toast "We updated the fee to £X based on a fresh check." If unchanged, show "We re-checked the airline site and confirmed £X. Your report has been logged for review."
  - The seller's proposed value is never written to `listings.name_change_fee`.
- `src/pages/SellTicket.tsx` — keep using `effectiveFee` from `onResult`, which now always equals the platform fee.
- Buyer side (`PurchaseDialog`, escrow totals) — no logic change; they already use `listings.name_change_fee`.

### Why this prevents overcharging
1. The input field is gone — the seller cannot type a number that lands in the listing.
2. The DB trigger enforces a hard upper bound from `airline_change_fees`, so even a malicious client patch can't bypass it.
3. The reporting path forces a fresh, automated check against the airline's site rather than trusting the seller. Disputes are logged for moderator review and to improve future verifications.

## Out of scope
- Moderator UI for resolving disputes (data is captured; UI can come later).
- Per-fare-class differentiation beyond what `get-name-change-fee` already returns.
- Refund logic if the actual fee charged by the airline turns out lower than the cap (could be handled later via partial escrow release).
