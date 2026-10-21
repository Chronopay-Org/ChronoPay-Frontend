import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  MiniCalendarNavigator,
  type MiniCalendarNavigatorProps,
} from "./mini-calendar-navigator";

// A fixed, non-"today" date so the assertions never depend on the wall clock.
// April 2026 has 30 days and April 1st 2026 falls on a Wednesday.
const APRIL_2026 = new Date(2026, 3, 15);
const APRIL_15_KEY = new Date(2026, 3, 15).toISOString().split("T")[0];

function renderNav(overrides: Partial<MiniCalendarNavigatorProps> = {}) {
  const onDateSelect = vi.fn();
  const result = render(
    <MiniCalendarNavigator
      currentDate={APRIL_2026}
      onDateSelect={onDateSelect}
      {...overrides}
    />,
  );
  return { ...result, onDateSelect };
}

describe("MiniCalendarNavigator", () => {
  it("renders the navigator region with an accessible label", () => {
    renderNav();
    expect(
      screen.getByRole("complementary", { name: "Mini calendar navigator" }),
    ).toBeInTheDocument();
  });

  it("shows the month and year of the current date", () => {
    renderNav();
    expect(
      screen.getByRole("heading", { name: "April 2026" }),
    ).toBeInTheDocument();
  });

  it("merges a caller className onto the navigator container", () => {
    renderNav({ className: "col-span-2" });
    expect(
      screen.getByRole("complementary", { name: "Mini calendar navigator" }),
    ).toHaveClass("col-span-2");
  });

  it("renders one gridcell per day of the month", () => {
    renderNav();
    const grid = screen.getByRole("grid", { name: "Calendar days" });
    // 30 days in April 2026.
    expect(screen.getAllByRole("gridcell")).toHaveLength(30);
    // Leading blank cells for the days before the 1st, then the days.
    const expectedLeading = new Date(2026, 3, 1).getDay();
    expect(grid.children).toHaveLength(expectedLeading + 30);
  });

  it("renders weekday column headers", () => {
    renderNav();
    for (const day of ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
  });

  it("renders 29 days for a leap-year February and 28 otherwise", () => {
    const { unmount } = renderNav({ currentDate: new Date(2028, 1, 10) });
    expect(screen.getAllByRole("gridcell")).toHaveLength(29);
    unmount();

    renderNav({ currentDate: new Date(2027, 1, 10) });
    expect(screen.getAllByRole("gridcell")).toHaveLength(28);
  });

  it("marks the current date as selected via aria-pressed", () => {
    renderNav();
    const selected = screen.getByRole("gridcell", { name: /April 15/ });
    expect(selected).toHaveAttribute("aria-pressed", "true");
    expect(selected).toHaveClass("bg-cyan-500");

    const other = screen.getByRole("gridcell", { name: /April 16/ });
    expect(other).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onDateSelect with the clicked day", () => {
    const { onDateSelect } = renderNav();
    fireEvent.click(screen.getByRole("gridcell", { name: /April 20/ }));

    expect(onDateSelect).toHaveBeenCalledTimes(1);
    const picked = onDateSelect.mock.calls[0][0] as Date;
    expect(picked.getFullYear()).toBe(2026);
    expect(picked.getMonth()).toBe(3);
    expect(picked.getDate()).toBe(20);
  });

  it("moves to the previous and next month with the navigation buttons", () => {
    renderNav();

    fireEvent.click(
      screen.getByRole("button", { name: "Previous month, March" }),
    );
    expect(
      screen.getByRole("heading", { name: "March 2026" }),
    ).toBeInTheDocument();

    // Back to April, then forward to May.
    fireEvent.click(screen.getByRole("button", { name: "Next month, April" }));
    fireEvent.click(screen.getByRole("button", { name: "Next month, May" }));
    expect(
      screen.getByRole("heading", { name: "May 2026" }),
    ).toBeInTheDocument();
  });

  it("rolls the year over when navigating across December and January", () => {
    renderNav({ currentDate: new Date(2026, 0, 5) });
    expect(
      screen.getByRole("heading", { name: "January 2026" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Previous month, December" }),
    );
    expect(
      screen.getByRole("heading", { name: "December 2025" }),
    ).toBeInTheDocument();
  });

  it("keeps the original selection while navigating other months", () => {
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: "Next month, May" }));

    expect(
      screen.getByRole("heading", { name: "May 2026" }),
    ).toBeInTheDocument();
    // April 15 is no longer rendered, but no May day is selected.
    const pressed = screen
      .getAllByRole("gridcell")
      .filter((cell) => cell.getAttribute("aria-pressed") === "true");
    expect(pressed).toHaveLength(0);
  });

  describe("availability density", () => {
    it("maps slot counts to none / low / medium / high dots", () => {
      const availabilityData = new Map<string, number>([
        [APRIL_15_KEY, 9], // high
        [new Date(2026, 3, 16).toISOString().split("T")[0], 5], // medium
        [new Date(2026, 3, 17).toISOString().split("T")[0], 2], // low
        [new Date(2026, 3, 18).toISOString().split("T")[0], 0], // none
      ]);
      renderNav({ availabilityData });

      const dot = (name: RegExp) =>
        screen.getByRole("gridcell", { name }).querySelector('[aria-hidden="true"]');

      expect(dot(/April 15/)).toHaveClass("bg-rose-400");
      expect(dot(/April 16/)).toHaveClass("bg-amber-400");
      expect(dot(/April 17/)).toHaveClass("bg-emerald-400");
      expect(dot(/April 18/)).toHaveClass("bg-transparent");
    });

    it("treats negative counts as low and NaN as no availability", () => {
      const availabilityData = new Map<string, number>([
        [new Date(2026, 3, 15).toISOString().split("T")[0], -5],
        [new Date(2026, 3, 16).toISOString().split("T")[0], Number.NaN],
      ]);
      renderNav({ availabilityData });

      const dot = (name: RegExp) =>
        screen.getByRole("gridcell", { name }).querySelector('[aria-hidden="true"]');

      expect(dot(/April 15/)).toHaveClass("bg-emerald-400");
      expect(dot(/April 16/)).toHaveClass("bg-transparent");
    });

    it("falls back to no availability when the prop is omitted", () => {
      renderNav();
      const dot = screen
        .getByRole("gridcell", { name: /April 15/ })
        .querySelector('[aria-hidden="true"]');
      expect(dot).toHaveClass("bg-transparent");
    });

    it("ignores availability keys that do not match the rendered day", () => {
      renderNav({
        availabilityData: new Map<string, number>([["not-a-date", 7]]),
      });
      const dot = screen
        .getByRole("gridcell", { name: /April 15/ })
        .querySelector('[aria-hidden="true"]');
      expect(dot).toHaveClass("bg-transparent");
    });

    it("renders the density legend", () => {
      renderNav();
      expect(screen.getByText("Low")).toBeInTheDocument();
      expect(screen.getByText("Med")).toBeInTheDocument();
      expect(screen.getByText("High")).toBeInTheDocument();
    });
  });
});
