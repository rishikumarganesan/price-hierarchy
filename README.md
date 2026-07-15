# Pricing Hierarchy Prototype

Standalone front-end prototype of PriceLabs' **Pricing Hierarchy** feature, demoed inside a
simplified clone of the Multi-Calendar. All data is seeded in-memory — no backend.

Pricing Hierarchy is a guardrail layer applied after algorithmic pricing but before final prices
are surfaced. It guarantees superior room categories are never priced below inferior ones, by
letting users define an ordered ladder of room types with a minimum price gap between each rung.

## Stack

Vite + React + Tailwind v4 + Zustand. Pricing logic lives in a pure, unit-tested module
([`src/lib/pricingEngine.js`](src/lib/pricingEngine.js)), decoupled from the UI.

## Running locally

```bash
npm install
npm run dev      # start the dev server
npx vitest run    # run the pricing engine unit tests
npm run build     # production build
```

## Demo script

1. Load the Multi-Calendar — red inversion warnings are visible on several seeded dates.
2. Go to Manage Listings → Pricing Hierarchy → Create Hierarchy.
3. Build a ladder: Standard (anchor) → Deluxe +10% → Superior +$200 fixed → Create.
4. Back on the Multi-Calendar, inversions are gone; hierarchy-adjusted cells show a purple tint
   and an org-chart glyph.
5. Hover an adjusted cell to see the full price breakdown tooltip, including the hierarchy line.
6. Hover a non-adjusted cell to see the grayed "not triggered" hierarchy line.
7. Toggle "Sync Prices" for Deluxe in the hierarchy table — Deluxe cells peg exactly to
   Standard + 10% on every date.
8. Flip the global "Hierarchy Enforcement" toggle off in the toolbar slide-over — inversions
   reappear.
9. One seeded date demonstrates a Max Price conflict warning once the hierarchy is enforced.
