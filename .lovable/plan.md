## Goal

Reduce Swappup's legal exposure if a seller reverts a name change after sale (or otherwise misuses a ticket post-transfer), on top of the existing 24h-post-departure payment hold and fraud scoring.

## 1. Terms & Conditions — liability disclaimer

Add a new clearly-titled clause to `src/content/legal/terms.en.md` and `src/content/legal/terms.it.md`, bump `TERMS_LAST_UPDATED` in `src/content/legal/version.ts` (this also re-triggers the existing `ReacceptDialog` so all users must accept the new wording).

Proposed wording (EN — IT to be mirrored):

> **Post-transfer ticket misuse — limitation of liability.** Swappup is a peer-to-peer marketplace and is not the carrier, issuer or holder of any ticket listed on the platform. Once the airline confirms the name change to the buyer and Swappup releases the funds to the seller, the transaction is final. Swappup is not responsible for, and disclaims all liability arising from, any subsequent act or omission of the seller, the buyer or the airline — including, without limitation: (i) the seller requesting a further name change, cancellation, refund, voucher, mileage credit or any other modification of the ticket after transfer; (ii) the airline rejecting, downgrading or invalidating the ticket at check-in or boarding; (iii) the buyer being denied boarding for reasons unrelated to the name change Swappup verified; (iv) any tax, fare-class or fee adjustment imposed by the carrier after transfer. The buyer's sole remedy in such cases lies against the seller and/or the airline under applicable consumer and contract law. Swappup will, on request and where lawful, share the evidence it retains (name-change confirmation, transfer screenshots, payment proof, ID-verification reference) to assist the buyer in pursuing that remedy.

Also add a short companion clause:

> **Seller covenants.** The seller irrevocably warrants that, after the name change is confirmed to the buyer, they will not request, authorise or attempt any reversal, further name change, cancellation, refund or voucher in respect of the ticket. Breach of this covenant entitles Swappup to permanently ban the account, withhold or claw back funds still under hold, pursue chargeback recovery, and report the conduct to the airline and, where applicable, to law enforcement.

## 2. Other protective measures I recommend adding

Pick any combination — each is a small, mostly-mechanical change.

**a. Explicit seller attestation at transfer confirmation.** In `TransferConfirmation.tsx`, add a mandatory checkbox above the submit button: "I confirm the name change is final. I will not request any reversal, further name change, refund, cancellation or voucher on this ticket. I understand that doing so is a breach of the Swappup Terms and may result in a permanent ban, withholding of funds, chargeback recovery and legal action." Store the acceptance + timestamp + IP on the `purchases` row (new columns `seller_finality_accepted_at`, `seller_finality_ip`).

**b. Buyer-side post-departure attestation.** When the buyer confirms receipt (or at the auto-release point 24h after departure), record an explicit "ticket worked at boarding / no issue" flag so we have a positive confirmation, not just silence. Useful evidence if a dispute is raised later.

**c. Tighten the 24h-after-departure hold copy.** Add a one-line note in `PurchaseDialog.tsx` and the buyer confirmation email: "If anything is wrong at check-in or boarding, contact us before the flight departs +24h — once the hold is released we can no longer reverse the payment." This makes the cut-off contractually clear.

**d. Evidence retention policy.** Add a sentence in `privacy.{en,it}.md` stating that transfer proofs, name-change screenshots, ID verification references and session/IP logs are retained for X years (suggest 6 — UK limitation period for contract claims) specifically for fraud and dispute defence. This is required to lawfully keep the evidence you'll need under §1.

**e. Auto-flag "name reverted" pattern in `check-fraud`.** Add a signal: if a seller has ≥1 completed transfer followed by another purchase/listing on the *same flight + date + booking reference*, flag severely and freeze the account. Cheap to add to the existing scorer.

**f. Mandatory dispute window before release.** Already in place via the 24h post-departure hold — keep, but expose a one-tap "Report a problem" button in the purchase detail view that *pauses* the auto-release until a human reviews. (New `purchases.release_paused` boolean + check in `expire-transfers` / `release-escrow`.)

**g. Airline-notification footer on receipts.** In the buyer's PDF receipt (`purchaseHelpers.tsx`), include a line: "If this ticket is invalidated or modified after issue, retain this receipt and the attached transfer evidence to support a claim against the original seller." Reinforces that the buyer's recourse is against the seller, not Swappup.

**h. KYC gating already exists** (mandatory ID verification before selling) — keep, and surface in T&Cs that this is what makes the seller identifiable for legal recourse. No code change.

## What I'll build if you approve

Default scope (lowest friction, highest legal value):
- §1 T&C clauses (EN + IT) + bump `TERMS_LAST_UPDATED`
- §2a seller finality checkbox + DB columns
- §2c hold-window copy clarification
- §2d privacy retention clause
- §2e fraud signal for reverted-name pattern

§2b, §2f, §2g are additive — tell me which of those (if any) to include and I'll fold them in.

## Non-technical summary

We'll add a clear "after the transfer is done, the seller is on the hook — not Swappup" clause to the Terms (and its Italian mirror), force every existing user to re-accept, make the seller tick a binding "I won't reverse this" box when they confirm the name change, tighten the privacy policy so we can legally keep the evidence we'd need to defend you, and teach the fraud scorer to spot a seller who tries to re-sell or re-list the same ticket after transfer.
