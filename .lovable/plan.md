

# Add Train Tickets to SwappUp (Revised)

Trains become a first-class listing type alongside flights. Travel credits are removed entirely. Name-change fees are shown as an **additional** cost on top of the ticket price, never bundled in. Non-transferable operators/fares are blocked at listing creation.

## What the user will see

**Home**
- A new always-visible horizontal filter bar at the top: **All / Flights / Trains** (segmented control style, matching the dark/gold aesthetic).
- Selecting one filters every horizontal row (Hot Deals, Recommended, etc.) on the Home page.
- Existing "Travel credit" rows and shortcuts are removed.

**Selling (`/sell`)**
- Type picker shows **Flight ticket / Train ticket** only (Travel credit option removed).
- "Train ticket" reveals a train form: origin & destination **station**, operator (Trenitalia, Italo, SNCF, DB, Renfe, Eurostar, ÖBB, NS, SBB, Thalys), train number, fare class, departure date & time, optional return.
- Same AI photo-upload, parsed as a train ticket.
- A train **Transferability check** card appears once operator + fare are chosen:
  - Green/yellow → seller can publish, fee is shown.
  - Red ("not transferable") → publish button is **disabled** with an inline message: *"This operator/fare does not allow name changes. You cannot resell this ticket on SwappUp."*
- Always-visible amber warning under the fee:  
  *"Name-change fees change frequently. Always confirm the current fee on <Operator>'s official website before listing."*

**Browsing**
- Browse filter pills: **All / Flights / Trains** (Credits removed).
- Train cards show a Train icon and `MIL → ROM` station codes, with operator on the right.

**Buying (Listing detail + Cart)**
- Train and flight listings show a clear additive breakdown:
  ```
  Ticket price                €120.00
  Name-change fee (Italo)     + €10.00
  ─────────────────────────────────────
  Total you pay               €130.00
  ```
- A persistent disclaimer below the breakdown:  
  *"The name-change fee is added on top of the ticket price and held in escrow. The seller pays it directly to the operator to transfer the ticket into your name. Fees can change — verify the current amount on <Operator>'s official website before purchase."*
- Cart line items reflect the same `ticket + fee` split, and checkout total includes the fee.

**Italian**
- All new strings added to `translations.ts` (EN + IT). Examples: "Train ticket" → "Biglietto del treno", "Station" → "Stazione", "Operator" → "Operatore", "Name-change fee (added on top)" → "Costo cambio nominativo (aggiuntivo)", "This operator does not allow name changes" → "Questo operatore non consente il cambio nominativo", warning copy fully localized.

## Name-change fee & transferability database

Built into `src/data/trainData.ts` (mirrors `flightData.ts`). Each operator has fare classes with `{ fee, transferable: 'yes' | 'restricted' | 'no' }`. `no` blocks listing creation.

| Operator | Country | Fare → Status (fee) |
|---|---|---|
| Trenitalia (Frecce) | IT | Base → yes (€8); Executive → yes (€15) |
| Italo | IT | Smart/Comfort/Prima/Club → yes (€10) |
| SNCF | FR | TGV INOUI → yes (€19); Ouigo → **no** |
| Deutsche Bahn | DE | Flexpreis → yes (€0); Sparpreis → **no** |
| Renfe | ES | Flexible → yes (€20); Promo → **no** |
| Eurostar | UK/FR | Premier/Business Premier → yes (£30); Standard → **no** |
| ÖBB | AT | Flex → yes (€0); Sparschiene → **no** |
| NS | NL | Standard day ticket → yes (€0) |
| SBB | CH | Standard → yes (CHF 0); Saver/Supersaver → **no** |
| Thalys / Eurostar Red | BE/NL/FR | Comfort/Premium → yes (€25); Standard → **no** |

Same `transferable: 'no'` enforcement is added to the existing flight transferability check (today it only warns — it will now also block listing creation, consistent with trains).

## Technical changes

**Database (single migration)**
- Extend `listing_type` enum with `train_ticket`. Keep `travel_credit` in the enum (existing rows may exist) but remove all UI paths that create or browse it.
- Add nullable train columns to `listings`: `operator text`, `train_number text`, `train_class text`, `origin_station text`, `destination_station text`, `departure_time time`.
- `name_change_fee` stays as the dedicated additive fee column; `price` stays as the ticket-only price. No bundling.
- Reuse `purchases.name_change_fee` (already exists) for the additive fee at checkout.

**Code**
- New `src/data/trainData.ts` with `stations`, `operators`, `getOperatorFare(operator, fareClass)`, `getPrimaryStationCode`.
- New `src/components/listings/TrainTransferabilityCheck.tsx` — same visual pattern as `TransferabilityCheck.tsx`, returns `{ status, fee, blocking }`. Always renders the "verify on operator website" warning.
- `TransferabilityCheck.tsx` (flights): add the same "verify on airline website" warning and propagate a `blocking` flag for restrictive airlines/fares so the publish button can be disabled.
- `SellTicket.tsx`:
  - Remove "Travel credit" from the type picker.
  - Add train branch (form + parse + submit) writing the new columns. `name_change_fee` is computed and stored separately; `price` remains the ticket-only price.
  - Disable submit when transferability is `no` (flights and trains).
- `Home.tsx`: add the always-visible **All / Flights / Trains** segmented filter at the top; pass it down to all row queries; drop the credit-specific row and the credit shortcut.
- `Browse.tsx`: filter pills become **All / Flights / Trains**; remove credit option; default query covers flights + trains.
- `ListingCard.tsx` & `MiniListingCard.tsx`: handle `train_ticket` (Train icon, station codes, operator). Remove `travel_credit` UI branches.
- `ListingDetail.tsx`: render train fields where flight fields appear; replace the current single price line with the additive breakdown component (ticket + name-change fee + total) for both flight and train listings; show the persistent operator-fee disclaimer.
- `Cart.tsx` + `PurchaseDialog.tsx`: surface the additive fee per line and in the total; keep checkout flow otherwise unchanged.
- `parse-ticket` edge function: extend prompt so Gemini also parses train PDFs/screenshots (operator, train number, stations, fare class).
- `translations.ts`: add all new EN/IT keys, including disclaimer and blocking message.

**Out of scope**
- No live train schedule verification API (no Aviationstack equivalent).
- No backfill/migration of any existing `travel_credit` listings — they simply stop appearing in UI.

