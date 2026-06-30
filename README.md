# chronopay-frontend

Next.js dashboard and Stellar wallet integration for **ChronoPay** - time tokenization and scheduling on the Stellar network.

## What's in this repo

- **Next.js 16** (App Router) with TypeScript and Tailwind CSS
- ChronoPay landing and dashboard starter pages
- Ready for Stellar wallet connection and time token UI

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
# Clone the repo (or use your fork)
git clone <repo-url>
cd chronopay-frontend

# Install dependencies
npm install

# Lint
npm run lint

# Build
npm run build

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script               | Description                                  |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Start dev server (Turbopack)                 |
| `npm run build`      | Production build                             |
| `npm run start`      | Start production server                      |
| `npm run lint`       | Run ESLint                                   |
| `npm test`           | Lint + build (CI)                            |
| `npm run test:unit`  | Run Vitest unit tests                        |
| `npm run test:coverage` | Unit tests with V8 coverage report        |

## Project layout

- `src/app/` - App Router pages such as `page.tsx` and `dashboard/page.tsx`
- `src/components/dashboard/` - Reusable dashboard overview building blocks
- `src/app/layout.tsx` - Root layout and metadata
- `public/` - Static assets

## Accessibility baseline

- **Skip link** — A "Skip to content" link is the first focusable element in every page. It is visually hidden until focused (`sr-only` / `focus:not-sr-only`) and targets `#main-content`.
- **Landmark regions** — `<header>` wraps the top nav; `<main id="main-content">` wraps primary page content; `<nav>` is nested inside the header. This gives screen readers a consistent landmark map on every route.
- **Focus visibility** — Interactive elements carry visible focus rings (Tailwind `focus:ring-*`). The skip link renders a high-contrast cyan badge on focus so keyboard users can always see it.
- **Heading hierarchy** — Each page starts at `<h1>` and does not skip levels.
- **Validation** — Changes were verified with `npm run lint && npm run build`. Manual keyboard-tab testing confirms the skip link appears on first Tab press and moves focus to `#main-content` on Enter.
- **Design Review** — All UI changes must pass the [Design Review Checklist](docs/design-review-checklist.md) ([Live Preview](/design-review)) before merging.

## Dashboard design notes

- The overview is split into small presentational components so the UI is easy to review and extend.
- Key metrics, wallet status, booking progress, and quick actions stay visible without sacrificing mobile readability.
- Loading, empty, and error states are treated as first-class layout states to avoid abrupt page shifts.
- Interactive elements include visible focus rings and semantic headings to support keyboard and screen-reader use.
- Slot rows use fixed grid columns, `font-mono`, and `tabular-nums` for dates, times, and rates so buyers can scan availability without columns drifting.
- Slot titles may wrap, but metadata columns keep stable widths; mobile uses horizontal overflow instead of compressing key values into unreadable text.
- Empty slot views distinguish between no inventory and no filtered results, with microcopy that tells the user whether to add availability or widen filters.
- Slot list data is rendered as text-only React content with no HTML injection, preserving the UI-only security boundary for availability labels and filter copy.

## Card interaction affordances

Clickable cards and panels use consistent hover and press (active) styles to clarify interactivity and provide visual feedback:

- **Hover**: Subtle border color change and lift effect for cards, background tint for buttons
- **Press (active)**: Enhanced border color and background changes to indicate pressed state
- **Focus**: High-contrast cyan ring for keyboard navigation
- **Non-interactive cards**: No hover/press styles to avoid misleading users

**Implementation details**

- Quick action cards: `hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-slate-900 active:-translate-y-0 active:border-cyan-300/60 active:bg-slate-800`
- Wallet card: `hover:border-cyan-400/40` (article) with button `hover:bg-white/8 active:bg-white/12`
- Buttons: `hover:bg-white/8 active:bg-white/12` with focus ring
- Edge cases: Transitions respect `prefers-reduced-motion`; active styles work on touch devices

This ensures users can easily identify interactive elements while maintaining a clean, non-cluttered interface.

## Button guidelines

Buttons and button-links use a standardized set of variants and sizes to ensure consistent UI across the dashboard.

**Variants**
- `primary`: High-contrast cyan button for primary actions (e.g., submitting forms, primary CTAs).
- `secondary`: Subtle outline button with hover effects for secondary actions.
- `ghost`: Text-only button for low-emphasis actions or tertiary links.

**Sizes**
- `sm`: Small padding and text size (`px-3 py-1.5 text-xs`).
- `md`: Default size for standard actions (`px-4 py-2.5 text-sm`).
- `lg`: Large padding for prominent CTAs (`px-6 py-3 text-base`).

**Implementation Details**
- **Component**: Use the `ButtonLink` component (`src/app/components/ui/button-link.tsx`) when navigating.
- **Native Buttons**: For native `<button>` elements (e.g., in `wallet-card.tsx`), apply the exact same classes used in the `ButtonLink` variants for consistency.
- **States**: The disabled state adds `pointer-events-none opacity-50`. Focus states use a high-contrast cyan ring (`focus-visible:ring-cyan-300`).
## Help text / tooltip pattern

For complex concepts like booking progress, wallet state, and fees, we use accessible help tooltips:

- **Trigger**: Info icon (question mark) button with hover/focus/click support
- **Accessibility**: ARIA `tooltip` role, `aria-describedby`, keyboard navigation (Enter/Space to toggle, Escape to close)
- **Content guidelines**: Keep tooltips concise (1-2 sentences), explain terms in plain language, avoid jargon
- **Implementation**: `Tooltip` component in `src/app/components/ui/tooltip.tsx`
- **Usage**: Place next to labels or terms that need explanation

Example:
```tsx
<dt className="text-slate-300 flex items-center gap-2">
  Pending escrow
  <Tooltip content="Time tokens held in escrow for active bookings. Released upon completion or cancellation." />
</dt>
```

## Contextual help popovers (HelpPopover)

For domain-specific jargon (escrow, mint, redemption, time token, XLM) we use the richer `HelpPopover` pattern. Unlike `Tooltip`, it:

- Persists on click (does not dismiss on hover-out) — suitable for longer definitions
- Renders structured content: title, body text, and an optional "Learn more" link
- Uses `role="dialog"` with a focus trap so keyboard users can navigate the full content and activate the link before dismissing
- Meets WCAG 2.1 AA — visible focus rings, `aria-expanded`, `aria-labelledby`, `aria-describedby`

**Files**
| File | Purpose |
|------|---------|
| `src/app/components/ui/help-popover.tsx` | HelpPopover component |
| `src/lib/glossary.ts` | Centralised term definitions |
| `src/__tests__/help-popover.test.tsx` | Unit tests (48 cases, 97%+ coverage) |

**Usage**
```tsx
import { HelpPopover } from "@/app/components/ui/help-popover";
import { glossary } from "@/lib/glossary";

<dt className="text-slate-300 flex items-center gap-2">
  Pending escrow
  <HelpPopover term={glossary.pendingEscrow} />
</dt>
```

**Props**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `term` | `GlossaryTerm` | required | Term definition from `glossary.ts` |
| `triggerLabel` | `string` | `"Help: {term.title}"` | `aria-label` for the trigger button |
| `className` | `string` | `""` | Extra classes on the wrapper `<span>` |

**Adding a new term**
1. Add an entry to `src/lib/glossary.ts` with `title` (≤ 6 words), `body` (≤ 2 sentences), and optional `learnMoreHref`.
2. Import `glossary` and `HelpPopover` in the component.
3. Place `<HelpPopover term={glossary.yourTerm} />` next to the jargon term.

**Keyboard behaviour**
- `Enter` / `Space` on trigger: open/close
- `Escape`: close and return focus to trigger
- `Tab` / `Shift+Tab` while open: cycles through close button and learn-more link without leaving the popover
- Click outside: close

**Placement**
The popover opens above the trigger by default. If there is insufficient space above (viewport collision), it opens below.

**Annotated terms (as of this release)**
- `glossary.pendingEscrow` — "Pending escrow" label in wallet card
- `glossary.nextPayout` — "Next payout" label in wallet card
- `glossary.rate` — rate badge in slot list rows
- `glossary.xlm` — "Rate details" label in slot list rows
- `glossary.bookingStages` — "Booking stages" heading in booking progress panel
- `glossary.mint` — "mint" in dashboard subtitle
- `glossary.timeToken` — "time tokens" in dashboard subtitle

### Above-the-fold spacing (laptop viewports)

The dashboard is tuned so the title, intro copy, wallet card, and at least the heading of the time-slots section land above the fold on common laptop screens without feeling cramped.

**Viewport targets**

| Class           | Width × height (CSS px) | Tailwind tier |
| --------------- | ----------------------- | ------------- |
| Small laptop    | 1280 × 720              | `lg`          |
| Standard laptop | 1366 × 768 / 1440 × 900 | `lg` / `xl`   |
| Large laptop    | 1920 × 1080             | `2xl`         |

After accounting for typical browser chrome (~120 px), short laptops have ~600 px of usable height, which is the constraint we optimize for.

**Spacing decisions** (see `src/app/dashboard/page.tsx`)

- `<main>` vertical padding scales `py-6` → `md:py-8` → `xl:py-12` (was a flat `py-16`). Reclaims ~64 px on short screens while keeping breathing room on larger displays.
- Section gap scales `space-y-5` → `md:space-y-6` → `xl:space-y-8` (was `space-y-10`). Tightens stack density at md/lg without crowding hierarchy at xl+.
- Card padding scales `p-4` → `md:p-5` → `xl:p-6` (was a flat `p-6`). Keeps card density appropriate to viewport.
- Header padding scales `py-3` → `md:py-4`, trimming a few pixels off the top bar on short screens.
- Title-to-description gap dropped from `mt-2` to `mt-1`; in-card heading-to-body gaps dropped from `mb-2`/`mb-4` to `mb-1.5`/`mb-3` so each card stays compact.

The breakpoints follow Tailwind defaults (`md` ≥ 768 px, `xl` ≥ 1280 px). Width is used as a proxy for height because Tailwind's height-based variants are not in this project, and on real laptops width and height correlate well enough for this use case. Short screens, page zoom, and the appearance of a vertical scrollbar are all handled by the same default-tier (compact) values, since they all reduce effective viewport height or width.

### Helper text

Secondary explanations beneath labels, statuses, CTAs, and inside cards use a single shared pattern instead of one-off Tailwind combinations. This keeps scan-rhythm consistent and prevents ad-hoc text styles from accumulating.

The pattern is defined in `src/app/globals.css` as three classes backed by CSS custom properties:

| Class                     | When to use it                                          | Token                              |
| ------------------------- | ------------------------------------------------------- | ---------------------------------- |
| `.helper-text`            | Default secondary explanation under a label or heading  | `--helper-text-color` (slate-300)  |
| `.helper-text--muted`     | Quieter metadata, empty-state copy, low-priority hints  | `--helper-text-color-muted` (slate-400) |
| `.helper-text--emphasis`  | Helper copy on accent surfaces (e.g. wallet card)       | `--helper-text-color-emphasis` (cyan-100/80) |

Modifiers stack with the base: `class="helper-text helper-text--muted"`.

**Size and rhythm tokens**

- `--helper-text-size: 0.875rem` (14px)
- `--helper-text-leading: 1.5rem` (24px)

**Spacing convention** — the class only owns the text itself; spacing stays at the call site so it can adapt to context:

- `mt-1` between a heading and its helper line (tight)
- `mt-2` between a card title and its intro paragraph
- `mt-3`–`mt-6` when separating helper copy from a CTA or value display

**Edge cases**

- Long URLs and unbroken tokens wrap with `overflow-wrap: anywhere` instead of overflowing their container.
- Multi-line wrapping uses `line-height: 1.5rem` so two-line helper copy stays comfortably readable next to 14px labels.
- Modifiers only override color, so size/leading/wrapping are preserved across tones.

**Usage example**

```tsx
<h2 className="text-lg font-semibold">Wallet Status</h2>
<p className="helper-text">Not connected</p>

<p className="helper-text helper-text--muted">No time slots listed yet.</p>

<p className="helper-text helper-text--emphasis">Primary wallet</p>
```

## UX copywriting pass (FE-DESIGN-030)

The dashboard copy was updated to improve clarity, trust, and scan speed:

- Stronger intent labels (for example, `Connect Wallet` and `Review wallet`)
- State-aware wallet microcopy for connected, disconnected, and error states
- Explicit wording to clarify that no transactions occur until the user confirms them
- Added helper text to explain booking and wallet flow in plain language

Scope is intentionally lightweight and contained to `src/app/dashboard/page.tsx` and `src/components/dashboard/wallet-card.tsx` for easy review.

## Contributing

1. Fork the repo and create a branch from `main`.
2. Install deps: `npm install`. Run lint and build: `npm run lint && npm run build`.
3. Make changes; keep lint and build green. Ensure your UI changes follow the [Design Review Checklist](docs/design-review-checklist.md).
4. Open a pull request using the provided template. CI must pass (lint, build).

## CI/CD

On every push and pull request to `main`, GitHub Actions runs:

- **Install**: `npm ci`
- **Lint**: `npm run lint`
- **Build**: `npm run build`

## License

MIT
