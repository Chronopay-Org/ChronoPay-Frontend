/**
 * Regression tests for SentimentSparkline (issue #999).
 *
 * Focused regression suite covering the failure modes that previously broke
 * dashboard rendering: empty series, single-point series, all-same values,
 * and accessibility labels.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SentimentSparkline } from "./sentiment-sparkline";
import type { SentimentDataPoint } from "./types";

const SAMPLE: SentimentDataPoint[] = [
  { period: "2026-07-01", positive: 30, mixed: 10, critical: 5 },
  { period: "2026-07-08", positive: 48, mixed: 17, critical: 9 },
];

describe("SentimentSparkline regression", () => {
  it("renders the sparkline for a normal series", () => {
    render(<SentimentSparkline data={SAMPLE} />);
    expect(screen.getByTestId("sentiment-sparkline")).toBeInTheDocument();
  });

  it("renders the empty-state testid when data is empty", () => {
    render(<SentimentSparkline data={[]} />);
    expect(screen.getByTestId("sentiment-sparkline-empty")).toBeInTheDocument();
  });

  it("renders without crashing on a single data point", () => {
    render(
      <SentimentSparkline
        data={[{ period: "2026-07-20", positive: 48, mixed: 17, critical: 9 }]}
      />
    );
    expect(screen.getByTestId("sentiment-sparkline")).toBeInTheDocument();
  });

  it("renders without crashing when all values are identical", () => {
    const same: SentimentDataPoint[] = [
      { period: "2026-07-01", positive: 10, mixed: 10, critical: 10 },
      { period: "2026-07-08", positive: 10, mixed: 10, critical: 10 },
    ];
    render(<SentimentSparkline data={same} />);
    expect(screen.getByTestId("sentiment-sparkline")).toBeInTheDocument();
  });

  it("exposes an accessible img role with a non-empty aria-label", () => {
    render(<SentimentSparkline data={SAMPLE} />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("aria-label")).toBeTruthy();
  });

  it("honours a custom label prop", () => {
    render(<SentimentSparkline data={SAMPLE} label="Weekly sentiment" />);
    expect(screen.getByLabelText("Weekly sentiment")).toBeInTheDocument();
  });
});
