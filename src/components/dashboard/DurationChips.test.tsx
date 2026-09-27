import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DurationChips from "./DurationChips";

/** Stable reference so the selection effects are not re-run by a new object each render. */
const COUNTS: Record<number, number> = { 15: 1, 30: 2, 60: 0 };

describe("DurationChips", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders a chip for every preset duration", () => {
      render(<DurationChips counts={COUNTS} />);

      expect(screen.getAllByRole("button")).toHaveLength(3);
      expect(screen.getByRole("button", { name: /15 minute filter/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /30 minute filter/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /60 minute filter/i })).toBeInTheDocument();
    });

    it("shows the minute value and its result count on each chip", () => {
      render(<DurationChips counts={COUNTS} />);

      expect(screen.getByRole("button", { name: /15 minute filter/i })).toHaveTextContent("15m");
      expect(screen.getByRole("button", { name: /15 minute filter/i })).toHaveTextContent("1");
      expect(screen.getByRole("button", { name: /30 minute filter/i })).toHaveTextContent("2");
    });

    it("pluralises the accessible name from the count", () => {
      render(<DurationChips counts={COUNTS} />);

      expect(
        screen.getByRole("button", { name: "15 minute filter — 1 result" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "30 minute filter — 2 results" }),
      ).toBeInTheDocument();
    });
  });

  describe("selection state transitions", () => {
    it("starts with nothing selected when no initial value is given", () => {
      render(<DurationChips counts={COUNTS} />);

      for (const button of screen.getAllByRole("button")) {
        expect(button).toHaveAttribute("aria-pressed", "false");
      }
    });

    it("starts with the initial duration selected", () => {
      render(<DurationChips counts={COUNTS} initial={30} />);

      expect(screen.getByRole("button", { name: /30 minute filter/i })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByRole("button", { name: /15 minute filter/i })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });

    it("selects a duration on click and clears it on the second click", () => {
      const onChange = vi.fn();
      render(<DurationChips counts={COUNTS} onChange={onChange} />);

      const thirty = screen.getByRole("button", { name: /30 minute filter/i });

      fireEvent.click(thirty);
      expect(thirty).toHaveAttribute("aria-pressed", "true");
      expect(onChange).toHaveBeenLastCalledWith(30);

      fireEvent.click(thirty);
      expect(thirty).toHaveAttribute("aria-pressed", "false");
      expect(onChange).toHaveBeenLastCalledWith(null);
    });

    it("replaces the previous selection instead of selecting two chips", () => {
      render(<DurationChips counts={COUNTS} initial={15} />);

      const fifteen = screen.getByRole("button", { name: /15 minute filter/i });
      const sixty = screen.getByRole("button", { name: /60 minute filter/i });

      fireEvent.click(sixty);

      expect(fifteen).toHaveAttribute("aria-pressed", "false");
      expect(sixty).toHaveAttribute("aria-pressed", "true");
    });

    it("keeps its internal selection in sync when the initial prop changes", () => {
      const { rerender } = render(<DurationChips counts={COUNTS} initial={null} />);

      expect(screen.getByRole("button", { name: /60 minute filter/i })).toHaveAttribute(
        "aria-pressed",
        "false",
      );

      rerender(<DurationChips counts={COUNTS} initial={60} />);

      expect(screen.getByRole("button", { name: /60 minute filter/i })).toHaveAttribute(
        "aria-pressed",
        "true",
      );

      rerender(<DurationChips counts={COUNTS} initial={null} />);

      expect(screen.getByRole("button", { name: /60 minute filter/i })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });
  });

  describe("change notifications", () => {
    it("reports the cleared selection on mount when nothing is selected", () => {
      const onChange = vi.fn();
      render(<DurationChips counts={COUNTS} onChange={onChange} />);

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it("reports the initial selection on mount", () => {
      const onChange = vi.fn();
      render(<DurationChips counts={COUNTS} initial={15} onChange={onChange} />);

      expect(onChange).toHaveBeenCalledWith(15);
    });
  });

  describe("live announcements", () => {
    it("announces the applied filter with its result count", () => {
      render(<DurationChips counts={COUNTS} />);

      fireEvent.click(screen.getByRole("button", { name: /30 minute filter/i }));

      expect(screen.getByRole("status")).toHaveTextContent("30-minute filter applied, 2 results");
    });

    it("uses the singular form when a single result matches", () => {
      render(<DurationChips counts={COUNTS} />);

      fireEvent.click(screen.getByRole("button", { name: /15 minute filter/i }));

      expect(screen.getByRole("status")).toHaveTextContent("15-minute filter applied, 1 result");
    });

    it("announces the cleared state after deselecting", () => {
      render(<DurationChips counts={COUNTS} initial={60} />);

      fireEvent.click(screen.getByRole("button", { name: /60 minute filter/i }));

      expect(screen.getByRole("status")).toHaveTextContent("Duration filter cleared");
    });
  });

  describe("boundary inputs", () => {
    it("treats a missing count as zero", () => {
      render(<DurationChips counts={{ 15: 1 }} />);

      expect(
        screen.getByRole("button", { name: "30 minute filter — 0 results" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "60 minute filter — 0 results" }),
      ).toBeInTheDocument();
    });

    it("ignores count entries that are not presets", () => {
      render(<DurationChips counts={{ ...COUNTS, 90: 12 }} />);

      expect(screen.getAllByRole("button")).toHaveLength(3);
      expect(screen.queryByRole("button", { name: /90 minute/i })).not.toBeInTheDocument();
    });

    it("does not throw when the change handler is omitted", () => {
      render(<DurationChips counts={COUNTS} />);

      expect(() => {
        fireEvent.click(screen.getByRole("button", { name: /15 minute filter/i }));
      }).not.toThrow();
    });

    it("accepts an empty counts map without crashing", () => {
      render(<DurationChips counts={{}} />);

      expect(
        screen.getByRole("button", { name: "15 minute filter — 0 results" }),
      ).toBeInTheDocument();
    });
  });
});
