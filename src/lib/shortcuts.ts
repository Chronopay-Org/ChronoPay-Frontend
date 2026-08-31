/**
 * ChronoPay Keyboard Shortcuts
 *
 * Centralised registry of every keyboard binding exposed by the dashboard.
 * The `?` (Shift+/) overlay renders these grouped by surface so users can
 * discover and learn the bindings without memorising them.
 *
 * This file is the single source of truth: when a new shortcut surface lands
 * (palette, navigation, density, …), add a group here and the overlay — and the
 * docs/design-review-checklist.md table — stay in sync automatically.
 *
 * Usage:
 *   import { SHORTCUT_GROUPS } from "@/lib/shortcuts";
 */

export interface ShortcutBinding {
  /**
   * The key or key chord that triggers the action, e.g. ["?"] or ["Ctrl", "K"].
   * Each entry is rendered inside its own <kbd> element.
   */
  keys: string[];
  /** Short plain-language label describing what the binding does. */
  label: string;
}

export interface ShortcutGroup {
  /** Stable identifier used for heading ids and tests. */
  id: string;
  /** Surface name shown as the group heading (e.g. "Global", "Search"). */
  title: string;
  /** Bindings that belong to this surface. */
  bindings: ShortcutBinding[];
}

/**
 * All current dashboard shortcuts, grouped by surface.
 * Ordered from most general (Global) to most specific.
 */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    id: "global",
    title: "Global",
    bindings: [
      {
        keys: ["?"],
        label: "Open or close this shortcut reference",
      },
      {
        keys: ["Esc"],
        label: "Close dialog, drawer, or search",
      },
    ],
  },
  {
    id: "navigation",
    title: "Navigation",
    bindings: [
      {
        keys: ["Tab"],
        label: "Move to the next interactive element",
      },
      {
        keys: ["Shift", "Tab"],
        label: "Move to the previous interactive element",
      },
      {
        keys: ["Enter"],
        label: "Activate the focused link or button",
      },
    ],
  },
  {
    id: "search",
    title: "Search",
    bindings: [
      {
        keys: ["↓"],
        label: "Move to the next suggestion",
      },
      {
        keys: ["↑"],
        label: "Move to the previous suggestion",
      },
      {
        keys: ["Enter"],
        label: "Run the highlighted search",
      },
      {
        keys: ["Esc"],
        label: "Dismiss the search box",
      },
    ],
  },
];
