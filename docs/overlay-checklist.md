# Overlay & Modal Accessibility Checklist

This checklist defines the standardized implementation rules for all dialogs, modals, and overlays within the ChronoPay design system to ensure strict compliance with WCAG 2.1 AA accessibility standards.

## 🪤 1. Focus Management (Focus Trap)
- [ ] Every overlay must be wrapped in the `<FocusTrap>` component from `src/components/common/FocusTrap.tsx`.
- [ ] Focus must immediately move to the first actionable element within the dialog when it opens.
- [ ] Focus must not escape the overlay while it is active (pressing Tab on the last element must loop back to the first).
- [ ] Focus must return to the trigger element that opened the overlay when the dialog is closed.

## 🗣️ 2. Screen Reader Semantics
- [ ] The overlay container must have `role="dialog"`.
- [ ] The overlay container must have `aria-modal="true"` to hide the rest of the page from assistive technologies.
- [ ] The dialog must be labelled. If there is a visible heading, use `aria-labelledby="[id-of-heading]"`. Otherwise, use `aria-label="[Descriptive Name]"`.

## ⌨️ 3. Keyboard Interactions
- [ ] Pressing the `Escape` key must close the overlay.
- [ ] All interactive elements inside the dialog must have a visible focus ring (`focus-visible:ring-2 focus-visible:ring-cyan-300`).

## 📱 4. Responsive & UI Guidelines
- [ ] The overlay must be fully usable on mobile screens without horizontal scrolling.
- [ ] If the content is taller than the viewport, the dialog content area should scroll vertically while keeping the modal constraints.
- [ ] A backdrop (e.g., `bg-black/50 backdrop-blur-sm`) must separate the modal visually from the main page content.
- [ ] Include a clear and accessible close button (e.g., `aria-label="Close dialog"`).

## ⚠️ Notes on Non-Modal Overlays (Toasts)
- Unlike modal dialogs, **Toasts/Notifications must NOT trap focus** as they are non-blocking.
- Toasts should use `role="status"` or `role="alert"` (depending on severity) and `aria-live` attributes to notify screen readers without interrupting the user's flow.
