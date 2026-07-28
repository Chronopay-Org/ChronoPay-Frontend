# Empty State Illustration Style + Copy Guidelines

## Design goals

- Help users understand slot availability, wallet readiness, and booking progress at a glance.
- Keep the primary action obvious without crowding the state with competing buttons.
- Use calm, trust-building language before asking for sensitive actions like wallet connection.

## Illustration rules

- Use abstract product-shaped panels instead of decorative mascots so the empty state still feels product-specific.
- Reserve the strongest accent for the most important action area.
- Keep illustrations non-essential for meaning; screen-reader users should get the same guidance from headings and body copy.

## Copy rules

- Headline: say what is missing in plain language.
- Body copy: explain why the state matters or what remains private.
- Guidance: use short supporting lines to reduce uncertainty.
- Action labels: start with a verb and match the next obvious step.

## Reusable implementation notes

- Shared shell: `src/app/components/dashboard-shell.tsx`
- Empty state card: `src/app/components/empty-state-card.tsx`
- Status chip: `src/app/components/ui/status-chip.tsx`
- Route-level states: `src/app/dashboard/loading.tsx`, `src/app/dashboard/error.tsx`

## Slot list example

Use the shared card whenever `src/components/dashboard/slot-list.tsx` has no items to render.

```tsx
import { ButtonLink } from "@/app/components/ui/button-link";
import { EmptyStateCard } from "@/app/components/empty-state-card";

<EmptyStateCard
  eyebrow="Slots"
  title="No time slots listed yet"
  description="Add an availability block when you are ready to sell or reserve time."
  accentLabel="Slots"
  status={{ label: "Empty", tone: "neutral" }}
  guidance={[
    "Create your first availability block to begin selling time.",
    "Set clear availability windows so customers can book reliably.",
  ]}
  actions={
    <ButtonLink href="/dashboard#quick-actions" variant="primary" size="md">
      Add availability
    </ButtonLink>
  }
/>
```

- Keep the illustration decorative only; it should stay `aria-hidden`.
- Make the primary action a real focusable control, not static text.
- If the state appears inside a dashboard panel, add a matching target id on the next relevant section.
