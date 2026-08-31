/**
 * ShortcutOverlay tests
 *
 * Coverage targets (95%+):
 *  - Closed state: renders nothing, no dialog in the tree
 *  - Open state: dialog with role="dialog" + aria-modal + aria-labelledby
 *  - Grouped lists: every group heading and binding renders with <kbd> keys
 *  - Accessible names: close button, group headings, binding labels
 *  - Keyboard: Escape closes
 *  - Backdrop click closes; clicks inside do not close
 *  - Close button closes and calls onClose
 *  - onClose callback contract
 *  - Shortcuts data integrity: ids unique, groups non-empty, bindings have keys
 */

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ShortcutOverlay } from "@/app/components/ui/shortcut-overlay";
import { SHORTCUT_GROUPS } from "@/lib/shortcuts";

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup(props: Partial<React.ComponentProps<typeof ShortcutOverlay>> = {}) {
  const onClose = vi.fn();
  const result = render(
    <ShortcutOverlay open={true} onClose={onClose} {...props} />
  );
  return { ...result, onClose };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ShortcutOverlay", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Closed state ─────────────────────────────────────────────────────────

  describe("closed state", () => {
    it("renders nothing when open=false", () => {
      render(<ShortcutOverlay open={false} onClose={vi.fn()} />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.queryByText("Keyboard shortcuts")).not.toBeInTheDocument();
    });
  });

  // ── Open state / ARIA ────────────────────────────────────────────────────

  describe("open state and ARIA", () => {
    it("renders a modal dialog labelled by its heading", () => {
      setup();
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute(
        "aria-labelledby",
        "shortcut-overlay-title"
      );
      expect(
        screen.getByRole("heading", { name: "Keyboard shortcuts" })
      ).toBeInTheDocument();
    });

    it("renders the backdrop over the page", () => {
      setup();
      // Backdrop is the outermost fixed layer
      const backdrop = document.querySelector(".fixed.inset-0");
      expect(backdrop).toBeInTheDocument();
    });
  });

  // ── Empty state ─────────────────────────────────────────────────────────

  describe("empty state", () => {
    it("shows a friendly message when no groups are defined", async () => {
      const shortcuts = await import("@/lib/shortcuts");
      vi.spyOn(shortcuts, "SHORTCUT_GROUPS", "get").mockReturnValue([]);

      setup();
      expect(
        screen.getByText("No shortcuts are defined yet.")
      ).toBeInTheDocument();
      expect(screen.queryAllByRole("list")).toHaveLength(0);
    });
  });

  // ── Grouped lists ────────────────────────────────────────────────────────

  describe("grouped binding lists", () => {
    it("renders a heading per group", () => {
      setup();
      for (const group of SHORTCUT_GROUPS) {
        expect(
          screen.getByRole("heading", { name: group.title })
        ).toBeInTheDocument();
      }
    });

    it("renders every binding label", () => {
      setup();
      for (const group of SHORTCUT_GROUPS) {
        for (const binding of group.bindings) {
          expect(screen.getByText(binding.label)).toBeInTheDocument();
        }
      }
    });

    it("renders bindings as kbd elements with accessible names", () => {
      setup();
      const allKeys = SHORTCUT_GROUPS.flatMap((group) => group.bindings).flatMap(
        (binding) => binding.keys
      );
      const uniqueKeys = [...new Set(allKeys)];
      for (const key of uniqueKeys) {
        const elements = screen.getAllByText(key);
        expect(elements.length).toBeGreaterThan(0);
        for (const element of elements) {
          expect(element.tagName.toLowerCase()).toBe("kbd");
        }
      }
    });

    it("renders a list per group", () => {
      setup();
      const lists = screen.getAllByRole("list");
      expect(lists).toHaveLength(SHORTCUT_GROUPS.length);
    });
  });

  // ── Keyboard interaction ─────────────────────────────────────────────────

  describe("keyboard interaction", () => {
    it("closes on Escape", () => {
      const { onClose } = setup();
      act(() => {
        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not close on other keys", () => {
      const { onClose } = setup();
      act(() => {
        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Enter" });
      });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ── Dismissal ────────────────────────────────────────────────────────────

  describe("dismissal", () => {
    it("closes when the backdrop is clicked", () => {
      const { onClose } = setup();
      const backdrop = document.querySelector(".fixed.inset-0");
      act(() => {
        fireEvent.mouseDown(backdrop as HTMLElement);
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not close when clicking inside the dialog", () => {
      const { onClose } = setup();
      act(() => {
        fireEvent.mouseDown(screen.getByRole("dialog"));
      });
      expect(onClose).not.toHaveBeenCalled();
    });

    it("closes via the close button with an accessible name", () => {
      const { onClose } = setup();
      const closeButton = screen.getByRole("button", {
        name: "Close keyboard shortcuts",
      });
      expect(closeButton).toBeInTheDocument();
      act(() => {
        fireEvent.click(closeButton);
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

// ── Shortcuts data integrity ──────────────────────────────────────────────────

describe("SHORTCUT_GROUPS data", () => {
  it("exports at least one group", () => {
    expect(SHORTCUT_GROUPS.length).toBeGreaterThan(0);
  });

  it("has unique group ids", () => {
    const ids = SHORTCUT_GROUPS.map((group) => group.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has non-empty groups with non-empty bindings", () => {
    for (const group of SHORTCUT_GROUPS) {
      expect(group.title.length).toBeGreaterThan(0);
      expect(group.bindings.length).toBeGreaterThan(0);
      for (const binding of group.bindings) {
        expect(binding.keys.length).toBeGreaterThan(0);
        expect(binding.label.length).toBeGreaterThan(0);
      }
    }
  });

  it("documents the ? (Shift+/) toggle binding", () => {
    const globalGroup = SHORTCUT_GROUPS.find((group) => group.id === "global");
    expect(globalGroup).toBeDefined();
    const toggle = globalGroup?.bindings.find((binding) =>
      binding.keys.includes("?")
    );
    expect(toggle).toBeDefined();
  });
});
