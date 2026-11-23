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
| `npm run test:coverage` | Vitest unit tests with coverage |

### Coverage gate

`npm run test:coverage` enforces a coverage gate over the modules listed in `vitest.config.mts` (`coverage.include`): **95%** lines, statements and functions, and **90%** branches. The list covers the UI and `src/lib`/`src/hooks` modules that already have dedicated tests.

## Environment variables

None are required to run the demo.

## Deploy

Deployed on Vercel (framework preset: Next.js, no config needed):

```bash
npx vercel --prod
```

CI (`.github/workflows/ci.yml`) runs `npm ci` and `npm run build` on every push and PR to `main`.

## Project layout

- `src/app/` App Router pages and layout:
  - `/` — ChronoPay landing page
  - `/marketplace` — Browse time-slot listings (sample catalogue from `src/app/marketplace/catalogue.ts`)
  - `/marketplace/[id]` — View a listing and its booking details (sample catalogue)
  - `/pricing` — Compare plans and pricing
  - `/status` — View platform health, uptime, and incidents (demo data)
  - `/dashboard` — Dashboard overview and marketplace
  - `/dashboard/notifications` — View notifications
  - `/dashboard/onboarding/services` — Configure supplier services and pricing
  - `/dashboard/onboarding/payout` — Configure a supplier payout account
  - `/dashboard/settings` — Manage dashboard settings
  - `/dashboard/slots` — Legacy slots index; redirects to `/dashboard`
  - `/dashboard/slots/[id]` — View a slot and its booking status (sample data from `src/components/dashboard/dashboard-data.ts`)
  - `/dashboard/slots/[id]/receipt` — View a shared slot receipt (sample data from `dashboard-data.ts`)
  - `/dashboard/suppliers/[id]` — View a supplier profile, availability, and reviews
  - `/admin/users` — Manage users (sample users from `src/components/dashboard/admin-user-data.ts`)
  - `/design-review` — Design review guide and component demonstrations (includes sample data from `dashboard-data.ts`)
  - `/design-review/focus-trap` — Test focus-trap behavior
  - `/design-review/formatters` — Preview internationalization formatters
  - `/design-review/payout-step` — Preview the supplier payout onboarding step
  - `/design-review/supplier-onboarding` — Preview the supplier onboarding wizard
  - `/design-system/components` — Browse UI component examples
  - `/design-system/tokens` — Browse semantic design tokens
  - `/design-tokens` — Search and copy design tokens
- `src/components/` UI components (dashboard, marketplace, ...)
- `src/lib/`, `src/hooks/`, `src/utils/` shared logic
- `docs/` design and component documentation (see [docs/README.md](docs/README.md))

## Known limitations

This is a demo populated with sample data, not live marketplace or account data; no real payments are processed. In particular, marketplace listings use `src/app/marketplace/catalogue.ts`, dashboard slot and design-review examples use `src/components/dashboard/dashboard-data.ts`, and admin users use `src/components/dashboard/admin-user-data.ts`.

`next.config.ts` sets `typescript.ignoreBuildErrors`; the codebase has outstanding type and lint errors.
