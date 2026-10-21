import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  AvailabilityLegend,
  type AvailabilityLegendProps,
  type AvailabilityStatus,
} from "./availability-legend";

const STATUS_COPY: Record<AvailabilityStatus, { label: string; description: string }> = {
  open: { label: "Open", description: "Available for booking" },
  held: { label: "Held", description: "Temporarily reserved" },
  sold: { label: "Sold", description: "Fully booked" },
  blocked: { label: "Blocked", description: "Not available" },
};

function renderLegend(props: AvailabilityLegendProps = {}) {
  return render(<AvailabilityLegend {...props} />);
}

function getLegend(container: HTMLElement): HTMLElement {
  const legend = container.querySelector<HTMLElement>('[aria-label="Availability status legend"]');
  if (!legend) throw new Error("legend container was not rendered");
  return legend;
}

describe("AvailabilityLegend", () => {
  describe("status coverage", () => {
    it("renders a label and description for every AvailabilityStatus", () => {
      renderLegend();

      for (const { label, description } of Object.values(STATUS_COPY)) {
        expect(screen.getByText(label)).toBeInTheDocument();
        expect(screen.getByText(description)).toBeInTheDocument();
      }
    });

    it("renders all four statuses rather than a subset", () => {
      const { container } = renderLegend();

      const legend = getLegend(container);
      const swatches = legend.querySelectorAll('[aria-hidden="true"]');

      expect(swatches).toHaveLength(4);
    });
  });

  describe("accessibility", () => {
    it("exposes the legend through an accessible name and role", () => {
      const { container } = renderLegend();

      const legend = getLegend(container);

      expect(legend).toHaveAttribute("role", "legend");
      expect(legend).toHaveAttribute("aria-label", "Availability status legend");
    });

    it("hides the decorative colour swatches from assistive technology", () => {
      const { container } = renderLegend();

      const legend = getLegend(container);
      const swatches = Array.from(legend.querySelectorAll('[aria-hidden="true"]'));

      expect(swatches.length).toBeGreaterThan(0);
      for (const swatch of swatches) {
        expect(swatch).toHaveAttribute("aria-hidden", "true");
      }
    });
  });

  describe("layout variants", () => {
    it("defaults to the horizontal variant", () => {
      const { container } = renderLegend();

      const legend = getLegend(container);

      expect(legend.className).toContain("flex-wrap");
      expect(legend.className).not.toContain("flex-col");
    });

    it("stacks the items in the vertical variant", () => {
      const { container } = renderLegend({ variant: "vertical" });

      const legend = getLegend(container);

      expect(legend.className).toContain("flex-col");
      expect(legend.className).not.toContain("flex-wrap");
    });

    it("falls back to the vertical layout for an unknown variant", () => {
      const { container } = renderLegend({
        variant: "diagonal" as unknown as AvailabilityLegendProps["variant"],
      });

      const legend = getLegend(container);

      expect(legend.className).toContain("flex-col");
    });
  });

  describe("boundary inputs", () => {
    it("renders with the default className when none is supplied", () => {
      const { container } = renderLegend();

      expect(getLegend(container).className).not.toContain("undefined");
    });

    it("merges a caller supplied className with the base styles", () => {
      const { container } = renderLegend({ className: "mt-6" });

      const legend = getLegend(container);

      expect(legend.className).toContain("mt-6");
      expect(legend.className).toContain("rounded-xl");
    });

    it("still renders every status when an empty className is passed", () => {
      renderLegend({ className: "" });

      expect(screen.getByText("Open")).toBeInTheDocument();
      expect(screen.getByText("Blocked")).toBeInTheDocument();
    });
  });
});
