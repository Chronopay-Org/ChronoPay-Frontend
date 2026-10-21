import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AsyncButton, AsyncButtonLabels } from "./async-button";

const defaultLabels: AsyncButtonLabels = {
  idle: "Submit",
  pending: "Submitting...",
  confirmed: "Done",
  error: "Failed",
};

describe("AsyncButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("Initial state and rendering", () => {
    it("renders in the idle state with correct label and attributes", () => {
      render(
        <AsyncButton onAction={async () => {}} labels={defaultLabels} />
      );
      
      const button = screen.getByRole("button", { name: "Submit" });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "false");
      expect(button).toHaveAttribute("aria-disabled", "false");
    });

    it("applies variant and size classes correctly", () => {
      render(
        <AsyncButton
          onAction={async () => {}}
          labels={defaultLabels}
          variant="primary"
          size="lg"
        />
      );
      const button = screen.getByRole("button", { name: "Submit" });
      expect(button.className).toContain("bg-cyan-300"); // primary
      expect(button.className).toContain("px-6"); // lg size
    });
  });

  describe("Success flow (idle -> pending -> confirmed -> idle)", () => {
    it("transitions through the states and resets after confirmedDuration", async () => {
      let resolveAction: () => void;
      const actionPromise = new Promise<void>((resolve) => {
        resolveAction = resolve;
      });
      const onAction = vi.fn().mockReturnValue(actionPromise);

      render(
        <AsyncButton onAction={onAction} labels={defaultLabels} confirmedDuration={1000} />
      );

      const button = screen.getByRole("button", { name: "Submit" });
      
      // Trigger action
      fireEvent.click(button);

      // Should be in pending state
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Submitting...")).toBeInTheDocument();
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");
      expect(button).toHaveAttribute("aria-disabled", "true");

      // Resolve action
      await act(async () => {
        resolveAction();
      });

      // Should be in confirmed state
      expect(screen.getByText("Done")).toBeInTheDocument();
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "false");

      // Advance timers by confirmedDuration (1000ms)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should return to idle
      expect(screen.getByText("Submit")).toBeInTheDocument();
    });
  });

  describe("Error flow (idle -> pending -> error)", () => {
    it("transitions to error state when onAction throws and calls onError", async () => {
      const error = new Error("Test error");
      const onAction = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();

      render(
        <AsyncButton onAction={onAction} labels={defaultLabels} onError={onError} />
      );

      const button = screen.getByRole("button", { name: "Submit" });
      
      // Trigger action
      fireEvent.click(button);

      // Should be in pending state initially
      expect(screen.getByText("Submitting...")).toBeInTheDocument();

      // Wait for the rejection to process
      await waitFor(() => {
        expect(screen.getByText("Failed")).toBeInTheDocument();
      });

      // Should be in error state
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "false");
      expect(onError).toHaveBeenCalledWith(error);
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe("Concurrency and double-submits", () => {
    it("prevents multiple onAction calls while pending", async () => {
      let resolveAction: () => void;
      const actionPromise = new Promise<void>((resolve) => {
        resolveAction = resolve;
      });
      const onAction = vi.fn().mockReturnValue(actionPromise);

      render(
        <AsyncButton onAction={onAction} labels={defaultLabels} />
      );

      const button = screen.getByRole("button", { name: "Submit" });
      
      // Click multiple times
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Should only trigger once
      expect(onAction).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveAction();
      });
    });
  });

  describe("Accessibility", () => {
    it("manages aria-describedby with statusId and optional describedBy prop", () => {
      render(
        <AsyncButton
          onAction={async () => {}}
          labels={defaultLabels}
          describedBy="custom-hint"
        />
      );

      const button = screen.getByRole("button", { name: "Submit" });
      const describedBy = button.getAttribute("aria-describedby");
      
      // Should include custom-hint and an auto-generated id
      expect(describedBy).toContain("custom-hint");
      
      // Check the live region
      const liveRegion = document.getElementById(describedBy?.split(" ")[1] || "");
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
    });
  });
});
