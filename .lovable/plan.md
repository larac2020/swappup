## Goal
Remove trains as a sellable/browsable ticket type. Swappup becomes flights-only again. Keep DB columns intact (no destructive migration) so any existing train rows don't break, but hide them from UI and block creation.

## Changes

### Sell flow (`src/pages/SellTicket.tsx`)
- Remove the flight/train type toggle UI entirely; hard-code `listingType: "flight_ticket"`.
- Strip train-only branches: train inclusions, `TrainForm`, `TrainTransferabilityCheck`, train submit/edit logic, train translations usage.
- Remove `TrainFront` icon import and `isTrain` checks.

### Browse (`src/pages/Browse.tsx`)
- Remove the flights/trains tab switcher; default to flights only.
- Filter out any `listing_type === "train_ticket"` rows defensively.

### Home (`src/pages/Home.tsx`)
- Remove train filter chip and `ListingTypeFilter` train option; show flights only.

### Other surfaces
- `Cart.tsx`, `ListingDetail.tsx`, `ListingCard.tsx`, `MiniListingCard.tsx`: remove `isTrain` branches, render flight layout only. Keep prop compatibility but ignore train type.
- `MyListings`, `Favorites`: verify no train-specific UI; filter out train rows if rendered.

### Cleanup
- Delete `src/components/listings/TrainForm.tsx`, `src/components/listings/TrainTransferabilityCheck.tsx`, `src/data/trainData.ts`.
- Remove the `parse-ticket` edge function's train schema branch — return flight-only parsing.
- Remove train-related translation keys from `src/i18n/translations.ts` (cabin class, train types, train inclusions, train ticket label, browseTrains, etc.) that are no longer referenced.
- Leave DB columns (`train_*`, `operator`, `origin_station`, etc.) and the `listing_type` enum value `train_ticket` in place — no migration needed. Existing train rows simply won't be displayed or creatable.

### Memory
- Update `mem://index.md` core to drop the train-marketplace mention; remove/refresh related memory files referencing trains.

## Out of scope
- No DB schema changes (non-destructive choice).
- No legal copy edits beyond removing obvious train mentions if trivially scoped.

Confirm and I'll implement.