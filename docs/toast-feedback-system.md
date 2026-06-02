# Toast & Inline Feedback System

Design system documentation for the ChronoPay async feedback pattern.  
Covers toast notifications and inline button states for time-token actions.

---

## Overview

ChronoPay's async actions (connect wallet, mint, buy, escrow release) are
Stellar network calls that take 1–3 seconds. Users need clear, accessible
feedback at two levels:

| Level | Component | When |
|---|---|---|
| **Inline** | `AsyncButton` | Immediately on click — spinner, confirmed, error state on the button itself |
| **Global** | `Toast` + `ToastContainer` | After the action resolves — confirms outcome or explains failure |

---

## Toast Variants

Four variants map to the existing tone scale used by `StatusChip`.

| Variant | Role | `aria-live` | Icon | Border / Background |
|---|---|---|---|---|
| `success` | `status` | `polite` | `CheckCircle2` (emerald) | `border-emerald-400/25 bg-emerald-950/85` |
| `info` | `status` | `polite` | `Info` (cyan) | `border-cyan-400/25 bg-cyan-950/85` |
| `warning` | `alert` | `assertive` | `AlertTriangle` (amber) | `border-amber-400/25 bg-amber-950/85` |
| `error` | `alert` | `assertive` | `XCircle` (rose) | `border-rose-400/25 bg-rose-950/85` |

`success` and `info` use `polite` — they wait for the screen reader to finish
its current sentence. `warning` and `error` use `assertive` — they interrupt
immediately because the user needs to act.

---

## Placement & Stacking

- **Desktop (md+):** fixed bottom-right, `bottom-6 right-6`
- **Mobile:** fixed bottom-center, `bottom-4`, full-width up to `max-w-sm`
- **Stack order:** newest toast appears on top (`flex-col-reverse`)
- **Max visible:** 5 toasts (oldest is dropped when the 6th arrives)
- **Gap between toasts:** `gap-2` (8 px)

---

## Auto-dismiss Timing

| Scenario | Duration |
|---|---|
| Default | 5 000 ms |
| Custom (pass `duration` prop) | Any ms value |
| Persistent (no auto-dismiss) | `duration: 0` |

The timer **pauses** while the user hovers over or focuses inside the toast,
giving them time to read or copy error details.

---

## Reduced-Motion Behaviour

Framer Motion's `motion.div` respects `prefers-reduced-motion` automatically
when the `layout` prop is used. The CSS utility `motion-reduce:translate-y-0`
and `motion-reduce:scale-100` are also applied to the wrapper so the toast
appears/disappears with opacity only — no translate or scale animation.

---

## Keyboard Accessibility

- The dismiss `×` button is always focusable (`tabIndex` not suppressed)
- Focus ring: `focus-visible:ring-2 focus-visible:ring-cyan-300` (matches
  the rest of the design system)
- `Escape` is **not** bound to dismiss toasts — the dismiss button is the
  single, predictable interaction point
- Screen readers announce the toast content via `role="status"` /
  `role="alert"` + `aria-atomic="true"` on each individual toast

---

## API

### `useToast()`

```tsx
const { toast, dismiss, toasts } = useToast();

// Fire a toast
const id = toast({
  variant: "success",          // "success" | "info" | "warning" | "error"
  title: "Wallet connected",
  description: "Optional detail line.",  // optional
  duration: 5000,              // optional, default 5000, 0 = persistent
});

// Dismiss programmatically
dismiss(id);
```

Must be called inside a component that is a descendant of `<ToastProvider>`.
`ToastProvider` is mounted in `src/app/layout.tsx` so it is available
everywhere in the app.

---

### `<AsyncButton>`

```tsx
<AsyncButton
  onAction={async () => { await mintToken(); }}
  labels={{
    idle:      "Mint time token",
    pending:   "Minting…",
    confirmed: "Minted",
    error:     "Mint failed",
  }}
  variant="primary"   // "primary" | "secondary"
  size="md"           // "sm" | "md" | "lg"
  confirmedDuration={2000}   // ms before resetting to idle
  onError={(err) => toast({ variant: "error", title: "Mint failed" })}
/>
```

State machine: `idle → pending → confirmed → idle` (happy path)  
                `idle → pending → error` (stays until next click)

Accessibility:
- `aria-busy="true"` + `disabled` during `pending` (prevents double-submit)
- `aria-live="polite"` hidden span announces state changes to screen readers
- Focus ring matches the design system

---

## Integration with Time-Token Actions

| Action | Toast on success | Toast on error |
|---|---|---|
| Connect wallet | `success` "Wallet connected" | `error` "Wallet action failed" |
| Mint | `success` "Token minted" | `error` "Mint failed" |
| Buy slot | `success` "Slot purchased" | `error` "Purchase failed" |
| Escrow release | `success` "Escrow released — 180 XLM transferred" | `error` "Escrow release failed" |

---

## File Structure

```
src/
  hooks/
    use-toast.ts                  # Context, provider, hook, types
  app/
    components/
      ui/
        toast.tsx                 # Single toast item
        toast-container.tsx       # AnimatePresence viewport region
        async-button.tsx          # Inline pending/confirmed/error button
    layout.tsx                    # ToastProvider + ToastContainer mounted here
    dashboard/
      page.tsx                    # Demo panels wired to useToast
  components/
    dashboard/
      wallet-card.tsx             # Uses AsyncButton + useToast
```

---

## Contrast & Dark Mode

All four variants are designed for the dark (`#07111f`) background:

| Variant | Text | Background | Contrast ratio (approx.) |
|---|---|---|---|
| success | `text-emerald-100` (#d1fae5) | `bg-emerald-950/85` | ≥ 7:1 ✓ |
| info | `text-cyan-100` (#cffafe) | `bg-cyan-950/85` | ≥ 7:1 ✓ |
| warning | `text-amber-100` (#fef3c7) | `bg-amber-950/85` | ≥ 7:1 ✓ |
| error | `text-rose-100` (#ffe4e6) | `bg-rose-950/85` | ≥ 7:1 ✓ |

All variants exceed WCAG 2.1 AA (4.5:1) and approach AAA (7:1) on the
dark surface. The description line uses `text-slate-300` (#cbd5e1) which
meets AA against the same backgrounds.

---

## Edge Cases

| Case | Behaviour |
|---|---|
| 6th toast arrives | Oldest is dropped from state (reducer caps at 5) |
| User hovers during auto-dismiss | Timer pauses; resumes on mouse-leave |
| User focuses dismiss button | Timer pauses; resumes on blur |
| `duration: 0` | No auto-dismiss; user must click × |
| `onAction` throws synchronously | Caught by `handleClick`, sets `error` state |
| Multiple rapid clicks | `if (state === "pending") return` guard prevents re-entry |
| Reduced motion | Framer Motion skips translate/scale; opacity-only transition |

---

## Accessibility Checklist

- [x] `role="status"` / `role="alert"` on each toast
- [x] `aria-live="polite"` / `aria-live="assertive"` scoped to each toast
- [x] `aria-atomic="true"` — full toast content read as one unit
- [x] Dismiss button has descriptive `aria-label="Dismiss: {title}"`
- [x] Dismiss button has visible focus ring (`focus-visible:ring-2 focus-visible:ring-cyan-300`)
- [x] `AsyncButton` uses `aria-busy` + `disabled` during pending
- [x] `AsyncButton` has hidden `aria-live="polite"` span for state announcements
- [x] Timer pauses on hover and focus
- [x] Reduced-motion: opacity-only transition
- [x] Contrast ≥ 4.5:1 on all variants (WCAG 2.1 AA)
- [x] `ToastContainer` has `aria-label="Notifications"` landmark
