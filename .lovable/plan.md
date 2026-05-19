## Goal

Turn `swappup.com` from an auth-walled app entry into a public marketing site, while keeping the existing app fully gated behind authentication.

## New public routes

| Route | Page | Notes |
|---|---|---|
| `/` | Marketing homepage | Hero, screens, value props, footer |
| `/about` | About Swappup | Mission, vision, what it does, for whom |
| `/terms-and-conditions` | Terms | Reuses existing `LegalPage` (markdown) |
| `/privacy-policy` | Privacy | Reuses existing `LegalPage` (markdown) |
| `/login` | Login form | Existing `AuthForm` in login mode |
| `/sign-up` | Sign-up form | Existing `AuthForm` in sign-up mode |

Old `/terms` and `/privacy` will 301-redirect (client-side `<Navigate replace>`) to the new URLs so existing emails / links keep working.

## Marketing pages — structure

**Shared marketing layout** (`MarketingLayout`):
- Top bar: Swappup logo (left) + "Login" and "Sign up" buttons (top right). Sign up is the primary CTA.
- Page content slot.
- Footer with: links to About, Terms & Conditions, Privacy Policy; company info block (address, registration number — placeholders for you to fill in); copyright.

**Homepage (`/`)** sections:
1. Hero — headline, subheadline, primary "Sign up" CTA, secondary "Login".
2. Product screens — 2–3 mockup screenshots (placeholders sourced from `src/assets`, easy to swap).
3. Value for users — short copy: turn unused tickets into cash, find cheaper flights from real travellers.
4. USPs — 3–4 cards: ease of use, secure escrow, ID-verified users, value recovered.
5. Final CTA band — "Get started" → `/sign-up`.

**About (`/about`)**:
- What Swappup is, who it's for, mission, vision. Single column, marketing layout.

**Terms / Privacy**: keep current `LegalPage` markdown rendering; just expose them at the new URLs and wrap-or-not as preferred (initial pass: leave standalone, footer links point to the new paths).

## Auth routing changes

Current state: `/` is the auth screen behind `PublicRoute`. After auth, user is sent to `/home` (or `/onboarding`).

Changes in `src/App.tsx`:
- `/` → public `Home` marketing page (no auth check, accessible to everyone).
- `/login` → `PublicRoute` wrapping `<Auth mode="login" />`.
- `/sign-up` → `PublicRoute` wrapping `<Auth mode="signup" />`.
- `/about` → public.
- `/terms-and-conditions` → public (renders existing `LegalPage doc="terms"`).
- `/privacy-policy` → public (renders existing `LegalPage doc="privacy"`).
- `/terms` → `<Navigate to="/terms-and-conditions" replace />`.
- `/privacy` → `<Navigate to="/privacy-policy" replace />`.
- `ProtectedRoute` unchanged. When unauthenticated users hit `/home`, `/account`, etc., redirect target becomes `/login` instead of `/`.
- `PublicRoute` (when already authenticated) keeps redirecting to `/home`, so logged-in users hitting `/login` or `/sign-up` skip past auth.

The marketing homepage is reachable by everyone — even logged-in users — so they can revisit it. The top bar on the marketing layout will show "Open app" instead of Login/Sign up when `useAuth().isAuthenticated` is true.

## Auth form — initial mode

`AuthForm` currently toggles between login and signup internally. Add an optional `initialMode?: "login" | "signup"` prop and pass it from the `Auth` page based on the route (`/login` vs `/sign-up`). The internal toggle stays.

## SEO

- `index.html`: update sitewide title/description to marketing copy, keep canonical `https://swappup.com/`, add `Organization` JSON-LD.
- Install `react-helmet-async` and add per-route `<Helmet>` to Home, About, Terms, Privacy with their own title/description/canonical/`og:*`.
- `public/robots.txt` and a basic `sitemap.xml` listing the four public pages.

## i18n

All new marketing copy goes through the existing `useLanguage()` / `translations.ts` system (EN + IT), consistent with the rest of the app.

## Design

Reuses the existing dark charcoal + gold/amber + glassmorphism design tokens from `index.css` / `tailwind.config.ts`. No new color system.

## Files to add

- `src/components/layout/MarketingLayout.tsx` — top bar + footer wrapper.
- `src/components/layout/MarketingHeader.tsx`
- `src/components/layout/MarketingFooter.tsx` — links + company info block.
- `src/pages/Landing.tsx` — the new public homepage at `/`.
- `src/pages/About.tsx`
- New marketing translation keys in `src/i18n/translations.ts`.
- `public/sitemap.xml`.

## Files to change

- `src/App.tsx` — new routes, redirects, `/login` and `/sign-up`, public `/`.
- `src/pages/Auth.tsx` + `src/components/auth/AuthForm.tsx` — accept `initialMode` prop derived from route.
- Anywhere the code redirects unauthenticated users to `/` (e.g. `ProtectedRoute`, sign-out flows) → redirect to `/login` instead. I'll grep for `Navigate to="/"` and `navigate("/")` to catch all of them.
- `index.html` — marketing meta + JSON-LD.
- `src/main.tsx` — add `HelmetProvider`.
- `public/robots.txt` — allow crawl, point at sitemap.

## Out of scope

- No rewrite of terms/privacy copy (you said keep as-is).
- No design exploration round — using current design tokens directly. If you want me to generate visual direction options for the landing page first, say the word and I'll run that before implementing.
- Final company info (address, registration number) and product screenshots: I'll put clear placeholders so you can drop the real values in.
