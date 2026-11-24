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

  it("Test A: Clear cancels pending validation and leaves discount at 0", async () => {
    const onDiscountApplied = vi.fn();

    render(<PromoCodeEntry baseTotal={100} onDiscountApplied={onDiscountApplied} />);

    fireEvent.click(screen.getByRole("button", { name: /add promo code/i }));

    const input = screen.getByLabelText(/promo code/i);
    fireEvent.change(input, { target: { value: "SAVE20" } });
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));

    expect(screen.getByText(/checking promo code/i)).toBeInTheDocument();

    // Before 500ms timeout expires, click Clear
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));

    expect(onDiscountApplied).toHaveBeenLastCalledWith(
      expect.objectContaining({ code: "", percent: 0, discountedTotal: 100 }),
    );

    // Advance fake timers beyond validation delay
    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
    });

    // Ensure the last call represents cleared state and pending validation did not apply discount
    expect(onDiscountApplied).toHaveBeenLastCalledWith(
      expect.objectContaining({ percent: 0 }),
    );
    expect(onDiscountApplied).not.toHaveBeenCalledWith(
      expect.objectContaining({ code: "SAVE20", percent: 20 }),
    );
  });

  it("Test B: a second Apply supersedes the first", async () => {
    const onDiscountApplied = vi.fn();

    render(<PromoCodeEntry baseTotal={100} onDiscountApplied={onDiscountApplied} />);

    fireEvent.click(screen.getByRole("button", { name: /add promo code/i }));

    const input = screen.getByLabelText(/promo code/i);
    const applyButton = screen.getByRole("button", { name: /^apply$/i });

    // Apply the first promo code
    fireEvent.change(input, { target: { value: "SAVE20" } });
    fireEvent.click(applyButton);

    expect(screen.getByText(/checking promo code/i)).toBeInTheDocument();
    expect(applyButton).toBeDisabled();
    expect(applyButton).toHaveAttribute("aria-busy", "true");

    // Before pending validation completes, change input and apply a second code
    fireEvent.change(input, { target: { value: "EARLYBIRD" } });
    fireEvent.click(applyButton);

    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
    });

    // Assert that only the second operation produces an applied discount
    expect(onDiscountApplied).toHaveBeenCalledWith(
      expect.objectContaining({ code: "EARLYBIRD", percent: 15 }),
    );
    expect(onDiscountApplied).not.toHaveBeenCalledWith(
      expect.objectContaining({ code: "SAVE20", percent: 20 }),
    );
  });

  it("Test C: the success chip displays the applied code and does not misrepresent edited input", async () => {
    render(<PromoCodeEntry baseTotal={100} />);

    fireEvent.click(screen.getByRole("button", { name: /add promo code/i }));

    const input = screen.getByLabelText(/promo code/i);
    const applyButton = screen.getByRole("button", { name: /^apply$/i });

    fireEvent.change(input, { target: { value: "save20" } });
    fireEvent.click(applyButton);

    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
    });

    // Success chip displays applied code in uppercase
    expect(screen.getByText(/SAVE20 applied/i)).toBeInTheDocument();

    // Edit the input to a different code
    fireEvent.change(input, { target: { value: "OTHERCODE" } });

    // UI does not misrepresent old discount as belonging to newly typed code
    expect(screen.queryByText(/OTHERCODE applied/i)).not.toBeInTheDocument();
    // Displayed applied code remains correct
    expect(screen.getByText(/SAVE20 applied/i)).toBeInTheDocument();
  });

  it("Test D: closing cancels pending validation", async () => {
    const onDiscountApplied = vi.fn();

    render(<PromoCodeEntry baseTotal={100} onDiscountApplied={onDiscountApplied} />);

    const disclosureButton = screen.getByRole("button", { name: /add promo code/i });
    fireEvent.click(disclosureButton);

    const input = screen.getByLabelText(/promo code/i);
    fireEvent.change(input, { target: { value: "SAVE20" } });
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));

    expect(screen.getByText(/checking promo code/i)).toBeInTheDocument();

    // Close the panel before timeout expires
    fireEvent.click(disclosureButton);

    expect(onDiscountApplied).toHaveBeenLastCalledWith(
      expect.objectContaining({ percent: 0 }),
    );

    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
    });

    // Assert that cancelled validation does not subsequently apply discount
    expect(onDiscountApplied).not.toHaveBeenCalledWith(
      expect.objectContaining({ code: "SAVE20", percent: 20 }),
    );
  });

  it("Test E: unmounting cancels pending validation", async () => {
    const onDiscountApplied = vi.fn();

    const { unmount } = render(<PromoCodeEntry baseTotal={100} onDiscountApplied={onDiscountApplied} />);

    fireEvent.click(screen.getByRole("button", { name: /add promo code/i }));

    const input = screen.getByLabelText(/promo code/i);
    fireEvent.change(input, { target: { value: "SAVE20" } });
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));

    const applyButton = screen.getByRole("button", { name: /^apply$/i });
    expect(applyButton).toBeDisabled();
    expect(applyButton).toHaveAttribute("aria-busy", "true");

    // Unmount while loading
    unmount();

    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
    });

    expect(onDiscountApplied).not.toHaveBeenCalled();
  });

  it("Apply button correctly reflects loading state and does not get stuck in loading", async () => {
    render(<PromoCodeEntry baseTotal={100} />);

    const disclosureButton = screen.getByRole("button", { name: /add promo code/i });
    fireEvent.click(disclosureButton);

    const input = screen.getByLabelText(/promo code/i);
    const applyButton = screen.getByRole("button", { name: /^apply$/i });

    // Initial state: not disabled, aria-busy false
    expect(applyButton).not.toBeDisabled();
    expect(applyButton).toHaveAttribute("aria-busy", "false");

    // Start loading
    fireEvent.change(input, { target: { value: "SAVE20" } });
    fireEvent.click(applyButton);

    expect(applyButton).toBeDisabled();
    expect(applyButton).toHaveAttribute("aria-busy", "true");

    // Clear restores button from loading
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(applyButton).not.toBeDisabled();
    expect(applyButton).toHaveAttribute("aria-busy", "false");

    // Start loading again and verify completion restores button
    fireEvent.change(input, { target: { value: "SAVE20" } });
    fireEvent.click(applyButton);
    expect(applyButton).toBeDisabled();
    expect(applyButton).toHaveAttribute("aria-busy", "true");

    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
    });

    expect(applyButton).not.toBeDisabled();
    expect(applyButton).toHaveAttribute("aria-busy", "false");
  });
});
