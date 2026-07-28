import { describe, it, expect } from "vitest";
import {
  KEYBOARD_SHORTCUTS,
  SHORTCUT_CATEGORIES,
  filterShortcuts,
} from "@/lib/keyboard-shortcuts";

describe("keyboard-shortcuts data", () => {
  it("every shortcut belongs to a known category", () => {
    KEYBOARD_SHORTCUTS.forEach((shortcut) => {
      expect(SHORTCUT_CATEGORIES).toContain(shortcut.category);
    });
  });

  it("every shortcut has a unique id", () => {
    const ids = KEYBOARD_SHORTCUTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every shortcut has at least one key", () => {
    KEYBOARD_SHORTCUTS.forEach((shortcut) => {
      expect(shortcut.keys.length).toBeGreaterThan(0);
    });
  });
});

describe("filterShortcuts", () => {
  it("returns everything for an empty query and 'All' category", () => {
    expect(filterShortcuts(KEYBOARD_SHORTCUTS, "All", "")).toHaveLength(
      KEYBOARD_SHORTCUTS.length,
    );
  });

  it("filters by category", () => {
    const result = filterShortcuts(KEYBOARD_SHORTCUTS, "Navigation", "");
    expect(result.length).toBeGreaterThan(0);
    result.forEach((s) => expect(s.category).toBe("Navigation"));
  });

  it("filters by case-insensitive description match", () => {
    const result = filterShortcuts(KEYBOARD_SHORTCUTS, "All", "MARKETPLACE");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("go-marketplace");
  });

  it("filters by key label match", () => {
    const result = filterShortcuts(KEYBOARD_SHORTCUTS, "All", "esc");
    expect(result.length).toBeGreaterThan(0);
    result.forEach((s) =>
      expect(s.keys.some((k) => k.toLowerCase().includes("esc"))).toBe(true),
    );
  });

  it("combines category and query filters", () => {
    const result = filterShortcuts(KEYBOARD_SHORTCUTS, "Actions", "theme");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("toggle-theme");
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterShortcuts(KEYBOARD_SHORTCUTS, "All", "zzzznomatch")).toEqual(
      [],
    );
  });

  it("trims whitespace in the query", () => {
    const result = filterShortcuts(KEYBOARD_SHORTCUTS, "All", "  marketplace  ");
    expect(result).toHaveLength(1);
  });
});
