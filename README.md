# Northstar

Ad landing page for Northstar: survey drones and a four-legged inspection robot on one mission plan.

Live: https://northstar-seven-livid.vercel.app (open with `?theme=dark` or `?theme=light` to pick an edition)

## What's on the page

- 3-step lead form in the first screen, repeated near the bottom, with ad attribution (UTM, gclid, fbclid) and conversion events for GTM, Google Ads/GA4 and the Meta Pixel
- Live "Mission Control" demo: map coverage, camera feed, telemetry, findings and a robot patrol, running on simulated data
- Scroll-driven 3D mission replay, exploded aircraft, robot viewer (React Three Fiber + GSAP)
- Survey planner and map layers built from real photogrammetry maths on a generated demo site
- Dark ("Midnight") and light ("Glacier") editions; reduced-motion and no-WebGL fallbacks

## Run it

```bash
npm install
npm run dev      # http://localhost:3060
npm run build    # typecheck + production build
```

## Lead form destination

Copy `.env.example` to `.env` and set `VITE_LEAD_ENDPOINT` to a JSON POST endpoint (Formspree, a Google Apps Script, a CRM webhook). Without it, submitting opens the visitor's email app pre-filled to `CONTACT_EMAIL` in `src/sections/content.ts`.

## Photography

Real photographs from Unsplash (Unsplash Licence: free for commercial use). Files live in `public/photos/` and are credited in the site footer; the list with source links is `PHOTOS` in `src/sections/content.ts`. Hardware seen in photos belongs to its makers and is shown for context only.

Capabilities shown are proposed, and all maps, 3D scenes and mission data are illustrations, not real sites.
