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

    // Regression coverage for the `if (!open) return null;` branch
    // (src/app/components/ui/shortcut-overlay.tsx:36): the closed state must
    // stay a hard null return — no empty shell, no stray attributes — so any
    // silent change to that contract fails here.
    it("returns a hard null value when open=false (regression)", () => {
      const { container } = render(
        <ShortcutOverlay open={false} onClose={vi.fn()} />
      );
      expect(container).toBeEmptyDOMElement();
      expect(container.firstChild).toBeNull();
      expect(container.outerHTML).toBe("<div></div>");
    });

    it("emits no warnings when open=false (regression)", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      render(<ShortcutOverlay open={false} onClose={vi.fn()} />);
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it("renders null for every close/open cycle boundary and is deterministic (regression)", () => {
      // Deterministic: repeated renders of the same closed props always yield
      // the identical null-output contract.
      for (let i = 0; i < 3; i += 1) {
        const { container, unmount } = render(
          <ShortcutOverlay open={false} onClose={vi.fn()} />
        );
        expect(container.firstChild).toBeNull();
        expect(container.outerHTML).toBe("<div></div>");
        unmount();
        expect(container.firstChild).toBeNull();
      }
    });

    it("stays null across an open→closed→open boundary cycle (regression)", () => {
      const { rerender, container } = render(
        <ShortcutOverlay open={false} onClose={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();

      rerender(<ShortcutOverlay open={true} onClose={vi.fn()} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      rerender(<ShortcutOverlay open={false} onClose={vi.fn()} />);
      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      rerender(<ShortcutOverlay open={true} onClose={vi.fn()} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("restores focus to the trigger when closing via rerender (regression)", () => {
      const trigger = document.createElement("button");
      document.body.appendChild(trigger);
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      // Note: render into the default container — mounting into document.body
      // directly resets activeElement in jsdom and would defeat the trap's
      // "previously focused" capture.
      const { rerender } = render(
        <ShortcutOverlay open={true} onClose={vi.fn()} />
      );
      // FocusTrap moved focus into the dialog's first focusable element.
      expect(document.activeElement).not.toBe(trigger);

      rerender(<ShortcutOverlay open={false} onClose={vi.fn()} />);
      // Closing unmounts the trap; focus returns to the trigger.
      expect(document.activeElement).toBe(trigger);

      trigger.remove();
    });

    it("moves focus to the [data-focus-fallback] anchor when the trigger is gone (regression)", () => {
      const fallback = document.createElement("button");
      fallback.setAttribute("data-focus-fallback", "");
      document.body.appendChild(fallback);

      const trigger = document.createElement("button");
      document.body.appendChild(trigger);
      trigger.focus();

      const { rerender } = render(
        <ShortcutOverlay open={true} onClose={vi.fn()} />
      );
      expect(document.activeElement).not.toBe(trigger);

      // The trigger is removed while the overlay is open…
      trigger.remove();

      rerender(<ShortcutOverlay open={false} onClose={vi.fn()} />);
      // …so on close focus falls back to the [data-focus-fallback] anchor
      // instead of being dropped to <body>.
      expect(document.activeElement).toBe(fallback);

      fallback.remove();
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
