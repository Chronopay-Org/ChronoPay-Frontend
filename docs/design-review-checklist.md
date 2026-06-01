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

---

*To use this in a PR, copy and paste the relevant sections above into your PR description.*
