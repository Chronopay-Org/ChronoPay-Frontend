import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PricingCalculator } from "./pricing-calculator";
import type { FeeBreakdown } from "./pricing-calculator";

describe("PricingCalculator", () => {
  it("renders with default values", () => {
    render(<PricingCalculator />);

    expect(screen.getByText("Fee Calculator")).toBeInTheDocument();
    expect(
      screen.getByText("Estimate your take-home after fees"),
    ).toBeInTheDocument();

    // Check sliders exist
    const priceSlider = screen.getByLabelText(/Hourly rate/i);
    const durationSlider = screen.getByLabelText(/Session duration/i);
    const volumeSlider = screen.getByLabelText(/Monthly volume/i);

    expect(priceSlider).toBeInTheDocument();
    expect(durationSlider).toBeInTheDocument();
    expect(volumeSlider).toBeInTheDocument();

    expect(priceSlider).toHaveValue("50");
    expect(durationSlider).toHaveValue("60");
    expect(volumeSlider).toHaveValue("20");
  });

  it("accepts custom initial values", () => {
    render(
      <PricingCalculator
        initialPrice={100}
        initialDuration={30}
        initialVolume={10}
      />,
    );

    expect(screen.getByLabelText(/Hourly rate/i)).toHaveValue("100");
    expect(screen.getByLabelText(/Session duration/i)).toHaveValue("30");
    expect(screen.getByLabelText(/Monthly volume/i)).toHaveValue("10");
  });

  it("computes correct breakdown for default inputs", () => {
    // hourlyRate=50, duration=60min => sessionPrice = 50 * (60/60) = 50.00
    // platformFee = 50 * 0.05 = 2.50
    // networkFee = 0.01
    // perSessionTakeHome = 50 - 2.50 - 0.01 = 47.49
    // monthlyTakeHome = 47.49 * 20 = 949.80
    render(<PricingCalculator />);

    expect(screen.getByText("50.00 XLM")).toBeTruthy(); // session price
    expect(screen.getByText("−2.50 XLM")).toBeTruthy(); // platform fee
    expect(screen.getByText("−0.01 XLM")).toBeTruthy(); // network fee
    expect(screen.getByText("47.49 XLM")).toBeTruthy(); // per-session take-home
    expect(screen.getByText("949.80 XLM")).toBeTruthy(); // monthly take-home
  });

  it("duration affects session price correctly", () => {
    // hourlyRate=100, duration=30min => sessionPrice = 100 * (30/60) = 50.00
    // platformFee = 50 * 0.05 = 2.50
    // perSessionTakeHome = 50 - 2.50 - 0.01 = 47.49
    render(
      <PricingCalculator initialPrice={100} initialDuration={30} />,
    );

    expect(screen.getByText("50.00 XLM")).toBeTruthy(); // session price
  });

  it("handles zero price gracefully", () => {
    render(<PricingCalculator initialPrice={0} />);

    // All fees and take-home should be zero
    const outputs = screen.getAllByText("0.00 XLM");
    expect(outputs.length).toBeGreaterThanOrEqual(3);
  });

  it("handles maximum values without overflow", () => {
    render(<PricingCalculator initialPrice={500} initialVolume={200} />);

    // Should render without crashing - just check component is rendered
    expect(screen.getByText("Fee Calculator")).toBeInTheDocument();
  });

  it("calls onRecalculate callback with breakdown", () => {
    const onRecalculate = vi.fn();
    render(<PricingCalculator onRecalculate={onRecalculate} />);

    // Should have been called at least once on mount
    expect(onRecalculate).toHaveBeenCalled();

    const call = onRecalculate.mock.lastCall?.[0] as FeeBreakdown;
    expect(call).toBeDefined();
    expect(call.platformRate).toBe(0.05);
    expect(typeof call.perSessionTakeHome).toBe("number");
    expect(typeof call.monthlyTakeHome).toBe("number");
  });

  it("uses custom platform rate and network fee", () => {
    render(
      <PricingCalculator
        initialPrice={100}
        platformRate={0.1} // 10%
        networkFeePerTx={0.05}
      />,
    );

    // sessionPrice = 100 * (60/60) = 100
    // platformFee = 100 * 0.10 = 10.00
    expect(screen.getByText("−10.00 XLM")).toBeTruthy();
    // networkFee = 0.05
    expect(screen.getByText("−0.05 XLM")).toBeTruthy();
  });

  it("updates values when slider changes", () => {
    render(<PricingCalculator initialPrice={50} />);

    const priceSlider = screen.getByLabelText(
      /Hourly rate/i,
    ) as HTMLInputElement;

    fireEvent.change(priceSlider, { target: { value: "100" } });
    expect(priceSlider).toHaveValue("100");
  });

  it("is accessible with proper ARIA attributes", () => {
    const { container } = render(<PricingCalculator />);

    // Card has aria-labelledby
    const article = container.querySelector("article");
    expect(article).toBeTruthy();
    expect(article?.getAttribute("aria-labelledby")).toBeTruthy();

    // Sliders have proper labels and ARIA
    const sliders = screen.getAllByRole("slider");
    expect(sliders).toHaveLength(3);

    for (const slider of sliders) {
      expect(slider.getAttribute("aria-valuetext")).toBeTruthy();
      expect(slider.getAttribute("min")).toBeTruthy();
      expect(slider.getAttribute("max")).toBeTruthy();
      expect(slider.getAttribute("step")).toBeTruthy();
    }
  });

  it("handles single session volume", () => {
    render(<PricingCalculator initialVolume={1} />);

    expect(screen.getByText(/1 session × 50.00 XLM/)).toBeTruthy();
  });

  it("shows plural sessions text for volume > 1", () => {
    render(<PricingCalculator initialVolume={5} />);

    expect(screen.getByText(/5 sessions × 50.00 XLM/)).toBeTruthy();
  });

  it("has help popovers for fee explanations", () => {
    render(<PricingCalculator />);

    // Help popover triggers should exist for platform fee and take-home
    const helpButtons = screen.getAllByLabelText(/Help:/i);
    expect(helpButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("has a tooltip explaining network fee", () => {
    render(<PricingCalculator />);

    const tooltipButton = screen.getByLabelText(
      /Help: what is the network fee/i,
    );
    expect(tooltipButton).toBeInTheDocument();
  });

  it("has live aria regions for dynamic updates", () => {
    render(<PricingCalculator />);

    const ariaLiveElements = document.querySelectorAll("[aria-live='polite']");
    expect(ariaLiveElements.length).toBeGreaterThanOrEqual(3); // sliders + per-session + monthly
  });

  it("renders without crashing with zero price and high volume", () => {
    render(<PricingCalculator initialPrice={0} initialVolume={200} />);
    expect(screen.getByText("Fee Calculator")).toBeInTheDocument();
  });

  it("preserves platformRate in breakdown even with zero inputs", () => {
    const onRecalculate = vi.fn();
    render(
      <PricingCalculator
        initialPrice={0}
        initialVolume={1}
        platformRate={0.08}
        onRecalculate={onRecalculate}
      />,
    );

    const call = onRecalculate.mock.lastCall?.[0] as FeeBreakdown;
    expect(call.platformRate).toBe(0.08);
    expect(call.perSessionTakeHome).toBe(0);
    expect(call.monthlyTakeHome).toBe(0);
  });

  it("shows session price label with current duration", () => {
    render(<PricingCalculator initialDuration={45} />);

    // The session price label should mention the duration
    expect(screen.getByText(/Session price \(45 min\)/)).toBeTruthy();
  });
});
