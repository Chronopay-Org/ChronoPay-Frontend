# Keyboard Shortcuts Overlay

Implements [#315](../../../issues/315) — a searchable command index for the
dashboard's keyboard shortcuts, replacing the need to scan a long static list.

- Component: `src/app/components/keyboard-shortcuts-overlay.tsx`
- Data: `src/lib/keyboard-shortcuts.ts`
- Wired into: `src/app/components/dashboard-shell.tsx`
- Tests: `src/app/components/__tests__/keyboard-shortcuts-overlay.test.tsx`,
  `src/__tests__/keyboard-shortcuts.test.ts`

## Opening the overlay

- **Header button** — a keyboard icon button labelled "Keyboard shortcuts" in
  both the desktop and mobile header.
- **Global shortcut** — `Ctrl+/` (or `Cmd+/` on macOS) toggles the overlay from
  anywhere in the dashboard.

## Behaviour

- A search field filters the list by shortcut description or key label as the
  user types (case-insensitive, substring match).
- Category filter chips (`All`, `Navigation`, `Search`, `Actions`, `General`)
  narrow the list further. Search and category combine — both must match.
- The first visible result is highlighted automatically whenever the query or
  category changes, so keyboard users always know which row `Enter`/further
  navigation would act on ("focus first result").
- `ArrowUp`/`ArrowDown` from the search field move the highlight through the
  visible results and wrap at the ends.
- No matches renders a descriptive empty state ("No shortcuts found — try a
  different search term or choose another category") instead of an empty list.
- `Escape` or the close button dismiss the overlay; clicking the backdrop
  outside the panel also dismisses it.
- Every open resets the search query and category back to defaults so the
  overlay starts from a predictable state.

## Accessibility (WCAG 2.1 AA)

- The panel is a `role="dialog"` with `aria-modal="true"` and
  `aria-labelledby` pointing at the visible heading.
- `FocusTrap` (`src/components/common/FocusTrap.tsx`) keeps `Tab`/`Shift+Tab`
  cycling inside the dialog while open and restores focus to the previously
  focused element (the trigger button) when it closes.
- The search field follows the combobox/listbox pattern already used by
  `HeaderSearch` and `AccountSwitcher`: `role="combobox"`, `aria-expanded`,
  `aria-controls`, and `aria-activedescendant` pointing at the highlighted
  `role="option"` row.
- Category chips are a `role="group"` with `aria-pressed` per chip, plus
  `ArrowLeft`/`ArrowRight`/`Home`/`End` roving focus — the same convention as
  `SentimentChipFilter`.
- Result-count changes are announced through a polite `LiveRegion`
  (`src/components/common/LiveRegion.tsx`), e.g. "3 shortcuts found" or "No
  shortcuts match your search".
- Colour is never the only signal: the active chip and highlighted row also
  change border/background, and text contrast is retained in both states.

## Responsive

- The dialog is centered with a `max-w-lg` cap on wider viewports and adds
  horizontal margin (`p-4`) on narrow ones so it never touches the screen
  edges.
- Category chips wrap (`flex-wrap`) instead of overflowing on small screens.
- The results list scrolls independently (`max-h-80 overflow-y-auto`) so the
  search field and chip row stay visible while scanning a long, unfiltered
  list.

## Extending the shortcut list

Add entries to `KEYBOARD_SHORTCUTS` in `src/lib/keyboard-shortcuts.ts`. Each
entry needs a unique `id`, an ordered `keys` array (rendered as individual
`<kbd>` tags), a human-readable `description`, and a `category` from
`SHORTCUT_CATEGORIES`. No changes to the overlay component are needed — the
search and filter logic operate on the full list automatically.
