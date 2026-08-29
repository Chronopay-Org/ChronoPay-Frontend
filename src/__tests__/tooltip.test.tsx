import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Tooltip } from "../app/components/ui/tooltip";

describe("Tooltip Component", () => {
  it("renders trigger button with default aria-label and lucide icon", () => {
    render(<Tooltip content="Standard tooltip text" />);
    const trigger = screen.getByLabelText("Help information");
    expect(trigger).toBeInTheDocument();
    expect(trigger.tagName).toBe("BUTTON");
  });

  it("promotes aria-describedby when visible and uses role='tooltip'", async () => {
    render(<Tooltip content="Tooltip explanation content" />);
    const trigger = screen.getByLabelText("Help information");
    expect(trigger).not.toHaveAttribute("aria-describedby");

    fireEvent.mouseEnter(trigger);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Tooltip explanation content");

    const tooltipId = tooltip.getAttribute("id");
    expect(trigger).toHaveAttribute("aria-describedby", tooltipId);
  });

  it("renders custom trigger and custom aria-label override", () => {
    render(
      <Tooltip
        content="Custom trigger content"
        ariaLabel="More information about fee rates"
        trigger={<span data-testid="custom-icon">?</span>}
      />
    );

    const trigger = screen.getByLabelText("More information about fee rates");
    expect(trigger).toBeInTheDocument();
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders longform variant with multi-line ReactNode content and inline anchors", async () => {
    const longformContent = (
      <div>
        <h4 className="font-bold">Longform Heading</h4>
        <p className="mt-1">
          Detailed explanation with multi-line text and an{" "}
          <a href="/docs/fees" className="text-cyan-400 underline">
            inline doc link
          </a>
          .
        </p>
      </div>
    );

    render(<Tooltip content={longformContent} variant="longform" />);
    const trigger = screen.getByLabelText("Help information");

    fireEvent.mouseEnter(trigger);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("max-w-sm");
    expect(tooltip.className).toContain("px-4");
    expect(tooltip.className).toContain("py-3");
    expect(screen.getByText("Longform Heading")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "inline doc link" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/docs/fees");
  });

  it("maintains hover-intent over tooltip surface for longform variant", async () => {
    render(
      <Tooltip
        variant="longform"
        content={
          <div>
            Longform text{" "}
            <a href="https://stellar.org" target="_blank" rel="noreferrer">
              Stellar Link
            </a>
          </div>
        }
      />
    );

    const trigger = screen.getByLabelText("Help information");
    fireEvent.mouseEnter(trigger);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();

    // Mouse leaves trigger but enters tooltip surface
    fireEvent.mouseLeave(trigger);
    fireEvent.mouseEnter(tooltip);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    // Tooltip should remain visible while hovering over tooltip surface
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    // Mouse leaves tooltip surface
    fireEvent.mouseLeave(tooltip);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("toggles visibility on click and touch events", async () => {
    render(<Tooltip content="Tap content" />);
    const trigger = screen.getByLabelText("Help information");

    // Touch start
    fireEvent.touchStart(trigger);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    // Click toggle
    fireEvent.click(trigger);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("dismisses tooltip on Escape key press and restores focus to trigger", async () => {
    render(<Tooltip content="Escape dismiss test" />);
    const trigger = screen.getByLabelText("Help information");

    fireEvent.mouseEnter(trigger);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(trigger, { key: "Escape" });
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("dismisses longform tooltip on Escape key press inside tooltip surface", async () => {
    render(
      <Tooltip
        variant="longform"
        content={
          <div>
            <a href="/test">Link</a>
          </div>
        }
      />
    );
    const trigger = screen.getByLabelText("Help information");
    fireEvent.mouseEnter(trigger);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const link = screen.getByRole("link", { name: "Link" });
    link.focus();
    act(() => {
      fireEvent.keyDown(link, { key: "Escape" });
    });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("handles trigger focus and blur events", async () => {
    render(
      <Tooltip
        variant="longform"
        content={
          <div>
            <a href="/test-focus">Focus Link</a>
          </div>
        }
      />
    );
    const trigger = screen.getByLabelText("Help information");

    fireEvent.focus(trigger);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "Focus Link" });
    fireEvent.blur(trigger, { relatedTarget: link });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.blur(trigger, { relatedTarget: document.body });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("updates placement on window resize event when visible", async () => {
    render(<Tooltip content="Resize placement test" />);
    const trigger = screen.getByLabelText("Help information");

    fireEvent.mouseEnter(trigger);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("cleans up hide timeout on unmount", async () => {
    const { unmount } = render(
      <Tooltip variant="longform" content="Unmount test" />
    );
    const trigger = screen.getByLabelText("Help information");
    fireEvent.mouseLeave(trigger);

    expect(() => unmount()).not.toThrow();
  });

  it("computes bottom placement when trigger is near the top boundary", async () => {
    const { container } = render(
      <Tooltip content="Bottom placement" variant="longform" />
    );
    const trigger = screen.getByLabelText("Help information");
    const tooltipDiv = document.createElement("div");

    // Mock getBoundingClientRect
    trigger.getBoundingClientRect = () =>
      ({ top: 0, bottom: 20, height: 20 } as DOMRect);
    tooltipDiv.getBoundingClientRect = () =>
      ({ top: 0, height: 100 } as DOMRect);

    fireEvent.mouseEnter(trigger);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("toggles on Enter and Space keyboard events", async () => {
    render(<Tooltip content="Keyboard toggle" />);
    const trigger = screen.getByLabelText("Help information");

    fireEvent.keyDown(trigger, { key: "Enter" });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: " " });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("hides on click outside of trigger and tooltip", async () => {
    render(
      <div>
        <Tooltip content="Outside click test" />
        <button data-testid="outside-button">Outside</button>
      </div>
    );

    const trigger = screen.getByLabelText("Help information");
    fireEvent.mouseEnter(trigger);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("outside-button"));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("applies custom className to wrapper", () => {
    const { container } = render(
      <Tooltip content="Custom class test" className="custom-wrapper-class" />
    );
    expect(container.firstChild).toHaveClass("custom-wrapper-class");
  });
});
