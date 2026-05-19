## Changes to `src/pages/Landing.tsx`

1. **Remove the "Peer-to-peer flight ticket marketplace" pill** above the headline (the small badge with the Sparkles icon, lines 34–37). The headline "Don't cancel your flight. Swap it." becomes the first element of the hero.

2. **Update the subtitle** (line 41–44) to mention that listing is free. New copy:

   > Plans changed? List your ticket for free and recover its value. Need a seat? Buy one from a real traveller, often well below the airline's price.

No other pages, components, or copy are touched (the footer tagline and meta description still mention peer-to-peer — let me know if you want those changed too).

## Where you can edit copy yourself

All marketing-site text lives in plain `.tsx` files under `src/`. You can edit them directly in the Lovable code editor (top of the preview pane → code icon, or Cmd/Ctrl+Shift+F to search) or in GitHub if you connect the repo:

- **Homepage** — `src/pages/Landing.tsx` (hero, features, how it works, CTA)
- **About page** — `src/pages/About.tsx`
- **Header (logo, nav, Sign up / Login buttons)** — `src/components/marketing/MarketingHeader.tsx`
- **Footer (tagline, links, company info, address, registration number)** — `src/components/marketing/MarketingFooter.tsx`
- **Shared layout wrapper** — `src/components/marketing/MarketingLayout.tsx`
- **Terms & Privacy long-form text** — `src/content/legal/terms.en.md`, `terms.it.md`, `privacy.en.md`, `privacy.it.md` (Markdown, easiest to edit)
- **SEO `<title>` / meta description / social tags** — `index.html` (site-wide defaults) and the `<Helmet>` block at the top of each page file
- **Sitemap** — `public/sitemap.xml`

Tip: search for any exact phrase you see on the site with Cmd/Ctrl+Shift+F in the code editor — it will jump straight to the file and line.
