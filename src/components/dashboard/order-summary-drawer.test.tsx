import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderSummaryDrawer } from "./order-summary-drawer";

describe("OrderSummaryDrawer", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 768px) and (max-width: 1279px)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia;
  });

  it("opens the editable drawer on tablet breakpoints", () => {
    render(
      <OrderSummaryDrawer title="Order summary" description="Review costs and confirm your booking.">
        <div>Summary content</div>
      </OrderSummaryDrawer>,
    );

    fireEvent.click(screen.getByRole("button", { name: /review order/i }));

    expect(screen.getByRole("dialog", { name: /order summary/i })).toBeInTheDocument();
    expect(screen.getByText("Summary content")).toBeInTheDocument();
  });

  it("closes the drawer on Escape and restores focus to the trigger", () => {
    render(
      <OrderSummaryDrawer title="Order summary" description="Review costs and confirm your booking.">
        <div>Summary content</div>
      </OrderSummaryDrawer>,
    );

    const trigger = screen.getByRole("button", { name: /review order/i });
    trigger.focus();
    fireEvent.click(trigger);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: /order summary/i })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
