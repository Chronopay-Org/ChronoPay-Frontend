import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useNotificationSelection } from "./use-notification-selection";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const ALL_IDS = ["n1", "n2", "n3", "n4"];

function renderSelection() {
  return renderHook(() => useNotificationSelection());
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("useNotificationSelection", () => {
  // ── Initial state ──────────────────────────────────────────────────────────

  describe("initial state", () => {
    it("starts with an empty selection", () => {
      const { result } = renderSelection();

      expect(result.current.selectedIds).toBeInstanceOf(Set);
      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.selectedCount).toBe(0);
      expect(result.current.lastFocusedIndexRef.current).toBeNull();
    });

    it("reports nothing as selected initially", () => {
      const { result } = renderSelection();

      expect(result.current.isSelected("n1")).toBe(false);
      expect(result.current.isSelected("n2")).toBe(false);
    });

    it("keeps a stable identity for the callbacks across renders", () => {
      const { result, rerender } = renderSelection();

      const first = result.current;
      rerender();

      expect(result.current.toggleSelect).toBe(first.toggleSelect);
      expect(result.current.rangeSelect).toBe(first.rangeSelect);
      expect(result.current.selectAll).toBe(first.selectAll);
      expect(result.current.clearSelection).toBe(first.clearSelection);
      expect(result.current.setSelected).toBe(first.setSelected);
      // `isSelected` depends on `selectedIds`, so it changes when selection does.
      expect(result.current.isSelected).toBe(first.isSelected);
    });
  });

  // ── toggleSelect ───────────────────────────────────────────────────────────

  describe("toggleSelect", () => {
    it("adds an id that is not selected", () => {
      const { result } = renderSelection();

      act(() => result.current.toggleSelect("n1"));

      expect(result.current.selectedIds.has("n1")).toBe(true);
      expect(result.current.selectedCount).toBe(1);
    });

    it("removes an id that is already selected", () => {
      const { result } = renderSelection();
      act(() => result.current.toggleSelect("n1"));

      act(() => result.current.toggleSelect("n1"));

      expect(result.current.selectedIds.has("n1")).toBe(false);
      expect(result.current.selectedCount).toBe(0);
    });

    it("toggles several ids independently", () => {
      const { result } = renderSelection();

      act(() => {
        result.current.toggleSelect("n1");
        result.current.toggleSelect("n2");
      });

      expect(result.current.selectedIds).toEqual(new Set(["n1", "n2"]));

      act(() => result.current.toggleSelect("n1"));

      expect(result.current.selectedIds).toEqual(new Set(["n2"]));
    });

    it("does not disturb other ids when toggling", () => {
      const { result } = renderSelection();
      act(() => result.current.rangeSelect(["n1", "n2"]));

      act(() => result.current.toggleSelect("n1"));

      expect(result.current.selectedIds).toEqual(new Set(["n2"]));
    });

    it("treats repeated toggles as parity-based (odd = selected)", () => {
      const { result } = renderSelection();

      act(() => {
        result.current.toggleSelect("n1");
        result.current.toggleSelect("n1");
        result.current.toggleSelect("n1");
      });
      // Three toggles: add → remove → add, so the id ends up selected.
      expect(result.current.selectedCount).toBe(1);

      act(() => result.current.toggleSelect("n1"));
      // Fourth toggle removes it again.
      expect(result.current.selectedCount).toBe(0);
    });

    it("stores an empty-string id verbatim without special-casing", () => {
      const { result } = renderSelection();

      act(() => result.current.toggleSelect(""));

      // The hook is id-agnostic: Set semantics keep "" as a real member.
      expect(result.current.selectedCount).toBe(1);
      expect(result.current.isSelected("")).toBe(true);

      act(() => result.current.toggleSelect(""));
      expect(result.current.selectedCount).toBe(0);
    });

    it("handles a toggle after clearing the selection", () => {
      const { result } = renderSelection();
      act(() => result.current.selectAll(ALL_IDS));
      act(() => result.current.clearSelection());

      act(() => result.current.toggleSelect("n3"));

      expect(result.current.selectedIds).toEqual(new Set(["n3"]));
      expect(result.current.selectedCount).toBe(1);
    });
  });

  // ── rangeSelect ────────────────────────────────────────────────────────────

  describe("rangeSelect", () => {
    it("adds every id in the given range", () => {
      const { result } = renderSelection();

      act(() => result.current.rangeSelect(["n1", "n2", "n3"]));

      expect(result.current.selectedIds).toEqual(new Set(["n1", "n2", "n3"]));
      expect(result.current.selectedCount).toBe(3);
    });

    it("unions with the existing selection instead of replacing it", () => {
      const { result } = renderSelection();
      act(() => result.current.toggleSelect("n1"));

      act(() => result.current.rangeSelect(["n2", "n3"]));

      expect(result.current.selectedIds).toEqual(
        new Set(["n1", "n2", "n3"]),
      );
      expect(result.current.selectedCount).toBe(3);
    });

    it("does not deselect ids outside the given range", () => {
      const { result } = renderSelection();
      act(() => result.current.rangeSelect(["n1", "n2", "n3", "n4"]));

      act(() => result.current.rangeSelect(["n2"]));

      expect(result.current.selectedIds).toEqual(
        new Set(["n1", "n2", "n3", "n4"]),
      );
    });

    it("is idempotent for a repeated range", () => {
      const { result } = renderSelection();
      act(() => result.current.rangeSelect(["n1", "n2"]));

      act(() => result.current.rangeSelect(["n1", "n2"]));

      expect(result.current.selectedIds).toEqual(new Set(["n1", "n2"]));
      expect(result.current.selectedCount).toBe(2);
    });

    it("accepts duplicate ids within a single range", () => {
      const { result } = renderSelection();

      act(() => result.current.rangeSelect(["n1", "n1", "n2"]));

      expect(result.current.selectedIds).toEqual(new Set(["n1", "n2"]));
      expect(result.current.selectedCount).toBe(2);
    });

    it("is a no-op for an empty array", () => {
      const { result } = renderSelection();
      act(() => result.current.rangeSelect(["n1"]));

      act(() => result.current.rangeSelect([]));

      expect(result.current.selectedIds).toEqual(new Set(["n1"]));
      expect(result.current.selectedCount).toBe(1);
    });
  });

  // ── selectAll ──────────────────────────────────────────────────────────────

  describe("selectAll", () => {
    it("replaces the selection with exactly the given ids", () => {
      const { result } = renderSelection();
      act(() => result.current.toggleSelect("n1"));

      act(() => result.current.selectAll(ALL_IDS));

      expect(result.current.selectedIds).toEqual(new Set(ALL_IDS));
      expect(result.current.selectedCount).toBe(4);
    });

    it("drops ids that are not in the given list (replace, not union)", () => {
      const { result } = renderSelection();
      act(() => result.current.selectAll(ALL_IDS));

      act(() => result.current.selectAll(["n2", "n3"]));

      expect(result.current.selectedIds).toEqual(new Set(["n2", "n3"]));
      expect(result.current.selectedCount).toBe(2);
    });

    it("clears the selection when given an empty array", () => {
      const { result } = renderSelection();
      act(() => result.current.selectAll(ALL_IDS));

      act(() => result.current.selectAll([]));

      expect(result.current.selectedCount).toBe(0);
      expect(result.current.selectedIds.size).toBe(0);
    });

    it("collapses duplicates to unique ids", () => {
      const { result } = renderSelection();

      act(() => result.current.selectAll(["n1", "n1", "n2"]));

      expect(result.current.selectedIds).toEqual(new Set(["n1", "n2"]));
      expect(result.current.selectedCount).toBe(2);
    });
  });

  // ── clearSelection ─────────────────────────────────────────────────────────

  describe("clearSelection", () => {
    it("empties a non-empty selection", () => {
      const { result } = renderSelection();
      act(() => result.current.selectAll(ALL_IDS));

      act(() => result.current.clearSelection());

      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.selectedCount).toBe(0);
      expect(result.current.isSelected("n1")).toBe(false);
    });

    it("is safe to call on an already-empty selection", () => {
      const { result } = renderSelection();

      act(() => result.current.clearSelection());

      expect(result.current.selectedCount).toBe(0);
    });

    it("allows re-selection after clearing", () => {
      const { result } = renderSelection();
      act(() => result.current.toggleSelect("n1"));
      act(() => result.current.clearSelection());

      act(() => result.current.toggleSelect("n2"));

      expect(result.current.selectedIds).toEqual(new Set(["n2"]));
    });
  });

  // ── setSelected ────────────────────────────────────────────────────────────

  describe("setSelected", () => {
    it("adopts the provided Set instance", () => {
      const { result } = renderSelection();
      const next = new Set(["a", "b"]);

      act(() => result.current.setSelected(next));

      expect(result.current.selectedIds).toBe(next); // same reference
      expect(result.current.selectedCount).toBe(2);
    });

    it("replaces a previous selection entirely", () => {
      const { result } = renderSelection();
      act(() => result.current.selectAll(ALL_IDS));

      act(() => result.current.setSelected(new Set(["z9"])));

      expect(result.current.selectedIds).toEqual(new Set(["z9"]));
      expect(result.current.isSelected("n1")).toBe(false);
      expect(result.current.isSelected("z9")).toBe(true);
    });

    it("accepts an empty Set to clear", () => {
      const { result } = renderSelection();
      act(() => result.current.selectAll(ALL_IDS));

      act(() => result.current.setSelected(new Set()));

      expect(result.current.selectedCount).toBe(0);
    });
  });

  // ── isSelected / selectedCount ─────────────────────────────────────────────

  describe("isSelected and selectedCount", () => {
    it("reflects membership for arbitrary ids", () => {
      const { result } = renderSelection();

      act(() => result.current.toggleSelect("n2"));

      expect(result.current.isSelected("n2")).toBe(true);
      expect(result.current.isSelected("n1")).toBe(false);
      expect(result.current.isSelected("never-seen")).toBe(false);
    });

    it("tracks the count through a full selection lifecycle", () => {
      const { result } = renderSelection();

      expect(result.current.selectedCount).toBe(0);

      act(() => result.current.toggleSelect("n1"));
      expect(result.current.selectedCount).toBe(1);

      act(() => result.current.rangeSelect(["n2", "n3"]));
      expect(result.current.selectedCount).toBe(3);

      act(() => result.current.selectAll(ALL_IDS));
      expect(result.current.selectedCount).toBe(4);

      act(() => result.current.clearSelection());
      expect(result.current.selectedCount).toBe(0);
    });
  });

  // ── lastFocusedIndexRef ────────────────────────────────────────────────────

  describe("lastFocusedIndexRef", () => {
    it("starts as null and persists across re-renders", () => {
      const { result, rerender } = renderSelection();

      expect(result.current.lastFocusedIndexRef.current).toBeNull();

      rerender();

      expect(result.current.lastFocusedIndexRef.current).toBeNull();
    });

    it("survives re-renders after being written by the consumer", () => {
      const { result, rerender } = renderSelection();

      act(() => {
        result.current.lastFocusedIndexRef.current = 3;
      });
      rerender();

      expect(result.current.lastFocusedIndexRef.current).toBe(3);
    });

    it("keeps the same ref object across re-renders", () => {
      const { result, rerender } = renderSelection();

      const refBefore = result.current.lastFocusedIndexRef;
      rerender();

      expect(result.current.lastFocusedIndexRef).toBe(refBefore);
    });
  });

  // ── Invalid inputs and boundary behavior ───────────────────────────────────

  describe("invalid inputs and boundaries", () => {
    it("ignores a rangeSelect on an empty array with nothing selected", () => {
      const { result } = renderSelection();

      act(() => result.current.rangeSelect([]));

      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.selectedCount).toBe(0);
    });

    it("keeps selection valid when toggling an unknown id", () => {
      const { result } = renderSelection();
      act(() => result.current.toggleSelect("n1"));

      act(() => result.current.toggleSelect("unknown-id"));

      // The hook is id-agnostic: unknown ids are stored, not rejected.
      expect(result.current.isSelected("unknown-id")).toBe(true);
      expect(result.current.selectedCount).toBe(2);
    });

    it("treats distinct whitespace ids as distinct members", () => {
      const { result } = renderSelection();

      act(() => {
        result.current.toggleSelect("n1");
        result.current.toggleSelect(" n1"); // leading space: different key
      });

      expect(result.current.selectedCount).toBe(2);
    });

    it("does not crash or mutate state for an empty selectAll", () => {
      const { result } = renderSelection();

      expect(() => act(() => result.current.selectAll([]))).not.toThrow();
      expect(result.current.selectedCount).toBe(0);
    });

    it("handles a large id batch deterministically", () => {
      const { result } = renderSelection();
      const largeBatch = Array.from({ length: 500 }, (_, i) => `id-${i}`);

      act(() => result.current.selectAll(largeBatch));

      expect(result.current.selectedCount).toBe(500);
      expect(result.current.isSelected("id-0")).toBe(true);
      expect(result.current.isSelected("id-499")).toBe(true);
      expect(result.current.isSelected("id-500")).toBe(false);
    });

    it("does not leak selection state between separate hook instances", () => {
      const first = renderSelection();
      act(() => first.result.current.selectAll(ALL_IDS));
      expect(first.result.current.selectedCount).toBe(4);

      const second = renderSelection();
      expect(second.result.current.selectedCount).toBe(0);
      expect(second.result.current.isSelected("n1")).toBe(false);
    });
  });
});
