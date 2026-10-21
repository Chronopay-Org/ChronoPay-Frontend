# Supplier Portfolio Gallery

A responsive image grid with an accessible lightbox for the supplier profile page. Buyers can browse work samples at a glance and open any image full-size with keyboard and screen-reader support.

## Files

| File | Purpose |
|------|---------|
| `src/components/dashboard/portfolio-gallery.tsx` | Responsive grid, empty state, `PanelShell` chrome |
| `src/components/dashboard/lightbox.tsx` | Overlay dialog, focus trap, keyboard navigation, caption |
| `src/components/dashboard/lightbox.test.tsx` | Unit tests for `Lightbox` (95%+ coverage) |
| `src/components/dashboard/portfolio-gallery.test.tsx` | Unit tests for `PortfolioGallery` (95%+ coverage) |
| `docs/portfolio-gallery.md` | This document |

## Usage

```tsx
import { PortfolioGallery } from "@/components/dashboard";

const images = [
  {
    src: "/portfolio/project-a.jpg",
    alt: "Full-stack dashboard for fintech client, showing real-time XLM balance",
    thumbSrc: "/portfolio/project-a-thumb.jpg",
  },
  {
    src: "/portfolio/project-b.jpg",
    alt: "Responsive booking calendar with time-zone aware slot display",
  },
];

<PortfolioGallery
  images={images}
  eyebrow="Portfolio"
  title="Work samples"
  description="Recent projects from this supplier."
/>
```

### Embedding inside an existing panel (`bare` mode)

```tsx
<PortfolioGallery
  images={images}
  bare
  className="mt-4"
/>
```

## Props

### `PortfolioGallery`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `images` | `LightboxImage[]` | required | Images to display |
| `title` | `string` | `"Portfolio"` | Panel heading (passed to `PanelShell`) |
| `eyebrow` | `string` | `"Gallery"` | Small uppercase label above the title |
| `description` | `string` | — | Supporting description shown in the panel header |
| `maxVisible` | `number` | `12` | Maximum thumbnails shown in the grid; extras collapse into a `+N` overflow cell |
| `className` | `string` | — | Extra CSS classes on the outer wrapper |
| `bare` | `boolean` | `false` | Skip `PanelShell` chrome; renders only the grid |
| `cellAspectRatio` | `string` | `"16 / 9"` | CSS `aspect-ratio` value for each thumbnail cell (e.g. `"1 / 1"` for square) |

### `LightboxImage`

```ts
interface LightboxImage {
  src: string;        // Full-resolution (or display) image URL
  alt: string;        // Alt text — also rendered as caption in the lightbox
  thumbSrc?: string;  // Optional separate thumbnail URL (falls back to `src`)
}
```

### `Lightbox` (standalone)

You can use `Lightbox` independently when you need a lightbox without the grid:

| Prop | Type | Description |
|------|------|-------------|
| `images` | `LightboxImage[]` | All images in the set |
| `currentIndex` | `number \| null` | Currently open image index; `null` = closed |
| `onClose` | `() => void` | Called on Esc, backdrop click, or close button |
| `onNavigate` | `(index: number) => void` | Called on Prev/Next/thumbnail click |
| `className` | `string` | Extra classes on the backdrop element |

## Grid layout

| Viewport | Columns |
|----------|---------|
| Mobile (default) | 2 |
| `sm` (≥ 640 px) | 3 |
| `lg` (≥ 1024 px) | 4 |

Cells use `aspect-ratio: 16 / 9` by default. Tall images are cropped to fill the cell without overflow. Pass `cellAspectRatio="1 / 1"` for square cells.

### Overflow cell

When `images.length > maxVisible`, the last visible cell becomes a `+N` button:

- Shows a blurred preview of the first hidden image as a background
- Displays `+N` text overlay
- Opening it jumps the lightbox to the last visible slot, from which the user can continue navigating

## Lightbox keyboard shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Close |
| `ArrowRight` | Next image |
| `ArrowLeft` | Previous image |
| `Tab` / `Shift+Tab` | Cycle focus within the dialog (FocusTrap) |

## Accessibility

### WCAG 2.1 AA checklist

- **Dialog role**: Lightbox uses `role="dialog"` with `aria-modal="true"` and `aria-labelledby` pointing to the "Image N of M" counter.
- **Focus management**: `FocusTrap` from `src/components/common/FocusTrap.tsx` captures and restores focus. On open, focus moves to the first focusable element inside the dialog. On close, focus returns to the thumbnail that opened it.
- **Focus visibility**: All interactive elements use `focus-ring-cyan` (2 px offset + 2 px cyan-300 ring), meeting 3:1 contrast on the dark background.
- **Keyboard navigation**: Full keyboard control via Esc, ArrowLeft, ArrowRight.
- **Caption**: `alt` text is surfaced as a visible caption beneath the enlarged image, so sighted users with low vision and screen-reader users receive the same description.
- **Thumbnail buttons**: Each carries `aria-label="Open image N: {alt}"` and `aria-haspopup="dialog"` so screen readers announce both the content and that a dialog will open.
- **Thumbnail strip**: Uses `role="tablist"` / `role="tab"` / `aria-selected` so AT users can understand which image is selected.
- **Decorative thumbnails**: Strip thumbnail images have `alt=""` and `aria-hidden="true"` to avoid duplicate announcements — the tab button itself carries the label.
- **Body scroll lock**: `document.body.style.overflow = "hidden"` prevents background scroll while the dialog is open, restored on close/unmount.
- **Empty state**: Rendered with `aria-live="polite"` so dynamic content changes are announced.

### RTL support

Previous/Next buttons use Tailwind's logical CSS properties (`start-*` / `end-*`) so their positions flip automatically in RTL documents.

### Reduced motion

Thumbnail hover scale and lightbox fade-in animations use `motion-safe:` prefix, so they are disabled when `prefers-reduced-motion: reduce` is active.

### Dark mode

All colors use the project's slate/cyan palette designed for dark backgrounds. No additional dark-mode overrides are needed.

## Edge cases

| Scenario | Behavior |
|----------|----------|
| Empty `images` array | Renders an empty-state illustration + "No portfolio images yet." message |
| Single image | Lightbox hides Prev/Next buttons and the thumbnail strip |
| Image with no `alt` | Caption element is omitted entirely (no empty `<p>` rendered) |
| Very long `alt` text | Caption paragraph uses `overflow-wrap: anywhere` — no overflow or truncation |
| `thumbSrc` absent | Falls back to `src` for the thumbnail |
| Images > `maxVisible` | Overflow `+N` cell shown; clicking opens lightbox at `maxVisible - 1` |

## Design tokens used

| Token / class | Usage |
|---------------|-------|
| `rounded-[28px]` | Panel border radius (via `PanelShell`) |
| `border border-white/10` | Subtle cell and panel borders |
| `bg-slate-950/70` | Panel backdrop |
| `bg-slate-900` | Thumbnail cell background |
| `bg-slate-950/90` | Lightbox backdrop |
| `focus-ring-cyan` | All interactive focus rings |
| `text-cyan-300` | Active thumbnail strip border |
| `helper-text helper-text--muted` | Empty state copy |

## Testing

```bash
# Run unit tests
npm run test:unit

# Run with coverage (includes these files)
npm run test:coverage
```

Tests cover: closed state, ARIA attributes, caption rendering, long alt text, prev/next visibility and labels, click/keyboard navigation, close interactions (backdrop, button, Escape), body scroll lock, thumbnail strip, empty state, overflow cell, bare mode, and lightbox integration end-to-end.
