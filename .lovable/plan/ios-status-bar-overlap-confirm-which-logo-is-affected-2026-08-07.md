# iOS status-bar overlap: confirm which logo is affected

## What I confirmed in the code

There are indeed two logo instances on the landing page:

1. **Sticky header logo** — `src/components/marketing/MarketingHeader.tsx`, a `sticky top-0` bar rendered by `MarketingLayout` on every marketing page. This is the one that stays visible while scrolling.
2. **Hero logo** — inside `src/pages/Landing.tsx`, part of the page body, scrolls away normally.

The safe-area fix **was applied to the sticky header** (instance 1): its root element carries the `safe-top` class, alongside the same class on `AppLayout` for the in-app screens. `index.css` defines `.safe-top { padding-top: env(safe-area-inset-top) }` with an iOS-native floor of `max(inset, 44px)`, `index.html` has `viewport-fit=cover`, and `main.tsx` adds the `ios-native` class plus the StatusBar overlay config on iOS.

So the padding is on the correct component. If overlap persists on a fresh native build, the cause is downstream of the CSS, and the next step is to identify which.

## Plan

1. Add a temporary on-device diagnostic (a small debug readout rendered only under `ios-native`) showing the resolved value of `env(safe-area-inset-top)`, the computed `padding-top` of the header element, and whether the `ios-native` class is present on `<html>`. This distinguishes three different failure modes rather than guessing.
2. Based on the readout:
   - Class missing -> the running bundle is stale or `Capacitor.isNativePlatform()` is false in that build; fix the sync/build path.
   - Class present but padding 0 -> the CSS utility is being overridden; raise specificity or move the padding to a wrapper element.
   - Padding correct but logo still under the clock -> the overlap is the hero logo or the native web view is positioned above the safe area; then pad the app shell (`#root`) instead of only the header.
3. Apply the matching fix, remove the diagnostic, and note that `npx cap sync ios` plus an Xcode rebuild is required.

## Note

A screenshot showing whether the overlapping logo is the small header logo (about 36px tall, left-aligned, with the menu button on the right) or the large centred hero logo would let me skip step 1 and go straight to the fix.
