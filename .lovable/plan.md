## Add app-style "About" info to mobile

### 1. About block at bottom of Account page
Add a small, muted block below the existing Support section in `src/pages/Account.tsx`:
- Swappup logo (small)
- "Swappup Ltd · Registered office: London, United Kingdom · Company No. 00000000"
- "Version 1.0.0 (build {commit/date})" — driven by a constant in `src/lib/appVersion.ts` so it's easy to bump
- "© {year} Swappup Ltd"
- Tappable "Terms" and "Privacy" text links (since mobile users no longer see the footer)

All copy goes through the existing i18n (`translations.ts`) in EN + IT.

### 2. Support link in marketing mobile menu
Add a "Support" entry to the hamburger sheet in `src/components/marketing/MarketingHeader.tsx`, linking to `/support` (page already exists). Add `support` label to `headerContent` EN/IT.

### Out of scope
- No PWA / Capacitor work
- No changes to desktop footer
- No new pages
