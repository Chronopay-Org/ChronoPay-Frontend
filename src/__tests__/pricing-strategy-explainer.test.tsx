import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PricingStrategyPreview from "@/components/pricing/PricingStrategyPreview";
import PricingStrategyExplainer from "@/components/pricing/PricingStrategyExplainer";
import { QuickActions } from "@/components/dashboard/quick-actions";
import type { QuickAction } from "@/components/dashboard/types";

describe("PricingStrategyPreview", () => {
  it("renders fixed strategy prices", () => {
    render(<PricingStrategyPreview strategy="fixed" />);
    expect(screen.getByText(/Strategy: fixed/i)).toBeTruthy();
    expect(screen.getAllByText(/\$10/).length).toBeGreaterThan(0);
  });

  it("renders tiered strategy with multiple values", () => {
    render(<PricingStrategyPreview strategy="tiered" />);
    expect(screen.getByText(/Strategy: tiered/i)).toBeTruthy();
  });
});

describe("PricingStrategyExplainer", () => {
  it("opens and allows switching strategies", async () => {
    const onClose = vi.fn();
    render(<PricingStrategyExplainer open={true} onClose={onClose} />);

    expect(screen.getByText(/Strategy: fixed/i)).toBeTruthy();

    const dynamic = screen.getByDisplayValue("dynamic") as HTMLInputElement;
    fireEvent.click(dynamic);
    expect(dynamic.checked).toBe(true);
  });

  it("shows loading and retry path", async () => {
    render(<PricingStrategyExplainer open={true} onClose={() => {}} />);
    expect(await screen.findByText(/Preview/i)).toBeTruthy();
  });
});

describe("QuickActions integration", () => {
  it("renders explainer toggle for mint actions", () => {
    const actions: QuickAction[] = [
      {
        title: "Mint time-token",
        description: "Create a time-token",
        href: "/mint",
        icon: "PlusCircle",
        tone: "neutral",
      },
    ];

    render(<QuickActions actions={actions} />);
    expect(screen.getByRole("button", { name: /Pricing explainer/i })).toBeTruthy();
  });
});
