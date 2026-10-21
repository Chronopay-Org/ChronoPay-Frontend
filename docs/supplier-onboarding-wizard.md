# Supplier Onboarding Wizard

Design-system documentation for the `SupplierOnboardingWizard` component introduced in [#344](https://github.com/Chronopay-Org/ChronoPay-Frontend/issues/344).

---

## Overview

`SupplierOnboardingWizard` is a multi-step layout for supplier onboarding. It provides:

- **Persistent side rail**: an always-visible list of every step (a horizontal, scrollable strip on mobile; a sticky vertical rail on `md+`) that tracks completion, the current step, and skipped optional steps.
- **Per-step validation**: each step reports its own `isComplete` state. Attempting to advance from an incomplete step surfaces an inline `role="alert"` message instead of silently disabling the Next button.
- **Skippable-later toggle**: steps marked `optional` expose a switch to defer the section; the wizard treats a skipped step as satisfied for navigation purposes and the rail reflects it as "Skipped for now".
- **Session persistence**: the current step, the furthest step reached, and skip choices persist to `sessionStorage` via `useWizardProgress`, so a reload resumes exactly where the supplier left off.

```
┌──────────────┬───────────────────────────────┐
│ ① Profile ✓  │  Storefront branding  Optional │
│ ② Branding ● │  Add a tagline...               │
│ ③ Review     │  [ Skip this step for now  ⚪ ] │
│              │  [ tagline input ]               │
│              │                                   │
│              │        ← Back          Next →    │
└──────────────┴───────────────────────────────┘
```

---

## Component

### `SupplierOnboardingWizard`

**Location:** `src/components/dashboard/supplier-onboarding-wizard.tsx`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steps` | `SupplierOnboardingStep[]` | required | Ordered list of steps to render. |
| `storageKey` | `string` | `"supplier-onboarding-wizard"` | sessionStorage key used to persist progress. Use a distinct key per wizard instance/route. |
| `heading` | `string` | `"Supplier onboarding"` | Visible card heading. |
| `onStepChange` | `(stepId: string) => void` | `undefined` | Called after navigating to a new step (Next, Back, or a rail click). |
| `onSkipToggle` | `(stepId: string, skipped: boolean) => void` | `undefined` | Called when an optional step's skip switch changes. |
| `onComplete` | `() => void` | `undefined` | Called when Next/Finish is pressed on the last step and it is complete or skipped. |

#### `SupplierOnboardingStep`

```ts
export type SupplierOnboardingStep = {
  id: string;
  title: string;
  description: string;
  /** Optional sections can be deferred later via the skip toggle. */
  optional?: boolean;
  /** Step body — form fields, summaries, etc. */
  content: ReactNode;
  /** Whether the step currently satisfies its own validation. */
  isComplete: boolean;
  /** Shown inline when the user tries to advance from an incomplete step. */
  errorMessage?: string;
};
```

Validation is intentionally left to the caller: each step's `isComplete` is a controlled boolean the host page recomputes from its own form state (see the showcase for an example). The wizard does not know about individual field rules — it only gates navigation on the flag.

#### Basic usage

```tsx
import { SupplierOnboardingWizard } from "@/components/dashboard/supplier-onboarding-wizard";

<SupplierOnboardingWizard
  storageKey="supplier-onboarding"
  steps={[
    {
      id: "profile",
      title: "Business profile",
      description: "Tell buyers who you are.",
      isComplete: businessName.trim().length > 0,
      errorMessage: "Add a business name to continue.",
      content: <BusinessProfileForm />,
    },
    {
      id: "branding",
      title: "Storefront branding",
      description: "Add an optional tagline.",
      optional: true,
      isComplete: tagline.trim().length > 0,
      content: <BrandingForm />,
    },
  ]}
  onComplete={() => submitApplication()}
/>
```

See `src/components/design/supplier-onboarding-wizard-showcase.tsx` for a full 5-step reference integration, and `/design-review/supplier-onboarding` for a live demo.

---

## Navigation model

- **Next** is always enabled. Clicking it while the current step is incomplete (and not skipped) shows the inline alert instead of moving; clicking it when valid advances, or calls `onComplete` on the last step. This avoids an unexplained disabled button — a common WCAG usability pitfall.
- **Back** is disabled on the first step only.
- **Rail navigation** is gated by the *furthest step reached* — a supplier can always jump back to a step they've already visited, but cannot skip ahead past their current progress by clicking the rail.
- **Skip toggle** marks the current optional step as satisfied for navigation. It does not hide or clear the step's content; the content dims (`opacity-50`) but stays visible so the supplier can still fill it in before leaving.

---

## Persistence model

`useWizardProgress` (`src/hooks/use-wizard-progress.ts`) stores `{ currentIndex, furthestIndex, skippedIds }` as JSON under `storageKey` in `sessionStorage`, following the same lazy-init + try/catch pattern as `useHeatmapPreference` and `useScrollRestoration`. Storage failures (private browsing, quota) are swallowed silently and the wizard falls back to in-memory state for that session.

Because progress is keyed by step **index**, keep the `steps` array's order and length stable across a given `storageKey` within a session.

---

## Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Rail semantics | `<nav aria-label="Onboarding steps">` with an `<ol>` of buttons |
| Current step | `aria-current="step"` on the active rail button |
| Unreached steps | `aria-disabled` + native `disabled` — kept in the DOM (not removed) so screen reader users still perceive the full journey |
| Step heading focus | Focus moves to the new step's `<h3>` (`tabIndex={-1}`) on every navigation, but not on initial mount |
| Validation | Inline `role="alert"` message shown only on a failed advance attempt; receives focus so it's announced immediately |
| Live region | `role="status" aria-live="polite"` announces `"Step X of N: Title"` on every navigation |
| Progress | `role="progressbar"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax` and a descriptive `aria-label` |
| Skip toggle | `role="switch"` with `aria-checked`, matching the pattern in `gift-purchase-toggle.tsx` |
| Focus rings | `focus-visible:ring-2 focus-visible:ring-cyan-300` on every interactive element |
| Non-colour cues | Rail markers use icon + label text (check, skip-forward, numeral) in addition to colour |

---

## Responsive behaviour

| Breakpoint | Layout |
|------------|--------|
| `< md` (< 768px) | Rail renders as a horizontal, scrollable strip above the step content |
| `≥ md` | Rail becomes a sticky vertical column (`md:sticky md:top-20 md:w-64`) beside the content |

---

## Testing

| File | Cases |
|------|-------|
| `src/components/dashboard/supplier-onboarding-wizard.test.tsx` | 19 tests — rendering, per-step validation blocking/unblocking Next, rail gating and `aria-current`, Back/Next/Finish navigation, skip toggle, sessionStorage persistence across remounts, live region, progressbar, callbacks |

Run with:

```bash
npm run test:unit
# or with coverage
npm run test:coverage
```

---

## Related

- `src/hooks/use-wizard-progress.ts` — sessionStorage-backed step/skip persistence
- `src/hooks/use-heatmap-preference.ts` — the localStorage lazy-init/try-catch pattern this hook follows
- `src/components/dashboard/card.tsx` — `Card`/`CardHeader`/`CardBody`/`CardFooter` shell
- `src/components/dashboard/booking-progress.tsx` — prior art for progress-bar styling referenced by this issue
- `src/components/design/supplier-onboarding-wizard-showcase.tsx` — reference integration with realistic steps
- `src/app/design-review/supplier-onboarding/page.tsx` — live design-review demo
- `docs/save-resume-drafts-ux.md` — companion draft-persistence UX documentation
