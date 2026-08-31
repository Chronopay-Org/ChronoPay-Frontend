import { render, screen } from "@testing-library/react";
import { SuccessIllustration } from "../success-illustration";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("SuccessIllustration", () => {
  beforeEach(() => {
    // Mock IntersectionObserver
    const mockIntersectionObserver = vi.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null,
    });
    window.IntersectionObserver = mockIntersectionObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the mint variant correctly", () => {
    render(<SuccessIllustration variant="mint" />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("aria-label", "Minted success illustration");
    expect(screen.getByText("Minted")).toBeInTheDocument();
  });

  it("renders the purchase variant correctly", () => {
    render(<SuccessIllustration variant="purchase" />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("aria-label", "Purchased success illustration");
    expect(screen.getByText("Purchased")).toBeInTheDocument();
  });

  it("renders the escrow-release variant correctly", () => {
    render(<SuccessIllustration variant="escrow-release" />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("aria-label", "Released success illustration");
    expect(screen.getByText("Released")).toBeInTheDocument();
  });

  it("renders the dispute-resolution variant correctly", () => {
    render(<SuccessIllustration variant="dispute-resolution" />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("aria-label", "Resolved success illustration");
    expect(screen.getByText("Resolved")).toBeInTheDocument();
  });

  it("accepts a custom alt text", () => {
    render(<SuccessIllustration variant="mint" alt="Custom Alt Text" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("aria-label", "Custom Alt Text");
  });
});
