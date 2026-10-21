# Keep Original Price Chip

## Overview

`KeepOriginalPriceChip` is a nudge chip shown on alternative slot cards during a rebooking flow. When the alternative slot is priced higher than the original booking, the chip offers buyers a one-click way to apply an account credit to cover the price difference and honour the original price.

**Component location:** `src/components/dashboard/keep-original-price-chip.tsx`  
**Glossary term:** `glossary.pricePreservationCredit` — rendered via `HelpPopover` next to the chip trigger.

## Design goals

- **Trust and clarity:** Buyers see the exact price difference and can apply credit without leaving the rebooking flow.
- **Honest credit gate:** If the buyer's credit balance is insufficient the chip renders in an amber "Insufficient credit" state rather than hiding, so the buyer understands why they cannot lock the price.
- **Non-destructive:** Clicking applies the credit to the current rebooking context only. No XLM is moved until the booking is confirmed downstream.
- **Accessible:** WCAG 2.1 AA — keyboard activation, visible focus ring, `aria-live` announcement on credit application.
- **Responsive:** Chip text wraps gracefully on narrow viewports; touch targets are ≥ 44px.

## Visual states

| State | Trigger | Colours | Button state |
| --- | --- | --- | --- |
| `idle` | Alternative price > original AND credit ≥ diff | Cyan border/bg (`cyan-300/30`, `cyan-300/10`) | Enabled |
| `applied` | Credit applied (or `applied=true` prop) | Emerald border/bg (`emerald-400/30`, `emerald-400/10`) | Disabled |
| `insufficient` | Credit < price difference | Amber border/bg (`amber-400/30`, `amber-400/10`) | Disabled |

The chip **renders nothing** (`null`) when the alternative price is equal to or cheaper than the original booking price. Callers do not need to guard the render.

## Component API

```tsx
import { KeepOriginalPriceChip } from "@/components/dashboard";

<KeepOriginalPriceChip
  originalPrice={120}
  alternativePrice={150}
  availableCredit={50}
  onApplyCredit={(diff) => {
    // diff = 30 (XLM)
    // wire to price-preservation service call
  }}
/>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `originalPrice` | `number` | required | Original booking price in XLM |
| `alternativePrice` | `number` | required | Alternative slot price in XLM |
| `availableCredit` | `number` | required | Buyer's current account credit in XLM |
| `currency` | `string` | `"XLM"` | Currency symbol displayed in chip text |
| `onApplyCredit` | `(priceDiff: number) => void` | — | Called when buyer applies credit; receives the price difference |
| `applied` | `boolean` | — | Controlled mode: forces the applied state externally |
| `className` | `string` | `""` | Additional classes on the outer wrapper |

### Type exports

```ts
export type KeepOriginalPriceState = "idle" | "applied" | "insufficient";
export type KeepOriginalPriceChipProps = { ... };
```

## Uncontrolled vs controlled

By default the component manages its own `applied` state internally (uncontrolled mode). Pass the `applied` prop to take external control — useful when the parent component tracks credit application across multiple alternative cards:

```tsx
// Controlled — parent owns applied state
const [appliedSlotId, setAppliedSlotId] = useState<string | null>(null);

<KeepOriginalPriceChip
  originalPrice={120}
  alternativePrice={150}
  availableCredit={50}
  applied={appliedSlotId === slot.id}
  onApplyCredit={(diff) => {
    setAppliedSlotId(slot.id);
    applyCredit(slot.id, diff);
  }}
/>
```

## Accessibility notes

| Concern | Implementation |
| --- | --- |
| Button semantics | Native `<button type="button">` — keyboard-accessible by default |
| Disabled state | Both `disabled` attribute and `aria-disabled="true"` on non-idle states |
| Descriptive label | `aria-label` on the trigger includes the state-specific price, e.g. `"Keep original price: 120 XLM"` |
| HelpPopover | `role="dialog"` with focus trap; explains credit mechanic on trigger click |
| Live announcement | `role="status"` `aria-live="polite"` `aria-atomic="true"` announces text when credit is applied |
| Focus ring | `focus-visible:ring-2 focus-visible:ring-cyan-300` — project-wide cyan focus pattern |
| Motion | `motion-reduce:transition-none` disables colour transitions for users with `prefers-reduced-motion` |
| Icon | `aria-hidden="true"` on the decorative `Tag` icon |

### Sample announcement text

> "Credit applied. You'll pay 120 XLM — the original price. 30 XLM covered by your credit."

### axe / manual checks

- No unlabelled buttons. The trigger button has a descriptive `aria-label` combining state + price.
- `aria-disabled` is set alongside the HTML `disabled` attribute for AT compatibility with non-native consumers.
- Contrast: cyan/emerald/amber tones on slate-950 background meet WCAG AA 4.5:1 for text.
- Dark mode: inherits ChronoPay slate/cyan/emerald/amber tokens — no separate palette needed.
- RTL: inline-flex with logical properties; no left/right-specific layout assumptions.

## Responsive layout

- Chip has `min-h-[2.25rem]` (36px) to meet the 44px touch target when combined with vertical spacing.
- Text wraps naturally via `inline-flex` — no fixed width.
- On narrow viewports (< 360px) the price badge shifts to a new line within the chip, which is acceptable.
- Panel padding for the containing carousel follows the standard `p-4 sm:p-5 xl:p-6` scale.

## Integration in SlotList / SuggestedAlternativesCarousel

```tsx
import { SlotList } from "@/components/dashboard";

<SlotList
  slots={mySlots}
  suggestedAlternatives={alternatives}
  originalPriceXlm={120}
  availableCreditXlm={buyerCredit}
  onApplyCredit={(slotId, diff) => {
    // wire to price-preservation service
  }}
/>
```

### `SlotList` new props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `suggestedAlternatives` | `AlternativeSlot[]` | — | When provided (even as `[]`), renders the "Rebook a matching slot" section |
| `originalPriceXlm` | `number` | — | Passed to `KeepOriginalPriceChip` on each alternative card |
| `availableCreditXlm` | `number` | `0` | Buyer's available credit forwarded to each chip |
| `onApplyCredit` | `(slotId: string, diff: number) => void` | — | Callback receiving the slot id and price diff when credit is applied |

### `AlternativeSlot` type

Extends `Slot` with an optional `priceXlm` field:

```ts
type AlternativeSlot = Slot & {
  priceXlm?: number; // numeric price; chip only shown when > originalPriceXlm
};
```

## Edge cases

| Scenario | Behaviour |
| --- | --- |
| Alternative ≤ original price | Component renders `null` — no DOM output |
| `availableCredit === priceDiff` | Credit exactly covers the difference; chip renders in idle state |
| `availableCredit < priceDiff` | Chip renders disabled in amber "Insufficient credit" state |
| `onApplyCredit` not provided | Click is safe — no error thrown, state still transitions |
| Fractional XLM amounts | Displayed to 2 d.p., trailing zeros stripped (e.g. `10.10 → 10.1`, `10.00 → 10`) |
| RTL languages | flex-wrap and logical padding keep layout intact in right-to-left locales |

## Glossary term

The chip registers a `pricePreservationCredit` term in `src/lib/glossary.ts`:

```ts
pricePreservationCredit: {
  title: "Price preservation credit",
  body: "When you rebook a slot priced higher than your original, ChronoPay can apply your account credit to cover the difference so you pay the original price. No action is taken until you confirm.",
  learnMoreHref: "/docs/rebooking#price-preservation",
}
```

## Testing

- Unit: `src/components/dashboard/keep-original-price-chip.test.tsx`
- **36 test cases**, coverage ≥ 95% (96.66% statements, 97.36% branches, 100% functions/lines)
- Edge cases covered: null render, equal/cheaper price, exact credit, one-unit-short, fractional XLM, controlled/uncontrolled, live announcement, keyboard Enter/Space, disabled click no-op, custom currency

```bash
npm run test:unit
npm run test:coverage -- --coverage.include="src/components/dashboard/keep-original-price-chip.tsx"
```

## Before/after comparison

### Before (alternative card, price difference silent)

```
┌─────────────────────────────────────────────┐
│ Strategy Session II       [Tight]           │
│ Fri Apr 4 · 11:00–12:00                     │
│ [3 interested buyers] [110 XLM / hr]        │
└─────────────────────────────────────────────┘
```

### After (nudge chip surfaced)

```
┌─────────────────────────────────────────────┐
│ Strategy Session II       [Tight]           │
│ Fri Apr 4 · 11:00–12:00                     │
│ [3 interested buyers] [110 XLM / hr]        │
│                                             │
│ 🏷 Keep original price · 100 XLM  +10 XLM ⓘ│
└─────────────────────────────────────────────┘
```

After clicking:

```
│ ✓ Price locked at 100 XLM                  ⓘ│
```
