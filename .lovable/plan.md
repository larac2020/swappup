# Email template refinements — buyer purchase confirmation

Scope: visual + copy refinements to `purchase-buyer-confirmation.tsx` and the shared `_layout.tsx`. No business-logic changes. Same tone/structure will be propagated to the other 6 templates in a follow-up if you approve.

## 1. Colors — orange-forward, white body

Update `_layout.tsx`:
- Replace the dark charcoal hero block with a **white hero** containing the `swappup` wordmark in **orange** (`#F4A929`). Keep the thin gold accent stripe at the very top and the gold left-ribbon for visual anchoring.
- Tagline ("Peer-to-peer flight marketplace") in muted grey under the wordmark.
- Body background stays white (already is).
- "Need help?" panel stays as-is (orange accents on light surface — you confirmed this is fine).
- CTA button: already orange (`brand.gold`). Confirm contrast by switching button text to **charcoal on orange** (current) and bumping weight to 700 for legibility.

## 2. Missing booking details

Add to `purchase-buyer-confirmation.tsx` props and render inside the trip/escrow card:
- `bookingRef` — original PNR / booking reference
- `airlineLoginEmail` — the email/account name the buyer must use to log into the airline reservation (the seller's account or the new account name once the name change is done)
- `airlineLoginNote` — short helper line (e.g. "Use this name when checking in / managing the booking")

These will be passed through `templateData` from `stripe-purchase-webhook` (already has access to the listing + buyer profile). Wiring will be added in the same edit.

## 3. Tone of voice — consistent warmth

Rewrite the "What happens next" section so it reads like a continuation of the warm opening rather than a transactional list:

Current (cold):
> 1. The seller has 24 hours to complete the name change…
> 2. You'll receive an email…
> 3. Once you confirm, the payment is released…

Proposed (warm, same info):
> Here's what happens from here — we'll guide you at every step.
>
> Maria has 24 hours to update the booking with your name and share the new reference. As soon as she does, we'll email you to take a quick look and confirm everything matches. Once you give the green light, we release her payment — and your seat is officially yours.
>
> If anything goes sideways, you're fully covered: no name change means an automatic refund, no questions asked.

Same friendly register as the opening; no bullet wall.

## 4. Greeting style

Change `h1` usage on the greeting line only — render "Hi Alex," with the body `<Text>` style (regular weight, 14px, body color) instead of the bold 22px heading. Keep the bold heading reserved for actual section titles further down (or remove it entirely if the new prose flow doesn't need one).

## 5. "View purchase" CTA — deep-link behaviour

Current href: `https://swappup.com/account?tab=purchases`.

Behaviour:
- **Mobile (PWA installed):** opens the app at the Purchases tab via the existing route; if not installed, opens the responsive web app in the browser — same UX since Swappup is a web app, not a native iOS/Android binary today.
- **Desktop:** opens swappup.com in the user's browser, lands on the Purchases tab. Fully functional.

Plan: keep the URL but add a small helper line under the button — *"Opens swappup.com — works on mobile and desktop."* — so the user knows what to expect. No native deep-link scheme needed (no native app exists). If/when a native app ships, we can layer a universal link on top without changing the email.

## 6. Merge "Amount held in escrow" into the trip card

Extend `TripCard` (or wrap with a small extension in this template) to render an "Amount held in escrow" row inside the same grey card as the flight details, styled like the other rows (muted label + value). Removes the floating standalone line.

## Files affected

- `supabase/functions/_shared/transactional-email-templates/_layout.tsx` — hero swap (white + orange wordmark), button weight, optional escrow row in `TripCard`.
- `supabase/functions/_shared/transactional-email-templates/purchase-buyer-confirmation.tsx` — new props (`bookingRef`, `airlineLoginEmail`), rewritten copy, regular-weight greeting, escrow merged into card, helper line under CTA.
- `supabase/functions/stripe-purchase-webhook/index.ts` — pass `bookingRef` and `airlineLoginEmail` in `templateData` for the buyer-confirmation send.
- Redeploy `send-transactional-email` and `stripe-purchase-webhook`.
- Regenerate `/mnt/documents/swappup-email-preview.html` so you can re-review before we propagate the same treatment to the other 6 templates.

## Open question

Confirm whether the "airline login" value should be:
(a) the buyer's own full name (what they'll log in with after the name change), **or**
(b) the seller's account email (what the buyer uses if the airline keeps the original account and only swaps the passenger name).

Different airlines do this differently — your call on which to surface by default.
