import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DesignSystemTokensPage from "@/app/design-system/tokens/page";

// Mock the SemanticTokenMap component since it has its own tests
vi.mock("@/app/components/semantic-token-map", () => ({
  SemanticTokenMap: () => <div data-testid="semantic-token-map-mock">Semantic Token Map Mock</div>,
}));

// Mock Link from next/link
vi.mock("next/link", () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className} data-testid="next-link">
      {children}
    </a>
  ),
}));

describe("DesignSystemTokensPage", () => {
  it("renders the design system tokens page header and title", () => {
    render(<DesignSystemTokensPage />);
    
    // Check header elements
    expect(screen.getByText("Design System")).toBeInTheDocument();
    
    const backLink = screen.getByTestId("next-link");
    expect(backLink).toHaveAttribute("href", "/");
    expect(backLink).toHaveTextContent("← Back to App");

    // Check main content
    expect(screen.getByText("Semantic Token Map")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Inspect how each semantic token maps to its primitive value across themes/i
      )
    ).toBeInTheDocument();
  });

  it("renders the SemanticTokenMap component", () => {
    render(<DesignSystemTokensPage />);
    
    // Ensure the token map child is rendered
    expect(screen.getByTestId("semantic-token-map-mock")).toBeInTheDocument();
  });
});
