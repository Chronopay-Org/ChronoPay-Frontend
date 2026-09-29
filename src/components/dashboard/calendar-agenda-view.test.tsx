import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  CalendarAgendaView,
  type CalendarAgendaViewProps,
} from "./calendar-agenda-view";

/**
 * Dedicated behaviour suite for `calendar-agenda-view.tsx`.
 *
 * The module previously had no directly associated fixture, so the contract of
 * `CalendarAgendaViewProps` / `CalendarAgendaView` -- the empty state, the month grouping,
 * the status -> label mapping, and which statuses are bookable -- was unprotected.
 *
 * `DayAvailability` is intentionally derived from the component's own public prop type
 * rather than imported from `./availability-strip`, so this suite exercises exactly the
 * contract the component publishes.
 */
type Day = CalendarAgendaViewProps["days"][number];

const STATUS_CASES: ReadonlyArray<{
  status: Day["status"];
  label: string;
  bookable: boolean;
}> = [
  { status: "available", label: "Available", bookable: true },
  { status: "limited", label: "Limited", bookable: true },
  { status: "full", label: "Full", bookable: false },
  { status: "none", label: "No slots", bookable: false },
];

function makeDay(overrides: Partial<Day> = {}): Day {
  return {
    date: new Date(2026, 4, 3), // May 2026, local time -> deterministic month grouping
    dayName: "Sun",
    dateLabel: "May 3, 2026",
    slotCount: 3,
    status: "available",
    ...overrides,
  };
}

/** A day in May 2026 with an explicit label. */
function mayDay(dateLabel: string, overrides: Partial<Day> = {}): Day {
  return makeDay({ date: new Date(2026, 4, 3), dateLabel, ...overrides });
}

/** A day in June 2026 with an explicit label. */
function juneDay(dateLabel: string, overrides: Partial<Day> = {}): Day {
  return makeDay({ date: new Date(2026, 5, 15), dateLabel, ...overrides });
}

function agendaSection(): HTMLElement {
  return screen.getByRole("region", { name: "Agenda view of availability" });
}

function rows(): HTMLElement[] {
  return screen.getAllByRole("listitem");
}

function statusBadge(row: HTMLElement): HTMLElement {
  const badge = row.querySelector<HTMLElement>("[aria-label^='Status:']");
  if (!badge) throw new Error("status badge not found in row");
  return badge;
}

/** Reads just the "<n> slot(s)" text so pluralisation can be asserted exactly. */
function slotCountLabel(row: HTMLElement): string {
  const match = Array.from(row.querySelectorAll("span")).find((span) =>
    /^-?\d+ slots?$/.test(span.textContent?.trim() ?? "")
  );
  return match?.textContent?.trim() ?? "";
}

describe("CalendarAgendaView", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("empty and degenerate inputs", () => {
    it("renders the empty state and no agenda section when there are no days", () => {
      render(<CalendarAgendaView days={[]} />);

      expect(screen.getByText("No availability data available")).toBeInTheDocument();
      expect(screen.queryByRole("region", { name: "Agenda view of availability" })).toBeNull();
      expect(screen.queryByRole("listitem")).toBeNull();
    });

    it("announces the empty state politely via role=status", () => {
      render(<CalendarAgendaView days={[]} />);

      const emptyState = screen.getByRole("status");
      expect(emptyState).toHaveAttribute("aria-live", "polite");
    });

    it("renders the agenda section instead of the empty state for a single day", () => {
      render(<CalendarAgendaView days={[makeDay()]} />);

      expect(agendaSection()).toBeInTheDocument();
      expect(screen.queryByRole("status")).toBeNull();
      expect(rows()).toHaveLength(1);
    });
  });

  describe("CalendarAgendaViewProps contract", () => {
    it("renders the labelled section with the availability agenda heading", () => {
      render(<CalendarAgendaView days={[makeDay()]} />);

      const section = agendaSection();
      expect(within(section).getByRole("heading", { level: 2 })).toHaveTextContent(
        "Availability Agenda"
      );
      expect(within(section).getByRole("list")).toHaveAccessibleName(
        "Available days grouped by month"
      );
    });

    it("merges a caller supplied className onto the section", () => {
      const { rerender } = render(<CalendarAgendaView days={[makeDay()]} />);
      expect(agendaSection()).toHaveClass("rounded-[1.5rem]");
      expect(agendaSection()).not.toHaveClass("agenda-custom");

      rerender(<CalendarAgendaView days={[makeDay()]} className="agenda-custom" />);
      expect(agendaSection()).toHaveClass("agenda-custom", "rounded-[1.5rem]");
    });

    it("does not mutate or reorder the days prop", () => {
      const days = [mayDay("May 10, 2026"), mayDay("May 3, 2026")];
      const labelsBefore = days.map((day) => day.dateLabel);
      const datesBefore = days.map((day) => day.date.getTime());

      render(<CalendarAgendaView days={days} />);

      // Insertion order is preserved (the component does not sort by date).
      expect(days.map((day) => day.dateLabel)).toEqual(labelsBefore);
      expect(days.map((day) => day.date.getTime())).toEqual(datesBefore);
      expect(rows().map((row) => row.textContent)).toEqual([
        expect.stringContaining("May 10, 2026"),
        expect.stringContaining("May 3, 2026"),
      ]);
    });

    it("treats onBook as optional", async () => {
      const user = userEvent.setup();
      render(<CalendarAgendaView days={[makeDay()]} />);

      await expect(
        user.click(screen.getByRole("button", { name: /Book slots for May 3, 2026/ }))
      ).resolves.toBeUndefined();
    });

    it("renders the supplied day name and label", () => {
      render(<CalendarAgendaView days={[makeDay({ dayName: "Mon", dateLabel: "May 4, 2026" })]} />);

      expect(screen.getByText("Mon")).toBeInTheDocument();
      expect(screen.getByText("May 4, 2026")).toBeInTheDocument();
    });
  });

  describe("status to label mapping", () => {
    it.each(STATUS_CASES)(
      "renders the $label badge for status $status",
      ({ status, label }) => {
        render(<CalendarAgendaView days={[makeDay({ status })]} />);

        const badge = statusBadge(rows()[0]);
        expect(badge).toHaveTextContent(label);
        expect(badge).toHaveAttribute("aria-label", `Status: ${label}`);
      }
    );

    it("gives each status a distinct badge label", () => {
      render(<CalendarAgendaView days={STATUS_CASES.map((c, i) => mayDay(`May ${i + 1}, 2026`, { status: c.status }))} />);

      const labels = rows().map((row) => statusBadge(row).getAttribute("aria-label"));
      expect(labels).toEqual([
        "Status: Available",
        "Status: Limited",
        "Status: Full",
        "Status: No slots",
      ]);
      expect(new Set(labels).size).toBe(labels.length);
    });
  });

  describe("bookable state transitions", () => {
    it.each(STATUS_CASES)(
      "exposes a bookable control for status $status only when bookable=$bookable",
      ({ status, bookable }) => {
        render(<CalendarAgendaView days={[makeDay({ status })]} />);

        if (bookable) {
          const bookButton = screen.getByRole("button", {
            name: /Book slots for May 3, 2026/,
          });
          expect(bookButton).toBeEnabled();
          return;
        }

        expect(screen.queryByRole("button", { name: /^Book / })).toBeNull();
        expect(
          screen.getByRole("button", { name: /No slots available for May 3, 2026/ })
        ).toBeDisabled();
      }
    );

    it("calls onBook with the identical Date instance of an available day", async () => {
      const user = userEvent.setup();
      const onBook = vi.fn();
      const day = makeDay();
      render(<CalendarAgendaView days={[day]} onBook={onBook} />);

      await user.click(screen.getByRole("button", { name: /Book slots for May 3, 2026/ }));

      expect(onBook).toHaveBeenCalledTimes(1);
      expect(onBook.mock.calls[0][0]).toBe(day.date);
    });

    it("calls onBook for a limited day", async () => {
      const user = userEvent.setup();
      const onBook = vi.fn();
      render(<CalendarAgendaView days={[makeDay({ status: "limited" })]} onBook={onBook} />);

      await user.click(screen.getByRole("button", { name: /Book slots for May 3, 2026/ }));

      expect(onBook).toHaveBeenCalledTimes(1);
    });

    it("labels a full day as Fully Booked and never fires onBook", async () => {
      const user = userEvent.setup();
      const onBook = vi.fn();
      render(<CalendarAgendaView days={[makeDay({ status: "full", slotCount: 0 })]} onBook={onBook} />);

      const button = screen.getByRole("button", { name: /No slots available for May 3, 2026/ });
      expect(button).toHaveTextContent("Fully Booked");
      expect(button).toBeDisabled();

      await user.click(button);
      expect(onBook).not.toHaveBeenCalled();
    });

    it("labels a day without slots as Unavailable and never fires onBook", async () => {
      const user = userEvent.setup();
      const onBook = vi.fn();
      render(<CalendarAgendaView days={[makeDay({ status: "none", slotCount: 0 })]} onBook={onBook} />);

      const button = screen.getByRole("button", { name: /No slots available for May 3, 2026/ });
      expect(button).toHaveTextContent("Unavailable");
      expect(button).toBeDisabled();

      await user.click(button);
      expect(onBook).not.toHaveBeenCalled();
    });

    it("keeps a day bookable when slotCount is 0 because the gate is status-only", async () => {
      const user = userEvent.setup();
      const onBook = vi.fn();
      render(<CalendarAgendaView days={[makeDay({ status: "available", slotCount: 0 })]} onBook={onBook} />);

      expect(slotCountLabel(rows()[0])).toBe("0 slots");
      await user.click(screen.getByRole("button", { name: /Book slots for May 3, 2026/ }));

      expect(onBook).toHaveBeenCalledTimes(1);
    });

    it("allows keyboard activation of the Book control", async () => {
      const user = userEvent.setup();
      const onBook = vi.fn();
      render(<CalendarAgendaView days={[makeDay()]} onBook={onBook} />);

      const bookButton = screen.getByRole("button", { name: /Book slots for May 3, 2026/ });
      await user.tab();
      expect(bookButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(onBook).toHaveBeenCalledTimes(1);
    });

    it("reports every bookable day independently", async () => {
      const user = userEvent.setup();
      const onBook = vi.fn();
      const first = mayDay("May 3, 2026", { status: "available", date: new Date(2026, 4, 3) });
      const second = mayDay("May 4, 2026", { status: "limited", date: new Date(2026, 4, 4) });
      render(<CalendarAgendaView days={[first, second]} onBook={onBook} />);

      await user.click(screen.getByRole("button", { name: /Book slots for May 4, 2026/ }));

      expect(onBook).toHaveBeenCalledTimes(1);
      expect(onBook.mock.calls[0][0]).toBe(second.date);
      expect(onBook).not.toHaveBeenCalledWith(first.date);
    });
  });

  describe("month grouping", () => {
    it("groups days under en-US long month + year headings", () => {
      render(
        <CalendarAgendaView
          days={[mayDay("May 3, 2026"), juneDay("Jun 15, 2026"), mayDay("May 4, 2026")]}
        />
      );

      expect(screen.getByRole("heading", { level: 3, name: "May 2026" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 3, name: "June 2026" })).toBeInTheDocument();
      expect(rows()).toHaveLength(3);
    });

    it("preserves day order within each month group", () => {
      render(
        <CalendarAgendaView
          days={[juneDay("Jun 15, 2026"), mayDay("May 10, 2026"), mayDay("May 3, 2026")]}
        />
      );

      const mayGroup = screen.getByRole("group", { name: "Days in May 2026" });
      expect(within(mayGroup).getAllByRole("listitem").map((row) => row.textContent)).toEqual([
        expect.stringContaining("May 10, 2026"),
        expect.stringContaining("May 3, 2026"),
      ]);

      // Month groups appear in order of first appearance in `days`.
      expect(
        screen.getAllByRole("group").map((group) => group.getAttribute("aria-label"))
      ).toEqual(["Days in June 2026", "Days in May 2026"]);
    });

    it("groups by the date, not by the supplied label", () => {
      render(<CalendarAgendaView days={[mayDay("Jun 1, 2026")]} />);

      const mayGroup = screen.getByRole("group", { name: "Days in May 2026" });
      expect(within(mayGroup).getByText("Jun 1, 2026")).toBeInTheDocument();
      expect(screen.queryByRole("group", { name: "Days in June 2026" })).toBeNull();
    });

    it("exposes list semantics for the grouping container", () => {
      render(<CalendarAgendaView days={[mayDay("May 3, 2026")]} />);

      const list = agendaSection().querySelector("[role='list']");
      expect(list).toHaveAttribute("aria-label", "Available days grouped by month");
      expect(within(list as HTMLElement).getAllByRole("group")).toHaveLength(1);
    });
  });

  describe("slot count rendering", () => {
    it.each([
      { slotCount: 1, expected: "1 slot" },
      { slotCount: 0, expected: "0 slots" },
      { slotCount: 2, expected: "2 slots" },
      { slotCount: 12, expected: "12 slots" },
    ])("renders $expected for slotCount $slotCount", ({ slotCount, expected }) => {
      render(<CalendarAgendaView days={[makeDay({ slotCount })]} />);

      expect(slotCountLabel(rows()[0])).toBe(expected);
    });

    it("renders a negative slot count with the plural form", () => {
      render(<CalendarAgendaView days={[makeDay({ slotCount: -1 })]} />);

      expect(slotCountLabel(rows()[0])).toBe("-1 slots");
    });
  });

  describe("representative invalid inputs", () => {
    it("renders an unrecognised status as a non-bookable Unavailable row", () => {
      // Characterisation: the status maps have no default branch, so an out-of-contract
      // status silently yields an empty badge label and the "Unavailable" fallback.
      render(
        <CalendarAgendaView days={[makeDay({ status: "archived" as Day["status"] })]} />
      );

      const row = rows()[0];
      expect(statusBadge(row)).toHaveAttribute("aria-label", "Status: undefined");
      expect(statusBadge(row).textContent).toBe("");
      expect(
        screen.getByRole("button", { name: /No slots available for May 3, 2026/ })
      ).toBeDisabled();
    });

    it("renders an invalid Date under an Invalid Date group without throwing", () => {
      render(<CalendarAgendaView days={[makeDay({ date: new Date("not-a-date") })]} />);

      expect(screen.getByRole("heading", { level: 3, name: "Invalid Date" })).toBeInTheDocument();
      expect(rows()).toHaveLength(1);
    });

    it("passes the invalid Date through to onBook unchanged", async () => {
      const user = userEvent.setup();
      const onBook = vi.fn();
      const invalidDate = new Date("not-a-date");
      render(<CalendarAgendaView days={[makeDay({ date: invalidDate })]} onBook={onBook} />);

      await user.click(screen.getByRole("button", { name: /Book slots for May 3, 2026/ }));

      expect(onBook).toHaveBeenCalledTimes(1);
      expect(onBook.mock.calls[0][0]).toBe(invalidDate);
    });

    it("still renders every row when two days share a dateLabel (duplicate React key)", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<CalendarAgendaView days={[mayDay("May 3, 2026"), mayDay("May 3, 2026")]} />);

      expect(rows()).toHaveLength(2);
      expect(consoleError.mock.calls.flat().join(" ")).toMatch(/same key/i);
    });

    it("renders a day whose dateLabel is empty", () => {
      render(<CalendarAgendaView days={[mayDay("", { dayName: "" })]} />);

      expect(rows()).toHaveLength(1);
      expect(screen.getByRole("button", { name: /Book slots for/ })).toBeInTheDocument();
    });
  });
});
