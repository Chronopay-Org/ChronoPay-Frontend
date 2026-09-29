/**
 * Regression suite for StatusChip.
 *
 * The chip is a pure presentational primitive, so the contract worth pinning is
 * its class output and its attribute pass-through:
 * - the base class list every chip carries,
 * - the exact token set each of the five tones maps to,
 * - the `className` merge order (base, tone, caller),
 * - rest-prop forwarding onto the <span>, including handlers,
 * - what an out-of-range tone does — it silently interpolates `undefined` into
 *   the class list rather than throwing, which is recorded here explicitly.
 */

import { describe, it, expect, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { StatusChip } from "@/app/components/ui/status-chip";

const BASE_CLASSES = [
  "inline-flex",
  "items-center",
  "rounded-full",
  "border",
  "px-3",
  "py-1",
  "text-xs",
  "font-medium",
  "tracking-[0.14em]",
  "uppercase",
];

const TONE_CLASSES = {
  info: ["border-cyan-300/25", "bg-cyan-300/12", "text-cyan-100"],
  warning: ["border-amber-300/25", "bg-amber-300/12", "text-amber-100"],
  success: ["border-emerald-300/25", "bg-emerald-300/12", "text-emerald-100"],
  danger: ["border-rose-300/25", "bg-rose-300/12", "text-rose-100"],
  neutral: ["border-white/10", "bg-white/6", "text-slate-200"],
} as const;

/** Renders a chip and returns the underlying <span>. */
function renderChip(props: Parameters<typeof StatusChip>[0]) {
  const { container } = render(<StatusChip {...props} />);
  const span = container.querySelector("span");
  if (!span) throw new Error("StatusChip did not render a span");
  return span;
}

describe("StatusChip", () => {
  describe("rendering", () => {
    it("renders a span element", () => {
      expect(renderChip({ children: "Active" }).tagName).toBe("SPAN");
    });

    it("renders its children", () => {
      const span = renderChip({ children: "Active" });
      expect(span).toHaveTextContent("Active");
    });

    it("renders nothing but the span when children is an empty string", () => {
      const span = renderChip({ children: "" });
      expect(span).toBeInTheDocument();
      expect(span.textContent).toBe("");
    });

    it("renders element children", () => {
      const span = renderChip({ children: <strong>Bold</strong> });
      expect(span.querySelector("strong")).toHaveTextContent("Bold");
    });

    it("renders multiple children in order", () => {
      const span = renderChip({ children: ["A", <em key="b">B</em>, "C"] });
      expect(span.textContent).toBe("ABC");
    });
  });

  describe("base classes", () => {
    it("carries the shared chip layout classes regardless of tone", () => {
      for (const tone of Object.keys(TONE_CLASSES) as (keyof typeof TONE_CLASSES)[]) {
        expect(renderChip({ tone, children: "x" })).toHaveClass(...BASE_CLASSES);
      }
    });

    it("applies the layout classes before the tone classes", () => {
      const className = renderChip({ tone: "info", children: "x" }).className;
      expect(className.indexOf("inline-flex")).toBeLessThan(className.indexOf("text-cyan-100"));
    });
  });

  describe("tone mapping", () => {
    for (const [tone, classes] of Object.entries(TONE_CLASSES)) {
      it(`maps tone="${tone}" to its token set`, () => {
        expect(renderChip({ tone: tone as keyof typeof TONE_CLASSES, children: "x" })).toHaveClass(
          ...classes,
        );
      });
    }

    it("defaults to neutral when no tone is given", () => {
      const span = renderChip({ children: "x" });
      expect(span).toHaveClass(...TONE_CLASSES.neutral);
      expect(span).not.toHaveClass(...TONE_CLASSES.danger);
    });

    it("applies exactly one tone's tokens at a time", () => {
      const span = renderChip({ tone: "success", children: "x" });
      const others = Object.entries(TONE_CLASSES)
        .filter(([name]) => name !== "success")
        .flatMap(([, classes]) => classes);
      expect(span).not.toHaveClass(...others);
    });

    it("treats an empty-string tone as unmapped (falsy boundary)", () => {
      // `toneClasses[""]` is undefined, so the class list gains an "undefined"
      // token. Recorded rather than corrected: the prop is a closed union, so
      // this can only be reached by an explicit cast.
      const span = renderChip({ tone: "" as never, children: "x" });
      expect(span.className.split(/\s+/)).toContain("undefined");
    });

    it("does not throw on an out-of-range tone value", () => {
      expect(() => renderChip({ tone: "brand-new" as never, children: "x" })).not.toThrow();
    });
  });

  describe("className merging", () => {
    it("produces the exact class string for the default case", () => {
      const span = renderChip({ children: "x" });
      expect(span.className).toBe(
        `${BASE_CLASSES.join(" ")} ${TONE_CLASSES.neutral.join(" ")} `,
      );
    });

    it("appends caller classes after the tone classes", () => {
      const span = renderChip({ tone: "danger", className: "ml-2", children: "x" });
      const className = span.className;
      expect(className).toMatch(/ml-2$/);
      expect(className.indexOf("text-rose-100")).toBeLessThan(className.indexOf("ml-2"));
    });

    it("adds no extra whitespace-free token when className is omitted", () => {
      const span = renderChip({ children: "x" });
      expect(span.className.trim().split(/\s+/)).toHaveLength(
        BASE_CLASSES.length + TONE_CLASSES.neutral.length,
      );
    });

    it("keeps caller classes alongside the base and tone classes", () => {
      const span = renderChip({ tone: "warning", className: "w-full", children: "x" });
      expect(span).toHaveClass(...BASE_CLASSES, ...TONE_CLASSES.warning, "w-full");
    });

    it("emits a single class attribute (className is not forwarded twice)", () => {
      const span = renderChip({ className: "ml-2", children: "x" });
      expect(span.getAttribute("class")).toBe(span.className);
      expect(span.className.match(/ml-2/g)).toHaveLength(1);
    });
  });

  describe("rest-prop forwarding", () => {
    it("forwards data attributes", () => {
      const span = renderChip({ "data-testid": "chip", children: "x" } as never);
      expect(span).toHaveAttribute("data-testid", "chip");
    });

    it("forwards id and title", () => {
      const span = renderChip({ id: "status-1", title: "Current status", children: "x" });
      expect(span).toHaveAttribute("id", "status-1");
      expect(span).toHaveAttribute("title", "Current status");
    });

    it("forwards aria attributes", () => {
      const span = renderChip({ "aria-label": "Status: active", children: "x" } as never);
      expect(span).toHaveAttribute("aria-label", "Status: active");
    });

    it("forwards event handlers", () => {
      const onClick = vi.fn();
      const span = renderChip({ onClick, children: "x" });
      fireEvent.click(span);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("still renders the computed class list when a className is also forwarded", () => {
      const span = renderChip({ className: "ml-2", children: "x" });
      expect(span).toHaveClass(...BASE_CLASSES);
    });
  });
});
