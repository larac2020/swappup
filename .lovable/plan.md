## Context: airline name-change reversal reality

Quick research on the major airlines you operate with:

- **Ryanair / easyJet / Wizz / low-cost carriers**: name changes are paid, treated as a brand-new ticket update. There is **no free "undo" window** — reverting to the original passenger means paying the same name-change fee again (or losing the ticket entirely on some fares).
- **Legacy carriers (BA, Lufthansa, Air France, AA, Delta, Air Canada, Qantas)**: most do not allow true *name changes* at all, only *minor name corrections* (typos, marital surname). A full reversal usually requires ticket re-issue at full fare difference.
- **24-hour DOT rule (US)**: only applies to *cancellations* of newly booked tickets, not to undoing name changes on resold tickets.

**Conclusion:** there is no realistic, free path to revert a name change. If the buyer fails to confirm within 48h after the seller has already executed the transfer, the seller has effectively spent the name-change fee on a ticket they no longer want under that name. Flyswap cannot recover that money from the airline.

The only fair, sustainable policy is: **the seller assumes that risk, and we make it explicit before they list**. Flyswap remains a marketplace, not an insurer of airline policy.

## Proposed approach

Three coordinated changes:

### 1. Add a "buyer didn't confirm in 48h" email to the seller

New transactional template `transfer-buyer-no-confirm-seller.tsx`:

- Tone: factual, empathetic, not apologetic on Flyswap's behalf.
- Explains: the buyer did not confirm the name change within the 48h verification window, so the sale has been cancelled and the buyer fully refunded.
- Reminds the seller that, per the listing acknowledgement they accepted, the name-change fee they paid to the airline is **not recoverable by Flyswap** — the booking is now under the buyer's name on the airline side and the seller would need to deal with the airline directly if they want to revert it.
- Includes the same standardized "ticket details" grey box used in the other seller emails (airline, booking ref, new name, route, original amount).
- CTA: "Open the airline booking" (or "View sale in app").
- Suggests next steps: contact the airline to attempt a goodwill reversal, or relist the ticket under the new buyer's name if the buyer agrees to release it (rare).

Triggered from the same backend job that already auto-cancels purchases when buyer 48h confirmation expires (alongside the existing buyer apology / refund flow).

### 2. Add a disclaimer + mandatory acknowledgement at listing publication

In the sell flow (`SellTicket.tsx`), just before the publish button:

- A clearly visible warning box (gold/amber accent, in line with the brand) titled **"Important: name-change risk"**.
- Body text: explains that once the seller executes the airline name change for a buyer, the fee paid to the airline is not refundable by Flyswap. If the buyer fails to verify within 48h and the sale is cancelled, the seller will have lost the name-change fee. Airlines do not offer a free reversal window.
- A required checkbox: *"I understand that the name-change fee I pay to the airline is not refundable by Flyswap if the buyer fails to confirm the transfer within 48 hours."*
- Publish button stays disabled until the box is checked.
- Persist the acknowledgement on the listing row (new column `name_change_risk_acknowledged_at timestamptz`) so we have a per-listing audit trail and can quote it in disputes.

Same disclaimer surfaced (read-only, as a reminder) inside the seller's existing post-sale email and the deadline-warning email — short one-liner under the "Confirm the name change" CTA, so the seller is reminded of the risk *before* they pay the airline.

### 3. Backend wiring

- Add `name_change_risk_acknowledged_at` to `listings` (migration).
- The existing scheduled job that handles expired buyer confirmations triggers `send-transactional-email` with the new template `transfer-buyer-no-confirm-seller`, using an idempotency key like `buyer-no-confirm-seller-${purchaseId}`.
- Register the new template in `registry.ts` and redeploy `send-transactional-email` and `preview-transactional-email`.

## Open questions before I build

1. Do you want to **block the seller from executing the name change** entirely once we know the buyer's confirmation deadline is risky (e.g. require the buyer to pre-confirm intent)? Or keep the current flow and rely purely on the disclaimer? Recommended: keep current flow + disclaimer.
2. For the disclaimer copy, do you want me to also mention that Flyswap **will pursue repeat-offender buyers** (suspension after X no-confirms) so sellers feel the platform is actively protecting them? Recommended: yes, one short reassurance line.
3. Should the seller email include a **template message they can copy/paste to the airline** to request a goodwill reversal? Low success rate but a nice touch.
