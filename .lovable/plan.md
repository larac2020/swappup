## Problem

After login, the `LanguageToggle` pill renders inside `BottomNav` (above the bottom navigation bar) on every authenticated page. The user wants it gone from that spot, and instead:
1. Shown at the top-right of the app, and
2. Reachable from the profile (already exists in `Account.tsx` as the "Language" section — no change needed there).

## Changes

1. **`src/components/layout/BottomNav.tsx`**
   - Remove the `<LanguageToggle />` block (and its import) currently rendered above the nav items.

2. **`src/components/layout/AppLayout.tsx`**
   - Add a fixed top-right container that renders `<LanguageToggle />` when `showNav` is true.
   - Position: `fixed top-3 right-3 z-50` so it floats above page content on all authenticated routes (Home, Browse, Cart, Listings, Account, sub-pages). Add `pt-safe` consideration via existing styling already on the toggle (it already has glass background).
   - Keep it out of the marketing/landing layout (those don't use `AppLayout`).

3. **`src/pages/Account.tsx`**
   - No change needed: the in-profile language section already exists (lines 245–267).

## Notes

- The Account page's existing language list stays as the primary in-profile control.
- The floating top-right toggle gives one-click access from any app screen without crowding the bottom nav.
- No business logic, i18n, or routing changes.
