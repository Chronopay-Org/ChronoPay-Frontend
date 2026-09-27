import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RecurringAvailabilityEditor } from "@/components/dashboard/recurring-availability-editor";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Render the component and return a set of commonly-used queries so individual
 * tests don't need to repeat boilerplate.
 */
function setup() {
  const result = render(<RecurringAvailabilityEditor />);

  /** Click every currently-selected weekday button to deselect it. */
  function clearAllWeekdays() {
    // Checked weekday buttons carry aria-checked="true"
    const checked = result.container.querySelectorAll<HTMLButtonElement>(
      '[role="checkbox"][aria-checked="true"]',
    );
    checked.forEach((btn) => fireEvent.click(btn));
  }

  /** Click a frequency radio by its visible label text. */
  function selectFrequency(label: string) {
    fireEvent.click(screen.getByRole("radio", { name: label }));
  }

  /** Click an end-condition radio by its visible label text. */
  function selectEndType(label: string) {
    fireEvent.click(screen.getByRole("radio", { name: label }));
  }

  return { ...result, clearAllWeekdays, selectFrequency, selectEndType };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("RecurringAvailabilityEditor", () => {
  // ── Initial render ─────────────────────────────────────────────────────────

  it("renders the panel title", () => {
    setup();
    expect(
      screen.getByRole("heading", { name: /recurring availability/i }),
    ).toBeInTheDocument();
  });

  it("renders all three frequency options", () => {
    setup();
    expect(screen.getByRole("radio", { name: "Daily" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Weekly" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Monthly" })).toBeInTheDocument();
  });

  it("defaults to Weekly frequency selected", () => {
    setup();
    expect(screen.getByRole("radio", { name: "Weekly" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("renders weekday buttons when frequency is weekly", () => {
    setup();
    // All 7 short-form weekday labels should appear
    for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      expect(screen.getByRole("checkbox", { name: day })).toBeInTheDocument();
    }
  });

  it("starts with Tue, Thu, Sat pre-selected", () => {
    setup();
    expect(screen.getByRole("checkbox", { name: "Tue" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("checkbox", { name: "Thu" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("checkbox", { name: "Sat" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  // ── Failure / empty-result branch (line 173) ──────────────────────────────
  // When `hasWeekdays && weekdayIndices.size === 0` the `rrule` useMemo
  // returns `null`, which propagates to `preview` (→ []) and `summary`
  // (→ "Select at least one day to see a preview.").

  describe("failure path: no weekday selected while frequency requires weekdays", () => {
    it("shows a validation alert when all weekdays are deselected (weekly)", () => {
      const { clearAllWeekdays } = setup();
      clearAllWeekdays();

      // The component renders a role="alert" paragraph
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent(
        /select at least one day/i,
      );
    });

    it("shows fallback summary text instead of an rrule description", () => {
      const { clearAllWeekdays } = setup();
      clearAllWeekdays();

      expect(
        screen.getByText(/select at least one day to see a preview/i),
      ).toBeInTheDocument();
    });

    it("renders 'No occurrences to preview' in the next-occurrences section", () => {
      const { clearAllWeekdays } = setup();
      clearAllWeekdays();

      expect(
        screen.getByText(/no occurrences to preview/i),
      ).toBeInTheDocument();
    });

    it("shows the same null-rrule behaviour when frequency is monthly and no days are selected", () => {
      const { clearAllWeekdays, selectFrequency } = setup();
      selectFrequency("Monthly");
      clearAllWeekdays();

      expect(screen.getByRole("alert")).toHaveTextContent(
        /select at least one day/i,
      );
      expect(
        screen.getByText(/select at least one day to see a preview/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/no occurrences to preview/i),
      ).toBeInTheDocument();
    });

    it("recovers when at least one day is re-selected", () => {
      const { clearAllWeekdays } = setup();
      clearAllWeekdays();

      // Validation alert should be present first
      expect(screen.getByRole("alert")).toBeInTheDocument();

      // Re-select Monday
      fireEvent.click(screen.getByRole("checkbox", { name: "Mon" }));

      // Alert should be gone; the rrule summary should now be meaningful text
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      // A real rrule description will not contain the fallback phrase
      expect(
        screen.queryByText(/select at least one day to see a preview/i),
      ).not.toBeInTheDocument();
    });
  });

  // ── Normal / happy path ────────────────────────────────────────────────────

  describe("normal path: valid weekday selection produces a preview", () => {
    it("does not show the validation alert when weekdays are selected", () => {
      setup(); // default has 3 days selected
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("renders up to 5 upcoming occurrences", () => {
      setup();
      const list = screen.getByRole("list", { name: /next occurrences/i });
      const items = within(list).getAllByRole("listitem");
      expect(items.length).toBeGreaterThan(0);
      expect(items.length).toBeLessThanOrEqual(5);
    });

    it("each occurrence list item contains a numbered badge", () => {
      setup();
      const list = screen.getByRole("list", { name: /next occurrences/i });
      const items = within(list).getAllByRole("listitem");
      items.forEach((item, idx) => {
        expect(item.textContent).toContain(String(idx + 1));
      });
    });

    it("shows a non-empty rrule summary text", () => {
      setup();
      // The Summary section label is a paragraph, the value is the next sibling
      const summarySection = screen
        .getAllByText(/summary/i)
        .find((el) => el.tagName === "P");
      expect(summarySection).toBeInTheDocument();
      // Its parent div holds both the label and the description
      const value = summarySection!.parentElement!.querySelector(
        "p:last-child",
      );
      expect(value?.textContent?.trim().length).toBeGreaterThan(0);
    });
  });

  // ── Frequency switching ────────────────────────────────────────────────────

  describe("frequency switching", () => {
    it("hides weekday selector when Daily is chosen", () => {
      const { selectFrequency } = setup();
      selectFrequency("Daily");

      // None of the weekday checkboxes should be in the DOM
      expect(screen.queryByRole("checkbox", { name: "Mon" })).not.toBeInTheDocument();
    });

    it("no validation alert appears when Daily is chosen (weekdays irrelevant)", () => {
      const { selectFrequency } = setup();
      selectFrequency("Daily");

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows weekday selector when Monthly is chosen", () => {
      const { selectFrequency } = setup();
      selectFrequency("Monthly");

      expect(screen.getByRole("checkbox", { name: "Mon" })).toBeInTheDocument();
    });

    it("marks the newly selected frequency as checked", () => {
      const { selectFrequency } = setup();
      selectFrequency("Daily");

      expect(screen.getByRole("radio", { name: "Daily" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      expect(screen.getByRole("radio", { name: "Weekly" })).toHaveAttribute(
        "aria-checked",
        "false",
      );
    });
  });

  // ── Interval input ─────────────────────────────────────────────────────────

  describe("interval input", () => {
    it("renders an interval number input defaulting to 1", () => {
      setup();
      const input = screen.getByRole("spinbutton", { name: /every/i });
      expect(input).toHaveValue(1);
    });

    it("clamps interval to 1 if a value below 1 is entered", () => {
      setup();
      const input = screen.getByRole("spinbutton", { name: /every/i });
      fireEvent.change(input, { target: { value: "0" } });
      expect(input).toHaveValue(1);
    });

    it("accepts a valid interval value", () => {
      setup();
      const input = screen.getByRole("spinbutton", { name: /every/i });
      fireEvent.change(input, { target: { value: "3" } });
      expect(input).toHaveValue(3);
    });
  });

  // ── End-condition panel ────────────────────────────────────────────────────

  describe("end condition", () => {
    it("defaults to Never", () => {
      setup();
      expect(screen.getByRole("radio", { name: "Never" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });

    it("shows occurrence count input when 'After' is selected", () => {
      const { selectEndType } = setup();
      selectEndType("After");

      expect(
        screen.getByRole("spinbutton", { name: /number of occurrences/i }),
      ).toBeInTheDocument();
    });

    it("shows date input when 'On date' is selected", () => {
      const { selectEndType } = setup();
      selectEndType("On date");

      expect(
        screen.getByRole("textbox", { name: /end date/i }) ??
          screen.getByLabelText(/end date/i),
      ).toBeInTheDocument();
    });

    it("hides count input when switching away from After", () => {
      const { selectEndType } = setup();
      selectEndType("After");
      selectEndType("Never");

      expect(
        screen.queryByRole("spinbutton", { name: /number of occurrences/i }),
      ).not.toBeInTheDocument();
    });
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  describe("accessibility", () => {
    it("has a live region for screen reader announcements", () => {
      const { container } = setup();
      const liveRegion = container.querySelector('[role="status"][aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it("weekday group has an accessible label", () => {
      setup();
      expect(
        screen.getByRole("group", { name: /days of the week/i }),
      ).toBeInTheDocument();
    });

    it("frequency radiogroup has an accessible label", () => {
      setup();
      expect(
        screen.getByRole("radiogroup", { name: /frequency/i }),
      ).toBeInTheDocument();
    });

    it("end radiogroup has an accessible label", () => {
      setup();
      expect(
        screen.getByRole("radiogroup", { name: /end/i }),
      ).toBeInTheDocument();
    });

    it("summary section has aria-live=polite", () => {
      const { container } = setup();
      const summaryDiv = container.querySelector(
        '[aria-live="polite"][aria-atomic="true"]',
      );
      expect(summaryDiv).toBeInTheDocument();
    });
  });

  // ── Boundary inputs ────────────────────────────────────────────────────────

  describe("boundary inputs", () => {
    it("selecting a single weekday is sufficient to produce a valid rrule", () => {
      const { clearAllWeekdays } = setup();
      clearAllWeekdays();

      // Now only one day
      fireEvent.click(screen.getByRole("checkbox", { name: "Fri" }));

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(
        screen.queryByText(/select at least one day to see a preview/i),
      ).not.toBeInTheDocument();
    });

    it("selecting all 7 weekdays produces a valid rrule", () => {
      setup();
      for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
        const btn = screen.getByRole("checkbox", { name: day });
        if (btn.getAttribute("aria-checked") === "false") {
          fireEvent.click(btn);
        }
      }

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      const list = screen.getByRole("list", { name: /next occurrences/i });
      expect(within(list).getAllByRole("listitem").length).toBeGreaterThan(0);
    });

    it("toggling a weekday on then off returns to the invalid (null rrule) state", () => {
      const { clearAllWeekdays } = setup();
      clearAllWeekdays();

      // select Mon
      fireEvent.click(screen.getByRole("checkbox", { name: "Mon" }));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      // deselect Mon again
      fireEvent.click(screen.getByRole("checkbox", { name: "Mon" }));
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("daily frequency with interval of 52 still renders occurrences", () => {
      const { selectFrequency } = setup();
      selectFrequency("Daily");

      const input = screen.getByRole("spinbutton", { name: /every/i });
      fireEvent.change(input, { target: { value: "52" } });

      // Daily never needs weekday selection — preview should still show
      expect(screen.queryByText(/no occurrences to preview/i)).not.toBeInTheDocument();
    });
  });
});
