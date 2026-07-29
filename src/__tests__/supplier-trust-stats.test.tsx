import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SupplierTrustStats } from "@/components/dashboard/supplier-trust-stats";
import type { TrustMetric } from "@/components/dashboard/types";

const validResponseTime: TrustMetric = {
  id: "response-time",
  label: "Response time",
  value: "2.4",
  unit: "min",
  trend: "up",
  tooltip: "Median time between receiving a booking request and responding.",
  tone: "positive",
  history: { values: [4.1, 3.8, 3.2, 2.9, 2.7, 2.5, 2.4] },
};

const validAcceptanceRate: TrustMetric = {
  id: "acceptance-rate",
  label: "Acceptance rate",
  value: "94",
  unit: "%",
  trend: "stable",
  tooltip: "Percentage of booking requests accepted.",
  tone: "positive",
  history: { values: [88, 91, 90, 93, 92, 94] },
};

const emptyResponseTime: TrustMetric = {
  id: "response-time",
  label: "Response time",
  value: "—",
  unit: "min",
  trend: "stable",
  tooltip: "Median time between receiving a booking request and responding.",
  tone: "neutral",
  history: { values: [] },
};

const emptyAcceptanceRate: TrustMetric = {
  id: "acceptance-rate",
  label: "Acceptance rate",
  value: "—",
  unit: "%",
  trend: "stable",
  tooltip: "Percentage of booking requests accepted.",
  tone: "neutral",
  history: { values: [] },
};

describe("SupplierTrustStats", () => {
  it("renders both trust metric tiles with valid data", () => {
    render(
      <SupplierTrustStats
        responseTime={validResponseTime}
        acceptanceRate={validAcceptanceRate}
      />,
    );

    expect(screen.getByText(/Response time/i)).toBeInTheDocument();
    expect(screen.getByText(/Acceptance rate/i)).toBeInTheDocument();
  });

  it("displays the metric values and units", () => {
    render(
      <SupplierTrustStats
        responseTime={validResponseTime}
        acceptanceRate={validAcceptanceRate}
      />,
    );

    expect(screen.getByText(/2.4/)).toBeInTheDocument();
    expect(screen.getByText(/94/)).toBeInTheDocument();
    expect(screen.getByText(/min/)).toBeInTheDocument();
    expect(screen.getByText(/%/)).toBeInTheDocument();
  });

  it("shows 'Last 30 days' microcopy for tiles", () => {
    render(
      <SupplierTrustStats
        responseTime={validResponseTime}
        acceptanceRate={validAcceptanceRate}
      />,
    );

    const labels = screen.getAllByText(/Last 30 days/i);
    // 2 visible tiles + 1 sr-only group label = 3 matches
    expect(labels.length).toBeGreaterThanOrEqual(2);
  });

  it("has accessible region role", () => {
    render(
      <SupplierTrustStats
        responseTime={validResponseTime}
        acceptanceRate={validAcceptanceRate}
      />,
    );

    const region = screen.getByRole("region");
    expect(region).toBeInTheDocument();
  });

  it("shows no-data state when history has fewer than 2 points", () => {
    render(
      <SupplierTrustStats
        responseTime={emptyResponseTime}
        acceptanceRate={emptyAcceptanceRate}
      />,
    );

    const insufficientElements = screen.getAllByText(/Insufficient data/i);
    expect(insufficientElements.length).toBe(2);
    const moreElements = screen.getAllByText(/More bookings are needed/i);
    expect(moreElements.length).toBe(2);
  });

  it("renders valid tiles when data exists and no-data tiles when empty", () => {
    render(
      <SupplierTrustStats
        responseTime={validResponseTime}
        acceptanceRate={emptyAcceptanceRate}
      />,
    );

    // Response time tile should show data
    expect(screen.getByText(/2.4/)).toBeInTheDocument();
    // Acceptance rate should show no-data
    expect(screen.getByText(/Insufficient data/i)).toBeInTheDocument();
  });
});
