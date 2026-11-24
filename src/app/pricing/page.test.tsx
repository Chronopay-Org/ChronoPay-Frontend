import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import PricingPage from "./page";

describe("PricingPage", () => {
  it("renders the pricing page correctly", () => {
    render(<PricingPage />);
    
    // Check header and breadcrumb
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    
    // Check main plan comparison text
    expect(screen.getByText("Monthly Billing")).toBeInTheDocument();
    
    // Check FAQ
    expect(screen.getByText("Frequently Asked Questions")).toBeInTheDocument();
    expect(screen.getByText("Can I change plans?")).toBeInTheDocument();
    
    // Check CTA section
    expect(screen.getByText("Ready to get started?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start Free Trial" })).toHaveAttribute("href", "/signup?plan=starter");
    expect(screen.getByRole("link", { name: "Talk to Sales" })).toHaveAttribute("href", "/contact-sales");
  });

  it("handles primary state transitions (billing toggle)", () => {
    render(<PricingPage />);
    
    const monthlyButton = screen.getByRole("button", { name: /Monthly Billing/i });
    const annualButton = screen.getByRole("button", { name: /Annual/i });
    
    // Switch to annual billing
    fireEvent.click(annualButton);
    expect(annualButton).toHaveAttribute("aria-pressed", "true");
    
    // Switch back to monthly billing
    fireEvent.click(monthlyButton);
    expect(monthlyButton).toHaveAttribute("aria-pressed", "true");
  });

  it("survives unexpected invalid inputs gracefully", () => {
    // Next.js pages might receive unexpected searchParams or params.
    // We verify that passing them doesn't break the public contract.
    const invalidProps = {
      searchParams: { weird: "value", arr: [] },
      params: null
    };
    
    // @ts-ignore - simulating invalid runtime props Next.js might pass
    const { container } = render(<PricingPage {...invalidProps} />);
    expect(container).toBeInTheDocument();
    expect(screen.getByText("Frequently Asked Questions")).toBeInTheDocument();
  });

  it("executes the plan selection handler without throwing", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    render(<PricingPage />);
    
    // Click the "Get Started" plan CTA link
    // It has the text "Get Started", wait, let's find it by role and text.
    // In plan-comparison, it renders as an anchor tag, but it might have multiple instances (mobile and desktop views).
    const ctaLinks = screen.getAllByRole("link", { name: /Get Started/i });
    expect(ctaLinks.length).toBeGreaterThan(0);
    
    fireEvent.click(ctaLinks[0]);
    
    // Expect console.log to have been called by handleSelectPlan
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("User selected plan: starter"));
    consoleSpy.mockRestore();
  });
});
