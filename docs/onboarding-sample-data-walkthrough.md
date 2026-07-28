# Onboarding Sample Data Walkthrough

## Overview

New ChronoPay sellers see **clearly labeled sample dashboard data** and a short **coach-mark tour**. The tour ends with a **Clear samples** action so demo rows never look like live inventory.

**Primary data:** `src/components/dashboard/dashboard-data.ts`  
**Hook:** `src/hooks/use-onboarding-samples.ts`  
**UI:** `SampleBadge`, `OnboardingWalkthrough`, `ClearSamplesBanner`

## Design goals

- **Honest labeling:** Every sample metric and slot shows a visible Sample badge + tooltip.
- **Guided, skippable:** Three coach marks with Skip / Escape; skipping keeps samples until cleared.
- **Accessible:** WCAG 2.1 AA — dialog semantics, focus trap, live step announcements, ≥ 44px targets.
- **Responsive + RTL-ready:** Logical `start` placement for the dialog; wrapping banner CTA on narrow viewports.
- **Documented:** This page is the design-system reference for sample onboarding.

## Components

### SampleBadge

```tsx
import { SampleBadge } from "@/components/dashboard";

<SampleBadge />
<SampleBadge tooltip="Custom explanation" />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tooltip` | `string` | `SAMPLE_TOOLTIP` | Explanation shown via shared `Tooltip` |
| `className` | `string` | `""` | Extra classes on the chip |

Amber chip + Beaker icon; `aria-label` is `Sample: {tooltip}`.

### ClearSamplesBanner

Persistent region (`data-tour-target="clear-samples"`) with the Clear samples CTA. Shown while sample data remains (during the tour or after skip).

### OnboardingWalkthrough

Modal coach marks that spotlight `[data-tour-target]` regions.

| Prop | Type | Description |
| --- | --- | --- |
| `open` | `boolean` | Mounts the overlay |
| `onSkip` | `() => void` | Skip / Escape / backdrop |
| `onComplete` | `() => void` | Tour finished (after last step) |
| `onClearSamples` | `() => void` | Final CTA removes sample rows |
| `steps` | `WalkthroughStep[]` | Optional override of default steps |

Default steps: **metrics → slots → clear-samples**.

### useOnboardingSamples

| Flag | Meaning |
| --- | --- |
| `showSamples` | Render sample metrics/slots |
| `showTour` | Open walkthrough |
| `showClearBanner` | Samples remain; tour dismissed |
| `clearSamples()` | Persist cleared state |
| `dismissTour()` | Persist tour dismissal without clearing |

Storage keys:

- `chronopay.onboarding.samplesCleared`
- `chronopay.onboarding.tourDismissed`

## Accessibility notes

| Concern | Implementation |
| --- | --- |
| Sample identity | Visible badge + descriptive `aria-label` + tooltip |
| Tour dialog | `role="dialog"` `aria-modal="true"` with labelled title/body |
| Keyboard | Escape skips; Tab cycles within dialog; Back/Next/Clear |
| Live updates | `aria-live="polite"` announces step changes |
| Focus | Primary action focused each step; cyan `focus-visible` rings |
| Motion | `prefers-reduced-motion` uses instant scroll |
| Dark mode | Uses existing slate/cyan/amber ChronoPay tokens |
| RTL | Banner and dialog use flex + logical `start` insets |

### axe / manual checks

- No unlabeled icon-only control without `aria-label` (close uses “Skip walkthrough”).
- Sample badge contrast: amber-100 on amber-400/10 with border (≥ 4.5:1 for text).
- Clear CTA meets 44×44 px minimum via `min-h-11`.
- Screen reader: clearing samples removes sample list content; empty slot state uses `EmptyStateCard`.

## Responsive layout

- **< 640px:** Banner stacks; walkthrough dialog is full-bleed inset from bottom edges.
- **≥ 640px:** Banner row with trailing CTA; dialog docks to `inset-inline-start`.

## Edge cases

| Case | Behavior |
| --- | --- |
| User skips tour | Samples stay; Clear samples banner remains |
| Dark mode | Inherited dashboard theme (no light-only palette) |
| RTL | Logical start/end; wrap-friendly flex |
| localStorage blocked | In-memory state still updates for the session |

## Testing

```bash
npm run test:unit
npm run test:coverage
npm run lint
```

Coverage include paths: sample badge, walkthrough, clear banner, onboarding hook (≥ 95% lines).

## Before / after

| Before | After |
| --- | --- |
| Sample-looking metrics/slots with no provenance | `isSample` rows + Sample badge/tooltip |
| No first-run guidance | Coach-mark walkthrough with skip |
| No way to dismiss demo data | Clear samples CTA + empty workspace |
