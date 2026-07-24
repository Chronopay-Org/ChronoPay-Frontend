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
- [ ] **Click-outside**: Clicking outside the popover closes it without disrupting other interactions.

## 🔐 Password Manager & Autofill Support
- [ ] **FormField primitive**: All form inputs use the `FormField` component from `src/app/components/ui/form-field.tsx`.
- [ ] **Autocomplete attribute**: Every input has a valid HTML5 `autocomplete` value (e.g., `email`, `current-password`, `one-time-code`).
- [ ] **Name attribute compatibility**: The `name` attribute aligns with the `autocomplete` value (e.g., `autocomplete="email"` → `name="email"`).
- [ ] **Input mode optimization**: Mobile inputs use appropriate `inputMode` (e.g., `inputMode="numeric"` for codes, `inputMode="email"` for emails).
- [ ] **Label association**: Every input has a visible label properly associated via `htmlFor`/`id`.
- [ ] **ARIA descriptions**: Helper text and error messages are linked via `aria-describedby`.
- [ ] **Required fields**: Required inputs have the `required` attribute and visible asterisk indicator.
- [ ] **Error states**: Error messages use `role="alert"` and `aria-invalid="true"` on the input.

---

*To use this in a PR, copy and paste the relevant sections above into your PR description.*
