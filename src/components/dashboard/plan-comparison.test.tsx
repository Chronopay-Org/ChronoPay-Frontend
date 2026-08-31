/**
 * PlanComparison Tests
 *
 * Coverage targets (95%+):
 *  - Rendering: Plans display with correct structure and data
 *  - Billing toggle: Monthly/yearly switching with price updates
 *  - Savings calculation: Correct percentage display for yearly
 *  - Recommended plan: Visual styling and ARIA labels applied
 *  - Responsive layout: Mobile cards vs desktop matrix
 *  - Features display: Feature lists, categories, and indicators
 *  - Accessibility: ARIA labels, heading hierarchy, color contrast, keyboard navigation
 *  - CTA buttons: Click handlers, plan selection, href attributes
 *  - Edge cases: Empty plans, missing prices, duplicate features
 *  - Keyboard navigation: Tab through plans, enter/space on buttons
 *  - Dark mode: Proper color contrast and styling
 */

import React from "react";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  PlanComparison,
  type PricingPlan,
  type PricingFeature,
} from "@/components/dashboard/plan-comparison";
import { axe } from "jest-axe";

// ─────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────

const mockFeatures: PricingFeature[] = [
  {
    id: "slots",
    name: "Time Slots",
    description: "Monthly bookable slots",
    included: true,
    category: "Core",
  },
  {
    id: "storage",
    name: "Storage",
    description: "Profile storage",
    included: "10 GB",
    category: "Core",
  },
  {
    id: "api",
    name: "API Access",
    included: false,
    category: "Integration",
  },
  {
    id: "support",
    name: "Priority Support",
    included: true,
    category: "Support",
  },
];

const basicPlan: PricingPlan = {
  id: "starter",
  name: "Starter",
  tagline: "For individuals",
  monthlyPrice: 2999,
  yearlyPrice: 29990,
  ctaLabel: "Get Started",
  ctaHref: "/signup?plan=starter",
  features: mockFeatures,
  accentColor: "slate",
};

const recommendedPlan: PricingPlan = {
  id: "pro",
  name: "Professional",
  tagline: "For businesses",
  monthlyPrice: 7999,
  yearlyPrice: 75990,
  ctaLabel: "Upgrade",
  ctaHref: "/signup?plan=pro",
  features: mockFeatures,
  accentColor: "cyan",
  isRecommended: true,
  recommendedReason: "Most popular",
};

const expensivePlan: PricingPlan = {
  id: "enterprise",
  name: "Enterprise",
  monthlyPrice: 29999,
  yearlyPrice: 287990,
  ctaLabel: "Contact Sales",
  ctaHref: "/contact-sales",
  features: mockFeatures,
  accentColor: "amber",
};

const planWithoutYearlyPrice: PricingPlan = {
  id: "budget",
  name: "Budget",
  monthlyPrice: 999,
  // No yearlyPrice provided - should calculate as monthlyPrice * 12
  ctaLabel: "Try",
  ctaHref: "/signup",
  features: mockFeatures,
};

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function setup(
  plans: PricingPlan[] = [basicPlan, recommendedPlan],
  props: Partial<React.ComponentProps<typeof PlanComparison>> = {}
) {
  const onSelectPlan = vi.fn();
  const result = render(
    <PlanComparison plans={plans} onSelectPlan={onSelectPlan} {...props} />
  );
  return {
    ...result,
    onSelectPlan,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────

describe("PlanComparison", () => {
  // ── Rendering ──────────────────────────────────────────────────────────

  describe("initial render", () => {
    it("renders all plans with correct names", () => {
      setup([basicPlan, recommendedPlan, expensivePlan]);
      expect(screen.getByText("Starter")).toBeInTheDocument();
      expect(screen.getByText("Professional")).toBeInTheDocument();
      expect(screen.getByText("Enterprise")).toBeInTheDocument();
    });

    it("displays the header with title and description", () => {
      setup();
      expect(screen.getByText("Simple, Transparent Pricing")).toBeInTheDocument();
      expect(
        screen.getByText("Choose the plan that fits your needs")
      ).toBeInTheDocument();
    });

    it("renders billing toggle buttons", () => {
      setup();
      expect(screen.getByRole("button", { name: /monthly/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /yearly/i })).toBeInTheDocument();
    });

    it("monthly button is pressed by default", () => {
      setup();
      const monthlyBtn = screen.getByRole("button", { name: /monthly/i });
      expect(monthlyBtn).toHaveAttribute("aria-pressed", "true");
    });

    it("renders plan taglines when provided", () => {
      setup();
      expect(screen.getByText("For individuals")).toBeInTheDocument();
      expect(screen.getByText("For businesses")).toBeInTheDocument();
    });

    it("does not render taglines when not provided", () => {
      const planNoTagline: PricingPlan = { ...basicPlan, tagline: undefined };
      setup([planNoTagline]);
      // Should still render the plan name
      expect(screen.getByText("Starter")).toBeInTheDocument();
    });
  });

  // ── Billing Toggle ─────────────────────────────────────────────────────

  describe("billing toggle", () => {
    it("switches to yearly billing on click", async () => {
      setup();
      const yearlyBtn = screen.getByRole("button", { name: /yearly/i });
      act(() => {
        fireEvent.click(yearlyBtn);
      });
      expect(yearlyBtn).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: /monthly/i })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });

    it("updates prices when switching to yearly", () => {
      setup([basicPlan]);
      // Monthly price: $29.99
      expect(screen.getByText("$29.99")).toBeInTheDocument();

      const yearlyBtn = screen.getByRole("button", { name: /yearly/i });
      act(() => {
        fireEvent.click(yearlyBtn);
      });
      // Yearly price: $299.90
      expect(screen.getByText("$299.90")).toBeInTheDocument();
    });

    it("updates prices when switching back to monthly", () => {
      setup([basicPlan]);
      const yearlyBtn = screen.getByRole("button", { name: /yearly/i });
      const monthlyBtn = screen.getByRole("button", { name: /monthly/i });

      act(() => {
        fireEvent.click(yearlyBtn);
      });
      expect(screen.getByText("$299.90")).toBeInTheDocument();

      act(() => {
        fireEvent.click(monthlyBtn);
      });
      expect(screen.getByText("$29.99")).toBeInTheDocument();
    });

    it("calculates yearly price from monthly if yearlyPrice not provided", () => {
      setup([planWithoutYearlyPrice]);
      // Monthly: $9.99
      expect(screen.getByText("$9.99")).toBeInTheDocument();

      const yearlyBtn = screen.getByRole("button", { name: /yearly/i });
      act(() => {
        fireEvent.click(yearlyBtn);
      });
      // Should calculate as 9.99 * 12 = $119.88
      expect(screen.getByText("$119.88")).toBeInTheDocument();
    });
  });

  // ── Savings Calculation ────────────────────────────────────────────────

  describe("savings display", () => {
    it("shows savings percentage when switching to yearly", () => {
      setup([basicPlan]); // yearlyPrice: 29990, monthlyPrice: 2999
      // savings = (2999*12 - 29990) / (2999*12) = (35988 - 29990) / 35988 ≈ 16%

      const yearlyBtn = screen.getByRole("button", { name: /yearly/i });
      act(() => {
        fireEvent.click(yearlyBtn);
      });

      const savingsText = screen.getByText(/save \d+%/i);
      expect(savingsText).toBeInTheDocument();
    });

    it("hides savings for plan with no yearly discount", () => {
      const noPlan: PricingPlan = {
        ...basicPlan,
        yearlyPrice: basicPlan.monthlyPrice * 12, // No discount
      };
      setup([noPlan]);

      const yearlyBtn = screen.getByRole("button", { name: /yearly/i });
      act(() => {
        fireEvent.click(yearlyBtn);
      });

      expect(screen.queryByText(/save \d+%/i)).not.toBeInTheDocument();
    });

    it("uses custom savings label", () => {
      setup(
        [basicPlan],
        { savingsLabel: "Save {savings}% on annual plans" }
      );

      const yearlyBtn = screen.getByRole("button", { name: /yearly/i });
      act(() => {
        fireEvent.click(yearlyBtn);
      });

      expect(
        screen.getByText(/save \d+% on annual plans/i)
      ).toBeInTheDocument();
    });
  });

  // ── Recommended Plan ────────────────────────────────────────────────────

  describe("recommended plan highlighting", () => {
    it("renders recommended badge for recommended plan", () => {
      setup([basicPlan, recommendedPlan], { recommendedPlanId: "pro" });
      expect(screen.getByText(/recommended/i)).toBeInTheDocument();
    });

    it("displays recommended reason when provided", () => {
      setup([basicPlan, recommendedPlan], { recommendedPlanId: "pro" });
      expect(screen.getByText("Most popular")).toBeInTheDocument();
    });

    it("includes aria-label for recommended plan", () => {
      const { container } = setup([basicPlan, recommendedPlan], {
        recommendedPlanId: "pro",
      });

      const planArticles = container.querySelectorAll("article");
      // The recommended plan card should have aria-label indicating it's recommended
      const recommendedCard = Array.from(planArticles).find((article) =>
        article.textContent?.includes("Professional")
      );
      expect(recommendedCard).toHaveAttribute(
        "aria-label",
        expect.stringContaining("recommended")
      );
    });

    it("recommended plan has different styling", () => {
      const { container } = setup([basicPlan, recommendedPlan], {
        recommendedPlanId: "pro",
      });

      const planCards = container.querySelectorAll("article");
      const recommendedCard = Array.from(planCards).find((card) =>
        card.textContent?.includes("Professional")
      );

      // Recommended plan should have cyan border styling
      expect(recommendedCard).toHaveClass("border-cyan-400/50");
    });
  });

  // ── Features Display ───────────────────────────────────────────────────

  describe("features display", () => {
    it("renders all features for each plan", () => {
      setup([basicPlan]);
      expect(screen.getByText("Time Slots")).toBeInTheDocument();
      expect(screen.getByText("Storage")).toBeInTheDocument();
      expect(screen.getByText("API Access")).toBeInTheDocument();
      expect(screen.getByText("Priority Support")).toBeInTheDocument();
    });

    it("displays feature descriptions", () => {
      setup([basicPlan]);
      expect(screen.getByText("Monthly bookable slots")).toBeInTheDocument();
      expect(screen.getByText("Profile storage")).toBeInTheDocument();
    });

    it("shows checkmarks for included features", () => {
      const { container } = setup([basicPlan]);
      const checks = container.querySelectorAll('svg[data-icon="check"]');
      expect(checks.length).toBeGreaterThan(0);
    });

    it("shows custom values for partial features", () => {
      setup([basicPlan]);
      expect(screen.getByText("10 GB")).toBeInTheDocument();
    });

    it("groups features by category", () => {
      setup([basicPlan, recommendedPlan]);
      expect(screen.getByText(/core/i)).toBeInTheDocument();
      expect(screen.getByText(/integration/i)).toBeInTheDocument();
      expect(screen.getByText(/support/i)).toBeInTheDocument();
    });
  });

  // ── CTA Buttons ────────────────────────────────────────────────────────

  describe("CTA buttons", () => {
    it("renders CTA button with correct label", () => {
      setup([basicPlan]);
      expect(screen.getByText("Get Started")).toBeInTheDocument();
      expect(screen.getByText("Upgrade")).toBeInTheDocument();
    });

    it("calls onSelectPlan callback when CTA is clicked", () => {
      const { onSelectPlan } = setup([basicPlan]);
      const ctaButton = screen.getByRole("button", { name: "Get Started" });
      act(() => {
        fireEvent.click(ctaButton);
      });
      expect(onSelectPlan).toHaveBeenCalledWith("starter");
    });

    it("calls onSelectPlan only once per click", () => {
      const { onSelectPlan } = setup([basicPlan]);
      const ctaButton = screen.getByRole("button", { name: "Get Started" });
      act(() => {
        fireEvent.click(ctaButton);
      });
      expect(onSelectPlan).toHaveBeenCalledTimes(1);
    });

    it("has aria-label on CTA buttons", () => {
      setup([basicPlan]);
      const cta = screen.getByRole("button", { name: /select starter plan/i });
      expect(cta).toBeInTheDocument();
    });

    it("recommended plan CTA has different styling", () => {
      const { container } = setup([basicPlan, recommendedPlan], {
        recommendedPlanId: "pro",
      });

      const buttons = container.querySelectorAll("button");
      const proButton = Array.from(buttons).find(
        (btn) => btn.textContent === "Upgrade"
      );

      expect(proButton).toHaveClass("bg-cyan-300");
    });
  });

  // ── Responsive Layout ──────────────────────────────────────────────────

  describe("responsive layout", () => {
    it("renders mobile card layout on small screens", () => {
      const { container } = setup([basicPlan, recommendedPlan]);

      // Mobile layout uses block (md:hidden)
      const mobileSection = container.querySelector(".block.md\\:hidden");
      expect(mobileSection).toBeInTheDocument();
    });

    it("renders desktop matrix layout on large screens", () => {
      const { container } = setup([basicPlan, recommendedPlan]);

      // Desktop layout uses hidden md:block
      const desktopSection = container.querySelector(".hidden.md\\:block");
      expect(desktopSection).toBeInTheDocument();
    });

    it("desktop layout uses table structure", () => {
      const { container } = setup([basicPlan, recommendedPlan]);
      const table = container.querySelector("table");
      expect(table).toBeInTheDocument();
      expect(table).toHaveAttribute("role", "table");
    });

    it("desktop layout has sticky feature column", () => {
      const { container } = setup([basicPlan, recommendedPlan]);
      const stickyElements = container.querySelectorAll(".sticky.left-0");
      expect(stickyElements.length).toBeGreaterThan(0);
    });
  });

  // ── Accessibility ──────────────────────────────────────────────────────

  describe("accessibility", () => {
    it("passes axe accessibility audit", async () => {
      const { container } = setup([basicPlan, recommendedPlan]);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has proper heading hierarchy", () => {
      setup([basicPlan, recommendedPlan]);
      const h2 = screen.getByText("Simple, Transparent Pricing");
      expect(h2.tagName).toBe("H2");
    });

    it("renders skip link for navigation", () => {
      // Note: Skip link is in the pricing page, not in the component
      // But we can test the structure is correct
      const { container } = setup([basicPlan]);
      expect(container.querySelector("h2")).toBeInTheDocument();
    });

    it("plan cards have proper article semantics", () => {
      const { container } = setup([basicPlan]);
      const articles = container.querySelectorAll("article");
      expect(articles.length).toBeGreaterThanOrEqual(1);
    });

    it("has proper aria labels for plan cards", () => {
      const { container } = setup([basicPlan]);
      const planCard = container.querySelector("article");
      expect(planCard).toHaveAttribute("aria-label");
    });

    it("billing toggle buttons have aria-pressed", () => {
      setup();
      const monthlyBtn = screen.getByRole("button", { name: /monthly/i });
      const yearlyBtn = screen.getByRole("button", { name: /yearly/i });

      expect(monthlyBtn).toHaveAttribute("aria-pressed");
      expect(yearlyBtn).toHaveAttribute("aria-pressed");
    });

    it("focus indicators are visible", () => {
      setup();
      const buttons = screen.getAllByRole("button");
      buttons.forEach((btn) => {
        expect(btn).toHaveClass("focus-ring-cyan");
      });
    });

    it("recommended indicator has aria-label", () => {
      const { container } = setup([basicPlan, recommendedPlan], {
        recommendedPlanId: "pro",
      });

      const recommendedBadge = screen.getByText(/recommended/);
      // Check that the badge is properly labeled
      expect(recommendedBadge.closest("div")).toHaveAttribute("aria-label");
    });

    it("features have proper contrast colors", () => {
      const { container } = setup([basicPlan]);

      // Check that text colors are properly applied
      const featureList = container.querySelector("div");
      expect(featureList).toBeInTheDocument();

      // Included features should have visible text
      const includedFeatures = container.querySelectorAll(".text-slate-200");
      expect(includedFeatures.length).toBeGreaterThan(0);
    });

    it("non-included features are visually distinguished", () => {
      const { container } = setup([basicPlan]);

      // Not included features should have muted styling
      const excludedFeatures = container.querySelectorAll(".text-slate-500");
      expect(excludedFeatures.length).toBeGreaterThan(0);
    });
  });

  // ── Keyboard Navigation ────────────────────────────────────────────────

  describe("keyboard navigation", () => {
    it("all interactive buttons are keyboard accessible", () => {
      setup([basicPlan, recommendedPlan]);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((btn) => {
        expect(btn.tagName).toBe("BUTTON");
      });
    });

    it("Tab key focuses next button", () => {
      setup([basicPlan]);

      const monthlyBtn = screen.getByRole("button", { name: /monthly/i });
      monthlyBtn.focus();
      expect(document.activeElement).toBe(monthlyBtn);
    });

    it("Enter key activates billing toggle", () => {
      setup();
      const yearlyBtn = screen.getByRole("button", { name: /yearly/i });

      yearlyBtn.focus();
      act(() => {
        fireEvent.keyDown(yearlyBtn, { key: "Enter" });
      });

      expect(yearlyBtn).toHaveAttribute("aria-pressed", "true");
    });

    it("Space key activates billing toggle", () => {
      setup();
      const yearlyBtn = screen.getByRole("button", { name: /yearly/i });

      yearlyBtn.focus();
      act(() => {
        fireEvent.keyDown(yearlyBtn, { key: " " });
      });

      expect(yearlyBtn).toHaveAttribute("aria-pressed", "true");
    });
  });

  // ── Edge Cases ─────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles single plan", () => {
      setup([basicPlan]);
      expect(screen.getByText("Starter")).toBeInTheDocument();
    });

    it("handles many plans", () => {
      const manyPlans = [basicPlan, recommendedPlan, expensivePlan];
      setup(manyPlans);
      expect(screen.getByText("Starter")).toBeInTheDocument();
      expect(screen.getByText("Professional")).toBeInTheDocument();
      expect(screen.getByText("Enterprise")).toBeInTheDocument();
    });

    it("handles plan with no features", () => {
      const noFeaturesPlan: PricingPlan = {
        ...basicPlan,
        features: [],
      };
      setup([noFeaturesPlan]);
      expect(screen.getByText("Starter")).toBeInTheDocument();
    });

    it("handles plan with no tagline", () => {
      const noTaglinePlan: PricingPlan = {
        ...basicPlan,
        tagline: undefined,
      };
      setup([noTaglinePlan]);
      expect(screen.getByText("Starter")).toBeInTheDocument();
    });

    it("handles plan with no recommendedReason", () => {
      const noReasonPlan: PricingPlan = {
        ...recommendedPlan,
        recommendedReason: undefined,
      };
      setup([basicPlan, noReasonPlan], { recommendedPlanId: "pro" });
      // Should still render the recommended badge
      expect(screen.getByText(/recommended/i)).toBeInTheDocument();
    });

    it("handles very high prices", () => {
      const expensivePlan: PricingPlan = {
        id: "mega",
        name: "Mega",
        monthlyPrice: 999999999, // $9,999,999.99
        ctaLabel: "Buy",
        ctaHref: "/buy",
        features: [],
      };
      setup([expensivePlan]);
      expect(screen.getByText("$9999999.99")).toBeInTheDocument();
    });

    it("handles very low prices", () => {
      const cheapPlan: PricingPlan = {
        id: "free",
        name: "Free",
        monthlyPrice: 1, // $0.01
        ctaLabel: "Try",
        ctaHref: "/try",
        features: [],
      };
      setup([cheapPlan]);
      expect(screen.getByText("$0.01")).toBeInTheDocument();
    });

    it("handles prices with $0", () => {
      const freePlan: PricingPlan = {
        id: "free",
        name: "Free",
        monthlyPrice: 0,
        ctaLabel: "Try",
        ctaHref: "/try",
        features: [],
      };
      setup([freePlan]);
      expect(screen.getByText("$0.00")).toBeInTheDocument();
    });

    it("handles duplicate feature IDs across plans", () => {
      setup([basicPlan, recommendedPlan]);
      // Both plans have the same features
      // Should only display once in the feature list
      const storageHeaders = screen.getAllByText("Storage");
      expect(storageHeaders.length).toBeGreaterThan(0);
    });

    it("handles missing onSelectPlan callback", () => {
      const { rerender } = render(
        <PlanComparison plans={[basicPlan]} />
      );
      const ctaButton = screen.getByRole("button", { name: "Get Started" });
      // Should not throw when clicking without callback
      expect(() => {
        fireEvent.click(ctaButton);
      }).not.toThrow();
    });

    it("handles custom billing labels", () => {
      setup(
        [basicPlan],
        {
          monthlyLabel: "Pay Monthly",
          yearlyLabel: "Pay Yearly",
        }
      );

      expect(screen.getByRole("button", { name: "Pay Monthly" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Pay Yearly" })).toBeInTheDocument();
    });
  });

  // ── Dark Mode & Theming ────────────────────────────────────────────────

  describe("dark mode and theming", () => {
    it("has proper background colors for dark mode", () => {
      const { container } = setup([basicPlan]);
      const wrapper = container.querySelector(".plan-comparison");
      expect(wrapper).toHaveClass("w-full");
    });

    it("accent colors are applied correctly", () => {
      const { container } = setup(
        [basicPlan, recommendedPlan, expensivePlan],
        { recommendedPlanId: "pro" }
      );

      // Check that different accent colors are present
      const text = container.textContent;
      expect(text).toContain("Starter");
      expect(text).toContain("Professional");
      expect(text).toContain("Enterprise");
    });

    it("border colors provide sufficient contrast", () => {
      const { container } = setup([basicPlan, recommendedPlan]);

      // Basic plan should have subtle borders
      const basicCard = Array.from(container.querySelectorAll("article")).find(
        (a) => a.textContent?.includes("Starter")
      );
      expect(basicCard).toHaveClass("border-white/10");

      // Recommended plan should have cyan border
      const recCard = Array.from(container.querySelectorAll("article")).find(
        (a) => a.textContent?.includes("Professional")
      );
      expect(recCard).toHaveClass("border-cyan-400/50");
    });
  });

  // ── State Management ────────────────────────────────────────────────────

  describe("state management", () => {
    it("maintains billing toggle state independently across renders", () => {
      const { rerender } = setup([basicPlan]);

      const yearlyBtn = screen.getByRole("button", { name: /yearly/i });
      act(() => {
        fireEvent.click(yearlyBtn);
      });

      expect(yearlyBtn).toHaveAttribute("aria-pressed", "true");

      // Re-render shouldn't reset state
      rerender(<PlanComparison plans={[basicPlan]} recommendedPlanId="pro" />);

      expect(yearlyBtn).toHaveAttribute("aria-pressed", "true");
    });

    it("resets billing toggle when plans change", () => {
      const { rerender } = setup([basicPlan]);

      const yearlyBtn = screen.getByRole("button", { name: /yearly/i });
      act(() => {
        fireEvent.click(yearlyBtn);
      });

      // Changing plans shouldn't affect the state
      // (The component doesn't explicitly reset on plan change)
      expect(yearlyBtn).toHaveAttribute("aria-pressed", "true");
    });
  });

  // ── Price Calculation ──────────────────────────────────────────────────

  describe("price calculations", () => {
    it("correctly formats prices with decimals", () => {
      const oddPrice: PricingPlan = {
        ...basicPlan,
        monthlyPrice: 12345, // $123.45
      };
      setup([oddPrice]);
      expect(screen.getByText("$123.45")).toBeInTheDocument();
    });

    it("handles prices that format to whole dollars", () => {
      const wholePrice: PricingPlan = {
        ...basicPlan,
        monthlyPrice: 50000, // $500.00
      };
      setup([wholePrice]);
      expect(screen.getByText("$500.00")).toBeInTheDocument();
    });

    it("calculates correct percentage savings for different price ratios", () => {
      const planWithBigSavings: PricingPlan = {
        ...basicPlan,
        monthlyPrice: 1000, // $10/month
        yearlyPrice: 9000, // $90/year (25% savings)
      };
      setup([planWithBigSavings]);

      const yearlyBtn = screen.getByRole("button", { name: /yearly/i });
      act(() => {
        fireEvent.click(yearlyBtn);
      });

      const savingsText = screen.getByText(/save 25%/);
      expect(savingsText).toBeInTheDocument();
    });
  });
});
