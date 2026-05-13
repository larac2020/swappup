
# Train-ticket sale flow — walkthrough & fixes

## Simulated user flow (what happens today)

1. User opens **/sell**, gating checks profile/ID/address/payment.
2. User picks **"Train ticket"** in the listing-type selector.
3. User uploads a PDF → `parse-ticket` edge function calls Gemini 2.5 Flash with a unified flight/train system prompt and an `extract_ticket_info` tool.
4. The tool returns: `ticketKind`, `operator`, `trainNumber`, `originStation/destinationStation`, `originCity/Country`, `destinationCity/Country`, `departureDate`, `returnDate`, `departureTime`, `originalPrice`, `priceCurrency`, `ticketCount`, `trainClass`.
5. `SellTicket.handleTicketUpload` autofills the form, switches `listingType` to `train_ticket` based on `ticketKind` (or operator/trainNumber heuristic), and applies the ≥72h-future rule.
6. `TrainForm` renders: route (country → city → station), one-way/return, departure date + single departure time, operator + fare-class dropdowns (driven by `trainData.ts`), train number, ticket count, original/your price, notes.
7. `TrainTransferabilityCheck` reads `trainData.ts` and either allows / denies / asks for fee acknowledgement.
8. Submit → `createListingMutation` writes a row in `listings` with `listing_type = "train_ticket"` and the operator name **mirrored into the `airline` column for legacy compat**. PurchaseDialog later calls `get-name-change-fee` with `body: { airline: ... }` regardless of type.

## Inconsistencies found

### A. Parsing (price & components)

- Price extraction is solid (FINAL total, currency, dot-decimal, multiplies per-pax) — same logic used for flights, works for trains.
- **Return-leg times are lost.** For trains, the tool only returns `departureTime`. `outboundArrivalTime`, `inboundDepartureTime`, `inboundArrivalTime` exist in the schema but are documented as flight-only. A round-trip Frecciarossa PDF parses as one-way times.
- **No "train type"** (Frecciarossa, Frecciargento, Frecciabianca, Intercity, Intercity Notte, Regionale / Regionale Veloce, Italo AGV, Italo EVO, TGV INOUI, ICE, AVE, Eurostar e320, Nightjet, etc.) is captured. This is the train equivalent of "aircraft type" and is what buyers actually look at.
- **No 1st/2nd class capture** even when the PDF clearly says "1ª classe / Standard / Premium / Business / Executive".
- **Stale fare vocabulary** in the system prompt for Trenitalia (lists "Base, Executive"). Today Trenitalia Frecciarossa uses **Standard / Premium / Business / Executive (+ Salottino)**; "Base / Economy / Super Economy" are the *flexibility tiers* layered on top. AI will return a label we can't map to `trainData.ts` and the dropdown ends up empty.

### B. Train operator / fare data (`src/data/trainData.ts`)

- **Outdated transferability rules.** Per current Trenitalia policy, Frecciarossa, Frecciargento, Intercity (day & night), Eurocity IT–CH (internal route), and Regionale tickets are **all nominative and non-transferable**. We currently flag Trenitalia Base/Executive as `transferable: "yes"` — we'd be letting sellers list tickets that legally cannot be transferred.
- Italo's fares are listed as transferable with €10 fee — Italo's actual policy is nominative for most fares since the 2023 update.
- **Thalys** is listed as a separate operator but Thalys merged into **Eurostar** in October 2023; it should be deprecated/aliased.
- **Eurostar** product names are stale ("Standard / Standard Premier / Business Premier"). Post-2023 the line-up is **Eurostar Standard / Eurostar Plus / Eurostar Premier**.
- **SNCF** only carries "TGV INOUI" and "Ouigo"; missing **Intercités**, **TER** (regional), and **Eurostar** as a separate brand.
- No regional/commuter coverage at all (no Trenord, no Italo's regional partners, no Renfe AVLO, no DB Regio, etc.).

### C. Field naming / "airline" leakage for trains

- `listingData.airline = formData.operator` writes the operator into the `airline` column "for legacy compat" — every downstream consumer that reads `listing.airline` then renders "Trenitalia" under copy that says **"airline"**.
- `PurchaseDialog`:
  - calls `get-name-change-fee` with `body: { airline: listing.airline }` even when the listing is a train (the function key/cache is airline-only and the function itself only knows about airlines).
  - renders **"Name change fee (Trenitalia)"** under a label string `Name change fee ({listing.airline})` and the disclaimer reads *"the airline's currently published amount"*.
- `ListingDetail` partially handles it (`carrierLabel = isTrain ? operator : airline`) but i18n keys still use `airline:` in interpolation.
- Submit-button "blocked by verification" wording surfaces flight-verification language even in code paths that never run for trains.

### D. Train form UX gaps vs flights

- **Inclusions UI is missing entirely for trains.** Flights have luggage / carry-on / meal / speedy boarding toggles; trains show no inclusion section at all. Train-relevant inclusions should be modelled separately (e.g. **Wi-Fi**, **power outlet at seat**, **seat reservation included**, **lounge access** (FrecciaClub / Italo Club Executive), **meal/snack on board** (Executive / Business / Italo Prima/Club only), **bike allowance**, **pet allowance**, **1st / 2nd class**). **Luggage limits should NOT appear** — European trains do not enforce per-bag limits.
- No **train type** selector (only operator + fare class).
- No **arrival times** (outbound or inbound) — only one `departure_time` field is stored per listing for trains.
- Currency selector is shown only for flights; trains are silently EUR-only (the `SellerFeeBreakdown` for trains is rendered without a currency prop), but Eurostar (GBP), SBB (CHF), and PKP (PLN) need different currencies.
- The 72h-future rule (designed for flights, where transferring takes time) is overly strict for trains — most train tickets are bought the same day; consider relaxing to a shorter window for train listings.
- Generated title is hardcoded English (`${city} Train Trip`) even when the user's language is IT.
- Train number placeholder is hardcoded `"FR 9612"` (Trenitalia) regardless of operator.

### E. Seller-form requirement edge cases

- Submit requires both `operator` and `trainClass`. If the parsed PDF returned an operator we *do* know but a fare label we don't, the dropdown is empty and the user cannot proceed without re-picking — but the upload widget still says "ticket parsed".
- Self-train-transfer / "non-transferable" branch in `TrainTransferabilityCheck` blocks listing creation correctly, but only based on the dropdown selection; it never re-validates against the actual ticket type extracted from the PDF.

## Fix plan

The fixes are scoped to keep the flow shape unchanged — same upload → parse → autofill → form → publish — but to make trains a first-class citizen rather than "flight code with operator strings".

### 1. `parse-ticket` edge function

- Expand the system prompt: list current 2024–2025 Trenitalia/Italo/SNCF/DB/Renfe/Eurostar/SBB/ÖBB/NS/PKP product hierarchies, and explicitly enumerate **train types** (Frecciarossa, Frecciargento, Frecciabianca, Intercity, Intercity Notte, Regionale Veloce, Regionale, Italo AGV/EVO, TGV INOUI, TGV Ouigo, Intercités, TER, ICE, IC, EC, RE, AVE, AVLO, Avant, Alvia, Eurostar e320, Nightjet, Railjet, Cisalpino).
- Add fields to the function tool:
  - `trainType` (string)
  - `travelClass` ("first" | "second" | "business")
  - `outboundArrivalTime`, `inboundDepartureTime`, `inboundArrivalTime` — applicable to trains too.
- Update the prompt so for trains:
  - `airline` MUST be omitted; `operator` MUST be set.
  - Fare class is mapped to one of the values in `trainData.ts` (case-insensitive), and falls back to the printed label if no mapping.
- Keep the price/currency rules (already correct); just clarify that the price block is the same for trains.

### 2. `src/data/trainData.ts`

- Refresh fare lists and transferability:
  - **Trenitalia**: Frecciarossa Standard / Premium / Business / Executive / Salottino (+ Frecciargento, Intercity, Regionale): all **non-transferable** today — mark `transferable: "no"` with a clear note.
  - **Italo**: Smart / Comfort / Prima / Club Executive — non-transferable per current policy; expose name change as denied.
  - **SNCF**: add Intercités and TER; mark Ouigo non-transferable; TGV INOUI Pro/Loisirs flexibility tiers.
  - **Eurostar**: rename to Standard / Plus / Premier; merge Thalys routes under Eurostar; keep Thalys as a deprecated alias that maps to Eurostar.
  - **Renfe**: add AVLO; Promo Básico vs Elige vs Prémium.
- Add a `trainTypes` lookup per operator (used by the new train-type selector and for parser mapping).
- Add a `currency` field per operator (defaults the form correctly: GBP for Eurostar, CHF for SBB, PLN for PKP).

### 3. `TrainForm` UX changes

- Add a **Train type** select (driven by the operator's `trainTypes`).
- Add **1st / 2nd class** toggle (or "Standard / Premium / Business / Executive" when the operator's fare class implies a service level).
- Add a train-specific **"What's included"** card with toggles: Wi-Fi, power outlet, seat reservation, lounge access, meal/snack on board, bike, pet, quiet coach. Remove luggage / carry-on / meal / speedy-boarding flight toggles for trains.
- Add **arrival time** fields next to each departure time (outbound + return when round-trip).
- Drive the **currency selector** for trains the same way flights do, defaulting to the operator's currency.
- Operator-aware train-number placeholder ("FR 9612" for Trenitalia, "9612" for Italo, "TGV 6201" for SNCF, etc.).
- Localise the auto-generated listing title (use `t("trainTripTitle", { city })`).
- Relax the 72h-future rule for trains to e.g. 6h (configurable constant), since same-day train resale is realistic.

### 4. Persistence (`createListingMutation`)

- Stop mirroring `operator` into the `airline` column. Add a migration to make `airline` nullable for `listing_type = 'train_ticket'` and start writing `operator` only.
- Add columns: `train_type`, `travel_class`, `outbound_arrival_time`, `inbound_departure_time`, `inbound_arrival_time`, `train_inclusions jsonb` (Wi-Fi, power, seat, lounge, meal, bike, pet, quiet coach).
- Backfill: for existing train rows, copy `airline → operator` if `operator IS NULL`.

### 5. Downstream consumers

- `PurchaseDialog`:
  - Branch on `listing.listing_type`. For trains, skip the airline-fee fetch and show the train fee from `trainData.ts` (same source `TrainTransferabilityCheck` uses).
  - Replace airline-only copy with operator-aware copy: `"Name change fee ({carrier})"`, `"the carrier's currently published amount"`.
- `ListingDetail`: keep `carrierLabel`, but switch the i18n strings that still say "airline" to a generic `{carrier}` interpolation.
- Submit button: keep `blockedByVerification` only for the flight branch (it already is), and rename the i18n key for the train transfer-blocked toast so it doesn't reuse flight wording.

### 6. Tests / manual QA checklist

- Upload a sample Frecciarossa PDF → verify operator = Trenitalia, trainType = Frecciarossa, travelClass = Standard, originalPrice + currency captured, departure + arrival times populated for both legs of a round-trip.
- Upload a sample Italo PDF → operator = Italo, trainType (AGV/EVO), fare = Smart/Comfort/Prima/Club, transferability = denied → form blocks publish.
- Upload a sample Eurostar PDF → operator = Eurostar, currency = GBP, fare = Plus/Premier, fee shown in £.
- Upload an SNCF Intercités PDF → operator = SNCF, trainType = Intercités, transferability behaviour matches policy.
- Verify the published listing detail page shows `Trenitalia` under the new "carrier" label (not "airline") and the purchase dialog quotes the same fee as the seller saw.

