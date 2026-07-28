# Supplier Verified Payouts Badge - Design System Standard

## Overview

The `verifiedPayouts` badge provides a compact, accessible, non-color-only visual indicator on supplier cards and slot listings across ChronoPay. It signals to buyers that a supplier's payout account and Stellar trustlines have been authenticated and verified on-chain for automated settlement.

**Component location:** `src/components/dashboard/social-proof-badge.tsx`  
**Card container integration:** `src/components/dashboard/card.tsx` (`SupplierCardHeader`)  
**Glossary term definition:** `src/lib/glossary.ts` (`verifiedPayouts`)  

## Design Goals

- **Visual Clarity:** Combines a distinct `ShieldCheck` icon with the uppercase text label `"VERIFIED PAYOUTS"`.
- **Non-Color-Only Conveyance (WCAG 2.1 SC 1.4.1):** Information is conveyed through icon shape, explicit text, and ARIA labels — never color alone.
- **Interactive Explainer (WCAG 2.1 SC 3.3.2 / 2.4.4):** Includes hover/focus tooltip criteria and an embedded interactive `HelpPopover` trigger link that opens on-demand domain guidance.
- **Responsive & Flexible:** Adapts to card headers, grid layouts, mobile viewports, and edge cases such as long supplier names and RTL text direction.

## Component Specification

### Badge Preset Data (`BADGE_PRESETS.verifiedPayouts`)

```typescript
verifiedPayouts: {
  label: "Verified Payouts",
  tone: "positive",
  icon: "ShieldCheck",
  criterion: "Supplier's payout account and Stellar trustlines are verified on-chain for automated settlement.",
  explainerKey: "verifiedPayouts",
}
```

### Visual Anatomy

1. **Icon Container:** `ShieldCheck` Lucide icon (`h-3 w-3 shrink-0`) in `emerald-100`.
2. **Text Label:** `"VERIFIED PAYOUTS"` in `text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100`.
3. **Tooltip Trigger:** Integrated `Tooltip` component displaying criterion text on hover and focus.
4. **Explainer Trigger:** Integrated `HelpPopover` button opening a popover with the `verifiedPayouts` glossary entry and documentation link.

## Layout & Container Edge Cases

### 1. Card Header Integration (`SupplierCardHeader`)
When placed inside a card header alongside long supplier names (e.g. `Dr. Alexandria Montgomery-Wellington III`), `SupplierCardHeader` uses `min-w-0 flex-1 truncate` on text containers and `shrink-0` on badge lists. This guarantees the badge remains fully visible without causing layout overflow.

### 2. Dark Mode & Contrast (WCAG 2.1 SC 1.4.3 Level AA)
- Background: `bg-emerald-400/10` over dark surface (`bg-zinc-900` / `bg-slate-950`).
- Border: `border-emerald-400/30`.
- Text & Icon: `text-emerald-100` (Contrast ratio > 7:1 against dark backgrounds).

### 3. Right-to-Left (RTL) Layout
- Flex layout utilizes `gap-1` and relative positioning.
- Text direction (`dir="rtl"`) automatically reverses icon and label alignment without breaking focus indicators or popover placement.

### 4. Screen Reader Experience (WCAG 2.1 SC 4.1.2)
- Root container includes `aria-label="Verified Payouts: Supplier's payout account and Stellar trustlines are verified on-chain for automated settlement."`.
- Decorative icon carries `aria-hidden="true"`.
- Explainer button carries `aria-label="Explainer for Verified Payouts"`, `aria-expanded`, and `aria-controls`.
- Popover uses `role="dialog"` with keyboard tab trapping and Escape key dismiss.

## Accessibility (axe) Checklist & Validation Notes

- [x] **WCAG 2.1 AA Compliant:** Contrast ratio verified (> 4.5:1 text, > 3:1 graphical control elements).
- [x] **Non-color-only:** Shield check icon and explicit label convey status independently of color.
- [x] **Keyboard Navigable:** Tab key moves to popover trigger; Enter/Space opens popover; Escape closes popover; focus restored to trigger.
- [x] **Touch Targets:** Trigger padding satisfies 44px touch target guidelines on mobile screens.
- [x] **Screen Readers:** Tested with NVDA and VoiceOver semantics.

## Usage Example

```tsx
import { Card, SupplierCardHeader, BADGE_PRESETS } from "@/components/dashboard";

export function SupplierProfileCard() {
  return (
    <Card variant="panel">
      <SupplierCardHeader
        name="Alex Rivera"
        title="Product & Strategy Consultant"
        badges={[
          { type: "verifiedPayouts", ...BADGE_PRESETS.verifiedPayouts },
          { type: "topRated", ...BADGE_PRESETS.topRated },
        ]}
      />
    </Card>
  );
}
```
