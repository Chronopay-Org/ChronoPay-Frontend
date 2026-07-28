# Promo code entry design system

## Purpose

The booking flow uses a compact promo-code disclosure to keep the pricing summary tidy while still surfacing validation feedback clearly.

## Accessibility

- The disclosure trigger is a button with `aria-expanded` and `aria-controls`.
- Validation feedback uses a live region so screen readers announce changes.
- Input and action buttons maintain visible focus rings and meet the existing dark-theme contrast pattern.

## States

1. Collapsed: shows a single trigger labeled “Add promo code”.
2. Idle: the field is available and empty.
3. Loading: the component shows a spinner and a “Checking promo code…” message.
4. Valid: success state includes a check icon, a confirmation chip, and the discounted total.
5. Invalid/Expired: inline error copy explains what to do next.

## Responsive behavior

- The input and action buttons stack vertically on narrow screens and sit side-by-side on larger screens.
- The summary remains readable on mobile and desktop without requiring horizontal scrolling.

## Notes

- Example codes used in the prototype: `SAVE20`, `EARLYBIRD`, and `WELCOME10`.
- The implementation is intentionally lightweight and easy to review in the booking flow.
