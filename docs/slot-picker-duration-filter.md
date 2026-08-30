# Slot picker duration filter

Summary

- Adds a chip-based duration filter above the slot picker to allow buyers to quickly filter slots to 15, 30, or 60-minute blocks.
- Chips show counts and are toggleable; they sync to the URL query param `duration`.

Accessibility

- Each chip is a `button` with `aria-pressed` to indicate toggle state to assistive tech.
- Changes to the filter are announced via a visually-hidden `LiveRegion` with `aria-live="polite"` so screen reader users hear the updated state and result counts.
- Keyboard interaction: chips are reachable via Tab and toggled with Enter/Space.
- Zero-result state uses the existing `EmptyStateCard` pattern to provide guidance and actions.

Implementation notes

- Component: `src/components/dashboard/DurationChips.tsx` — client component.
- Wiring: `src/components/dashboard/slot-list.tsx` — reads `duration` from URL, updates via `router.replace`, filters `slots` from `dashboard-data.ts`.
- Data: `src/components/dashboard/types.ts` now includes `durationMinutes?: number` for `Slot`.

Deep links

- Example: `/dashboard?duration=30` will preselect the 30m chip and show only 30-minute slots.

Edge cases

- If no slots match, an accessible empty state is shown with guidance.
- Clearing a chip removes `duration` from the URL.

Design review checklist

- Visual: chips match existing rounded-full, border, and focus-ring patterns used elsewhere in the dashboard.
- Contrast: selected/pressed states use `bg-cyan-600/40` with white text which matches the project's dark theme palette.
- Responsiveness: chips are in a flex-wrap container and wrap on narrow viewports.

Testing

- Unit tests added to assert toggle behavior and LiveRegion announcements.
- Manual validation: keyboard navigation, URL deep-linking, dark-mode colors.
