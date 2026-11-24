import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  CalendarViewToggle,
  type CalendarViewMode,
  type CalendarViewToggleProps,
} from "@/components/dashboard/calendar-view-toggle";

/**
 * Complementary to `calendar-view-toggle.test.tsx`, which covers the rendered
 * happy path (the four labels, the active highlight, click, arrow wrapping, the
 * heatmap toggle and className).
 *
 * This suite pins the parts the issue names but that fixture leaves unasserted:
 * the exported `CalendarViewMode` / `CalendarViewToggleProps` surface, the
 * roving tab stop, activating a tab that is not the selected one, and the
 * boundaries — a key the component does not handle, and a heatmap prop that is
 * absent.
 */

const MODES = ["month", "week", "day", "agenda"] as const satisfies readonly CalendarViewMode[];

/**
 * Typed against `CalendarViewMode`, so adding a mode to the component without
 * extending this table is a compile error in the build, not a silent gap.
 */
const MODE_COPY: Record<CalendarViewMode, { label: string; description: string }> = {
  month: { label: "Month", description: "View entire month at a glance" },
  week: { label: "Week", description: "View current week in detail" },
  day: { label: "Day", description: "Focus on single day" },
  agenda: { label: "Agenda", description: "Chronological list view" },
};

/** Fresh spies per render: a shared module-level mock leaks calls between tests. */
function renderToggle(overrides: Partial<CalendarViewToggleProps> = {}) {
  const onModeChange = vi.fn();
  const onHeatmapToggle = vi.fn();
  const props: CalendarViewToggleProps = {
    currentMode: "month",
    onModeChange,
    ...overrides,
  };

  const view = render(<CalendarViewToggle {...props} />);
  return { ...view, onModeChange, onHeatmapToggle };
}

const tabNamed = (name: string | RegExp) => screen.getByRole("tab", { name });

describe("CalendarViewToggle public contract", () => {
  it("renders one tab per CalendarViewMode and no others", () => {
    renderToggle();

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(MODES.length);
    for (const mode of MODES) {
      expect(tabNamed(MODE_COPY[mode].label)).toBeInTheDocument();
    }
  });

  it("marks exactly the current mode as selected, for every mode", () => {
    for (const current of MODES) {
      const { unmount } = renderToggle({ currentMode: current });

      const selected = screen
        .getAllByRole("tab")
        .filter((tab) => tab.getAttribute("aria-selected") === "true");

      // A toggle that selected nothing, or two tabs at once, would leave the
      // calendar in a state the control cannot express.
      expect(selected).toHaveLength(1);
      expect(selected[0]).toBe(tabNamed(MODE_COPY[current].label));

      unmount();
    }
  });

  it("accepts the required props alone and the full documented surface", () => {
    // Minimum: only the two required props.
    const requiredOnly = renderToggle();
    expect(requiredOnly.container.querySelector('[role="tablist"]')).not.toBeNull();
    requiredOnly.unmount();

    // Full: every optional prop populated at once.
    expect(() =>
      renderToggle({
        currentMode: "day",
        heatmapEnabled: true,
        onHeatmapToggle: vi.fn(),
        className: "custom-toolbar",
      })
    ).not.toThrow();
  });

  it("omits the heatmap control entirely when no handler is given", () => {
    renderToggle();

    // The heatmap button is rendered only when `onHeatmapToggle` is passed, so
    // an uncontrolled instance must not present a dead control.
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("defaults heatmapEnabled to false when only the handler is given", () => {
    renderToggle({ onHeatmapToggle: vi.fn() });

    expect(screen.getByRole("button", { name: /Show availability heatmap/i })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });
});

describe("roving tab stop", () => {
  it("exposes a single tab stop, on the selected mode", () => {
    renderToggle({ currentMode: "day" });

    const stops = screen
      .getAllByRole("tab")
      .filter((tab) => tab.getAttribute("tabindex") === "0");

    // One tab stop for the whole tab list: Tab enters the control once and the
    // arrow keys do the rest.
    expect(stops).toHaveLength(1);
    expect(stops[0]).toBe(tabNamed("Day"));
  });

  it("removes every non-selected mode from the tab order", () => {
    renderToggle({ currentMode: "week" });

    for (const mode of MODES) {
      const tab = tabNamed(MODE_COPY[mode].label);
      expect(tab).toHaveAttribute("tabindex", mode === "week" ? "0" : "-1");
    }
  });
});

describe("keyboard boundaries", () => {
  it("activates the tab the event lands on, not the selected one", () => {
    const { onModeChange } = renderToggle({ currentMode: "month" });

    // `handleKeyDown` commits the mode it was given, so pressing Enter on a
    // neighbour selects that neighbour.
    fireEvent.keyDown(tabNamed("Week"), { key: "Enter" });
    expect(onModeChange).toHaveBeenCalledWith("week");

    onModeChange.mockClear();
    fireEvent.keyDown(tabNamed("Agenda"), { key: " " });
    expect(onModeChange).toHaveBeenCalledWith("agenda");
  });

  it("ignores keys it does not handle", () => {
    const { onModeChange } = renderToggle({ currentMode: "month" });

    for (const key of ["ArrowUp", "ArrowDown", "Home", "End", "Escape", "Tab", "a"]) {
      fireEvent.keyDown(tabNamed("Month"), { key });
    }

    // Only ArrowLeft/ArrowRight/Enter/Space are bound; anything else must leave
    // the mode untouched rather than falling through to a default.
    expect(onModeChange).not.toHaveBeenCalled();
  });

  it("does not change mode when focus moves", () => {
    const { onModeChange } = renderToggle({ currentMode: "month" });

    // Focusing a neighbour only moves the internal roving index; selection
    // stays with the caller's `currentMode`.
    fireEvent.focus(tabNamed("Agenda"));
    expect(onModeChange).not.toHaveBeenCalled();
    expect(tabNamed("Month")).toHaveAttribute("aria-selected", "true");
  });

  it("still reports a click on the already-selected mode", () => {
    const { onModeChange } = renderToggle({ currentMode: "month" });

    fireEvent.click(tabNamed("Month"));

    // No early return for the current mode, so a caller can treat the callback
    // as "the user asked for this view" without special-casing.
    expect(onModeChange).toHaveBeenCalledWith("month");
  });
});

describe("accessibility wiring", () => {
  it("labels the tab list and the group it contains", () => {
    renderToggle();

    expect(screen.getByRole("tablist")).toHaveAccessibleName("Calendar view mode");
    expect(screen.getByRole("group")).toHaveAccessibleName("Calendar view");
  });

  it("gives every mode its description as the tooltip", () => {
    renderToggle();

    for (const mode of MODES) {
      expect(tabNamed(MODE_COPY[mode].label)).toHaveAttribute(
        "title",
        MODE_COPY[mode].description
      );
    }
  });

  it("hides the mode icons from the accessibility tree", () => {
    renderToggle();

    for (const mode of MODES) {
      const icon = tabNamed(MODE_COPY[mode].label).querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
  });
});
