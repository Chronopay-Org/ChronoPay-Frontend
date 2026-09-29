/**
 * PlanComparison + validatePlans regression suite.
 *
 * Why this file exists
 * --------------------
 * `validatePlans` owns the component's explicit failure contract: every
 * malformed input throws an `Error` with a fixed, user-visible message. Those
 * guards were previously exercised only indirectly (a single `toThrow()` with
 * no message assertion), so a silent change to a guard — or to its message —
 * could ship without a single test going red. This suite pins the return/throw
 * contract of every branch and covers the neighbouring normal and boundary
 * paths of the component that consumes it.
 *
 * Cases covered
 * -------------
 * validatePlans — failure path
 *   - non-array input (null, undefined, object, string, number, boolean)
 *   - non-string / missing `id`
 *   - non-string / missing `name`
 *   - non-numeric `monthlyPrice`, non-numeric `yearlyPrice`
 *   - non-array `features`
 *   - first malformed plan wins (deterministic, order-dependent)
 * validatePlans — success + boundary path
 *   - well-formed list, empty list
 *   - identity, order and unknown-property preservation
 *   - boundary-but-accepted values (empty identifiers, NaN prices, no features)
 * PlanComparison — normal path
 *   - renders plans/prices, billing toggle, savings label, CTA callback,
 *     recommended plan from both `isRecommended` and `recommendedPlanId`
 * PlanComparison — boundary path
 *   - empty list → empty state, malformed data → alert (never throws),
 *     no yearly discount → no savings label
 *   - axe accessibility audit
 */

import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { axe } from "jest-axe";

import PlanComparison, {
  validatePlans,
  type PricingPlan,
} from "@/components/dashboard/plan-comparison";

// ─────────────────────────────────────────────────────────────────────────
// Fixtures + helpers
// ─────────────────────────────────────────────────────────────────────────

function makePlan(overrides: Partial<PricingPlan> = {}): PricingPlan {
  return {
    id: "starter",
    name: "Starter",
    tagline: "For individuals",
    monthlyPrice: 1000, // $10.00
    yearlyPrice: 10000, // $100.00 → 17% cheaper than 12 × monthly
    ctaLabel: "Buy Starter",
    ctaHref: "/signup?plan=starter",
    features: [{ id: "slots", name: "Time Slots", included: true }],
    ...overrides,
  };
}

const validPlans: PricingPlan[] = [
  makePlan(),
  makePlan({
    id: "pro",
    name: "Professional",
    tagline: "For teams",
    monthlyPrice: 2000,
    yearlyPrice: 20000,
    ctaLabel: "Buy Pro",
    ctaHref: "/signup?plan=pro",
    isRecommended: true,
  }),
];

/** Runs `fn` and returns the error it threw; fails if it did not throw. */
function captureError(fn: () => unknown): Error {
  try {
    fn();
  } catch (err) {
    return err as Error;
  }
  throw new Error("Expected the call to throw, but it returned normally");
}

// ─────────────────────────────────────────────────────────────────────────
// validatePlans — explicit failure path
// ─────────────────────────────────────────────────────────────────────────

describe("validatePlans", () => {
  describe("failure path", () => {
    it.each([null, undefined, {}, "plans", 42, true])(
      "rejects non-array input (%p) with the documented message",
      (input) => {
        expect(captureError(() => validatePlans(input)).message).toBe(
          "Plans must be an array"
        );
      }
    );

    it("rejects a plan whose id is not a string", () => {
      const plan = { ...makePlan(), id: 7 };
      expect(captureError(() => validatePlans([plan])).message).toBe(
        "Plan.id must be a string"
      );
    });

    it("rejects a plan with a missing id", () => {
      const { id, ...plan } = makePlan();
      expect(id).toBe("starter");
      expect(captureError(() => validatePlans([plan])).message).toBe(
        "Plan.id must be a string"
      );
    });

    it("rejects a plan whose name is not a string", () => {
      const plan = { ...makePlan(), name: null };
      expect(captureError(() => validatePlans([plan])).message).toBe(
        "Plan.name must be a string"
      );
    });

    it("rejects a plan with a missing name", () => {
      const { name, ...plan } = makePlan();
      expect(name).toBe("Starter");
      expect(captureError(() => validatePlans([plan])).message).toBe(
        "Plan.name must be a string"
      );
    });

    it("rejects a plan whose monthlyPrice is not a number", () => {
      const plan = { ...makePlan(), monthlyPrice: "1000" };
      expect(captureError(() => validatePlans([plan])).message).toBe(
        "Plan prices must be numbers"
      );
    });

    it("rejects a plan whose yearlyPrice is not a number", () => {
      const plan = { ...makePlan(), yearlyPrice: undefined };
      expect(captureError(() => validatePlans([plan])).message).toBe(
        "Plan prices must be numbers"
      );
    });

    it("rejects a plan whose features is not an array", () => {
      const plan = { ...makePlan(), features: null };
      expect(captureError(() => validatePlans([plan])).message).toBe(
        "Plan.features must be an array"
      );
    });

    it("surfaces only the first malformed plan so the error is deterministic", () => {
      const firstValid = makePlan();
      const secondBroken = { ...makePlan({ id: "pro" }), id: 99 };
      const thirdBroken = { ...makePlan({ id: "ent" }), name: 42 };

      expect(captureError(() => validatePlans([firstValid, secondBroken, thirdBroken])).message).toBe(
        "Plan.id must be a string"
      );
      expect(captureError(() => validatePlans([firstValid, thirdBroken])).message).toBe(
        "Plan.name must be a string"
      );
    });

    it("throws an Error instance (not a string or unknown rejection)", () => {
      expect(captureError(() => validatePlans({}))).toBeInstanceOf(Error);
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // validatePlans — success + boundary path
  // ─────────────────────────────────────────────────────────────────────

  describe("success path", () => {
    it("returns the plans unchanged when every entry is well formed", () => {
      expect(validatePlans(validPlans)).toEqual(validPlans);
    });

    it("returns the identical array reference so callers keep their data", () => {
      expect(validatePlans(validPlans)).toBe(validPlans);
    });

    it("accepts an empty array (boundary)", () => {
      const empty: unknown[] = [];
      expect(validatePlans(empty)).toEqual([]);
      expect(validatePlans(empty)).toBe(empty);
    });

    it("preserves order and unknown properties", () => {
      const withExtras = [
        { ...makePlan({ id: "a" }), internalNote: "keep me" },
        makePlan({ id: "b" }),
      ];

      const result = validatePlans(withExtras) as Array<
        PricingPlan & { internalNote?: string }
      >;

      expect(result.map((plan) => plan.id)).toEqual(["a", "b"]);
      expect(result[0].internalNote).toBe("keep me");
    });

    it("documents the accepted boundary values for the type guards", () => {
      // Empty identifiers are still strings, NaN is still `typeof "number"`,
      // and an empty feature list is still an array — all pass the guards.
      const boundary = makePlan({
        id: "",
        name: "",
        monthlyPrice: Number.NaN,
        yearlyPrice: Number.NaN,
        features: [],
      });

      expect(() => validatePlans([boundary])).not.toThrow();
      expect(validatePlans([boundary])).toHaveLength(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// PlanComparison — normal path
// ─────────────────────────────────────────────────────────────────────────

describe("PlanComparison", () => {
  describe("normal path", () => {
    it("renders the heading, plan names and monthly prices", () => {
      render(<PlanComparison plans={validPlans} />);

      expect(screen.getByText("Choose a plan")).toBeInTheDocument();
      expect(screen.getAllByText("Starter").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Professional").length).toBeGreaterThan(0);
      expect(screen.getAllByText("$10.00").length).toBeGreaterThan(0);
      expect(screen.getAllByText("$20.00").length).toBeGreaterThan(0);
    });

    it("switches to yearly prices when the billing toggle is activated", () => {
      render(<PlanComparison plans={validPlans} />);

      fireEvent.click(screen.getByRole("button", { name: /toggle yearly billing/i }));

      expect(screen.getAllByText("$100.00").length).toBeGreaterThan(0);
      expect(screen.getAllByText("$200.00").length).toBeGreaterThan(0);
    });

    it("shows the savings label once yearly billing is cheaper", () => {
      render(<PlanComparison plans={validPlans} />);

      fireEvent.click(screen.getByRole("button", { name: /toggle yearly billing/i }));

      expect(screen.getByText("Save 17%")).toBeInTheDocument();
    });

    it("forwards the selected plan id from both the mobile and desktop CTAs", () => {
      const onSelectPlan = vi.fn();
      render(<PlanComparison plans={validPlans} onSelectPlan={onSelectPlan} />);

      const ctas = screen.getAllByRole("link", { name: "Buy Pro" });
      expect(ctas).toHaveLength(2); // one per layout: mobile card + desktop matrix
      ctas.forEach((cta) => fireEvent.click(cta));

      expect(onSelectPlan).toHaveBeenCalledTimes(2);
      expect(onSelectPlan).toHaveBeenNthCalledWith(1, "pro");
      expect(onSelectPlan).toHaveBeenNthCalledWith(2, "pro");
    });

    it("flags a plan named by recommendedPlanId", () => {
      render(<PlanComparison plans={validPlans} recommendedPlanId="starter" />);

      const card = screen.getByRole("article", { name: "Starter plan" });
      expect(within(card).getByText("Recommended")).toBeInTheDocument();
    });

    it("flags a plan marked isRecommended in its data", () => {
      render(<PlanComparison plans={validPlans} />);

      const card = screen.getByRole("article", { name: "Professional plan" });
      expect(within(card).getByText("Recommended")).toBeInTheDocument();
    });

    it("renders each feature once per plan with its inclusion state", () => {
      render(<PlanComparison plans={validPlans} />);

      const card = screen.getByRole("article", { name: "Starter plan" });
      expect(within(card).getByText("Time Slots")).toBeInTheDocument();
      expect(within(card).getByText("Included")).toBeInTheDocument();
    });

    it("keeps the primary heading and toggle wired for assistive tech", () => {
      render(<PlanComparison plans={validPlans} />);

      const toggle = screen.getByRole("button", { name: /toggle yearly billing/i });
      expect(toggle).toHaveAttribute("aria-pressed", "false");

      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-pressed", "true");
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // PlanComparison — boundary path
  // ─────────────────────────────────────────────────────────────────────

  describe("boundary path", () => {
    it("renders the empty state when no plans are supplied", () => {
      render(<PlanComparison plans={[]} />);

      expect(screen.getByText("Pricing")).toBeInTheDocument();
      expect(screen.getByText(/No plans available at this time/i)).toBeInTheDocument();
    });

    it("renders the invalid-configuration alert instead of throwing", () => {
      const malformed = [{ id: 42, name: "Broken" }] as unknown as PricingPlan[];

      render(<PlanComparison plans={malformed} />);

      expect(screen.getByRole("alert")).toHaveTextContent("Invalid pricing configuration.");
    });

    it("keeps the invalid-configuration reason observable and deterministic", () => {
      const malformed = [{ id: 42, name: "Broken" }] as unknown as PricingPlan[];

      render(<PlanComparison plans={malformed} />);

      expect(screen.getByText("Invalid pricing configuration.")).toHaveAttribute(
        "data-error",
        "Plan.id must be a string"
      );
    });

    it("omits the savings label when yearly billing is not cheaper", () => {
      render(<PlanComparison plans={[makePlan({ monthlyPrice: 1000, yearlyPrice: 12000 })]} />);

      fireEvent.click(screen.getByRole("button", { name: /toggle yearly billing/i }));

      expect(screen.queryByText(/Save \d+%/)).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // Accessibility
  // ─────────────────────────────────────────────────────────────────────

  describe("accessibility", () => {
    it("has no axe violations on the normal path", async () => {
      const { container } = render(<PlanComparison plans={validPlans} />);

      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
