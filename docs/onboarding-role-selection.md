# Onboarding Role Selection

The first-launch role selection flow prompts users to choose between buyer, supplier, and admin before they continue into the dashboard shell.

## Experience summary

- Full-screen modal dialog on first launch
- Three visual role cards with icon, description, and summary bullets
- Buyer preselected as the recommended starting role
- Primary CTA persists the choice into `RoleContext` and local storage
- Dashboard setup content updates by role after selection

## Accessibility notes

- Dialog uses `role="dialog"` with `aria-modal="true"`.
- Focus moves to the first role card when the dialog opens.
- Each card exposes pressed state with `aria-pressed`.
- Role changes continue to announce through the shell live region.
- The user can switch roles later from the header role chip without losing context.

## Persistence model

- Role value stored in `chronopay:role`
- Explicit onboarding completion stored in `chronopay:role:selected`
- If no explicit selection exists, the dialog appears even though buyer remains the SSR fallback

## Responsive and edge-case notes

- Cards stack into a single column on narrow viewports and a three-column grid on large screens.
- The copy stays readable in dark mode and wraps safely for longer translated labels.
- RTL support relies on flex/grid mirroring and logical spacing classes.

## Validation notes

- Covered by shell tests for first-launch dialog visibility.
- Manual follow-up recommended for browser-level focus and animation review.
