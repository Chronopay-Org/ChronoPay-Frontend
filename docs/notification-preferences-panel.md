# Notification Preferences Panel

The notification preferences panel adds per-category and per-channel controls to dashboard settings, plus quiet-hours scheduling.

## Included behaviors

- Desktop matrix with categories on rows and channels on columns
- Mobile stacked cards instead of a squeezed table
- Per-cell `role="switch"` toggles
- Quiet-hours enable switch with start and end time inputs
- Polite save announcement through a live region

## Accessibility notes

- Every toggle exposes a full channel/category label through `aria-label`.
- Quiet-hours inputs remain in the tab order only while enabled.
- The desktop table keeps category headers as row headers for screen-reader context.
- Save feedback is announced without moving focus.

## Responsive notes

- `md` and up: matrix table for quick scanning.
- Below `md`: categories collapse into stacked channel rows.
- Controls keep a minimum 44 px target size.

## Edge-case notes

- Many categories: the panel keeps table overflow contained on desktop.
- Dark mode: all states use the existing slate surface system.
- RTL: the table is explicitly `dir="ltr"` for stable channel ordering while surrounding copy still mirrors naturally.
- Keyboard: all switches and time inputs remain fully operable without pointer input.

## Validation notes

- Covered by `jest-axe` in component tests.
- Manual follow-up recommended in browser for final visual QA on dark mode and RTL documents.
