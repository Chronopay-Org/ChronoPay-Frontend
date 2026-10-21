# ChronoPay Frontend

Web app for **ChronoPay**, a time-economy marketplace on the Stellar network: suppliers publish bookable time slots, buyers reserve and pay for them, and both sides get status timelines and receipts.

**Live demo:** https://chronopay-frontend-omega.vercel.app

> All listings, suppliers, balances and receipts are sample data. No real payments are processed.

## Features

- Landing page, marketplace, supplier profiles and slot detail pages
- Dashboard: wallet status, bookings, notifications, settings, admin user view
- Supplier onboarding (services, payouts), recurring availability editor
- Booking status timeline and receipts with notes
- Pricing and plan comparison
- Light/dark themes, i18n, keyboard shortcuts (`?`), command palette, accessibility-first components
- Design system and token reference pages (`/design-system/*`, `/design-tokens`)

## Quickstart

Requires Node.js 20+ (CI uses 22).

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run test:unit` | Vitest unit tests |

## Environment variables

None are required to run the demo.

## Deploy

Deployed on Vercel (framework preset: Next.js, no config needed):

```bash
npx vercel --prod
```

CI (`.github/workflows/ci.yml`) runs `npm ci` and `npm run build` on every push and PR to `main`.

## Project layout

- `src/app/` App Router pages and layout
- `src/components/` UI components (dashboard, marketplace, ...)
- `src/lib/`, `src/hooks/`, `src/utils/` shared logic
- `docs/` design and component documentation (see [docs/README.md](docs/README.md))

## Known limitations

`next.config.ts` sets `typescript.ignoreBuildErrors`; the codebase has outstanding type and lint errors.
