## Problem

The expanded purchase card only shows ticket details (route, airline, dates, booking ref, surname) when `status === "transfer_confirmed"`. For `pending`, `completed`, `pending_transfer`, and `refunded` purchases the body is effectively empty — only the small Receipt button row renders. That's why the expander looks blank.

DB confirms: the user's purchases are `completed` and `pending`.

## Fix

Always render a "Trip details" block in the expander (route, airports, airline/operator, flight #, departure, return, passengers, class). Then layer status-specific blocks on top:

```
[ Trip details ]                      ← always
[ Price breakdown · Receipt button ]  ← always
[ Status block ]                      ← varies by status
  - pending: "Payment processing" info
  - pending_transfer: existing warning + refund-if-expired
  - transfer_confirmed: existing booking credentials + actions
  - completed: booking credentials (read-only) + ticket PDF + share
  - refunded: "Refunded" muted info
[ Escrow info ]                       ← when held/authorized
```

Booking credentials (ref, surname, passenger name, copy buttons, ticket PDF, share) should appear whenever those fields exist on the purchase — which currently means `transfer_confirmed` or `completed` (post-release). That way the buyer can still grab their PDF and credentials after the escrow is released.

## Changes

- `src/components/account/Purchases.tsx`
  - Extract the trip-details `<div>` out of the `isTransferConfirmed` block; render it unconditionally inside the expanded body.
  - Extract the booking-credentials `<div>` (booking ref, surname, passenger name, payment proof) and render it whenever `p.transfer_booking_ref || p.transfer_surname` is set (covers both `transfer_confirmed` and `completed`).
  - Move ticket-PDF / Share buttons into a sibling action row that renders whenever credentials exist; keep "Confirm everything is ok" / "Report a problem" gated to `transfer_confirmed && escrow_status !== "released"`.
  - Add small status hint blocks for `pending` ("Payment is processing — we'll notify you when the seller starts the transfer") and `refunded` ("This purchase was refunded").

## Out of scope

No backend changes, no new dependencies.
