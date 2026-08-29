# Refund Destination Selector

## Overview

The **RefundDestinationSelector** allows users to choose where their refund should be sent: to their ChronoPay wallet (instant, fee-free) or back to their original payment card (3–10 business days, network fees may apply).

It follows the two-card radio group pattern with clear tradeoff copy, badges for the recommended default, and inline tooltips for ETA and fee details.

A **RefundConfirmationModal** confirms the selection before final submission.

## Component API

### `RefundDestinationSelector`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onConfirm` | `(submission: RefundDestinationSubmission) => void` | — | Called after the user confirms via the modal |
| `destinations` | `readonly RefundDestinationOption[]` | Wallet + Card presets | Override destination options |
| `title` | `string` | `"Refund destination"` | Panel title |
| `eyebrow` | `string` | `"Payout"` | Panel eyebrow label |
| `description` | `string` | `"Choose where your refund should be sent…"` | Supporting description |
| `className` | `string` | `""` | Additional CSS classes |
| `bare` | `boolean` | `false` | Hide PanelShell chrome for embedding |

### `RefundConfirmationModal`

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Controls modal visibility |
| `onClose` | `() => void` | Called when modal is dismissed |
| `onConfirm` | `() => void` | Called when user confirms |
| `destination` | `RefundDestinationOption` | The selected destination to display |

### Types

```ts
type RefundDestination = "wallet" | "card";

type RefundDestinationOption = {
  id: RefundDestination;
  label: string;
  description: string;
  eta: string;
  fee: string;
  icon: string;
  recommended?: boolean;
  badge?: string;
};

type RefundDestinationSubmission = {
  destination: RefundDestination;
  option: RefundDestinationOption;
};
```

## Usage

```tsx
import { RefundDestinationSelector } from "@/components/dashboard/refund-destination-selector";

function RefundPage() {
  const handleRefundConfirm = (submission) => {
    console.log("Refund to:", submission.destination);
    // Submit to API...
  };

  return (
    <RefundDestinationSelector onConfirm={handleRefundConfirm} />
  );
}
```

### With Custom Destinations

```tsx
<RefundDestinationSelector
  destinations={[
    {
      id: "wallet",
      label: "ChronoPay Wallet",
      description: "Instant credit to your wallet.",
      eta: "Within minutes",
      fee: "No fees",
      icon: "Wallet",
      recommended: true,
      badge: "Recommended",
    },
    {
      id: "card",
      label: "Visa ending 4242",
      description: "Back to your card.",
      eta: "5–7 business days",
      fee: "2% processing fee",
      icon: "CreditCard",
    },
  ]}
  onConfirm={handleRefundConfirm}
/>
```

### Bare Mode (Embedded)

```tsx
<RefundDestinationSelector
  bare
  title="Where to send refund"
  description="Pick your preferred destination."
  onConfirm={handleRefundConfirm}
/>
```

## Accessibility (WCAG 2.1 AA)

- **radiogroup** with `role="radio"` buttons for destination selection
- Arrow-key navigation (ArrowRight/Left, ArrowUp/Down, Home/End)
- `aria-checked` reflects the current selection
- **LiveRegion** announces the default recommended choice on mount
- **LiveRegion** announces selection changes
- **FocusTrap** inside the confirmation modal
- Escape closes the modal
- Visible focus rings (cyan) on all interactive elements
- `aria-describedby` links radiogroup to description

## Visual Design

| Element | Tokens |
|---------|--------|
| Selected card | `border-cyan-300/50`, `bg-cyan-300/10`, `ring-1 ring-cyan-300/30` |
| Unselected card | `border-white/12`, `bg-white/5` |
| Recommended badge | `bg-cyan-300 text-slate-950` (selected), `bg-cyan-100/90 text-cyan-800` (unselected) |
| Modal backdrop | `bg-slate-950/80 backdrop-blur-sm` |
| Modal surface | `elevation-4`, `border-white/12 bg-slate-900` |
| Focus ring | `ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-950` |

## Dark Mode & RTL

- **Dark mode**: Uses Tailwind `dark:` variants (`dark:bg-cyan-900/30`, `dark:text-cyan-300`) leveraging the existing CSS variable system
- **RTL**: Tailwind's built-in RTL mirroring handles `right-*`/`left-*` classes automatically when `dir="rtl"` is set on `<html>`

## Edge Cases

- **Card unavailable**: Pass a single-element `destinations` array to show only the available option
- **Empty destinations**: Falls back gracefully; confirm button is disabled
- **Double confirmation**: After submission, the button changes to "Refund confirmed" (disabled) to prevent duplicate submissions
- **Keyboard-only**: Full keyboard navigation support via arrow keys, Home/End, Escape, and Enter/Space
