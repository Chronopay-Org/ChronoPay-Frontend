# Save and resume drafts UX

The dashboard now exposes a draft-status surface for long multi-step flows such as minting, disputes, and supplier onboarding.

## Pattern summary
- Show a draft-status chip in the flow header with one of three states: Saved, Saving, or Offline.
- Present resumable draft cards with a last-edited timestamp and a clear resume action.
- Provide a confirmation dialog before discarding a draft.
- Announce state changes through the shared live region with polite, throttled updates.

## Accessibility notes
- All controls use visible focus states and high-contrast text on dark surfaces.
- The discard dialog uses dialog semantics with `role="dialog"` and `aria-modal="true"`.
- Status updates are exposed to screen readers through the live region component.
