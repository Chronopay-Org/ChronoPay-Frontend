import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Dashboard from "@/app/dashboard/page";
import { useSearchParams } from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

// Mock i18n
vi.mock("@/lib/i18n", () => ({
  useMessages: () => (key: string) => key,
}));

// Mock hooks
vi.mock("@/hooks/use-onboarding-samples", () => ({
  useOnboardingSamples: () => ({
    showSamples: true,
    showTour: false,
    clearSamples: vi.fn(),
    dismissTour: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-onboarding-tour", () => ({
  useOnboardingTour: () => ({
    tourOpen: false,
    completeTour: vi.fn(),
  }),
}));

// We mock some children that might have complex client-side requirements or missing contexts
vi.mock("@/components/checkout/NetworkSelector", () => ({
  NetworkProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="network-provider">{children}</div>,
}));

// Canvas API is often not fully supported in jsdom, which canvas-confetti or other visual components might use
vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

describe("Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dashboard when no special params are present", () => {
    (useSearchParams as any).mockReturnValue({
      has: vi.fn().mockReturnValue(false),
      getAll: vi.fn().mockReturnValue([]),
      get: vi.fn().mockReturnValue(null),
    });

    render(<Dashboard />);
    
    // Check for title key from i18n
    expect(screen.getByText("dashboard.title")).toBeInTheDocument();
    expect(screen.getByText("dashboard.marketplaceTitle")).toBeInTheDocument();
  });

  it("renders the loading state when ?loading=true is present", () => {
    (useSearchParams as any).mockReturnValue({
      has: vi.fn((key) => key === "loading"),
      getAll: vi.fn().mockReturnValue([]),
      get: vi.fn().mockReturnValue(null),
    });

    render(<Dashboard />);
    
    expect(screen.getByText("dashboard.loadingMessage")).toBeInTheDocument();
    expect(screen.queryByText("dashboard.title")).not.toBeInTheDocument();
  });

  it("renders the error state when ?error=true is present", () => {
    (useSearchParams as any).mockReturnValue({
      has: vi.fn((key) => key === "error"),
      getAll: vi.fn().mockReturnValue([]),
      get: vi.fn().mockReturnValue(null),
    });

    render(<Dashboard />);
    
    expect(screen.getByText("dashboard.errorMessage")).toBeInTheDocument();
    expect(screen.queryByText("dashboard.title")).not.toBeInTheDocument();
  });

  it("renders the empty state when ?empty=true is present", () => {
    (useSearchParams as any).mockReturnValue({
      has: vi.fn((key) => key === "empty"),
      getAll: vi.fn().mockReturnValue([]),
      get: vi.fn().mockReturnValue(null),
    });

    render(<Dashboard />);
    
    expect(screen.getByText("dashboard.emptyMessage")).toBeInTheDocument();
    expect(screen.queryByText("dashboard.title")).not.toBeInTheDocument();
  });
});
