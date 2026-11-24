import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricCard } from "./metric-card";
import type { EarningsSegment, Metric, Tone } from "./types";

const baseMetric: Metric = {
  label: "Active Bookings",
  value: "24",
  detail: "Up 12% from last week",
  tone: "neutral",
};

const sampleBreakdown: EarningsSegment[] = [
  {
    id: "settled",
    label: "Settled",
    value: 700,
    formattedValue: "700 XLM",
    colorClass: "bg-cyan-400",
  },
  {
    id: "escrowed",
    label: "Escrowed",
    value: 300,
    formattedValue: "300 XLM",
    colorClass: "bg-amber-400",
  },
];

describe("MetricCard", () => {
  describe("accessible naming and element IDs", () => {
    it("sanitizes metric.label into predictable element IDs and wires aria-labelledby and aria-describedby", () => {
      render(
        <MetricCard
          metric={{
            ...baseMetric,
            label: "Active Bookings!",
            tone: "positive",
          }}
        />
      );

      const card = screen.getByRole("article", { name: "Active Bookings!" });
      expect(card).toHaveAttribute(
        "aria-labelledby",
        "metric-active-bookings-label"
      );
      expect(card).toHaveAttribute(
        "aria-describedby",
        "metric-active-bookings-value metric-active-bookings-detail metric-active-bookings-status"
      );

      expect(screen.getByText("Active Bookings!")).toHaveAttribute(
        "id",
        "metric-active-bookings-label"
      );
      expect(screen.getByText("24")).toHaveAttribute(
        "id",
        "metric-active-bookings-value"
      );
      expect(screen.getByText("Up 12% from last week")).toHaveAttribute(
        "id",
        "metric-active-bookings-detail"
      );

      const statusChip = screen.getByLabelText(
        "Active Bookings! status: On track"
      );
      expect(statusChip).toHaveAttribute("id", "metric-active-bookings-status");
      expect(statusChip).toHaveTextContent("On track");
    });

    it("trims leading and trailing non-alphanumeric characters when generating IDs", () => {
      render(
        <MetricCard
          metric={{
            ...baseMetric,
            label: "  $$Total Earnings (30d)!!  ",
          }}
        />
      );

      expect(screen.getByText("$$Total Earnings (30d)!!")).toHaveAttribute(
        "id",
        "metric-total-earnings-30d-label"
      );
    });
  });

  describe("tone labels", () => {
    const toneCases: Array<[Tone, string]> = [
      ["neutral", "Stable"],
      ["positive", "On track"],
      ["warning", "Needs review"],
      ["critical", "Needs attention"],
      ["muted", "No signal"],
    ];

    it.each(toneCases)(
      "renders %s tone with status label %s",
      (tone, expectedLabel) => {
        render(<MetricCard metric={{ ...baseMetric, tone }} />);

        const statusChip = screen.getByLabelText(
          `${baseMetric.label} status: ${expectedLabel}`
        );
        expect(statusChip).toHaveTextContent(expectedLabel);
      }
    );
  });

  describe("conditional sample badge", () => {
    it("does not render SampleBadge when isSample is omitted or false", () => {
      const { container, rerender } = render(<MetricCard metric={baseMetric} />);
      expect(container.querySelector("[data-sample-badge]")).toBeNull();
      expect(screen.queryByText("Sample")).not.toBeInTheDocument();

      rerender(<MetricCard metric={{ ...baseMetric, isSample: false }} />);
      expect(container.querySelector("[data-sample-badge]")).toBeNull();
      expect(screen.queryByText("Sample")).not.toBeInTheDocument();
    });

    it("renders SampleBadge when isSample is true", () => {
      const { container } = render(
        <MetricCard metric={{ ...baseMetric, isSample: true }} />
      );
      expect(container.querySelector("[data-sample-badge]")).toBeInTheDocument();
      expect(screen.getByText("Sample")).toBeInTheDocument();
    });
  });

  describe("conditional earnings chart", () => {
    it("does not render EarningsChart when breakdown is omitted or empty", () => {
      const { rerender } = render(<MetricCard metric={baseMetric} />);
      expect(
        screen.queryByRole("region", { name: "Earnings breakdown" })
      ).not.toBeInTheDocument();

      rerender(<MetricCard metric={{ ...baseMetric, breakdown: [] }} />);
      expect(
        screen.queryByRole("region", { name: "Earnings breakdown" })
      ).not.toBeInTheDocument();
    });

    it("renders EarningsChart when breakdown has items", () => {
      render(
        <MetricCard metric={{ ...baseMetric, breakdown: sampleBreakdown }} />
      );

      expect(
        screen.getByRole("region", { name: "Earnings breakdown" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("progressbar", { name: "Settled: 700 XLM" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("progressbar", { name: "Escrowed: 300 XLM" })
      ).toBeInTheDocument();
    });
  });
});
