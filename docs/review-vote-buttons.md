# Review Helpful/Unhelpful Vote Buttons

Design-system documentation for the `ReviewVoteButtons` component introduced in [#261](https://github.com/Chronopay-Org/ChronoPay-Frontend/issues/261).

---

## Overview

The `ReviewVoteButtons` component renders two small vote action buttons — **Helpful** and **Unhelpful** — adjacent to each customer review. It provides:

- **Optimistic UI**: counts and `aria-pressed` state update immediately on click — no network round-trip delay felt by the user.
- **Pressed state / double-vote prevention**: a voter's active choice is visually highlighted with a distinct border + background, and `aria-pressed="true"` is set on the active button. Clicking an already-active button removes the vote; clicking the opposite button switches the vote.
- **Undo toast affordance**: a success toast (via `useToast`) fires on every vote action carrying an `onUndo` callback. The user may revert within the toast's display duration.
- **Server error rollback**: if the optional async `onVote` prop rejects, all optimistic state is automatically restored and an error toast is displayed.

```
[👍 12]  [👎 1]
```

---

## Component

### `ReviewVoteButtons`

**Location:** `src/components/dashboard/review-vote-buttons.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `reviewId` | `string` | required | Unique review identifier — used to scope accessible IDs. |
| `initialHelpfulCount` | `number` | `0` | Starting helpful vote count. Floor-clamped to 0. |
| `initialUnhelpfulCount` | `number` | `0` | Starting unhelpful vote count. Floor-clamped to 0. |
| `initialUserVote` | `VoteType` | `null` | The current viewer's existing vote (`"helpful"`, `"unhelpful"`, or `null`). |
| `onVote` | `(newVote: VoteType, previousVote: VoteType) => Promise<void> \| void` | `undefined` | Async callback invoked after the optimistic update. A rejected promise triggers automatic rollback. |
| `showToastOnVote` | `boolean` | `true` | Whether to fire a feedback toast with undo affordance on each vote action. |
| `disabled` | `boolean` | `false` | Disables both buttons. Use during loading or when the current viewer is not permitted to vote. |
| `className` | `string` | `""` | Extra Tailwind classes applied to the container `div`. |

#### Exported Types

```ts
// src/components/dashboard/review-vote-buttons.tsx
export type VoteType = "helpful" | "unhelpful" | null;
```

#### Basic usage

```tsx
import { ReviewVoteButtons } from "@/components/dashboard/review-vote-buttons";

<ReviewVoteButtons
  reviewId="review-42"
  initialHelpfulCount={12}
  initialUnhelpfulCount={1}
  initialUserVote={null}
  onVote={async (newVote, prevVote) => {
    await apiClient.postVote({ reviewId: "review-42", vote: newVote });
  }}
/>
```

#### Inside a `ReviewsPanel` review list item

```tsx
<div className="flex items-center gap-1.5 pl-4 pt-1">
  <span className="text-xs text-slate-500 me-1">Was this helpful?</span>
  <ReviewVoteButtons
    reviewId={review.id}
    initialHelpfulCount={review.helpfulCount}
    initialUnhelpfulCount={review.unhelpfulCount}
    initialUserVote={review.userVote}
  />
</div>
```

See `src/components/dashboard/reviews-panel.tsx` for the full reference integration.

---

## State Machine

```
               ┌─────────────────────────────┐
               │         null (no vote)       │
               └──────┬───────────┬───────────┘
            click H   │           │  click U
                       ▼           ▼
             ┌──────────┐     ┌────────────┐
             │ "helpful" │     │"unhelpful" │
             └──────┬───┘     └───┬────────┘
           click H  │             │  click U
          (toggle)  ▼             ▼  (toggle)
               ┌─────────────────────────────┐
               │         null (no vote)       │
               └─────────────────────────────┘

  From "helpful" → click U  ⟹ switch to "unhelpful" (–helpful, +unhelpful)
  From "unhelpful" → click H ⟹ switch to "helpful"  (+helpful, –unhelpful)
```

---

## Optimistic UI & Rollback

1. **Optimistic update** — `setUserVote`, `setHelpfulCount`, `setUnhelpfulCount`, and a `LiveRegion` announcement fire synchronously before any async work.
2. **Async `onVote`** — the supplied callback is awaited. During the await, `isPending` is `true` and both buttons are `disabled` to prevent double-firing.
3. **Rollback on failure** — if `onVote` rejects, the closure-captured previous state is restored and an `"error"` toast is displayed.
4. **Undo via toast** — the rollback function is also exposed as `onUndo` inside the success toast. Users may undo within the toast's display window.

---

## Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Button semantics | `<button type="button">` — native keyboard and AT support |
| Pressed state | `aria-pressed="true/false"` on each button — reflects current user vote |
| Accessible name | `aria-label` includes vote direction, count, and singular/plural label e.g. `"Mark review as helpful (12 helpful votes)"` |
| Group semantics | Container uses `role="group" aria-label="Review voting controls"` |
| Focus ring | `.focus-ring-cyan` utility — 2 px offset + 2 px cyan-300 ring, WCAG AA contrast |
| SR announcements | `<LiveRegion aria-live="polite">` announces vote outcome and updated counts |
| Keyboard nav | Tab moves between buttons; Enter/Space activate the focused button |
| Disabled state | `disabled` prop sets HTML `disabled`; styled with `opacity-50 cursor-not-allowed` |
| Non-colour cues | Active state uses icon scale transform + border + background in addition to colour |
| RTL support | Container uses `gap-` (logical); `me-1` margin uses logical property |

### Colour contrast

| State | Background | Text / Icon | Contrast ratio |
|-------|-----------|-------------|----------------|
| Idle | `bg-slate-900/60` | `text-slate-400` (#94a3b8) on `#0f172a` | ≥ 4.5 : 1 (AA) |
| Helpful pressed | `bg-emerald-500/15` | `text-emerald-300` (#6ee7b7) on dark surface | ≥ 4.5 : 1 (AA) |
| Unhelpful pressed | `bg-rose-500/15` | `text-rose-300` (#fda4af) on dark surface | ≥ 4.5 : 1 (AA) |

---

## Theming

The component inherits CSS custom properties from `src/app/globals.css`. It renders correctly on the default dark surface and `[data-theme="light"]` without code changes. Button pressed states use semantic colour tokens aligned with the existing `StatusChip` Tone system:

| Vote | Pressed border | Pressed background | Icon / text |
|------|---------------|-------------------|-------------|
| Helpful | `emerald-500/40` | `emerald-500/15` | `emerald-300 / emerald-400` |
| Unhelpful | `rose-500/40` | `rose-500/15` | `rose-300 / rose-400` |

---

## Responsive Behaviour

| Breakpoint | Layout |
|------------|--------|
| All | Inline-flex row; buttons wrap naturally inside the review list item's flex container |
| `< sm` (< 640 px) | The entire review item column-stacks; the vote row sits below the excerpt |
| `≥ sm` | Review excerpt and vote row remain in a compact column inside the list item |

---

## Toast & Undo Integration

`ReviewVoteButtons` calls `useToast()` from `@/hooks/use-toast`. The component soft-catches if no `<ToastProvider>` is present in the tree (useful in isolated component tests). In production, `<ToastProvider>` is mounted in `src/app/layout.tsx`.

Toast payload on success:

```ts
toast({
  variant: "success",
  title: "Marked review as helpful.",        // varies by action
  description: "Click Undo to revert your vote.",
  duration: 5000,
  onUndo: rollback,                          // restores previous vote state
});
```

Toast payload on server error:

```ts
toast({
  variant: "error",
  title: "Failed to record vote",
  description: "Your vote could not be saved. Changes rolled back.",
});
```

---

## Testing

| File | Cases |
|------|-------|
| `src/components/dashboard/review-vote-buttons.test.tsx` | 25+ unit tests — rendering, aria-pressed, optimistic counts, toggle/switch, rollback, toast, undo, disabled, LiveRegion, keyboard, labels |
| `src/components/dashboard/reviews-panel.test.tsx` | 8+ integration tests — vote buttons rendered per stub, accessible groups, optimistic update in context |

Run with:

```bash
npm run test:unit
# or with coverage
npm run test:coverage
```

---

## Related

- `src/hooks/use-toast.tsx` — toast context with `onUndo` support
- `src/app/components/ui/toast.tsx` — toast renderer with undo button
- `src/components/common/LiveRegion.tsx` — polite announcement utility
- `src/components/dashboard/panel-shell.tsx` — host panel
- `src/components/dashboard/reviews-panel.tsx` — primary consumer
- `docs/review-sentiment-chip-filter.md` — companion review filtering documentation
- `docs/toast-feedback-system.md` — full toast system documentation
