# Wallet Connect Reduced-Motion Success State

Documentation for the reduced-motion alternative of the wallet connection success state in `WalletConnectModal.tsx`.

**Component location:** `src/components/dashboard/WalletConnectModal.tsx`  
**Tests location:** `src/components/dashboard/WalletConnectModal.test.tsx`

---

## Overview

When connecting a Stellar wallet or email account in the `WalletConnectModal`, reaching the `success` state delivers a celebratory emotional beat. To ensure full WCAG 2.1 AA compliance and provide a safe experience for users sensitive to motion (vestibular disorders, visual motion sensitivity), the component automatically detects and respects the user's `prefers-reduced-motion` system preference.

- **Standard Motion**: Features a pop spring scale-up, pulse ripple ring, stroke animation, and dynamic zoom-in entrance transition.
- **Reduced Motion (`prefers-reduced-motion: reduce`)**: Replaces all scaling, spring, bouncing, and pulsing animations with a high-contrast **static success mark** and a smooth, subtle **opacity crossfade**.

---

## Technical Details

### Preference Detection & Dynamic Listener
The component uses `window.matchMedia('(prefers-reduced-motion: reduce)')` to determine the initial preference and attaches an `addEventListener('change')` listener so that toggling motion preferences mid-flow updates the interface immediately without needing a page refresh.

```tsx
const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
});

useEffect(() => {
  if (typeof window === 'undefined') return;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}, []);
```

---

## Emotional Beat & Static Success Mark Design

The reduced-motion state retains the visual satisfaction of success through color contrast, icon clarity, and structured hierarchy:

1. **Static Success Badge**:
   - Container: `flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400`
   - Icon: Solid 24x24 SVG checkmark (`polyline points="20 6 9 17 4 12"`) with clear `strokeWidth="2.5"`.
   - Motion suppression: Removes `animate-ping`, `animate-bounce`, and scale keyframes.
2. **Crossfade Entrance**:
   - Container applies `transition-opacity duration-200 ease-in-out opacity-100` when reduced motion is preferred.
3. **Status Chip & Confirmation**:
   - Includes `<StatusChip tone="positive">Connected</StatusChip>` badge.
   - Clear text heading: `"Wallet Connected Successfully"`.
   - Helper text: `"Your wallet is ready. You can manage connection preferences in settings."`

---

## Accessibility (WCAG 2.1 AA)

| Criteria | Implementation |
|---|---|
| **Live Region Announcement** | `LiveRegion` renders `<div role="status" aria-live="polite">Wallet connected successfully.</div>` so screen readers speak the confirmation upon status transition. |
| **Color Contrast** | Emerald success badge (`#059669` / `#34d399`) and text tokens meet the 4.5:1 text contrast and 3:1 graphical component contrast rules against both light (`#ffffff`) and dark (`#0f172a`) backgrounds. |
| **Focus Trap & Keyboard** | Trapped safely within `<FocusTrap>` modal shell; Esc key closes modal. |
| **Screen Reader** | Success SVG icon is marked `aria-hidden="true"` to prevent repetitive reading while live region handles clear status text. |
| **RTL Support** | Centered flex layout with logical text alignment (`text-center`, `max-w-xs mx-auto`). |

---

## Verification & Automated Testing

The implementation is verified using `vitest` and `jest-axe` in `src/components/dashboard/WalletConnectModal.test.tsx`:

- **Standard Motion Test**: Validates rendering of `standard-motion-success-mark` when `prefers-reduced-motion` is false.
- **Reduced Motion Test**: Validates rendering of `reduced-motion-success-mark` when `prefers-reduced-motion: reduce` is active.
- **Dynamic Toggle Test**: Simulates mid-flow preference toggle via `mediaQuery.change` listener.
- **LiveRegion Test**: Asserts screen reader text content on status change.
- **axe Audit**: Verifies zero WCAG 2.1 AA accessibility violations.
