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
| `critical` | `alert` | `assertive` | `AlertOctagon` (pulsing red) | `border-red-500/50 bg-red-950` |

`success` and `info` use `polite` — they wait for the screen reader to finish
its current sentence. `warning`, `error`, and `critical` use `assertive` — they interrupt
immediately because the user needs to act. `critical` toasts are forced to persist until acknowledged (`duration` = 0).

---

## Placement & Stacking

- **Desktop (md+):** fixed bottom-right, `bottom-6 right-6`
- **Mobile:** fixed bottom-center, `bottom-4`, full-width up to `max-w-sm`
- **Stack order:** newest toast appears on top (`flex-col-reverse`)
- **Max visible:** `TOAST_STACK_LIMIT` = 5 entries (oldest dropped when limit exceeded)
- **Gap between toasts:** `gap-2` (8 px)
- **Clear all:** appears when ≥ 2 entries are visible; dismisses entire stack

---

## Grouping by Category

When multiple toasts share the same `category` string they are collapsed into
a single grouped entry in the stack.

```
┌──────────────────────────────────────────┐
│ ✓  3 transactions confirmed       [∨][×] │
│    "Slot #42 purchased"                  │
└──────────────────────────────────────────┘
```

- The **count badge** shows how many messages are in the group.
- The **chevron button** (`aria-expanded`) expands an inline panel listing
  every individual message with a relative timestamp.
- Expanding a group **pauses** its auto-dismiss timer so the user can read.
- A **"Dismiss all"** shortcut inside the panel dismisses the whole group.
- Groups that receive a new message are **bubbled to the top** of the stack.

### Category API

```tsx
toast({
  variant: "success",
  title: "Slot #42 purchased",
  category: "transactions",   // ← grouping key
});

toast({
  variant: "success",
  title: "Slot #43 purchased",
  category: "transactions",   // ← same key → merged into one card
});
```

### Edge cases

| Case | Behaviour |
|---|---|
| Burst of 20+ same-category toasts | All merged into one group entry; count badge shows real count; stack stays ≤ 5 |
| All entries grouped | Each group is one stack slot; "Clear all" dismisses every group |
| No category | Toast is never grouped; treated as individual entry |
| Expanded group auto-dismiss | Timer is paused while panel is open |
| RTL | Flex layout reverses naturally; no explicit overrides needed |
| Reduced motion | `panelVariants` height animation omitted; opacity-only via `motion-reduce:*` classes |

---

## Auto-dismiss Timing

| Scenario | Duration |
|---|---|
| Default | 5 000 ms |
| Custom (pass `duration` prop) | Any ms value |
| Persistent (no auto-dismiss) | `duration: 0` |

The timer **pauses** while the user hovers over or focuses inside the toast,
giving them time to read or copy error details.

## Undo affordance

For a reversible action, pass an `onUndo` callback. The toast adds a visible
countdown ring and an **Undo** button. The ring drains over the toast duration,
then freezes whenever the toast is hovered, focused, or an expanded group is
being read. Persistent toasts (`duration: 0`) retain the Undo button without a
countdown.

```tsx
toast({
  variant: "success",
  title: "Slot deleted",
  duration: 5000,
  onUndo: () => restoreSlot(slotId),
});
```

While focus is inside that toast, <kbd>Ctrl</kbd>+<kbd>Z</kbd> (or
<kbd>⌘</kbd>+<kbd>Z</kbd>) invokes Undo. Limiting the shortcut to the focused
toast avoids intercepting native undo in forms and content-editable fields.
The Undo button's accessible name includes the shortcut, the countdown has an
updated remaining-time label, and a separate polite live region announces both
availability and a successful undo. The SVG itself is hidden from assistive
technology. The countdown is static when reduced motion is requested.

### Accessibility and review notes

- Keyboard: tab to **Undo**, then use Enter/Space or Ctrl/Cmd+Z; focus remains
  visible on every action.
- Screen readers: verify the availability announcement follows the toast
  announcement and that successful undo is announced before dismissal.
- Responsive/RTL: the action row uses flex sizing and logical content flow, so
  the ring and controls stay usable at the mobile `max-w-sm` viewport and in
  right-to-left documents.
- Dark mode: ring colors reuse the existing variant tokens and maintain the
  established dark-surface contrast.
- Automated accessibility: run the component through axe in the application
  harness; expected result is no WCAG 2.1 AA violations for the idle, focused,
  paused, and grouped states.

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
const { toast, dismiss, dismissAll, toasts } = useToast();

// Fire a toast
const id = toast({
  variant: "success",          // "success" | "info" | "warning" | "error" | "critical"
  title: "Wallet connected",
  description: "Optional detail line.",  // optional
  duration: 5000,              // optional, default 5000, 0 = persistent
  category: "transactions",   // optional — toasts with the same category
                               // are grouped into one stacked card
});

// Dismiss one entry (or group) by id
dismiss(id);

// Dismiss every visible entry at once
dismissAll();
```

Must be called inside a component that is a descendant of `<ToastProvider>`.
`ToastProvider` is mounted in `src/app/layout.tsx` so it is available
everywhere in the app.

### `ToastItem` shape

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Stable identifier (`group:{category}` for groups) |
| `variant` | `ToastVariant` | Tone / role |
| `title` | `string` | Primary text (most recent message for groups) |
| `description` | `string?` | Secondary text |
| `duration` | `number?` | Auto-dismiss ms |
| `category` | `string?` | Grouping key |
| `count` | `number` | Messages in group (1 = ungrouped) |
| `messages` | `ToastMessage[]` | Individual entries shown in expanded panel |

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
| critical | `text-red-50 font-bold` (#fef2f2) | `bg-red-950` | ≥ 7:1 ✓ |

All variants exceed WCAG 2.1 AA (4.5:1) and approach AAA (7:1) on the
dark surface. The description line uses `text-slate-300` (#cbd5e1) which
meets AA against the same backgrounds.

---

## Edge Cases

| Case | Behaviour |
|---|---|
| 6th entry arrives (ungrouped) | Oldest is dropped (reducer caps at `TOAST_STACK_LIMIT = 5`) |
| Burst of 20+ same-category | All merged into one group; count badge reflects real count |
| User hovers during auto-dismiss | Timer pauses; resumes on mouse-leave |
| User focuses dismiss button | Timer pauses; resumes on blur |
| Expanded group | Auto-dismiss paused; resumes when collapsed |
| `duration: 0` | No auto-dismiss; user must click × |
| `onAction` throws synchronously | Caught by `handleClick`, sets `error` state |
| Multiple rapid clicks | `if (state === "pending") return` guard prevents re-entry |
| Reduced motion | Framer Motion skips translate/scale; opacity-only transition; panel height animation skipped |
| Dark mode | Uses existing `slate`/`cyan` palette — no change needed |
| RTL | Flex layout reverses naturally |

---

## Accessibility Checklist

- [x] `role="status"` / `role="alert"` on each toast / group
- [x] `aria-live="polite"` / `aria-live="assertive"` scoped to each entry
- [x] `aria-atomic="true"` — full toast content read as one unit
- [x] Grouped toast has `aria-label="{count} {category} notifications: {title}"`
- [x] Count badge has `aria-label="{count} notifications in this group"`
- [x] Expand button has `aria-expanded` + `aria-controls` pointing to panel
- [x] Expanded panel is `role="list"` with `aria-label`
- [x] Dismiss button has descriptive `aria-label="Dismiss: {title}"`
- [x] Dismiss button has visible focus ring (`focus-visible:ring-2 focus-visible:ring-cyan-300`)
- [x] "Clear all" button dismisses entire stack
- [x] `AsyncButton` uses `aria-busy` + `disabled` during pending
- [x] `AsyncButton` has hidden `aria-live="polite"` span for state announcements
- [x] Timer pauses on hover, focus, and while expanded
- [x] Reduced-motion: opacity-only transition
- [x] Contrast ≥ 4.5:1 on all variants (WCAG 2.1 AA)
- [x] `ToastContainer` has `aria-label="Notifications"` landmark
