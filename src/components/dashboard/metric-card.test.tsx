import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricCard } from "./metric-card";
import type { Metric, Tone } from "./types";

const baseMetric: Metric = {
  label: "Total earnings",
  value: "1,240 XLM",
  detail: "Across 12 settled bookings this month.",
  tone: "positive",
};

function renderCard(metric: Partial<Metric> = {}) {
  return render(<MetricCard metric={{ ...baseMetric, ...metric }} />);
}

describe("MetricCard", () => {
  it("renders the label, value and detail", () => {
    renderCard();
    expect(screen.getByText("Total earnings")).toBeInTheDocument();
    expect(screen.getByText("1,240 XLM")).toBeInTheDocument();
    expect(
      screen.getByText("Across 12 settled bookings this month."),
    ).toBeInTheDocument();
  });

  it.each([
    ["neutral", "Stable"],
    ["positive", "On track"],
    ["warning", "Needs review"],
    ["critical", "Needs attention"],
    ["muted", "No signal"],
  ] as Array<[Tone, string]>)("maps the %s tone to its status label", (tone, label) => {
    renderCard({ tone });
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("wires the card to its label, value, detail and status ids", () => {
    const { container } = renderCard();
    const card = container.querySelector("article.card") as HTMLElement;

    expect(card).toBeInTheDocument();
    expect(card.getAttribute("aria-labelledby")).toBe("metric-total-earnings-label");
    expect(card.getAttribute("aria-describedby")).toBe(
      "metric-total-earnings-value metric-total-earnings-detail metric-total-earnings-status",
    );

    for (const id of [
      "metric-total-earnings-label",
      "metric-total-earnings-value",
      "metric-total-earnings-detail",
      "metric-total-earnings-status",
    ]) {
      expect(container.querySelector(`#${id}`)).toBeInTheDocument();
    }
  });

  it("normalises the metric label into a stable element id", () => {
    const { container } = renderCard({ label: "Net   Revenue / Q1!" });
    expect(container.querySelector("#metric-net-revenue-q1-label")).toBeInTheDocument();
  });

  it("does not crash on a label made only of non-alphanumeric characters", () => {
    const { container } = renderCard({ label: "!!!" });
    // All characters are stripped, leaving the "metric-" prefix.
    expect(container.querySelector("#metric--label")).toBeInTheDocument();
    expect(screen.getByText("!!!")).toBeInTheDocument();
  });

  it("announces value changes politely", () => {
    renderCard();
    const value = screen.getByText("1,240 XLM");
    expect(value).toHaveAttribute("aria-live", "polite");
    expect(value).toHaveAttribute("aria-atomic", "true");
  });

  it("labels the status chip with the metric label and tone", () => {
    renderCard({ tone: "critical" });
    expect(
      screen.getByLabelText("Total earnings status: Needs attention"),
    ).toBeInTheDocument();
  });

  it("shows a sample badge only for sample metrics", () => {
    const { container, unmount } = renderCard();
    expect(container.querySelector("[data-sample-badge]")).toBeNull();
    unmount();

    const sampled = renderCard({ isSample: true });
    expect(
      sampled.container.querySelector("[data-sample-badge]"),
    ).toBeInTheDocument();
  });

  it("renders the earnings breakdown only when it has segments", () => {
    const { unmount } = renderCard();
    expect(screen.queryByRole("region", { name: "Earnings breakdown" })).toBeNull();
    unmount();

    // An explicitly empty breakdown must not render the chart.
    const empty = renderCard({ breakdown: [] });
    expect(empty.queryByRole("region", { name: "Earnings breakdown" })).toBeNull();
    empty.unmount();

    renderCard({
      breakdown: [
        {
          id: "bookings",
          label: "Bookings",
          value: 900,
          formattedValue: "900 XLM",
          colorClass: "bg-cyan-500",
        },
        {
          id: "tips",
          label: "Tips",
          value: 340,
          formattedValue: "340 XLM",
          colorClass: "bg-emerald-500",
        },
      ],
    });
    expect(
      screen.getByRole("region", { name: "Earnings breakdown" }),
    ).toBeInTheDocument();
  });

  it("skips the chart when every segment is zero but still renders the metric", () => {
    renderCard({
      breakdown: [
        {
          id: "bookings",
          label: "Bookings",
          value: 0,
          formattedValue: "0 XLM",
          colorClass: "bg-cyan-500",
        },
      ],
    });
    expect(screen.queryByRole("region", { name: "Earnings breakdown" })).toBeNull();
    expect(screen.getByText("Total earnings")).toBeInTheDocument();
  });
});
