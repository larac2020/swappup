## Goal

In each expanded purchase card on `/account/purchases`, add copy buttons, a downloadable ticket PDF, a separate receipt PDF, and a mobile share sheet.

## Behaviour

### 1. Copy buttons
Inline `Copy` icon button next to each of: Booking Ref, Surname, Passenger name on ticket, Flight/Train #. On click → write to clipboard via `navigator.clipboard.writeText`, show sonner toast "Copied to clipboard". Icon swaps to `Check` for ~1.5s as visual confirmation. Buttons sit at the right of the value, ghost variant, `size-icon` small.

### 2. Download ticket PDF
"Download ticket PDF" button shown only when `status === "transfer_confirmed"`, in the action row alongside "Confirm everything is ok" and "Report a problem". Generated client-side with `jspdf` (and `qrcode` for the QR). One-page A4 layout:
- Header: "swappup" wordmark + "Ticket details"
- Big route block: Origin city (airport) → Destination city (airport)
- Departure date/time, return date/time if present
- Airline / operator + flight / train number, class if present
- Booking reference (large, monospace)
- Passenger surname + full name
- QR code encoding `BOOKING:<ref>|SURNAME:<surname>` (helps the buyer at airline kiosks; clearly labelled "Reference QR")
- Footer: purchase id, generated date, "Use these details to access your booking on the airline's website."

Filename: `swappup-ticket-<bookingRef>.pdf`. Button shows spinner while generating, toast on done.

### 3. Receipt PDF (fiscal-style)
"Download receipt" button always shown when purchase has a price (independent of transfer status), as a small ghost button in the price row. One-page A4:
- Header: "swappup" + "Payment receipt"
- Buyer name + email (from profile)
- Purchase ID, date, status
- Itemised breakdown: Ticket price, Name change fee (if > 0), Total
- Currency in original currency
- Payment ID (Stripe reference) if present
- Escrow status line
- Footer note about VAT/non-fiscal nature

Filename: `swappup-receipt-<purchaseId>.pdf`.

### 4. Mobile share sheet
"Share" button (only rendered when `navigator.share` is available, so effectively mobile/PWA). Calls:
```ts
navigator.share({
  title: "My swappup ticket",
  text: `${route} on ${date}\nBooking: ${bookingRef}\nSurname: ${surname}`,
  url: window.location.href,
})
```
Falls back silently (button hidden) on desktop. Toast on cancel/error suppressed.

## Files to change

- `src/components/account/Purchases.tsx`
  - Add small `<CopyButton value={...} />` helper (defined inline at top of file).
  - Add `downloadTicketPdf(p, listing)` and `downloadReceiptPdf(p, listing, profile)` async helpers.
  - Add `shareTicket(p, listing)` helper guarded by `typeof navigator !== "undefined" && "share" in navigator`.
  - Wire into the expanded card: copy icons inline next to Booking Ref / Surname / Passenger name / Flight #; ticket-PDF + share buttons in the transfer-confirmed action row; receipt-PDF button in the price-breakdown row.
  - Extend the `profile` query to also select `full_name, email` for the receipt PDF.

## Dependencies

- `jspdf` (client-side PDF generation, ~50kb gzipped)
- `qrcode` (QR generation, tiny). Use the canvas / data URL API, embed via `doc.addImage(...)`.

Both added with `bun add`.

## Out of scope

- Calendar (.ics), status timeline stepper, confirm-release guard dialog, airline check-in deep links, server-side PDF signing — separate follow-ups.
- No backend changes; everything is client-side rendering of data already loaded.
