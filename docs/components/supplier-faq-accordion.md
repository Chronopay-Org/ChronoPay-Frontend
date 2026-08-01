# Supplier FAQ Accordion

A searchable, deep-linkable FAQ accordion for the supplier profile, so buyers
can quickly find answers about pricing, policy, and process without leaving
the profile page.

Component: [`<SupplierFaqAccordion>`](../../src/components/dashboard/supplier-faq-accordion.tsx)

---

## When to use

Use `<SupplierFaqAccordion>` on any supplier-facing profile surface where a
buyer needs self-serve answers before booking or messaging a supplier:

- **Supplier profile page** — below the hero and trust stats, ahead of
  reviews.
- **Support / help drawers** — a scoped subset of entries filtered to a
  single category (e.g. only `"Policy"` entries).

---

## Anatomy

```
┌──────────────────────────────────────────────────────────┐
│ SUPPLIER PROFILE                                         │
│ Frequently asked questions                                │
│ Answers about pricing, policy, and process …               │
├──────────────────────────────────────────────────────────┤
│ 🔍  Search questions and answers…                    [x] │
│ Showing all 8 questions                                    │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ PRICING                                            ⌄ │ │
│ │ What currency is pricing shown in?                    │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ POLICY                                             ⌃ │ │
│ │ What is the refund policy?                            │ │
│ │   Refunds are issued within 5 business days …          │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

- **Header**: `<PanelShell>` provides the *eyebrow*, *title*, and
  *description* slots (skip via `bare` when embedding elsewhere).
- **Search**: a labeled `role="searchbox"` input with a clear button once a
  query is entered. Result count and matched-term highlighting update live.
- **List**: one `<li>` per FAQ entry, each a WAI-ARIA disclosure — a
  `<button>` header (`aria-expanded` / `aria-controls`) toggling a
  `role="region"` panel (`aria-labelledby`).

---

## Component API

### Props

```ts
interface SupplierFaqAccordionProps {
  entries: readonly SupplierFaqEntry[];
  title?: string;                 // default: "Frequently asked questions"
  eyebrow?: string;                // default: "Supplier profile"
  description?: string;
  searchPlaceholder?: string;
  idPrefix?: string;               // default: "faq-", used for deep-link anchors
  initialDeepLinkId?: string;      // overrides the URL hash on mount
  bare?: boolean;                  // hide PanelShell chrome
  className?: string;
}
```

### `SupplierFaqEntry`

```ts
type SupplierFaqEntry = {
  id: string;          // stable slug, used for the deep-link anchor
  question: string;
  answer: string;
  category?: string;   // e.g. "Pricing" | "Policy" | "Process"
};
```

---

## Search behavior

- Matching is case-insensitive substring matching across `question`,
  `answer`, and `category`.
- Matched terms are wrapped in `<mark>` in both the question and the answer.
  Highlighting is a visual aid only — the result-count text carries the same
  information for anyone who can't perceive color/background differences.
- An empty query shows every entry, collapsed to their prior open/closed
  state.
- No matches renders a `role="status"` empty state instead of the list.

## Deep linking

- On mount, the component reads `window.location.hash`, strips the
  `idPrefix`, and — if it matches an entry id — expands that entry and
  scrolls it into view (`scrollIntoView({ behavior: "smooth", block: "start" })`),
  then moves focus to its header.
- `initialDeepLinkId` overrides the hash for cases where the host page
  already parsed the route (e.g. Next.js `searchParams`).
- Toggling any entry updates the hash via `history.replaceState` (no new
  history entry), so a buyer can copy the current URL to share a specific
  answer.
- An unknown/stale hash is ignored — every entry renders collapsed, no error.

---

## Accessibility (WCAG 2.1 AA)

- Implements the [WAI-ARIA disclosure (accordion) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/):
  each header is a native `<button>` with `aria-expanded` and
  `aria-controls`; each panel is `role="region"` with `aria-labelledby`
  pointing back at its header.
- Keyboard support across the visible (filtered) headers only:
  - `Arrow Down` / `Arrow Up` — move focus to the next/previous header,
    wrapping at the ends.
  - `Home` / `End` — jump to the first/last visible header.
- The search input has a visually-hidden `<label>` and
  `aria-describedby` pointing at the live result-count text.
- Result-count changes are announced via a polite live region
  (`<LiveRegion>`), so screen reader users hear updates without needing to
  re-read the input.
- Collapsed panel content is not rendered into the DOM (rather than only
  visually hidden), so assistive tech and in-page search never encounter
  stale/duplicate answer text.
- Color is never the only signal: highlighted terms also appear in the
  announced/visible result count, and expand/collapse state is exposed via
  `aria-expanded`, not just the chevron icon.

---

## Responsive & theming notes

- Layout is a single-column list at all breakpoints; the search bar and
  result count stack above it. No horizontal scrolling at any width.
- Uses the existing dark surface tokens (`bg-slate-900/40`,
  `border-white/10`) — no additional design tokens introduced.
- `<mark>` uses `bg-amber-300/90` with dark text for contrast against both
  the light-on-dark question text and the panel background.
- Works under `dir="rtl"`: the chevron and layout use logical Tailwind
  utilities (`gap`, flex) rather than hard-coded `left/right`, aside from the
  search icon and clear button positions, which mirror automatically under
  RTL because they use `left-*`/`right-*` relative to the input's own
  `dir` inheritance from the document.

---

## Edge cases covered

| Case | Behavior |
| --- | --- |
| Long answers | No truncation or max-height clipping; the panel grows with content. |
| Empty search | Shows the full list, `"Showing all N questions"`. |
| No matches | `role="status"` empty state, no accordion list rendered. |
| Empty `entries` array | Same empty state, `"Showing all 0 questions"`. |
| Unknown deep-link hash | Ignored; all entries render collapsed. |
| Dark mode | No dark-mode-specific branch; component is dark-surface by default and unaffected by an ancestor `.dark` class. |
| RTL | Renders and functions identically; verified via `document.dir = "rtl"`. |

---

## Testing

See [`supplier-faq-accordion.test.tsx`](../../src/components/dashboard/supplier-faq-accordion.test.tsx)
for the full suite (25 tests, 100% line/function coverage on the component),
covering: disclosure semantics, keyboard navigation, search/filter/highlight,
deep-linking (hash + prop), empty states, long content, and RTL/dark-mode
rendering.
