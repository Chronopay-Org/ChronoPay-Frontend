# Two-Factor Fallback Picker

## Overview

The `TwoFactorFallbackPicker` presents a list of configured 2FA fallback methods (SMS, TOTP, hardware key) when the user's primary two-factor method is unavailable. It follows the same card-radio pattern as `RefundDestinationSelector` and `CancellationReasonPicker`, with clear method descriptions, ETAs, optional badges, and an inline "Help me sign in" support link.

**Component location:** `src/components/dashboard/two-factor-fallback-picker.tsx`
**Shell pattern:** Standalone region with slate/cyan design tokens matching the dashboard aesthetic.

## Design goals

- **Fallback-first:** Lists methods in user-configured order (passed via props), defaulting to the first as recommended.
- **Clear guidance:** Each method shows an icon, label, description, and estimated time to complete.
- **Support link:** Bottom "Help me sign in" link routes to a support flow when the user is stuck.
- **Accessible:** WCAG 2.1 AA — radiogroup with arrow-key navigation, visible focus, live announcements.
- **Responsive:** Cards stack vertically on mobile; CTA and selection hint share a row on wider viewports.
- **RTL-ready:** Uses flex layout with no hard-coded left/right assumptions.

## Component API

```tsx
import {
  TwoFactorFallbackPicker,
  type TwoFactorMethodOption,
} from "@/components/dashboard/two-factor-fallback-picker";

<TwoFactorFallbackPicker
  onSelect={(method) => {
    // method.id, method.label, method.description, method.eta, method.icon
  }}
/>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `onSelect` | `(method) => void` | — | Called when user confirms a method |
| `methods` | `readonly TwoFactorMethodOption[]` | built-in SMS / TOTP / hardware key | Override method options (order is preserved) |
| `title` | `string` | `"Choose another sign-in method"` | Region heading |
| `description` | `string` | short helper copy | Supporting sentence |
| `continueLabel` | `string` | `"Continue"` | Primary CTA label |
| `helpLinkHref` | `string` | `"/help/sign-in"` | Support link URL |
| `helpLinkLabel` | `string` | `"Help me sign in"` | Support link text |
| `className` | `string` | `""` | Extra classes on the outer container |

### Default method options

| Id | Label | Description | Icon | ETA |
| --- | --- | --- | --- | --- |
| `sms` | SMS code | Receive a one-time code via text message. | Smartphone | ~30 seconds |
| `totp` | Authenticator app | Generate a time-based code from Google Authenticator, Authy, etc. | Shield | ~15 seconds |
| `hardware_key` | Hardware security key | Use a FIDO2 / WebAuthn key (YubiKey, etc.). | KeyRound | ~10 seconds |

### Types

```ts
type TwoFactorMethodId = "sms" | "totp" | "hardware_key";

type TwoFactorMethodOption = {
  id: TwoFactorMethodId;
  label: string;
  description: string;
  icon: "Smartphone" | "Shield" | "KeyRound";
  eta?: string;
  badge?: string;
};
```

## Usage

### Default — all three methods

```tsx
import { TwoFactorFallbackPicker } from "@/components/dashboard/two-factor-fallback-picker";

function FallbackPage() {
  const handleSelect = (method) => {
    // Navigate to SMS/TOTP/hardware key flow
    console.log("Continuing with:", method.id);
  };

  return (
    <TwoFactorFallbackPicker onSelect={handleSelect} />
  );
}
```

### With custom method order

```tsx
<TwoFactorFallbackPicker
  methods={[
    {
      id: "hardware_key",
      label: "YubiKey",
      description: "Insert your YubiKey and tap the button.",
      icon: "KeyRound",
      eta: "~10 seconds",
      badge: "Fastest",
    },
    {
      id: "sms",
      label: "SMS code",
      description: "A code will be texted to your phone.",
      icon: "Smartphone",
      eta: "~30 seconds",
    },
  ]}
  onSelect={handleSelect}
/>
```

### Single method (only one configured)

```tsx
<TwoFactorFallbackPicker
  methods={[
    {
      id: "sms",
      label: "SMS code",
      description: "A code will be texted to your phone.",
      icon: "Smartphone",
    },
  ]}
  onSelect={handleSelect}
/>
```

### Custom support link

```tsx
<TwoFactorFallbackPicker
  helpLinkLabel="I need help signing in"
  helpLinkHref="/contact-support?reason=2fa-locked"
  onSelect={handleSelect}
/>
```

## Accessibility (WCAG 2.1 AA)

| Concern | Implementation |
| --- | --- |
| Group semantics | `role="radiogroup"` + `role="radio"` cards |
| Keyboard | Arrow keys / Home / End move selection and focus (roving `tabIndex`) |
| Focus | Cyan `focus-visible:ring-2` rings on cards, button, and link |
| Default announcement | `role="status"` `aria-live="polite"` announces the default method on mount |
| Selection announcement | Live region announces method name + ETA on change |
| Confirmation | Live region announces confirmation and button text updates |
| Support link | Visible focus ring; opens in same tab with `ExternalLink` icon |
| `aria-describedby` | Region linked to its description paragraph |

### axe / manual checks

- No unlabeled controls; radiogroup has `aria-labelledby`
- Contrast: all text meets ≥ 4.5:1 (cyan-on-slate, white-on-slate)
- Dark mode: inherits ChronoPay slate/cyan tokens
- RTL: flex layout with no hard-coded directional assumptions
- Touch targets: all interactive elements ≥ 44px height

## Visual Design

| Element | Tokens |
|---------|--------|
| Container | `rounded-[28px]`, `border-white/10`, `bg-slate-950/70`, `backdrop-blur` |
| Selected card | `border-cyan-300/50`, `bg-cyan-300/10`, `ring-1 ring-cyan-300/30` |
| Unselected card | `border-white/12`, `bg-white/5` |
| Badge | `bg-cyan-300 text-slate-950` (selected), `bg-cyan-100/90 text-cyan-800` / `dark:bg-cyan-900/30` (unselected) |
| Focus ring | `ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-950` |
| Primary CTA | `bg-cyan-300 text-slate-950` |
| Disabled state | `bg-white/10 text-slate-500 cursor-not-allowed` |

## Responsive layout

- **< 640px:** Cards stack vertically; CTA full-width via column flex
- **≥ 640px:** Selection hint and CTA share a row
- Padding scales: `p-4` → `sm:p-5` → `xl:p-6`

## Edge Cases

- **No methods available**: Continue button is disabled, no radiogroup rendered
- **Single method**: Pre-selected; user can continue immediately
- **Badge on method**: Rendered as a pill floating at top-right of card
- **Unknown icon**: Falls back to `HelpCircle` icon
- **Confirmation guard**: After clicking Continue, selection is locked and button changes to "Continuing..." (disabled)
- **Unmount safety**: Timeout cancellation via `mountedRef` prevents state updates after unmount

## Testing

- Unit: `src/components/dashboard/two-factor-fallback-picker.test.tsx`
- Coverage target: **≥ 95%** for the picker module
- Edge cases covered:
  - Single method, no methods
  - Keyboard arrow / Home / End navigation
  - ARIA states (aria-checked, aria-labelledby)
  - Live region announcements (default, selection, confirmation)
  - Unknown icon fallback
  - Confirmation guard (no re-selection after confirm)
  - Cleanup on unmount
  - Custom methods, labels, order, badge, help link
  - Dark mode + RTL (via token inheritance)

```bash
npm run test:unit
npm run lint
```
