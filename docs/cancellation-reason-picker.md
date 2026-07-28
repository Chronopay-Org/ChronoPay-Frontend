# Cancellation Reason Picker

## Overview

The `CancellationReasonPicker` asks buyers for a short reason before they cancel or rebook a time-token session. It combines selectable reason chips with an optional free-text field (max **240** characters) and announces submission to assistive technology.

**Component location:** `src/components/dashboard/cancellation-reason-picker.tsx`  
**Shell pattern:** Reuses `PanelShell` (`src/components/dashboard/panel-shell.tsx`) for consistent dashboard chrome.

## Design goals

- **Compact:** Chip row + optional details; no modal required.
- **Honest defaults:** Includes **Prefer not to say** so privacy is a first-class choice.
- **Accessible:** WCAG 2.1 AA — keyboard radiogroup, visible focus, live announcements.
- **Responsive:** Chips wrap; submit stacks on narrow viewports; touch targets ≥ 44px.
- **RTL-ready:** Uses logical flex wrapping and full-width controls (no left/right-only layout assumptions).

## Component API

```tsx
import {
  CancellationReasonPicker,
  type CancellationReasonSubmission,
} from "@/components/dashboard";

<CancellationReasonPicker
  onSubmit={(payload: CancellationReasonSubmission) => {
    // payload.reasonId, payload.reasonLabel, payload.details
  }}
/>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `onSubmit` | `(payload) => void` | — | Fires after a valid submit |
| `reasons` | `CancellationReasonOption[]` | built-in list | Override chip options |
| `title` | `string` | `"Why are you cancelling?"` | Panel / bare heading |
| `eyebrow` | `string` | `"Feedback"` | PanelShell eyebrow |
| `description` | `string` | short helper copy | Supporting sentence |
| `submitLabel` | `string` | `"Submit reason"` | Primary CTA label |
| `className` | `string` | `""` | Extra classes on the form |
| `bare` | `boolean` | `false` | Skip PanelShell when embedding in a dialog |

### Default reason chips

| Id | Label |
| --- | --- |
| `schedule_conflict` | Schedule conflict |
| `no_longer_needed` | No longer needed |
| `found_alternative` | Found another option |
| `price_concern` | Price or rate concern |
| `seller_issue` | Seller or communication issue |
| `prefer_not_to_say` | Prefer not to say |
| `other` | Other |

Constant: `CANCELLATION_REASON_MAX_CHARS = 240`.

## Accessibility notes

| Concern | Implementation |
| --- | --- |
| Group semantics | `role="radiogroup"` + `role="radio"` chips |
| Keyboard | Arrow keys / Home / End move selection and focus (roving `tabIndex`) |
| Focus | Cyan `focus-visible:ring-2` rings on chips, textarea, and submit |
| Free-text limit | `maxLength={240}` + live character count |
| Submission | `role="status"` `aria-live="polite"` announces the chosen reason |
| Required choice | Submit disabled until a chip is selected |

### axe / manual checks

- No unlabeled form controls; radiogroup has `aria-labelledby`.
- Contrast: selected chips use cyan-on-slate tones meeting ≥ 4.5:1 for text.
- Dark mode: inherits ChronoPay slate/cyan tokens (no separate light-only palette).
- RTL: wrap chips and stack CTA; character counter uses `justify-between` without hard-coded side padding that breaks mirroring.

## Responsive layout

- **< 640px:** Chips wrap; submit button full-width via column flex.
- **≥ 640px:** Selection hint and submit share a row.
- Panel padding follows `PanelShell` (`p-4` → `sm:p-5` → `xl:p-6`).

## Embedding examples

### Dashboard panel (default)

```tsx
<CancellationReasonPicker
  onSubmit={(payload) => console.log(payload)}
/>
```

### Inside an existing cancel dialog

```tsx
<CancellationReasonPicker
  bare
  title="Before you cancel"
  submitLabel="Confirm cancellation"
  onSubmit={handleCancel}
/>
```

## Testing

- Unit: `src/components/dashboard/cancellation-reason-picker.test.tsx`
- Coverage target: **≥ 95%** for the picker module
- Edge cases covered: 240-char clip, prefer-not-to-say, keyboard arrows, announce on submit, disabled submit

```bash
npm run test:unit
npm run lint
```
