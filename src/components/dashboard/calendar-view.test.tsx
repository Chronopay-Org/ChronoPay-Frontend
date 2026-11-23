import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { axe } from "jest-axe";
import { CalendarView } from "./calendar-view";
import { groupSlotsByDate, toISODateKey } from "./use-calendar-state";
import type { Slot } from "./types";

const sampleSlots: Slot[] = [
  {
    id: "slot-july-31",
    title: "July End Architecture Review",
    date: "2026-07-31",
    dateLabel: "Fri, Jul 31",
    timeRange: "14:00 - 15:00 UTC",
    status: "Healthy",
    demand: "High Demand",
    rate: "50 XLM / hr",
  },
  {
    id: "slot-aug-01-a",
    title: "August Kickoff Consultation",
    date: "2026-08-01",
    dateLabel: "Sat, Aug 1",
    timeRange: "10:00 - 11:00 UTC",
    status: "Healthy",
    demand: "Medium Demand",
    rate: "60 XLM / hr",
  },
  {
    id: "slot-aug-01-b",
    title: "August Smart Contract Audit",
    date: "2026-08-01",
    dateLabel: "Sat, Aug 1",
    timeRange: "15:00 - 16:30 UTC",
    status: "Tight",
    demand: "High Demand",
    rate: "80 XLM / hr",
  },
  {
    id: "slot-dec-31",
    title: "Year-End Strategy",
    date: "2026-12-31",
    dateLabel: "Thu, Dec 31",
    timeRange: "12:00 - 13:00 UTC",
    status: "Busy",
    demand: "High Demand",
    rate: "90 XLM / hr",
  },
  {
    id: "slot-jan-01",
    title: "New Year Planning",
    date: "2027-01-01",
    dateLabel: "Fri, Jan 1",
    timeRange: "09:00 - 10:00 UTC",
    status: "Healthy",
    demand: "Low Demand",
    rate: "50 XLM / hr",
  },
];

describe("groupSlotsByDate", () => {
  it("groups slots accurately across month and year boundaries using ISO dates", () => {
    const grouped = groupSlotsByDate(sampleSlots);

    expect(grouped.get("2026-07-31")?.map((s) => s.id)).toEqual(["slot-july-31"]);
    expect(grouped.get("2026-08-01")?.map((s) => s.id)).toEqual([
      "slot-aug-01-a",
      "slot-aug-01-b",
    ]);
    expect(grouped.get("2026-12-31")?.map((s) => s.id)).toEqual(["slot-dec-31"]);
    expect(grouped.get("2027-01-01")?.map((s) => s.id)).toEqual(["slot-jan-01"]);
  });

  it("resolves Today and Tomorrow relative to referenceDate without hard-coded day numbers", () => {
    const ref = new Date(2026, 6, 31); // July 31, 2026
    const relativeSlots: Slot[] = [
      {
        id: "rel-today",
        title: "Today Slot",
        dateLabel: "Today",
        timeRange: "10:00 - 11:00 UTC",
        status: "Healthy",
        demand: "High",
        rate: "50 XLM / hr",
      },
      {
        id: "rel-tomorrow",
        title: "Tomorrow Slot",
        dateLabel: "Tomorrow",
        timeRange: "11:00 - 12:00 UTC",
        status: "Tight",
        demand: "Medium",
        rate: "50 XLM / hr",
      },
    ];

    const grouped = groupSlotsByDate(relativeSlots, ref);
    expect(grouped.get(toISODateKey(new Date(2026, 6, 31)))?.map((s) => s.id)).toEqual([
      "rel-today",
    ]);
    // Tomorrow rolls over from July 31 to August 1
    expect(grouped.get(toISODateKey(new Date(2026, 7, 1)))?.map((s) => s.id)).toEqual([
      "rel-tomorrow",
    ]);
  });
});

describe("CalendarView", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders MonthCalendarView in month mode and syncs selected date with MiniCalendarNavigator", () => {
    render(
      <CalendarView
        slots={sampleSlots}
        initialDate={new Date(2026, 6, 31)} // July 31, 2026
      />
    );

    // Selected day (July 31) slot is shown
    expect(screen.getByText("July End Architecture Review")).toBeInTheDocument();

    // Both MonthCalendarView and MiniCalendarNavigator show July 2026
    expect(screen.getAllByText("July 2026")).toHaveLength(2);

    // Click Next month in MiniCalendarNavigator -> moves both views to August 2026
    const miniNav = screen.getByRole("complementary", {
      name: /mini calendar navigator/i,
    });
    fireEvent.click(within(miniNav).getByRole("button", { name: /next month/i }));

    expect(screen.getAllByText("August 2026")).toHaveLength(2);

    // Select August 1 in MiniCalendarNavigator -> updates selected day slots and MonthCalendarView
    const aug1Mini = within(miniNav).getByRole("gridcell", {
      name: /^Saturday, August 1$/i,
    });
    fireEvent.click(aug1Mini);

    expect(screen.getByText("August Kickoff Consultation")).toBeInTheDocument();
    expect(screen.getByText("August Smart Contract Audit")).toBeInTheDocument();

    // MonthCalendarView reflects August 1 as selected
    const monthRegion = screen.getByRole("region", { name: /month calendar/i });
    const aug1Month = within(monthRegion).getByRole("gridcell", {
      name: /^Saturday, August 1, selected/i,
    });
    expect(aug1Month).toHaveAttribute("aria-selected", "true");
  });

  it("switches to Agenda view and syncs booking date back to shared state", () => {
    const onBook = vi.fn();
    render(
      <CalendarView
        slots={sampleSlots}
        initialDate={new Date(2026, 6, 31)}
        onBook={onBook}
      />
    );

    // Switch to Agenda mode via CalendarViewToggle
    fireEvent.click(screen.getByRole("tab", { name: /agenda/i }));

    expect(screen.getByText("Availability Agenda")).toBeInTheDocument();

    // Book August 1 in Agenda view
    const bookAug1 = screen.getByRole("button", {
      name: /book slots for aug 1, 2026/i,
    });
    fireEvent.click(bookAug1);

    expect(onBook).toHaveBeenCalledTimes(1);
    const bookedDate: Date = onBook.mock.calls[0][0];
    expect(toISODateKey(bookedDate)).toBe("2026-08-01");

    // MiniCalendarNavigator moved to August 2026
    const miniNav = screen.getByRole("complementary", {
      name: /mini calendar navigator/i,
    });
    expect(within(miniNav).getByText("August 2026")).toBeInTheDocument();
  });

  it("groups slots across a month boundary in week view and supports keyboard navigation with LiveRegion announcements", () => {
    render(
      <CalendarView
        slots={sampleSlots}
        viewMode="week"
        initialDate={new Date(2026, 6, 31)} // Fri Jul 31, 2026 (week spans Jul 26 - Aug 1)
      />
    );

    const weekGrid = screen.getByRole("grid", { name: /week calendar view/i });
    const cells = within(weekGrid).getAllByRole("gridcell");
    expect(cells).toHaveLength(7);

    // Both July 31 and August 1 slots appear in the same week across the month boundary
    expect(within(weekGrid).getByText("July End Architecture Review")).toBeInTheDocument();
    expect(within(weekGrid).getByText("August Kickoff Consultation")).toBeInTheDocument();

    // Focus the selected cell (Fri Jul 31, index 5) and press ArrowRight -> Sat Aug 1 (index 6)
    const jul31Cell = cells[5];
    jul31Cell.focus();
    fireEvent.keyDown(jul31Cell, { key: "ArrowRight" });
    expect(cells[6]).toHaveFocus();

    // Press Home -> moves to Sunday (index 0)
    fireEvent.keyDown(cells[6], { key: "Home" });
    expect(cells[0]).toHaveFocus();

    // Press End -> moves to Saturday (index 6)
    fireEvent.keyDown(cells[0], { key: "End" });
    expect(cells[6]).toHaveFocus();

    // Press PageDown -> advances month and announces via LiveRegion
    fireEvent.keyDown(cells[6], { key: "PageDown" });
    const liveRegions = screen.getAllByRole("status");
    expect(
      liveRegions.some((el) => /September 2026/i.test(el.textContent ?? ""))
    ).toBe(true);

    // Press PageUp on Sep 1 (index 2 in Sun Aug 30 - Sat Sep 5 week) -> moves back to August 2026
    const updatedCells = within(weekGrid).getAllByRole("gridcell");
    fireEvent.keyDown(updatedCells[2], { key: "PageUp" });
    expect(
      screen
        .getAllByRole("status")
        .some((el) => /August 2026/i.test(el.textContent ?? ""))
    ).toBe(true);
  });

  it("is axe-clean in month, week, day, and agenda modes", async () => {
    const modes = ["month", "week", "day", "agenda"] as const;
    for (const mode of modes) {
      const { container, unmount } = render(
        <CalendarView
          slots={sampleSlots}
          viewMode={mode}
          initialDate={new Date(2026, 6, 31)}
        />
      );
      const results = await axe(container);
      expect(results.violations).toEqual([]);
      unmount();
    }
  });
});
