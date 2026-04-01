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
