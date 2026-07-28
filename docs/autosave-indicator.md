# Autosave Indicator

A compact status badge that tells users when their booking-flow progress has been saved, is being saved, hit an error, or is queued offline.

**Component location:** `src/components/dashboard/autosave-indicator.tsx`  
**Type definition:** `AutosaveStatus` in `src/components/dashboard/types.ts`

---

## States

| State | Label | Icon | Tone token |
|---|---|---|---|
| `saving` | "Saving…" | Spinning half-circle | `warning` (`--accent-warm`) |
| `saved` | "Saved · N mins ago" | Checkmark | `positive` (`--success`) |
| `offline` | "Offline — changes queued" | Warning (dot + exclamation) | `neutral` (`--accent`) |
| `error` | "Couldn't save" + Retry button | Cross | `critical` (`--danger`) |

- **saved** shows a relative-time label ("just now", "2 mins ago", "1 hr ago") that auto-updates every 30s. Hovering or focusing the badge reveals the exact timestamp in a tooltip.
- **error** includes a keyboard-reachable Retry button (`aria-label="Retry saving your booking progress"`).

---

## Tokens used

The component consumes the same tone–color mapping as `StatusChip`:

| Tone | Border | Background | Text |
|---|---|---|---|
| `warning` (saving) | `border-amber-400/30` | `bg-amber-400/10` | `text-amber-100` |
| `positive` (saved) | `border-emerald-400/30` | `bg-emerald-400/10` | `text-emerald-100` |
| `neutral` (offline) | `border-sky-400/30` | `bg-sky-400/10` | `text-sky-100` |
| `critical` (error) | `border-rose-400/30` | `bg-rose-400/10` | `text-rose-100` |

No new CSS variables are introduced — the component reuses the existing `--accent-warm`, `--success`, `--accent`, `--danger` tokens inherited from `globals.css`.

---

## Props

```tsx
interface AutosaveIndicatorProps {
  status: "saving" | "saved" | "offline" | "error";
  lastSavedAt?: Date;       // exact timestamp — used for tooltip + relative label
  onRetry?: () => void;     // shown only in error state
}
```

---

## Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|---|---|
| **Live region** | A visually-hidden `role="status"` + `aria-live="polite"` element announces status text. Text is only updated when the status actually changes (not on every relative-time tick), so screen readers aren't spammed. |
| **Tooltip keyboard access** | The badge has `tabIndex={0}` + `role="button"` in the `saved` state. Focus opens the tooltip; Escape closes it. `aria-describedby` links the badge to the tooltip content. |
| **Retry accessible name** | The retry button uses `aria-label="Retry saving your booking progress"`. |
| **Reduced motion** | The saving spinner's `animate-spin` class is suppressed when `prefers-reduced-motion: reduce` is active. |
| **Color contrast** | All four states use the existing tone palette (amber/emerald/sky/rose) which exceeds 4.5:1 against the dark `#07111f` background. Light-mode tokens in `[data-theme="light"]` also pass 4.5:1. |
| **Logical CSS** | Uses `inset-inline-start`, `ms-1`, `start-1/2` instead of separate `[dir="rtl"]` overrides — RTL works for free. |

---

## Integration example

```tsx
import { BookingProgress } from "@/components/dashboard/booking-progress";

<BookingProgress
  stages={stages}
  autosaveStatus="saved"
  autosaveLastSavedAt={new Date()}
  onAutosaveRetry={() => { /* retry logic */ }}
/>
```

When `autosaveStatus` is omitted the indicator is not rendered, preserving backward compatibility.

---

## Screenshots

### Dark theme
1. **saving** — amber badge with spinner + "Saving…"
2. **saved** — emerald badge with checkmark + "Saved · just now" (tooltip open on focus showing exact timestamp)
3. **offline** — sky badge with warning icon + "Offline — changes queued"
4. **error** — rose badge with cross + "Couldn't save" + "Retry" button

### Light theme
Same four states with light-mode token resolution (darker foreground colors on the lighter `#f0f5fb` background).