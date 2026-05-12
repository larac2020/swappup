## Goal

Restyle the booking-confirmation PDF (`downloadTicketPdf`) to match the swappup brand and add a personal greeting, support contact, and appropriate legal language. Apply the same brand polish to the receipt PDF for consistency.

## Brand mapping for print

PDFs print on white paper, so we adapt the dark-theme palette to a light, on-brand surface:

```
Background       white
Ink              #0F1116  (charcoal, mirrors --foreground inverted)
Muted ink        #6B7280
Brand gold       #F4A929  (hsl 38 92% 55% — primary)
Gold deep        #D98A0F  (hsl 28 90% 50% — accent end of brand gradient)
Soft gold tint   #FEF3DC  (background for headers/banners)
Success          #1FAD66
Danger           #C0392B  (used only on disclaimer accent)
Divider          #E6E6E6
```

Typography stays in jsPDF built-ins: Helvetica bold for headings (proxy for Space Grotesk), Helvetica normal for body. Booking ref stays in Courier bold for monospace credibility.

## Layout — Booking confirmation PDF

```
┌─────────────────────────────────────────────────┐
│  ▌swappup    Booking confirmation               │ ← gold left bar, brand wordmark
│              Order #ABCD-1234 · 12 May 2026     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Hi {first name},                               │ ← greeting block
│  Your purchase is confirmed. Use the booking    │
│  credentials below to retrieve your ticket on   │
│  the airline's website.                         │
│                                                 │
│  ┌─── Trip ────────────────────────────────┐    │
│  │ London (LHR) → Warsaw (WAW)             │    │
│  │ Wed, 24 Jun 2026 · 09:35                │    │
│  │ Wizz Air · W6 1234 · 1 passenger        │    │
│  │ Seller: Lara Cuttini                    │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─── Booking credentials ─────────────────┐    │ ← gold tint background
│  │ Booking reference                       │    │
│  │  ABC123                                 │    │ ← large mono
│  │ Surname            Passenger            │    │
│  │  BARBER             Mario Rossi         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Need help?                                     │ ← support box
│  Email   support@swappup.com                    │
│  Help    swappup.com/help                       │
│  Reply within 24h on business days              │
│                                                 │
├─────────────────────────────────────────────────┤
│  Disclaimer · swappup is a peer-to-peer market- │ ← legal footer (small grey)
│  place. This document confirms your purchase    │
│  on swappup; it is not a boarding pass and does │
│  not grant boarding rights. The airline ticket  │
│  is delivered by the seller via name change on  │
│  the original booking. Keep this confirmation   │
│  for your records.                              │
│                                                 │
│  Order ID · Generated dd-mm-yyyy hh:mm          │
└─────────────────────────────────────────────────┘
```

## Implementation details (`src/components/account/purchaseHelpers.tsx`)

- New `BRAND` color constants object at top of file (single source of truth).
- New `header()`: 14mm gold bar at top, "swappup" wordmark in charcoal, subtitle in muted; right-aligned order ref + date.
- New `section(doc, title, y)` helper that draws a small uppercase gold title with a 0.4mm gold underline (mimics the in-app section labels).
- New `panel(doc, x, y, w, h, fill)` helper for tinted boxes with 1mm rounded corners (`doc.roundedRect`).
- Greeting: derives first name from `profile.full_name?.split(" ")[0]` with fallback "there".
- Trip panel: light-grey fill, replaces current label/value rows; keeps existing fields plus seller name and 1-line summary up top (route, date, airline+flight, pax).
- Credentials panel: soft-gold fill, big Courier bold booking ref (24pt), surname + passenger side-by-side.
- Support block: 3 lines (email, help URL, response time). Both `support@swappup.com` and `https://swappup.com/help` rendered as gold-coloured links via `doc.textWithLink()`.
- Footer: thin gold rule, then small (8pt) grey disclaimer paragraph wrapped via `splitTextToSize`, then order ID + generated timestamp on the very last line.
- Drop the yellow disclaimer banner at the top — replaced by the polished footer disclaimer.
- Page-overflow guard: if `y > 270` after credentials, `doc.addPage()` and re-draw header before support/footer.

## Receipt PDF — same brand pass

Apply the same `header`, `section`, `panel`, `BRAND` helpers to `downloadReceiptPdf` so both documents look like one family. Add the same greeting and support block; keep payment details (currently the receipt's purpose) unchanged. Footer disclaimer for receipt: "Issued by swappup as proof of payment. Not a fiscal invoice. swappup is not the merchant of record for the underlying flight ticket."

## Legal disclaimer — recommendation

Yes, include a short disclaimer. Two reasons:

1. **Liability clarity** — swappup is a P2P marketplace; the airline ticket is the seller's, transferred via name change. Without a disclaimer a buyer might present the PDF at the gate or treat swappup as the carrier.
2. **Document classification** — clearly stating "not a boarding pass" and "not a fiscal invoice" prevents the confirmation/receipt being misused as either.

Proposed wording (kept short, plain English, no legalese):

> swappup is a peer-to-peer marketplace. This document confirms your purchase on swappup; it is not a boarding pass and does not grant boarding rights. Your airline ticket is provided by the seller via a name change on the original booking. For terms and consumer rights, see swappup.com/terms.

For the receipt, append: "Issued as proof of payment. Not a fiscal invoice."

We are **not** adding GDPR, refund-policy, or arbitration text to the PDF — those belong to Terms / Privacy pages already linked from the app, and bloating the PDF reduces readability.

## Out of scope

- No new dependencies, no logo image embedding (wordmark stays as Helvetica bold). If you want a real logo PNG embedded later, that's a follow-up.
- No i18n on the PDF text yet — strings stay in English, matching the existing helper.
- No changes to the in-app expander UI.
