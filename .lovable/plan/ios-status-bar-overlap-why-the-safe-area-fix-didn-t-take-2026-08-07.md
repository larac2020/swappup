# iOS status-bar overlap — why the safe-area fix didn't take

## What I checked

- `index.html` already has the correct tag:
  `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />`
  So that part is present and correct — it is not the cause.
- `MarketingHeader` and `AppLayout` both already set `paddingTop: env(safe-area-inset-top)`.
- `capacitor.config.ts` has no plugin config at all, and the iOS project has no StatusBar
  configuration. That is the remaining suspect: with the default Capacitor iOS setup the
  status bar overlays the web view, and unless the app is rebuilt/synced with the current
  web bundle, the running app can still be serving an older `dist`.

Diagnosis is therefore: meta tag fine, CSS fine, native layer / build sync unverified.

## Plan

1. Make the safe area explicit and debuggable
   - Define `--safe-top: env(safe-area-inset-top, 0px)` in `index.css` and use it in the
     header and `AppLayout` instead of raw `env()` inline styles.
   - Add a small dev-only readout (temporary, removed after confirmation) that reports the
     computed value of `--safe-top` so we can tell whether iOS is returning 0 or a real
     value (e.g. 47/59px). This distinguishes "CSS not applied" from "inset is genuinely 0".

2. Control the status bar from the native side
   - Install `@capacitor/status-bar` and, on iOS native only, call
     `StatusBar.setOverlaysWebView({ overlay: true })` plus a dark style, so the inset is
     consistent and the web layer owns the spacing.
   - Alternatively (chosen if step 1 shows the inset is 0): set `overlay: false`, which makes
     iOS shrink the web view below the status bar so no CSS padding is needed at all.

3. Guarantee a minimum offset on native iOS
   - Fallback: `padding-top: max(env(safe-area-inset-top), 44px)` applied only when running
     natively on iOS, so even if the inset resolves to 0 the logo can never sit under the
     clock.

4. Rebuild step for you
   - After the change you need `npx cap sync ios` and a fresh Xcode build; a web-only reload
     of an existing installed app will not pick up `index.html` changes.

## Technical notes

Files touched: `src/index.css`, `src/components/marketing/MarketingHeader.tsx`,
`src/components/layout/AppLayout.tsx`, `src/main.tsx` (native status-bar init),
`capacitor.config.ts` (StatusBar plugin block), `package.json` (`@capacitor/status-bar`).
No backend or business-logic changes.
