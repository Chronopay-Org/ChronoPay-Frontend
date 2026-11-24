import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuickActions } from "./quick-actions";
import type { QuickAction } from "./types";

// Mock the PricingStrategyExplainer to observe state transitions
vi.mock("@/components/pricing/PricingStrategyExplainer", () => {
  return {
    default: ({ open, onClose }: { open: boolean; onClose: () => void }) => (
      open ? (
        <div data-testid="pricing-explainer">
          <button onClick={onClose} data-testid="close-explainer">Close Explainer</button>
        </div>
      ) : null
    ),
  };
});

describe("QuickActions", () => {
  it("renders a list of actions with correct details", () => {
    const actions: QuickAction[] = [
      {
        title: "Test Action",
        description: "Test Description",
        href: "/test",
        tone: "positive",
        icon: "Check",
      },
      {
        title: "Another Action",
        description: "Another Description",
        href: "/another",
        tone: "neutral",
        icon: "Info",
      }
    ];
    
    render(<QuickActions actions={actions} />);
    
    expect(screen.getByText("Test Action")).toBeDefined();
    expect(screen.getByText("Test Description")).toBeDefined();
    expect(screen.getByText("Ready")).toBeDefined(); // positive tone mapped to "Ready"
    expect(screen.getByText("View Test Action")).toBeDefined();
    expect(screen.getByText("View Test Action").closest("a")).toHaveProperty("href", expect.stringContaining("/test"));
    
    expect(screen.getByText("Another Action")).toBeDefined();
    expect(screen.getByText("Another Description")).toBeDefined();
    expect(screen.getByText("Available")).toBeDefined(); // neutral tone mapped to "Available"
  });

  it("shows pricing explainer toggle for 'mint' related actions and transitions state", () => {
    const actions: QuickAction[] = [
      {
        title: "Mint Token",
        description: "Create a new token",
        href: "/mint",
        tone: "neutral",
        icon: "Plus",
      }
    ];

    render(<QuickActions actions={actions} />);
    
    // Toggle button should be present
    const toggleBtn = screen.getByRole("button", { name: "Open pricing explainer" });
    expect(toggleBtn).toBeDefined();

    // Explainer should be hidden initially
    expect(screen.queryByTestId("pricing-explainer")).toBeNull();

    // Click toggle to open explainer
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId("pricing-explainer")).toBeDefined();

    // Close explainer
    const closeBtn = screen.getByTestId("close-explainer");
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId("pricing-explainer")).toBeNull();
  });

  it("handles invalid icon input without crashing (fallback behavior)", () => {
    const actions: QuickAction[] = [
      {
        title: "Broken Icon Action",
        description: "This has a bad icon",
        href: "/bad-icon",
        tone: "warning",
        icon: "NonExistentIconXYZ",
      }
    ];

    // This should not throw an error because of the fallback
    expect(() => render(<QuickActions actions={actions} />)).not.toThrow();
    
    expect(screen.getByText("Broken Icon Action")).toBeDefined();
    expect(screen.getByText("Needs review")).toBeDefined(); // warning tone mapped to "Needs review"
  });
});
