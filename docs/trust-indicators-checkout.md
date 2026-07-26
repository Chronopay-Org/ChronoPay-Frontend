# Trust and Safety Indicators

## Purpose
Trust and safety indicators (`TrustStrip`) reassure the buyer at the moment of decision during the checkout flow. They explicitly surface escrow protection, the dispute window, and the underlying Stellar audit signals.

## Placement
The `TrustStrip` component must be placed **at the top of the checkout review panel**, immediately preceding the order summary or payment submission button. This ensures it is one of the first things a user sees and that screen readers announce it before the user reaches the critical action buttons.

## Accessibility (WCAG 2.1 AA)
- **Screen Reader Announce-Once**: The component is wrapped in a `<section>` with `aria-label="Trust and Safety Guarantees"`. 
- **List Semantics**: The indicators are structured as a semantic list (`<ul>`, `<li>`), meaning screen readers will announce the number of items and read them sequentially without redundant noise.
- **Focusable Tooltips**: Since tooltips contain important explanatory text, each indicator label is a `<span>` with `tabIndex={0}` and a native `title` attribute. Keyboard-only users can Tab to each label to reveal its tooltip. Icons are marked `aria-hidden="true"` to avoid redundant announcements.
- **Contrast**: The text and icons use accessible contrast ratios for both Light and Dark modes (`text-emerald-600` in light, `text-emerald-400` in dark mode).

## Responsive Design
- **Mobile (< 640px)**: The indicators stack vertically, using full width.
- **Tablet/Desktop (>= 640px)**: The indicators arrange in a horizontal flex row with space-around to evenly distribute across the checkout panel top edge.

## Edge Cases Covered
- Hover states properly reveal the native tooltip.
- Keyboard focus triggers the browser's tooltip natively.
- High-contrast visual styling ensures the strip does not blend into standard forms.

## Usage Example
```tsx
import { TrustStrip } from '@/components/checkout/TrustStrip';

export function CheckoutReviewPanel() {
  return (
    <div className="flex flex-col gap-6">
      {/* Placed at the top of the checkout review panel */}
      <TrustStrip />
      
      <OrderSummary />
      <PaymentButton />
    </div>
  );
}
```
