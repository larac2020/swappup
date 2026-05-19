## Goal

Replace the small hand-maintained European list in `src/data/flightData.ts` with a global dataset covering every airport that has scheduled commercial passenger flights. No UI changes — every screen that uses cities (Sell, Onboarding, Preferences, Browse filters, listing cards, lookups) automatically picks up the new data through the existing helpers.

## Approach

1. **Source data**: use the public OpenFlights `airports.dat` dataset (≈7,700 airports worldwide, includes IATA, city, country, name). Filter to entries that:
   - have a valid 3-letter IATA code,
   - are flagged as type `airport` (excludes heliports / train stations / closed),
   - appear in the OpenFlights `routes.dat` file at least once as origin or destination (this is the practical proxy for "has scheduled commercial flights" and removes ~3,000 GA-only fields).
   Result: ~3,300 commercial airports across ~230 countries.

2. **Generate the dataset offline** with a one-off Node script (run via `code--exec`, not shipped in the app):
   - Download `airports.dat` + `routes.dat` from the OpenFlights GitHub mirror.
   - Build a deduplicated array of `{ city, country, airportCode, airportName }` entries.
   - Normalise country names to match Swappup's existing conventions (e.g. "United Kingdom", "United States", "Czech Republic" → use the same spelling already in the file; build a small override map for the ~15 known mismatches).
   - Sort by country, then city, then airport code so the file is reviewable in PR diffs.
   - Write the result to `src/data/airports.generated.ts` as `export const airports: CityData[] = [...]`.

3. **Wire it into `flightData.ts`**:
   - Keep the `CityData` interface and all helper functions (`getCountries`, `getCitiesByCountry`, `getUniqueCities`, `getPrimaryAirportCode`, `getAirportNameByCode`, etc.) unchanged.
   - Replace the inline `cities` array with `export { airports as cities } from "./airports.generated"`.
   - Keep the `airlines` array and `getAirlineData` exactly as they are.

4. **Performance sanity checks** (the dataset grows ~50×):
   - `ListingFilters`, `SellTicket`, `Onboarding`, `Preferences` already use Combobox/Command components that filter on type — confirm they still feel snappy with ~3,300 entries. If any of them iterate the full list on every render, memoise the country→cities map once at module load.
   - Add a memoised `citiesByCountry` map inside `flightData.ts` so `getCitiesByCountry()` becomes O(1) instead of O(n).

5. **Validation**:
   - Spot-check 10 random cities (London, Tokyo, Buenos Aires, Reykjavik, Nairobi, Auckland, etc.) load correctly in the Sell flow and Browse filters.
   - Confirm existing listings still resolve via `getAirportNameByCode` (lookup by IATA — unchanged).
   - Run `tsc` via the harness to confirm no type drift.

## Out of scope

- No change to country list semantics used by billing-address validation (`mem://logic/location-validation`) — that mapping lives elsewhere and is unaffected.
- No translations for city names (cities stay in their English/local OpenFlights form, matching the current convention).
- No airline list changes.
- No backend/DB migration: listings already store free-form `departure_city` / `arrival_city` strings plus IATA codes, so old data keeps working.

## Files

- **Add**: `src/data/airports.generated.ts` (auto-generated, ~3,300 entries, ~150 KB).
- **Edit**: `src/data/flightData.ts` — swap inline array for re-export, add memoised lookup map.
- **Add (dev-only, not committed to runtime)**: `scripts/build-airports.mjs` — the generator, kept in the repo for future refreshes.

## Risks & mitigations

- **Country-name mismatches** between OpenFlights and Swappup's billing-address country list → handled by the override map in the generator; any remaining mismatch surfaces as a city tagged with an unknown country and is logged during generation for manual review.
- **Bundle size**: +~150 KB raw / ~40 KB gzipped added to the main bundle. Acceptable for now; if it becomes an issue we can lazy-load the array via dynamic import in a follow-up.
- **Stale data**: OpenFlights is community-maintained and updates infrequently. The generator script makes refreshes a one-command job.
