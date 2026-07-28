/**
 * BookingChecklist unit tests
 *
 * Coverage targets (95%+):
 *  - deriveChecklistSummary helper
 *  - ProgressBar render and aria values
 *  - StatusIcon for every status variant
 *  - StepRow: presentational + interactive variants
 *  - aria-current="step" on the active step
 *  - aria-setsize / aria-posinset on step rows
 *  - Panel heading, eyebrow, and progress pill
 *  - Mobile collapse / expand toggle (aria-expanded / aria-controls)
 *  - defaultCollapsed=false starts expanded
 *  - aria-live announcement when step statuses change
 *  - Skipped optional steps count toward progress
 *  - All steps done → 100% label + emerald pill
 *  - withCard=false strips the card classes
 *  - Empty steps array
 *  - Keyboard: click triggers onStepClick
 *  - No onStepClick → purely presentational
 *  - Accessibility: axe violations
 */

import React, { useState } from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  BookingChecklist,
  deriveChecklistSummary,
  type ChecklistStep,
} from "./booking-checklist";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const STEPS_MIXED: ChecklistStep[] = [
  { id: "reserve", label: "Reserve slot", status: "done" },
  { id: "confirm", label: "Confirm booking", status: "done" },
  { id: "escrow", label: "Escrow payment", status: "active", description: "Waiting for funds" },
  { id: "deliver", label: "Deliver service", status: "blocked", description: "Depends on escrow" },
  { id: "rate", label: "Rate experience", status: "pending", optional: true },
  { id: "release", label: "Release escrow", status: "pending" },
];

const STEPS_ALL_DONE: ChecklistStep[] = [
  { id: "a", label: "Step A", status: "done" },
  { id: "b", label: "Step B", status: "done" },
  { id: "c", label: "Step C", status: "done" },
];

const STEPS_WITH_SKIPPED: ChecklistStep[] = [
  { id: "a", label: "Step A", status: "done" },
  { id: "b", label: "Step B", status: "skipped", optional: true },
  { id: "c", label: "Step C", status: "pending" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setup(
  props: Partial<React.ComponentProps<typeof BookingChecklist>> & {
    steps?: ChecklistStep[];
  } = {},
) {
  const steps = props.steps ?? STEPS_MIXED;
  const onStepClick = vi.fn();
  const result = render(
    <BookingChecklist steps={steps} onStepClick={onStepClick} {...props} />,
  );
  return { ...result, onStepClick };
}

// ─── deriveChecklistSummary ────────────────────────────────────────────────────

describe("deriveChecklistSummary", () => {
  it("returns zeros for an empty list", () => {
    expect(deriveChecklistSummary([])).toEqual({
      total: 0,
      done: 0,
      active: 0,
      blocked: 0,
      skipped: 0,
      pending: 0,
      progress: 0,
    });
  });

  it("counts each status bucket correctly", () => {
    const s = deriveChecklistSummary(STEPS_MIXED);
    expect(s.total).toBe(6);
    expect(s.done).toBe(2);
    expect(s.active).toBe(1);
    expect(s.blocked).toBe(1);
    expect(s.skipped).toBe(0);
    expect(s.pending).toBe(2);
  });

  it("progress = done / total (ignores skipped non-optional)", () => {
    const steps: ChecklistStep[] = [
      { id: "a", label: "A", status: "done" },
      { id: "b", label: "B", status: "skipped" }, // not optional → does NOT count
      { id: "c", label: "C", status: "pending" },
    ];
    const s = deriveChecklistSummary(steps);
    expect(s.progress).toBeCloseTo(1 / 3);
  });

  it("skipped optional steps count toward progress", () => {
    const s = deriveChecklistSummary(STEPS_WITH_SKIPPED);
    // done(1) + skipped-optional(1) = 2 out of 3
    expect(s.progress).toBeCloseTo(2 / 3);
  });

  it("progress is 1 when all steps are done", () => {
    expect(deriveChecklistSummary(STEPS_ALL_DONE).progress).toBe(1);
  });
});

// ─── Render basics ────────────────────────────────────────────────────────────

describe("BookingChecklist – render basics", () => {
  it("renders the default heading text", () => {
    setup();
    expect(
      screen.getByRole("heading", { name: "Booking checklist" }),
    ).toBeInTheDocument();
  });

  it("renders a custom title", () => {
    setup({ title: "Complete your booking" });
    expect(
      screen.getByRole("heading", { name: "Complete your booking" }),
    ).toBeInTheDocument();
  });

  it("renders an eyebrow when provided", () => {
    setup({ eyebrow: "Step tracker" });
    expect(screen.getByText("Step tracker")).toBeInTheDocument();
  });

  it("does not render eyebrow when omitted", () => {
    setup();
    expect(screen.queryByText("Step tracker")).not.toBeInTheDocument();
  });

  it("renders all step labels", () => {
    setup();
    for (const step of STEPS_MIXED) {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    }
  });

  it("renders step descriptions when provided", () => {
    setup();
    expect(screen.getByText("Waiting for funds")).toBeInTheDocument();
    expect(screen.getByText("Depends on escrow")).toBeInTheDocument();
  });

  it("marks optional steps with (optional) label", () => {
    setup();
    expect(screen.getByText("(optional)")).toBeInTheDocument();
  });

  it("renders a progress bar with correct aria-valuenow", () => {
    setup({ steps: STEPS_ALL_DONE });
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "100");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("shows done/total pill for partial progress", () => {
    setup();
    // 2 done out of 6 → "2/6"
    expect(screen.getByText("2/6")).toBeInTheDocument();
  });

  it("shows 3/3 pill when all steps are done", () => {
    setup({ steps: STEPS_ALL_DONE });
    expect(screen.getByText("3/3")).toBeInTheDocument();
  });

  it("renders the step list as a <ol> with role=list", () => {
    setup();
    const list = screen.getByRole("list");
    expect(list.tagName.toLowerCase()).toBe("ol");
  });

  it("renders each step as a listitem", () => {
    setup();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(STEPS_MIXED.length);
  });
});

// ─── Status labels and pills ──────────────────────────────────────────────────

describe("BookingChecklist – status pills", () => {
  const ALL_STATUSES: ChecklistStep[] = [
    { id: "1", label: "Done step", status: "done" },
    { id: "2", label: "Active step", status: "active" },
    { id: "3", label: "Blocked step", status: "blocked" },
    { id: "4", label: "Skipped step", status: "skipped" },
    { id: "5", label: "Pending step", status: "pending" },
  ];

  it("renders the correct aria-hidden status pill for each status", () => {
    render(<BookingChecklist steps={ALL_STATUSES} />);
    // Pills are aria-hidden but still in the DOM — query by visible text
    const pills = ["Done", "In progress", "Blocked", "Skipped", "Pending"];
    for (const label of pills) {
      // There may be multiple text nodes; just check at least one exists
      const all = screen.getAllByText(label);
      expect(all.length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ─── ARIA semantics ───────────────────────────────────────────────────────────

describe("BookingChecklist – ARIA semantics", () => {
  it("the section is labelled by the heading", () => {
    setup();
    const section = screen.getByRole("region", { name: "Booking checklist" });
    expect(section).toBeInTheDocument();
  });

  it("active step carries aria-current=step", () => {
    setup();
    // The active step row is a button (interactive) or div; search by aria-current
    const activeRow = document.querySelector("[aria-current='step']");
    expect(activeRow).not.toBeNull();
    expect(activeRow?.textContent).toContain("Escrow payment");
  });

  it("non-active steps do not carry aria-current", () => {
    setup();
    const allWithCurrent = document.querySelectorAll("[aria-current]");
    expect(allWithCurrent).toHaveLength(1);
  });

  it("each step row carries aria-labelledby referencing the step label", () => {
    setup();
    // Every step row (button or div) should have aria-labelledby
    const rows = document.querySelectorAll("[aria-labelledby]");
    // There are 6 steps + one section that also has aria-labelledby
    expect(rows.length).toBeGreaterThanOrEqual(STEPS_MIXED.length);
  });

  it("contains a polite live region", () => {
    setup();
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
  });

  it("the progress bar has an aria-label", () => {
    setup();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-label");
    expect(bar.getAttribute("aria-label")).toMatch(/booking completion/i);
  });
});

// ─── Mobile collapse / expand ─────────────────────────────────────────────────

describe("BookingChecklist – mobile collapse", () => {
  it("collapse button has aria-expanded=false by default", () => {
    setup(); // defaultCollapsed=true
    const toggle = screen.getByRole("button", { name: /expand booking checklist/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("collapse button has aria-expanded=true when defaultCollapsed=false", () => {
    setup({ defaultCollapsed: false });
    const toggle = screen.getByRole("button", { name: /collapse booking checklist/i });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("clicking the toggle flips aria-expanded", () => {
    setup();
    const toggle = screen.getByRole("button", { name: /expand booking checklist/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("toggle aria-controls points to the step list id", () => {
    setup();
    const toggle = screen.getByRole("button", { name: /expand booking checklist/i });
    const listId = toggle.getAttribute("aria-controls");
    expect(listId).toBeTruthy();
    const list = document.getElementById(listId!);
    expect(list?.tagName.toLowerCase()).toBe("ol");
  });
});

// ─── Interaction ──────────────────────────────────────────────────────────────

describe("BookingChecklist – interaction", () => {
  it("calls onStepClick with the step when an interactive row is clicked", () => {
    const { onStepClick } = setup({ defaultCollapsed: false });
    // The done step is interactive (has onStepClick)
    const doneRow = screen.getByRole("button", { name: /reserve slot/i });
    fireEvent.click(doneRow);
    expect(onStepClick).toHaveBeenCalledOnce();
    expect(onStepClick.mock.calls[0][0]).toMatchObject({ id: "reserve" });
  });

  it("pending step is not interactive (renders as div, not button)", () => {
    setup({ defaultCollapsed: false });
    // "Release escrow" is pending and non-optional → not interactive
    // It should NOT be a button
    const row = document.querySelector("[aria-labelledby*='release']");
    expect(row?.tagName.toLowerCase()).toBe("div");
  });

  it("does not render step buttons when onStepClick is omitted", () => {
    render(
      <BookingChecklist steps={STEPS_MIXED} defaultCollapsed={false} />,
    );
    // No step buttons should be present (only the mobile toggle button)
    const buttons = screen.getAllByRole("button");
    // The only button should be the mobile collapse toggle
    expect(buttons.length).toBe(1);
    expect(buttons[0]).toHaveAttribute("aria-expanded");
  });
});

// ─── Live announcements ───────────────────────────────────────────────────────

describe("BookingChecklist – live announcements", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("announces when a step status changes", async () => {
    const initialSteps: ChecklistStep[] = [
      { id: "a", label: "Step A", status: "active" },
      { id: "b", label: "Step B", status: "pending" },
    ];

    function Wrapper() {
      const [steps, setSteps] = useState(initialSteps);
      return (
        <>
          <BookingChecklist steps={steps} />
          <button
            onClick={() =>
              setSteps([
                { id: "a", label: "Step A", status: "done" },
                { id: "b", label: "Step B", status: "active" },
              ])
            }
          >
            Advance
          </button>
        </>
      );
    }

    render(<Wrapper />);
    fireEvent.click(screen.getByRole("button", { name: "Advance" }));

    await act(async () => {
      vi.runAllTimers();
    });

    await waitFor(() => {
      const announcer = screen.getByRole("status");
      expect(announcer.textContent).toContain("Step A: Done");
      expect(announcer.textContent).toContain("Step B: In progress");
    });
  });

  it("does not announce on the initial render", async () => {
    setup();
    await act(async () => {
      vi.runAllTimers();
    });
    const announcer = screen.getByRole("status");
    expect(announcer.textContent).toBe("");
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe("BookingChecklist – edge cases", () => {
  it("renders without error when steps list is empty", () => {
    setup({ steps: [] });
    expect(screen.getByRole("heading", { name: "Booking checklist" })).toBeInTheDocument();
    expect(screen.getByText("0/0")).toBeInTheDocument();
  });

  it("100% label renders when all steps are done", () => {
    setup({ steps: STEPS_ALL_DONE });
    expect(
      screen.getByText(/all steps complete/i),
    ).toBeInTheDocument();
  });

  it("partial progress renders percentage label", () => {
    // 2 done / 6 total = 33%
    setup();
    expect(screen.getByText(/33%\s+complete/i)).toBeInTheDocument();
  });

  it("withCard=false omits the card border/radius classes", () => {
    const { container } = setup({ withCard: false });
    const section = container.querySelector("section");
    expect(section?.className).not.toContain("rounded-[28px]");
  });

  it("withCard=true (default) applies card classes", () => {
    const { container } = setup({ withCard: true });
    const section = container.querySelector("section");
    expect(section?.className).toContain("rounded-[28px]");
  });

  it("single all-done step shows 1/1", () => {
    setup({ steps: [{ id: "x", label: "Only step", status: "done" }] });
    expect(screen.getByText("1/1")).toBeInTheDocument();
  });
});

// ─── Accessibility (axe) ──────────────────────────────────────────────────────

describe("BookingChecklist – accessibility", () => {
  it("has no axe violations with mixed steps (collapsed)", async () => {
    const { container } = setup();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no axe violations with the step list expanded", async () => {
    const { container } = setup({ defaultCollapsed: false });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no axe violations with all steps done", async () => {
    const { container } = setup({ steps: STEPS_ALL_DONE, defaultCollapsed: false });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no axe violations with no steps", async () => {
    const { container } = setup({ steps: [] });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no axe violations without onStepClick (presentational)", async () => {
    const { container } = render(
      <BookingChecklist steps={STEPS_MIXED} defaultCollapsed={false} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no axe violations when eyebrow is provided", async () => {
    const { container } = setup({ eyebrow: "Step tracker", defaultCollapsed: false });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
