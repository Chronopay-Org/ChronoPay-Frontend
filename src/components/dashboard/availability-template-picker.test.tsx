/**
 * AvailabilityTemplatePicker tests
 *
 * Coverage targets (95%+):
 *  - Default render with PanelShell & built-in templates
 *  - Bare mode heading / layout
 *  - Template cards radiogroup & roving tabIndex / keyboard navigation
 *  - Scope selection (current_week, next_week, current_month)
 *  - Save custom template modal & form submission
 *  - Diff preview modal rendering & metrics calculation
 *  - Conflict detection for booked slots
 *  - Overwrite confirmation modal & template application execution
 *  - Undo last application banner & callback
 *  - Live screen reader announcements
 */

import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AvailabilityTemplatePicker,
  DEFAULT_AVAILABILITY_TEMPLATES,
  type AvailabilityTemplate,
} from "./availability-template-picker";
import type { Slot } from "./types";

const mockExistingSlots: Slot[] = [
  {
    id: "slot-1",
    title: "1-on-1 Architecture Consultation",
    dateLabel: "Today",
    timeRange: "14:00 - 15:00 UTC",
    status: "Healthy",
    demand: "High",
    rate: "50 XLM / hr",
  },
  {
    id: "slot-2",
    title: "Code Review",
    dateLabel: "Tomorrow",
    timeRange: "10:00 - 11:30 UTC",
    status: "Busy", // Represents booked/conflict
    demand: "Medium",
    rate: "75 XLM / hr",
  },
];

describe("AvailabilityTemplatePicker", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("initial render", () => {
    it("renders default title, description and built-in templates", () => {
      render(<AvailabilityTemplatePicker />);
      expect(screen.getByRole("heading", { name: /Availability Template Picker/i })).toBeInTheDocument();
      expect(screen.getByText(/Apply preset or saved availability templates/i)).toBeInTheDocument();

      for (const tpl of DEFAULT_AVAILABILITY_TEMPLATES) {
        expect(screen.getByText(tpl.name)).toBeInTheDocument();
      }
    });

    it("renders scope selector radiogroup", () => {
      render(<AvailabilityTemplatePicker />);
      expect(screen.getByRole("radiogroup", { name: /Apply Scope \/ Horizon/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Current Week" })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Next Week" })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Selected Month" })).toBeInTheDocument();
    });

    it("renders template list radiogroup", () => {
      render(<AvailabilityTemplatePicker />);
      expect(screen.getByRole("radiogroup", { name: /Select Availability Template/i })).toBeInTheDocument();
      expect(screen.getAllByRole("radio").length).toBeGreaterThan(4);
    });
  });

  describe("bare mode", () => {
    it("renders without relying on PanelShell chrome when bare is true", () => {
      render(<AvailabilityTemplatePicker bare title="Custom Embedded Title" />);
      expect(screen.getByRole("heading", { name: "Custom Embedded Title" })).toBeInTheDocument();
    });
  });

  describe("template selection & keyboard navigation", () => {
    it("selects a template when clicked and announces selection", async () => {
      render(<AvailabilityTemplatePicker />);
      const weekendRadio = screen.getByRole("radio", { name: /Weekend Special/i });
      fireEvent.click(weekendRadio);
      expect(weekendRadio).toHaveAttribute("aria-checked", "true");

      await act(async () => {
        vi.runAllTimers();
      });
      await waitFor(() => {
        expect(screen.getByRole("status").textContent).toContain("Selected template: Weekend Special");
      });
    });

    it("navigates template cards with ArrowRight, ArrowLeft, Home, End keys", () => {
      render(<AvailabilityTemplatePicker />);
      const firstRadio = screen.getByRole("radio", { name: /Standard Weekdays/i });
      firstRadio.focus();

      fireEvent.keyDown(firstRadio, { key: "ArrowRight" });
      expect(screen.getByRole("radio", { name: /Weekend Special/i })).toHaveAttribute("aria-checked", "true");

      const weekendRadio = screen.getByRole("radio", { name: /Weekend Special/i });
      fireEvent.keyDown(weekendRadio, { key: "ArrowDown" });
      expect(screen.getByRole("radio", { name: /7-Day High Availability/i })).toHaveAttribute("aria-checked", "true");

      const fullweekRadio = screen.getByRole("radio", { name: /7-Day High Availability/i });
      fireEvent.keyDown(fullweekRadio, { key: "Home" });
      expect(screen.getByRole("radio", { name: /Standard Weekdays/i })).toHaveAttribute("aria-checked", "true");

      fireEvent.keyDown(firstRadio, { key: "End" });
      expect(screen.getByRole("radio", { name: /Early Morning Focus/i })).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("scope selection", () => {
    it("updates selected scope on click and announces change", async () => {
      render(<AvailabilityTemplatePicker />);
      const nextWeekRadio = screen.getByRole("radio", { name: "Next Week" });
      fireEvent.click(nextWeekRadio);
      expect(nextWeekRadio).toHaveAttribute("aria-checked", "true");

      await act(async () => {
        vi.runAllTimers();
      });
      await waitFor(() => {
        expect(screen.getByRole("status").textContent).toContain("Scope changed to Next Week");
      });
    });
  });

  describe("direct apply (no existing slots)", () => {
    it("directly applies template when no existing slots present", async () => {
      const onApplyTemplate = vi.fn();
      render(<AvailabilityTemplatePicker onApplyTemplate={onApplyTemplate} />);

      const applyBtn = screen.getByRole("button", { name: /Apply Standard Weekdays/i });
      fireEvent.click(applyBtn);

      expect(onApplyTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ id: "tpl-weekdays", name: "Standard Weekdays" }),
        "current_week"
      );

      // Verify Undo banner is shown
      expect(screen.getByText(/Applied Standard Weekdays to current week/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Undo/i })).toBeInTheDocument();
    });

    it("triggers undo callback when undo button clicked", () => {
      const onUndoLastApply = vi.fn();
      render(<AvailabilityTemplatePicker onUndoLastApply={onUndoLastApply} />);

      fireEvent.click(screen.getByRole("button", { name: /Apply Standard Weekdays/i }));
      const undoBtn = screen.getByRole("button", { name: /Undo/i });
      fireEvent.click(undoBtn);

      expect(onUndoLastApply).toHaveBeenCalled();
      expect(screen.queryByText(/Applied Standard Weekdays/i)).not.toBeInTheDocument();
    });
  });

  describe("diff preview modal & overwrite confirmation flow", () => {
    it("opens diff modal when existing slots are present", () => {
      render(<AvailabilityTemplatePicker existingSlots={mockExistingSlots} />);

      fireEvent.click(screen.getByRole("button", { name: /Apply Standard Weekdays/i }));

      expect(screen.getByRole("dialog", { name: /Template Application Preview/i })).toBeInTheDocument();
      expect(screen.getByText(/Booked Slot Conflict\(s\) Detected/i)).toBeInTheDocument();
    });

    it("allows canceling out of diff modal", () => {
      render(<AvailabilityTemplatePicker existingSlots={mockExistingSlots} />);

      fireEvent.click(screen.getByRole("button", { name: /Apply Standard Weekdays/i }));
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("proceeds to overwrite confirmation modal when overwrite is required", () => {
      render(<AvailabilityTemplatePicker existingSlots={mockExistingSlots} />);

      fireEvent.click(screen.getByRole("button", { name: /Apply Standard Weekdays/i }));
      fireEvent.click(screen.getByRole("button", { name: "Proceed to Apply" }));

      expect(screen.getByRole("dialog", { name: /Confirm Overwriting Existing Slots\?/i })).toBeInTheDocument();
    });

    it("executes template apply after confirming overwrite", () => {
      const onApplyTemplate = vi.fn();
      render(
        <AvailabilityTemplatePicker
          existingSlots={mockExistingSlots}
          onApplyTemplate={onApplyTemplate}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /Apply Standard Weekdays/i }));
      fireEvent.click(screen.getByRole("button", { name: "Proceed to Apply" }));
      fireEvent.click(screen.getByRole("button", { name: "Confirm Overwrite & Apply" }));

      expect(onApplyTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ id: "tpl-weekdays" }),
        "current_week"
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("save custom template modal", () => {
    it("opens save custom modal and handles form submit", async () => {
      const onSaveCurrentAsTemplate = vi.fn();
      render(<AvailabilityTemplatePicker onSaveCurrentAsTemplate={onSaveCurrentAsTemplate} />);

      // Open save modal
      fireEvent.click(screen.getByRole("button", { name: /Save Current as Template/i }));
      expect(screen.getByRole("dialog", { name: /Save Custom Availability Template/i })).toBeInTheDocument();

      // Submit button is disabled when empty
      const submitBtn = screen.getByRole("button", { name: "Save Template" });
      expect(submitBtn).toBeDisabled();

      // Fill form
      fireEvent.change(screen.getByLabelText(/Template Name/i), {
        target: { value: "Evening Consult Blocks" },
      });
      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { value: "After hours availability 6pm-9pm" },
      });

      expect(submitBtn).not.toBeDisabled();
      fireEvent.click(submitBtn);

      expect(onSaveCurrentAsTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Evening Consult Blocks",
          description: "After hours availability 6pm-9pm",
          category: "custom",
          isCustom: true,
        })
      );

      // Verify custom template card now exists and is selected
      expect(screen.getByRole("radio", { name: /Evening Consult Blocks/i })).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
