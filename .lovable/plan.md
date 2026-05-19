## Goal
Fix the "Supported airlines & name-change fees" FAQ table so it shows real airlines with real fees, in alphabetical order, split into two sections: airlines that allow name changes, and airlines that don't (shown as "N/A").

## 1. Seed real airline data (insert into `airline_change_fees`)

Upsert the following rows with `last_verified_at = now()`, `confidence = 'high'`, `route_type = 'international'`, currency `EUR` (best-known public per-passenger fees as of May 2026 — user can correct later):

**Transferable (allow name change):**
| Airline | Fee | Notes |
|---|---|---|
| Ryanair | €115 | Online name correction |
| Wizz Air | €60 | Online via Wizz Account |
| Vueling | €60 | Per passenger, per flight |
| Volotea | €50 | Name correction fee |
| Air Europa | €120 | Name change fee |
| Iberia | €80 | Per passenger |
| ITA Airways | €90 | Per passenger |
| Aer Lingus | €100 | Short-haul |
| TAP Air Portugal | €100 | Per passenger |
| Eurowings | €70 | Per passenger |

**Non-transferable (`is_transferable = false`, fee = 0):**
| Airline | Notes |
|---|---|
| easyJet | Only minor spelling corrections, no full name change |
| British Airways | Non-transferable |
| Lufthansa | Non-transferable |
| Air France | Non-transferable |
| KLM | Non-transferable |
| Swiss | Non-transferable |
| Delta | Non-transferable |
| United | Non-transferable |
| American Airlines | Non-transferable |
| Emirates | Non-transferable |

Existing wrong rows (Ryanair / Wizz Air / British Airways with €0) are overwritten via upsert on (`airline_code`, `route_type`).

## 2. FAQ page update (`src/pages/Faq.tsx`)

- Remove the `is_transferable = true` filter so both groups are fetched; sort alphabetically.
- Split the result into two arrays: `transferable` and `nonTransferable`.
- Render two subsections inside the "Supported airlines" block:
  - **"Airlines that allow name changes" / "Compagnie che permettono il cambio nome"** — table with fee column.
  - **"Airlines that don't allow name changes" / "Compagnie che non permettono il cambio nome"** — same table layout but the fee column shows **"N/A"** in muted text, and the leading icon switches from green check to a muted X / dash so it's instantly readable.
- Keep the "Verified on" column for both sections.
- Keep the existing intro copy but tweak it to mention the two groups (EN + IT).

## 3. Out of scope
- No change to the refresh job, dispute flow, edge functions, or any other page.
- Real-world fees can vary by fare class and route; the user can correct individual values after seeding.
