/**
 * CancellationReasonPicker tests
 *
 * Coverage targets (95%+):
 *  - Default render with PanelShell chrome
 *  - Bare mode heading / description
 *  - Reason chips including Prefer not to say
 *  - Selection + aria-checked / roving tabIndex
 *  - Keyboard: ArrowRight/Left, Home/End
 *  - Free-text optional; hard clip at 240 chars
 *  - Submit disabled until selection; payload shape
 *  - Live announcement on select and submit
 *  - Custom reasons / submitLabel props
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CancellationReasonPicker,
  CANCELLATION_REASON_MAX_CHARS,
  DEFAULT_CANCELLATION_REASONS,
  type CancellationReasonSubmission,
} from "./cancellation-reason-picker";

function setup(
  props: Partial<React.ComponentProps<typeof CancellationReasonPicker>> = {},
) {
  const onSubmit = vi.fn();
  const result = render(
    <CancellationReasonPicker onSubmit={onSubmit} {...props} />,
  );
  return { ...result, onSubmit };
}

describe("CancellationReasonPicker", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("initial render", () => {
    it("renders the default title inside PanelShell", () => {
      setup();
      expect(
        screen.getByRole("heading", { name: "Why are you cancelling?" }),
      ).toBeInTheDocument();
    });

    it("renders all default reason chips including Prefer not to say", () => {
      setup();
      for (const reason of DEFAULT_CANCELLATION_REASONS) {
        expect(
          screen.getByRole("radio", { name: reason.label }),
        ).toBeInTheDocument();
      }
    });

    it("exposes a radiogroup labelled Cancellation reason", () => {
      setup();
      expect(
        screen.getByRole("radiogroup", { name: "Cancellation reason" }),
      ).toBeInTheDocument();
    });

    it("disables submit until a reason is selected", () => {
      setup();
      expect(
        screen.getByRole("button", { name: "Submit reason" }),
      ).toBeDisabled();
    });

    it("shows character counter at 0/240", () => {
      setup();
      expect(
        screen.getByText(`0/${CANCELLATION_REASON_MAX_CHARS}`),
      ).toBeInTheDocument();
    });
  });

  describe("bare mode", () => {
    it("renders title and description without relying on panel-only copy", () => {
      setup({
        bare: true,
        title: "Before you rebook",
        description: "Tell us what changed.",
      });
      expect(
        screen.getByRole("heading", { name: "Before you rebook" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Tell us what changed.")).toBeInTheDocument();
    });
  });

  describe("selection", () => {
    it("marks the chosen chip as aria-checked", () => {
      setup();
      const chip = screen.getByRole("radio", { name: "Schedule conflict" });
      fireEvent.click(chip);
      expect(chip).toHaveAttribute("aria-checked", "true");
      expect(
        screen.getByRole("radio", { name: "Prefer not to say" }),
      ).toHaveAttribute("aria-checked", "false");
    });

    it("enables submit after selection", () => {
      setup();
      fireEvent.click(screen.getByRole("radio", { name: "Prefer not to say" }));
      expect(
        screen.getByRole("button", { name: "Submit reason" }),
      ).not.toBeDisabled();
    });

    it("announces the selected reason", async () => {
      setup();
      fireEvent.click(screen.getByRole("radio", { name: "No longer needed" }));
      await act(async () => {
        vi.runAllTimers();
      });
      await waitFor(() => {
        expect(
          screen.getByRole("status").textContent,
        ).toContain("Selected reason: No longer needed");
      });
    });
  });

  describe("keyboard navigation", () => {
    it("moves selection with ArrowRight", () => {
      setup();
      const first = screen.getByRole("radio", { name: "Schedule conflict" });
      first.focus();
      fireEvent.keyDown(first, { key: "ArrowRight" });
      expect(
        screen.getByRole("radio", { name: "No longer needed" }),
      ).toHaveAttribute("aria-checked", "true");
    });

    it("moves selection with ArrowDown and ArrowUp", () => {
      setup();
      const first = screen.getByRole("radio", { name: "Schedule conflict" });
      first.focus();
      fireEvent.keyDown(first, { key: "ArrowDown" });
      expect(
        screen.getByRole("radio", { name: "No longer needed" }),
      ).toHaveAttribute("aria-checked", "true");

      const second = screen.getByRole("radio", { name: "No longer needed" });
      fireEvent.keyDown(second, { key: "ArrowUp" });
      expect(
        screen.getByRole("radio", { name: "Schedule conflict" }),
      ).toHaveAttribute("aria-checked", "true");
    });

    it("moves selection with ArrowLeft wrapping to the end", () => {
      setup();
      const first = screen.getByRole("radio", { name: "Schedule conflict" });
      fireEvent.click(first);
      fireEvent.keyDown(first, { key: "ArrowLeft" });
      expect(
        screen.getByRole("radio", { name: "Other" }),
      ).toHaveAttribute("aria-checked", "true");
    });

    it("jumps to Home and End", () => {
      setup();
      const mid = screen.getByRole("radio", { name: "Found another option" });
      fireEvent.click(mid);
      fireEvent.keyDown(mid, { key: "Home" });
      expect(
        screen.getByRole("radio", { name: "Schedule conflict" }),
      ).toHaveAttribute("aria-checked", "true");

      const first = screen.getByRole("radio", { name: "Schedule conflict" });
      fireEvent.keyDown(first, { key: "End" });
      expect(
        screen.getByRole("radio", { name: "Other" }),
      ).toHaveAttribute("aria-checked", "true");
    });

    it("ignores unrelated keys", () => {
      setup();
      const first = screen.getByRole("radio", { name: "Schedule conflict" });
      fireEvent.click(first);
      fireEvent.keyDown(first, { key: "a" });
      expect(first).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("free-text field", () => {
    it("accepts optional details under the limit", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      setup();
      const field = screen.getByLabelText(/Additional details/i);
      await user.type(field, "Session time no longer works.");
      expect(field).toHaveValue("Session time no longer works.");
      expect(screen.getByText(/\/240$/)).toHaveTextContent(
        `${"Session time no longer works.".length}/240`,
      );
    });

    it("clips input at 240 characters", () => {
      setup();
      const field = screen.getByLabelText(/Additional details/i);
      const oversized = "x".repeat(CANCELLATION_REASON_MAX_CHARS + 40);
      fireEvent.change(field, { target: { value: oversized } });
      expect((field as HTMLTextAreaElement).value).toHaveLength(
        CANCELLATION_REASON_MAX_CHARS,
      );
      expect(
        screen.getByText(
          `${CANCELLATION_REASON_MAX_CHARS}/${CANCELLATION_REASON_MAX_CHARS}`,
        ),
      ).toBeInTheDocument();
    });
  });

  describe("submission", () => {
    it("does not call onSubmit when nothing is selected", () => {
      const { onSubmit } = setup();
      const form = screen.getByRole("button", { name: "Submit reason" })
        .closest("form");
      expect(form).toBeTruthy();
      fireEvent.submit(form!);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("submits reason id, label, and trimmed details", async () => {
      const { onSubmit } = setup({ submitLabel: "Confirm cancel" });
      fireEvent.click(screen.getByRole("radio", { name: "Other" }));
      fireEvent.change(screen.getByLabelText(/Additional details/i), {
        target: { value: "  custom note  " },
      });
      fireEvent.click(screen.getByRole("button", { name: "Confirm cancel" }));

      expect(onSubmit).toHaveBeenCalledTimes(1);
      const payload = onSubmit.mock
        .calls[0][0] as CancellationReasonSubmission;
      expect(payload).toEqual({
        reasonId: "other",
        reasonLabel: "Other",
        details: "custom note",
      });

      await act(async () => {
        vi.runAllTimers();
      });
      await waitFor(() => {
        expect(screen.getByRole("status").textContent).toMatch(
          /Reason submitted: Other/,
        );
      });
      expect(
        screen.getByRole("button", { name: "Reason submitted" }),
      ).toBeInTheDocument();
    });

    it("announces submission without details when empty", async () => {
      const { onSubmit } = setup();
      fireEvent.click(
        screen.getByRole("radio", { name: "Prefer not to say" }),
      );
      fireEvent.click(screen.getByRole("button", { name: "Submit reason" }));
      expect(onSubmit).toHaveBeenCalledWith({
        reasonId: "prefer_not_to_say",
        reasonLabel: "Prefer not to say",
        details: "",
      });
      await act(async () => {
        vi.runAllTimers();
      });
      await waitFor(() => {
        expect(screen.getByRole("status").textContent).toBe(
          "Reason submitted: Prefer not to say. Thank you for your feedback.",
        );
      });
    });
  });

  describe("customization", () => {
    it("renders a custom reason list", () => {
      setup({
        reasons: [
          { id: "prefer_not_to_say", label: "Prefer not to say" },
          { id: "other", label: "Something else" },
        ],
      });
      expect(
        screen.getByRole("radio", { name: "Something else" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("radio", { name: "Schedule conflict" }),
      ).not.toBeInTheDocument();
    });
  });
});
