/**
 * keyboard-shortcuts.ts
 *
 * Single source of truth for the shortcuts listed in the
 * `KeyboardShortcutsOverlay` (src/app/components/keyboard-shortcuts-overlay.tsx).
 * Kept separate from the component so the list can be unit-tested and reused
 * (e.g. a future command palette) without importing React.
 */

export type ShortcutCategory =
  | "Navigation"
  | "Search"
  | "Actions"
  | "General";

export const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  "Navigation",
  "Search",
  "Actions",
  "General",
];

export interface ShortcutEntry {
  /** Stable id used for React keys and test lookups. */
  id: string;
  /** Ordered key combination, e.g. ["Ctrl", "K"]. Rendered as separate <kbd> tags. */
  keys: string[];
  /** Human-readable description of what the shortcut does. */
  description: string;
  category: ShortcutCategory;
}

export const KEYBOARD_SHORTCUTS: ShortcutEntry[] = [
  {
    id: "open-shortcuts",
    keys: ["Ctrl", "/"],
    description: "Open the keyboard shortcuts overlay",
    category: "General",
  },
  {
    id: "close-overlay",
    keys: ["Esc"],
    description: "Close the current dialog, drawer, or overlay",
    category: "General",
  },
  {
    id: "whats-this-mode",
    keys: ["?"],
    description: "Toggle \"What's this\" contextual help mode",
    category: "General",
  },
  {
    id: "go-home",
    keys: ["G", "H"],
    description: "Go to the dashboard home",
    category: "Navigation",
  },
  {
    id: "go-marketplace",
    keys: ["G", "M"],
    description: "Go to the marketplace",
    category: "Navigation",
  },
  {
    id: "go-history",
    keys: ["G", "T"],
    description: "Go to transaction history",
    category: "Navigation",
  },
  {
    id: "open-search",
    keys: ["/"],
    description: "Focus the header search field",
    category: "Search",
  },
  {
    id: "search-clear",
    keys: ["Esc"],
    description: "Clear the current search query",
    category: "Search",
  },
  {
    id: "search-navigate",
    keys: ["↑", "↓"],
    description: "Move between search suggestions and recent searches",
    category: "Search",
  },
  {
    id: "switch-account",
    keys: ["Ctrl", "Shift", "A"],
    description: "Open the account switcher",
    category: "Actions",
  },
  {
    id: "toggle-theme",
    keys: ["Ctrl", "Shift", "L"],
    description: "Toggle light and dark theme",
    category: "Actions",
  },
  {
    id: "mint-slot",
    keys: ["Ctrl", "M"],
    description: "Mint a new time slot",
    category: "Actions",
  },
];

/**
 * Filters shortcuts by category and a free-text query.
 * The query matches against the description and the rendered key labels,
 * case-insensitively.
 */
export function filterShortcuts(
  shortcuts: ShortcutEntry[],
  category: ShortcutCategory | "All",
  query: string,
): ShortcutEntry[] {
  const normalizedQuery = query.trim().toLowerCase();

  return shortcuts.filter((shortcut) => {
    if (category !== "All" && shortcut.category !== category) return false;
    if (!normalizedQuery) return true;

    const haystack = [shortcut.description, ...shortcut.keys]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}
