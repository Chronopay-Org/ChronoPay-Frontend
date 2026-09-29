import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SharedReceiptPage from "./page";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/components/dashboard-shell", () => ({
  DashboardShell: ({ children }: { children: ReactNode }) => (
    <main>{children}</main>
  ),
}));

vi.mock("@/app/components/ui/breadcrumb-overflow", () => ({
  BreadcrumbOverflow: ({ items }: { items: { label: string }[] }) => (
    <nav aria-label="Breadcrumb">
      {items.map((item) => (
        <span key={item.label}>{item.label}</span>
      ))}
    </nav>
  ),
}));

vi.mock("@/components/dashboard/status-chip", () => ({
  StatusChip: ({ children }: { children: ReactNode }) => (
    <span>{children}</span>
  ),
}));

vi.mock("@/app/components/ui/tooltip", () => ({
  Tooltip: ({
    children,
    content,
  }: {
    children: ReactNode;
    content: string;
  }) => <span title={content}>{children}</span>,
}));

describe("SharedReceiptPage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders shared query details and a calculated fee breakdown", () => {
    render(
      <SharedReceiptPage
        params={Promise.resolve({ id: "slot-42" })}
        searchParams={Promise.resolve({
          asset: ["ART-42", "ignored-asset"],
          tx: ["abc123...xyz789", "ignored-hash"],
          buyer: "A. B.",
          seller: "C. D.",
          total: "100.00 USDC",
          settled: "2026-09-29",
        })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Shared Receipt" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ART-42")).toBeInTheDocument();
    expect(screen.queryByText("ignored-asset")).not.toBeInTheDocument();
    expect(screen.getByText("abc123...xyz789")).toBeInTheDocument();
    expect(screen.getByText("A. B.")).toBeInTheDocument();
    expect(screen.getByText("C. D.")).toBeInTheDocument();
    expect(screen.getByText("2026-09-29")).toBeInTheDocument();
    expect(screen.getByText("98.00 USDC")).toBeInTheDocument();
    expect(screen.getByText("2.00 USDC")).toBeInTheDocument();
    expect(screen.getByText("1.50 USDC")).toBeInTheDocument();
    expect(screen.getByText("0.50 USDC")).toBeInTheDocument();
    expect(screen.getByText("100.00 USDC")).toBeInTheDocument();
  });

  it("shows the empty receipt state when no usable query details are provided", () => {
    render(
      <SharedReceiptPage
        params={Promise.resolve({ id: "slot-42" })}
        searchParams={Promise.resolve({ asset: "", tx: [], buyer: undefined })}
      />,
    );

    expect(
      screen.getByText("This shared link has no receipt details to display."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Fee Breakdown")).not.toBeInTheDocument();
    expect(screen.getByText("Settled")).toBeInTheDocument();
  });

  it("handles a malformed total deterministically with zero fees and the default currency", () => {
    render(
      <SharedReceiptPage
        params={Promise.resolve({ id: "slot-42" })}
        searchParams={Promise.resolve({
          asset: "ART-42",
          total: ["not-a-total", "500 XLM"],
        })}
      />,
    );

    expect(screen.getByText("ART-42")).toBeInTheDocument();
    expect(screen.getByText("0.00 USDC")).toBeInTheDocument();
    expect(screen.getAllByText("0.00 USDC")).toHaveLength(5);
    expect(screen.queryByText("500 XLM")).not.toBeInTheDocument();
  });

  it("transitions from stale to refreshing and back to a fresh estimate", () => {
    vi.useFakeTimers();
    render(
      <SharedReceiptPage
        params={Promise.resolve({ id: "slot-42" })}
        searchParams={Promise.resolve({ total: "10 XLM" })}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(
      screen.getByTitle("Estimate may be outdated due to network volatility."),
    ).toBeInTheDocument();

    const refreshButton = screen.getByRole("button", {
      name: "Refresh network fee estimate",
    });
    fireEvent.click(refreshButton);
    expect(refreshButton.querySelector("svg")).toHaveClass("animate-spin");

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(refreshButton.querySelector("svg")).not.toHaveClass("animate-spin");
    expect(
      screen.queryByTitle(
        "Estimate may be outdated due to network volatility.",
      ),
    ).not.toBeInTheDocument();
  });
});
