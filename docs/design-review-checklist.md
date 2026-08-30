# Design Review Checklist

This checklist is derived from the `DesignChecklist` component in `src/components/design/DesignChecklist.tsx`. Contributors and reviewers should use this to ensure consistent UI/UX quality.

You can view the [Live Preview](/design-review) of this checklist in the application.

## ♿ Accessibility (WCAG 2.1 AA)
- [ ] **Contrast**: Text contrast ratios meet 4.5:1 (3:1 for large text/icons).
- [ ] **Keyboard**: Navigation order is logical; focus is not trapped; interactive elements are reachable.
- [ ] **Focus Rings**: High-contrast rings (cyan) are visible on all interactive elements.
- [ ] **Semantics**: ARIA labels, landmarks (`<header>`, `<main>`, `<nav>`), and alt text are correctly used.
- [ ] **Skip Link**: The "Skip to content" link is present and functional.

## 📱 Responsive & Layout
- [ ] **Mobile-First**: No horizontal scrolling on small screens; layout adapts to narrow viewports.
- [ ] **Above-the-Fold**: Critical info (title, wallet, CTA) is visible on 1280x720 laptop viewports.
- [ ] **Breakpoints**: Tailwind defaults (`md`, `lg`, `xl`) are used consistently.
- [ ] **Spacing**: Shared spacing tokens (`py-6/8/12`, `space-y-5/6/8`) are used instead of ad-hoc values.
- [ ] **Data Tables**: `font-mono` and `tabular-nums` are used for scannable numeric data.

## ⚙️ Operational States
- [ ] **Loading**: Skeleton screens or spinners are implemented; layout shifts are minimized.
- [ ] **Empty States**: Follow guidelines in `docs/empty-state-guidelines.md`.
- [ ] **Error States**: Errors are descriptive and offer a clear path to recovery.
- [ ] **Interactivity**: Hover, active, and focus states clearly distinguish interactive elements.
- [ ] **Reduced Motion**: Success states (e.g. WalletConnectModal) provide crossfade + static icon alternatives for `prefers-reduced-motion: reduce` (`docs/wallet-connect-reduced-motion.md`).

## 🎨 Design Tokens & Patterns
- [ ] **Helper Text**: Standardized `.helper-text` and `.helper-text--muted` CSS classes are used.
- [ ] **Buttons**: Correct `ButtonLink` variants (primary, secondary, ghost) are applied.
- [ ] **Hierarchy**: Heading levels (`h1` → `h6`) follow a logical, non-skipping hierarchy.
- [ ] **Consistency**: Card padding and border-radius match existing dashboard patterns.

## 💬 Contextual Help (HelpPopover)
- [ ] **Jargon annotated**: Domain-specific terms (escrow, mint, time token, XLM, etc.) have an inline `HelpPopover`.
- [ ] **Glossary entry**: Each annotated term has a corresponding entry in `src/lib/glossary.ts` (title ≤ 6 words, body ≤ 2 sentences).
- [ ] **Learn-more link**: Every glossary term includes a `learnMoreHref` pointing to the relevant docs section.
- [ ] **ARIA correct**: Popover uses `role="dialog"`, `aria-labelledby`, `aria-describedby`, and `aria-expanded` on the trigger.
- [ ] **Focus management**: Opening moves focus to the close button; closing returns focus to the trigger.
- [ ] **Keyboard operable**: Enter/Space opens; Escape closes; Tab/Shift+Tab cycles within the open popover.
- [ ] **What's this mode**: The `?` shortcut activates a contextual help mode with a cursor change, hover/focus highlight, and descriptive popovers; it respects reduced-motion and remains keyboard accessible.
- [ ] **Click-outside**: Clicking outside the popover closes it without disrupting other interactions.

## ⌨️ Keyboard Shortcuts Overlay (`?` / Shift+/)

The dashboard ships a discoverable keyboard-shortcuts reference. Pressing **`?` (Shift+/)** anywhere on the shell toggles a modal that lists every binding grouped by surface, so users never have to memorise shortcuts.

- [ ] **Trigger**: `?` (Shift+/) toggles the overlay globally from the shell; the binding is ignored while focus is inside an input, textarea, select, or content-editable element.
- [ ] **Single source of truth**: All bindings live in `src/lib/shortcuts.ts` as `SHORTCUT_GROUPS` (grouped by surface) and are rendered by `src/app/components/ui/shortcut-overlay.tsx`.
- [ ] **ARIA correct**: Overlay uses `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing at the visible heading.
- [ ] **Focus management**: The overlay is wrapped in the shared `<FocusTrap>` so Tab/Shift+Tab stay inside; focus returns to the previously focused element on close.
- [ ] **Keyboard operable**: Escape closes; the close button is keyboard-reachable with a visible cyan focus ring.
- [ ] **Backdrop**: A scrim (`bg-black/50 backdrop-blur-sm`) separates the modal; clicking it closes the overlay.
- [ ] **Bindings accessible**: Each shortcut renders as a proper `<kbd>` element next to a text label — never an icon alone — so every binding has an accessible name.
- [ ] **Responsive**: The dialog is centered with `max-w-md`, and the list scrolls vertically (`max-h-[70vh] overflow-y-auto`) on short viewports with no horizontal overflow.
- [ ] **Edge cases**: Empty registry shows a friendly fallback message; dark mode uses the shell's slate/cyan token palette.
- [ ] **Adding shortcuts**: Extend `SHORTCUT_GROUPS` in `src/lib/shortcuts.ts` — no component changes needed.

---

*To use this in a PR, copy and paste the relevant sections above into your PR description.*
