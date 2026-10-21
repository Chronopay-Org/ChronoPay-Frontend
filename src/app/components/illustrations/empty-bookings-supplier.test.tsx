/**
 * Focused behavior coverage for EmptyBookingsSupplier
 * (src/app/components/illustrations/empty-bookings-supplier.tsx).
 *
 * Exercises the public contract of the component:
 *  - the accessible SVG surface (role/aria-label/namespace)
 *  - the default 240x200 canvas and prop-driven sizing (number + string)
 *  - className forwarding (including the empty default)
 *  - the supplier role color scheme in light mode and the dark-mode CSS vars
 *  - the inbox tray geometry and gradient definition
 *  - boundary inputs (0 / negative / very large sizes) stay deterministic
 *  - the illustrations barrel re-exports the same component
 *  - axe-core accessibility audit
 */

import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import {
  EmptyBookingsSupplier,
  type EmptyBookingsSupplierProps,
} from "./empty-bookings-supplier";
import { EmptyBookingsSupplier as BarrelSupplier } from "./index";
import { ILLUSTRATION_TOKENS, ROLE_COLOR_SCHEMES } from "./illustration-tokens";

expect.extend(toHaveNoViolations);

const SUPPLIER_ARIA_LABEL = "Empty inbox tray - no bookings received yet";

const getSvg = (container: HTMLElement): SVGElement => {
  const svg = container.querySelector("svg");
  expect(svg).not.toBeNull();
  return svg as SVGElement;
};

describe("EmptyBookingsSupplier", () => {
  describe("accessible SVG surface", () => {
    it("renders a single svg with role=img and the supplier aria-label", () => {
      const { container } = render(<EmptyBookingsSupplier />);
      const svgs = container.querySelectorAll("svg");
      expect(svgs).toHaveLength(1);

      const svg = getSvg(container);
      expect(svg).toHaveAttribute("role", "img");
      expect(svg).toHaveAttribute("aria-label", SUPPLIER_ARIA_LABEL);
      expect(svg.tagName.toLowerCase()).toBe("svg");
    });

    it("keeps the supplier aria-label distinct from the buyer/admin illustrations", async () => {
      const { EmptyBookingsBuyer } = await import("./empty-bookings-buyer");
      const { EmptyBookingsAdmin } = await import("./empty-bookings-admin");

      const buyer = render(<EmptyBookingsBuyer />);
      const admin = render(<EmptyBookingsAdmin />);

      expect(getSvg(buyer.container)).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Calendar"),
      );
      expect(getSvg(admin.container)).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Dashboard"),
      );
    });
  });

  describe("canvas sizing", () => {
    it("uses the documented 240x200 default canvas", () => {
      const { container } = render(<EmptyBookingsSupplier />);
      const svg = getSvg(container);
      expect(svg).toHaveAttribute("viewBox", "0 0 240 200");
      expect(svg).toHaveAttribute("width", "240");
      expect(svg).toHaveAttribute("height", "200");
    });

    it("applies numeric width/height overrides", () => {
      const { container } = render(<EmptyBookingsSupplier width={320} height={240} />);
      const svg = getSvg(container);
      expect(svg).toHaveAttribute("width", "320");
      expect(svg).toHaveAttribute("height", "240");
      // The viewBox stays fixed so the drawing scales with the element.
      expect(svg).toHaveAttribute("viewBox", "0 0 240 200");
    });

    it("applies string width/height overrides for responsive layouts", () => {
      const { container } = render(<EmptyBookingsSupplier width="100%" height="12rem" />);
      const svg = getSvg(container);
      expect(svg).toHaveAttribute("width", "100%");
      expect(svg).toHaveAttribute("height", "12rem");
    });

    it("accepts only the declared prop shape", () => {
      const props: EmptyBookingsSupplierProps = {
        width: 100,
        height: "50%",
        className: "mx-auto",
      };
      const { container } = render(<EmptyBookingsSupplier {...props} />);
      expect(getSvg(container)).toHaveClass("mx-auto");
    });
  });

  describe("className forwarding", () => {
    it("defaults to an empty className", () => {
      const { container } = render(<EmptyBookingsSupplier />);
      expect(getSvg(container).getAttribute("class") || "").toBe("");
    });

    it("preserves a caller-provided className", () => {
      const { container } = render(
        <EmptyBookingsSupplier className="text-cyan-500 custom-illustration" />,
      );
      expect(getSvg(container)).toHaveClass("custom-illustration");
    });
  });

  describe("boundary inputs", () => {
    it("renders deterministically for zero and negative sizes", () => {
      const zero = render(<EmptyBookingsSupplier width={0} height={0} />);
      expect(getSvg(zero.container)).toHaveAttribute("width", "0");

      const negative = render(<EmptyBookingsSupplier width={-10} height={-10} />);
      expect(getSvg(negative.container)).toHaveAttribute("width", "-10");
      // The static canvas geometry is unaffected by the prop override.
      expect(getSvg(negative.container).querySelectorAll("path").length).toBeGreaterThan(0);
    });

    it("renders several instances side by side without shared mutable state", () => {
      const { container } = render(
        <>
          <EmptyBookingsSupplier />
          <EmptyBookingsSupplier width={120} />
          <EmptyBookingsSupplier className="third" />
        </>,
      );
      const svgs = container.querySelectorAll("svg");
      expect(svgs).toHaveLength(3);
      expect(svgs[0]).toHaveAttribute("width", "240");
      expect(svgs[1]).toHaveAttribute("width", "120");
      expect(svgs[2]).toHaveClass("third");
    });
  });

  describe("color tokens", () => {
    it("paints light mode with the supplier role color scheme", () => {
      const { container } = render(<EmptyBookingsSupplier />);
      const html = container.innerHTML;
      const supplier = ROLE_COLOR_SCHEMES.supplier;

      expect(supplier.accent).toBe(ILLUSTRATION_TOKENS.INBOX_ACCENT_LIGHT);
      expect(html).toContain(supplier.accent);
      expect(html).toContain(supplier.secondary);
      expect(html).toContain(ILLUSTRATION_TOKENS.SURFACE_LIGHT);
    });

    it("wires dark-mode CSS variable classes for surface, accent and gradient stops", () => {
      const { container } = render(<EmptyBookingsSupplier />);
      const svg = getSvg(container);
      const html = svg.innerHTML;

      expect(html).toContain("dark:fill-[var(--illus-surface-dark)]");
      expect(html).toContain("dark:stroke-[var(--illus-accent-dark-supplier)]");
      expect(html).toContain("dark:stroke-[var(--illus-secondary-dark)]");
      expect(html).toContain("dark:stop-color-[var(--illus-color-supplier-grad-start)]");
      expect(html).toContain("dark:stop-color-[var(--illus-color-supplier-grad-end)]");
    });
  });

  describe("geometry", () => {
    it("defines a referenceable supplier gradient plus surface rectangles", () => {
      const { container } = render(<EmptyBookingsSupplier />);
      const svg = getSvg(container);

      const gradient = svg.querySelector("linearGradient#supplier-gradient");
      expect(gradient).not.toBeNull();
      expect(svg.querySelectorAll("linearGradient stop")).toHaveLength(2);
      expect(svg.querySelector('rect[fill="url(#supplier-gradient)"]')).not.toBeNull();
    });

    it("renders the inbox tray outline, rim and slot dividers", () => {
      const { container } = render(<EmptyBookingsSupplier />);
      const svg = getSvg(container);

      const tray = svg.querySelector('path[d^="M 50 70"]');
      expect(tray).not.toBeNull();
      expect(tray).toHaveAttribute("fill", "none");

      const rim = svg.querySelector('path[d="M 55 60 L 185 60"]');
      expect(rim).toHaveAttribute("stroke-linecap", "round");

      // Two dashed vertical dividers plus the horizontal guideline.
      expect(svg.querySelectorAll("line[stroke-dasharray]")).toHaveLength(3);
    });
  });

  describe("barrel export", () => {
    it("re-exports the same component from the illustrations index", () => {
      expect(BarrelSupplier).toBe(EmptyBookingsSupplier);
    });
  });

  describe("accessibility audit", () => {
    it("passes an axe scan", async () => {
      const { container } = render(<EmptyBookingsSupplier />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
