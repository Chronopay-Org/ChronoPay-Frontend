# Command Palette Design System

## Overview

The Command Palette (`CommandPalette`) is a context-sensitive, keyboard-first command interface triggered by **Cmd+K / Ctrl+K**. It provides quick access to all major navigation destinations and actions within ChronoPay, with results ranked by relevance to the current route.

## Trigger

| Method | Behaviour |
|---|---|
| `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux) | Opens the palette |
| Click outside | Closes the palette |
| `Escape` | Closes the palette (clears query first if non-empty) |

## Features

### 1. Context-Sensitive Ranking

Commands are ranked higher when they are more relevant to the current page. The ranking algorithm is documented in `src/lib/commands.ts`:

```
Score = (labelMatch ? 15 : keywordMatch ? 5 : 0) × routeBoost
```

- **Label match (+10)**: The query appears in the command's display label
- **Precision bonus (+5)**: The query appears at the start of the label
- **Keyword match (+5)**: The query matches a keyword but not the label
- **Route boost (×N)**: Multiplier applied when the current pathname matches a `routeBoost` pattern

**Boost values:**

| Boost | Meaning | Examples |
|---|---|---|
| ×3 | "You're on this page" | Dashboard → Dashboard, Wallet → Wallet |
| ×5 | "Quick action from" | Wallet → Transfer, Calendar → Create Availability |

### 2. "Why This?" Tooltip

Each boosted result displays:
- A **"Top pick"** badge next to the label
- An **info icon** (`Info` from Lucide) that reveals a tooltip explaining the boost reason

The tooltip appears on hover, focus, or click of the info button.

### 3. Global Toggle

A toggle in the palette footer switches between two ranking modes:

| Mode | Label | Behaviour |
|---|---|---|
| **Contextual** (default) | Shows "Contextual" with `aria-checked="true"` | Route-aware ranking with boosts |
| **Global** | Shows "Global" with `aria-checked="false"` | All boosts set to 1; flat alphabetical ordering |

The toggle uses `role="switch"` with `aria-checked` for accessibility.

## Component Architecture

```
src/
├── lib/
│   └── commands.ts          # Command definitions, matchRoute, rankCommands
├── hooks/
│   └── use-command-palette.ts  # State management, keyboard shortcut, focus trap
└── app/components/
    ├── command-palette.tsx     # UI component
    └── __tests__/
        └── command-palette.test.tsx
```

### Data Flow

1. `useCommandPalette` hook manages all state (open/close, query, activeIndex, global toggle)
2. It calls `rankCommands(COMMANDS, query, pathname, isGlobal)` to get sorted results
3. `CommandPalette` component renders the UI, binding keyboard/pointer events to hook actions
4. Commands are defined in `commands.ts` with their labels, keywords, and route boosts

## Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|---|---|
| Dialog pattern | `role="dialog"` + `aria-modal="true"` on the backdrop container |
| Dialog labelling | `aria-labelledby` pointing to a hidden heading |
| Combobox pattern | `role="combobox"` + `aria-expanded` + `aria-controls` + `aria-activedescendant` |
| Listbox pattern | `role="listbox"` on results container, `role="option"` + `aria-selected` on each item |
| Keyboard navigation | Arrow keys to navigate, Enter to select, Escape to dismiss, Tab prevented |
| Focus management | Focus moves to input on open, returns to trigger on close, trapped in dialog |
| Focus indicators | All interactive elements have `focus-visible:ring-*` styles |
| Screen reader announcements | `role="status"` with `aria-live="polite"` announces result count |
| Visible labels | "Top pick" badge on boosted items; info button has `aria-label` with boost reason |
| Reduced motion | No custom animations; standard Tailwind transition classes respect `prefers-reduced-motion` |

## Responsive Behaviour

| Viewport | Layout |
|---|---|
| Mobile (<640px) | Full-width with `mx-4` gutters, `pt-[15vh]` from top |
| Desktop (≥640px) | Centered `max-w-lg` card, `pt-[20vh]` from top |
| Max height | `max-h-[60vh]` with scrollable results area |

## Design Tokens

The palette uses the same design tokens as other overlays:

- Background: `bg-slate-950/95 backdrop-blur-xl` (matches `account-switcher` and search dropdowns)
- Border: `border-white/10` with `ring-1 ring-black/20`
- Accent: `cyan-400` / `cyan-500/10` for selected and boosted items
- Text: `white` primary, `slate-500` secondary, `slate-600` hints

  # Command Palette Recent Actions & Pinning

## Overview
To improve navigation efficiency, the command palette maintains a list of recently used actions and allows users to pin frequently used tools to the top.

## Behavior
- **Recent Group**: Tracks the last 5 unique actions performed.
- **Pinned Group**: Static list of actions chosen by the user. Pinned items are excluded from the Recent group to avoid duplication.
- **Persistence**: State is persisted in `localStorage` per browser session.

## Accessibility (WCAG 2.1 AA)
- Toggling a pin is performable via keyboard (Enter/Space on the button).
- Aria-labels dynamically update based on pinned state.
- Focus is managed to prevent closing the palette when toggling pins.

## Edge Cases

| Scenario | Behaviour |
|---|---|
| **Unknown route** (no routeBoost matches) | All boosts default to 1; no "Top pick" badges shown |
| **Dark mode** | Automatically inherits from `data-theme` / `prefers-color-scheme` via CSS custom properties |
| **RTL layouts** | Uses standard CSS (no directional assumptions); `getBoundingClientRect` is layout-aware |
| **Keyboard only** | All interactions available via keyboard; no mouse required |
| **Screen reader** | Full ARIA combobox/listbox pattern; result count announced; boost reasons in `aria-label` |
| **Very long command list** | Scrollable results area with `overflow-y-auto`; keyboard wraps at boundaries |
| **Empty query** | Shows all commands ordered by route boost (contextual) or original order (global) |
| **No results** | Friendly empty state with suggestion to try different terms |
| **Rapid typing** | Immediate filtering on every keystroke (no debounce needed — lightweight computation) |

## Testing

Tests in `src/app/components/__tests__/command-palette.test.tsx` cover:

- Rendering (hidden by default, opens on shortcut)
- Search/filtering (label match, keyword match, empty state)
- Keyboard navigation (ArrowDown/Up, wrap-around, Enter, Escape)
- Route-aware ranking (Transfer boosted on wallet, Create Availability on calendar)
- Global toggle (disables boosts, toggles label/aria-checked)
- "Why this?" tooltip (appears on click/hover)
- Accessibility (dialog role, combobox attributes, listbox/option roles, live region)
- Edge cases (unknown route, clearing query)
- Unit tests for `rankCommands` and `matchRoute`

Run with:

```bash
npx vitest run src/app/components/__tests__/command-palette.test.tsx
```
