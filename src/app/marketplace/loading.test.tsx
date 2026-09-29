import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { axe } from "jest-axe";
import MarketplaceLoading from "./loading";

// Mock child components to isolate MarketplaceLoading behavior
vi.mock("@/components/dashboard/panel-shell", () => ({
  PanelShell: ({ children, title, description }: any) => (
    <div data-testid="panel-shell" data-title={title} data-description={description}>
      {children}
    </div>
  ),
}));

vi.mock("./components/recently-viewed-rail", () => ({
  RecentlyViewedRail: () => <div data-testid="recently-viewed-rail" />,
}));

describe("MarketplaceLoading", () => {
  it("renders the loading skeleton successfully", () => {
    const { container } = render(<MarketplaceLoading />);
    
    // Check main layout structure
    const mainContent = container.querySelector("main#main-content");
    expect(mainContent).toBeInTheDocument();
    
    // Check mocked dependencies
    expect(screen.getByTestId("recently-viewed-rail")).toBeInTheDocument();
    
    const panelShell = screen.getByTestId("panel-shell");
    expect(panelShell).toBeInTheDocument();
    expect(panelShell).toHaveAttribute("data-title", "Marketplace");
    expect(panelShell).toHaveAttribute("data-description", "Browse and book time slots from suppliers worldwide");
    
    // Check loading container accessibility
    const loadingContainer = screen.getByRole("status", { name: "Loading marketplace items" });
    expect(loadingContainer).toBeInTheDocument();
    expect(loadingContainer).toHaveAttribute("aria-busy", "true");
    expect(loadingContainer).toHaveAttribute("aria-live", "polite");
    
    // Check skeleton items
    const skeletonItems = container.querySelectorAll(".card[aria-hidden='true']");
    expect(skeletonItems).toHaveLength(8);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<MarketplaceLoading />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
