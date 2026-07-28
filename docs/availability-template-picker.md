# Availability Template Picker

## Overview

The `AvailabilityTemplatePicker` component enables suppliers to quickly apply preset (weekdays, weekends, 7-day high availability, early morning) or custom saved availability templates to their calendar in a single interaction.

**Component location:** `src/components/dashboard/availability-template-picker.tsx`  
**Shell pattern:** Reuses `PanelShell` (`src/components/dashboard/panel-shell.tsx`) for consistent dashboard chrome, or operates in `bare` mode when embedded inside drawers or dialogs.

## Design Goals

- **One-Click Application:** Apply structured weekly slot templates across current week, next week, or full month.
- **Visual Previews:** Mini timeline previews showing active day coverage and hourly blocks for every template card.
- **Custom Templates:** "Save current as template" modal allowing suppliers to persist custom schedules.
- **Diff & Conflict Protection:** Calculates slots added, slots modified, and highlights booked slot conflicts before applying.
- **Overwrite Safety:** Confirmation modal before overwriting unbooked existing blocks, while preserving booked buyer appointments.
- **Undo / Revert:** Instant undo banner allowing suppliers to revert accidental template applications.
- **Accessible (WCAG 2.1 AA):** Roving `tabIndex` keyboard navigation across radiogroups, high-contrast indicators, cyan/emerald focus rings, and screen reader announcements (`role="status"`, `aria-live="polite"`).
- **Responsive & Dark Mode:** Responsive layout wrapping on narrow viewports, styled with ChronoPay slate/cyan glassmorphism tokens.

## Component API

```tsx
import {
  AvailabilityTemplatePicker,
  type AvailabilityTemplate,
  type ApplyScope,
} from "@/components/dashboard";

<AvailabilityTemplatePicker
  existingSlots={slots}
  onApplyTemplate={(template: AvailabilityTemplate, scope: ApplyScope) => {
    // Apply template logic
  }}
  onSaveCurrentAsTemplate={(newTemplate: AvailabilityTemplate) => {
    // Save template logic
  }}
  onUndoLastApply={() => {
    // Revert template logic
  }}
/>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `templates` | `AvailabilityTemplate[]` | built-in templates | List of preset/saved templates |
| `existingSlots` | `Slot[]` | `[]` | Current slots used for diffing and booked conflict detection |
| `onApplyTemplate` | `(template, scope) => void` | — | Callback fired when a template is applied |
| `onSaveCurrentAsTemplate` | `(template) => void` | — | Callback fired when a custom template is created |
| `onUndoLastApply` | `() => void` | — | Callback fired when undo is triggered |
| `bare` | `boolean` | `false` | Skip PanelShell when embedding in drawers or dialogs |
| `title` | `string` | `"Availability Template Picker"` | Heading text |
| `description` | `string` | helper text | Subheading description |
| `className` | `string` | `""` | Extra CSS class names |

### Built-in Templates

| ID | Name | Schedule | Category |
| --- | --- | --- | --- |
| `tpl-weekdays` | Standard Weekdays | Mon-Fri 09:00-17:00 UTC | `weekdays` |
| `tpl-weekends` | Weekend Special | Sat-Sun 10:00-16:00 UTC | `weekends` |
| `tpl-fullweek` | 7-Day High Availability | Mon-Sun 09:00-18:00 UTC | `fullweek` |
| `tpl-earlybird` | Early Morning Focus | Mon-Fri 07:00-12:00 UTC | `custom` |

## Accessibility (WCAG 2.1 AA)

| Concern | Implementation |
| --- | --- |
| Radiogroup Semantics | `role="radiogroup"` on template cards and scope selector with `role="radio"` items |
| Keyboard Navigation | Roving `tabIndex` handling `ArrowRight`/`ArrowLeft`/`ArrowUp`/`ArrowDown`/`Home`/`End` |
| Screen Reader Live Region | `role="status"` `aria-live="polite"` announces selection changes, scope switches, template saves, and applications |
| Focus Visibility | Cyan focus rings (`focus-visible:ring-2 focus-visible:ring-cyan-400`) on interactive elements |
| Color Contrast | Text and status badges use high-contrast HSL tokens (≥ 4.5:1 ratio) |
| Modal Accessibility | Dialogs implement `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` |

## Responsive Layout

- **< 640px:** Template cards display in single column; CTA buttons expand to full width; scope selector wraps cleanly.
- **≥ 640px:** Template cards display in 2-column grid; CTA controls align horizontally.

## Testing & Verification

- Unit test suite: `src/components/dashboard/availability-template-picker.test.tsx`
- Coverage target: **≥ 95%**
