## Goal

On `/account/purchases`, make each purchase a compact, clickable card that expands in place to reveal full ticket details. No new route.

## Behaviour

- Default (collapsed) card shows: airline icon, title, route (origin → destination), departure date, status badge, price, and a chevron indicating it's expandable.
- Click anywhere on the card header to toggle expand/collapse. One card can be open at a time (clicking another collapses the previous).
- Expanded card reveals the existing details block: pending-transfer warning, transfer-confirmed ticket details (route, airline, flight #, departure/return, passengers, booking ref, surname, payment proof, name on ticket), refund button when the deadline expired, escrow info, and the "Confirm everything is ok" / "Report a problem" actions.
- Smooth height transition on expand/collapse; chevron rotates 180°.
- Keyboard accessible: header is a `button`, supports Enter/Space, has `aria-expanded` and `aria-controls`.
- Deep link: support `?open=<purchaseId>` so the home banner / "Sold" shortcut / notifications can link straight to an already-expanded card. The card scrolls into view on mount when matched.

## Files to change

- `src/components/account/Purchases.tsx`
  - Add `expandedId` state (default to `searchParams.get("open")`).
  - Wrap the existing card body in a header button + collapsible content region.
  - Move route/date summary into the always-visible header; move everything else into the collapsible region.
  - Use a simple max-height/opacity transition (no new dependency) or `Collapsible` from `@/components/ui/collapsible` if already imported elsewhere — check first, prefer the existing primitive.
  - Add ChevronDown icon with `rotate-180` when open.

## Out of scope

- No changes to the data model, queries, or actions.
- No changes to the Sales / TransactionHistory views (can be a follow-up).
- No new detail route.
