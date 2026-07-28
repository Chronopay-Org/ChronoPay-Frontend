import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PromoCodeEntry } from "./promo-code-entry";

describe("PromoCodeEntry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("expands the disclosure and applies a valid promo code", async () => {
    const onDiscountApplied = vi.fn();

    render(<PromoCodeEntry baseTotal={100} onDiscountApplied={onDiscountApplied} />);

    fireEvent.click(screen.getByRole("button", { name: /add promo code/i }));

    const input = screen.getByLabelText(/promo code/i);
    fireEvent.change(input, { target: { value: "save20" } });
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));

    expect(screen.getByText(/checking promo code/i)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
    });

    expect(screen.getByText(/20% off your booking applied/i)).toBeInTheDocument();

    expect(onDiscountApplied).toHaveBeenCalledWith(
      expect.objectContaining({ code: "SAVE20", percent: 20 }),
    );
  });

  it("shows an expired-state message for expired promo codes", async () => {
    render(<PromoCodeEntry baseTotal={100} />);

    fireEvent.click(screen.getByRole("button", { name: /add promo code/i }));
    fireEvent.change(screen.getByLabelText(/promo code/i), { target: { value: "expired25" } });
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));

    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
    });

    expect(screen.getByText(/promo code not found/i)).toBeInTheDocument();
  });
});
