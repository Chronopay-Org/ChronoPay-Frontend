import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe } from "jest-axe";

import PlanComparison, { validatePlans, type PricingPlan } from "../components/dashboard/plan-comparison";

const SAMPLE_PLANS: PricingPlan[] = [
  {
    id: "a",
    name: "A",
    monthlyPrice: 1000,
    yearlyPrice: 10000,
    ctaLabel: "Buy A",
    ctaHref: "/a",
    features: [{ id: "f1", name: "F1", included: true }],
  },
  {
    id: "b",
    name: "B",
    monthlyPrice: 2000,
    yearlyPrice: 20000,
    ctaLabel: "Buy B",
    ctaHref: "/b",
    features: [{ id: "f1", name: "F1", included: false }],
  },
];

describe("PlanComparison", () => {
  it("renders plans and prices", async () => {
    render(<PlanComparison plans={SAMPLE_PLANS} onSelectPlan={() => {}} />);
    expect(screen.getByText("Choose a plan")).toBeInTheDocument();
    expect(screen.getAllByText("$10.00").length).toBeGreaterThan(0);
  });

  it("toggles billing cycle and updates prices", () => {
    render(<PlanComparison plans={SAMPLE_PLANS} onSelectPlan={() => {}} />);
    const toggle = screen.getByRole("button", { name: /toggle yearly billing/i });
    // monthly visible
    expect(screen.getAllByText("$10.00").length).toBeGreaterThan(0);
    fireEvent.click(toggle);
    // yearly visible
    expect(screen.getAllByText("$100.00").length).toBeGreaterThan(0);
  });

  it("calls onSelectPlan when CTA clicked", () => {
    const cb = vi.fn();
    render(<PlanComparison plans={SAMPLE_PLANS} onSelectPlan={cb} />);
    const cta = screen.getAllByRole("link").find((a) => a.textContent?.includes("Buy A"));
    expect(cta).toBeDefined();
    if (cta) fireEvent.click(cta);
    expect(cb).toHaveBeenCalledWith("a");
  });

  it("renders empty state when no plans", () => {
    render(<PlanComparison plans={[]} />);
    expect(screen.getByText(/No plans available/i)).toBeInTheDocument();
  });

  it("validatePlans rejects invalid input", () => {
    expect(() => validatePlans(null as any)).toThrow();
    expect(() => validatePlans([{ id: 1 } as any])).toThrow();
  });

  it("has no basic accessibility violations", async () => {
    const { container } = render(<PlanComparison plans={SAMPLE_PLANS} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
