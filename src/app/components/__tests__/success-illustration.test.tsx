import { render, screen, act } from "@testing-library/react";
import { SuccessIllustration, SuccessVariant } from "../success-illustration";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("SuccessIllustration", () => {
  let triggerIntersection: IntersectionObserverCallback;
  let observeMock: ReturnType<typeof vi.fn>;
  let disconnectMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observeMock = vi.fn();
    disconnectMock = vi.fn();
    
    class MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        triggerIntersection = callback;
      }
      observe = observeMock;
      unobserve = vi.fn();
      disconnect = disconnectMock;
    }
    
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it("handles state transitions based on intersection observer", () => {
    render(<SuccessIllustration variant="mint" />);
    const img = screen.getByRole("img");
    
    // Initial state is unpaused
    expect(img).not.toHaveClass("es-paused");
    
    // Simulate leaving viewport
    act(() => {
      triggerIntersection([{ isIntersecting: false }] as IntersectionObserverEntry[], {} as IntersectionObserver);
    });
    
    expect(img).toHaveClass("es-paused");
    
    // Simulate re-entering viewport
    act(() => {
      triggerIntersection([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver);
    });
    
    expect(img).not.toHaveClass("es-paused");
  });

  it("fails deterministically for invalid variants (boundary behavior)", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    expect(() => {
      render(<SuccessIllustration variant={"invalid-variant" as SuccessVariant} />);
    }).toThrow();
    
    consoleSpy.mockRestore();
  });
});
