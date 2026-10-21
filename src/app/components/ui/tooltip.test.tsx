import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip } from "@/app/components/ui/tooltip";

describe("Tooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => cb(performance.now()));
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe("Rendering", () => {
    it("renders the trigger button with the default aria-label", () => {
      render(<Tooltip content="Helpful info" />);
      const trigger = screen.getByLabelText("Help information");
      expect(trigger).toBeInTheDocument();
      expect(trigger.tagName).toBe("BUTTON");
      // Tooltip content should not be in the document initially
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("renders with a custom aria-label", () => {
      render(<Tooltip content="Helpful info" ariaLabel="Custom label" />);
      expect(screen.getByLabelText("Custom label")).toBeInTheDocument();
    });

    it("renders a custom trigger", () => {
      render(
        <Tooltip content="Info" trigger={<span data-testid="custom-trigger">Trigger</span>} />
      );
      expect(screen.getByTestId("custom-trigger")).toBeInTheDocument();
    });
  });

  describe("Interactivity & State Transitions", () => {
    it("shows the tooltip on focus and hides on blur", async () => {
      render(<Tooltip content="Tooltip content" />);
      const trigger = screen.getByLabelText("Help information");
      
      fireEvent.focus(trigger);
      expect(screen.getByRole("tooltip")).toHaveTextContent("Tooltip content");
      
      fireEvent.blur(trigger);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("shows the tooltip on mouse enter and hides on mouse leave", async () => {
      render(<Tooltip content="Tooltip content" interactive={false} />);
      const trigger = screen.getByLabelText("Help information");

      fireEvent.mouseEnter(trigger);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      fireEvent.mouseLeave(trigger);
      // Because interactive=false, delay is 0, so it hides immediately
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("shows the tooltip on click and toggles off on second click", async () => {
      const user = userEvent.setup({ delay: null });
      render(<Tooltip content="Tooltip content" />);
      const trigger = screen.getByLabelText("Help information");

      await user.click(trigger);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      await user.click(trigger);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("hides the tooltip on Escape key press from the trigger", async () => {
      render(<Tooltip content="Tooltip content" />);
      const trigger = screen.getByLabelText("Help information");

      fireEvent.focus(trigger);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      fireEvent.keyDown(trigger, { key: "Escape" });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("shows the tooltip on Enter key press", () => {
      render(<Tooltip content="Tooltip content" />);
      const trigger = screen.getByLabelText("Help information");

      fireEvent.keyDown(trigger, { key: "Enter" });
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    it("hides the tooltip when clicking outside", async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <div>
          <button>Outside</button>
          <Tooltip content="Tooltip content" />
        </div>
      );
      const trigger = screen.getByLabelText("Help information");

      await user.click(trigger);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      await user.click(screen.getByText("Outside"));
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  describe("Interactive Mode", () => {
    it("keeps tooltip open when moving mouse to tooltip surface if interactive", async () => {
      render(<Tooltip content="Tooltip content" interactive={true} />);
      const trigger = screen.getByLabelText("Help information");

      fireEvent.mouseEnter(trigger);
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toBeInTheDocument();

      fireEvent.mouseLeave(trigger);
      
      // Before hide timeout completes, mouse enters tooltip
      fireEvent.mouseEnter(tooltip);
      act(() => {
        vi.advanceTimersByTime(200); // Exceeds the 150ms timeout
      });
      // Should still be visible
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      // Now mouse leaves tooltip
      fireEvent.mouseLeave(tooltip);
      act(() => {
        vi.advanceTimersByTime(200); // Exceeds the 100ms timeout
      });
      // Should be hidden
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });
});
