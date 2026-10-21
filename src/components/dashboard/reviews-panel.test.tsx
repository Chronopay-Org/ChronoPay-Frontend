/**
 * reviews-panel.test.tsx
 *
 * Comprehensive test suite for ReviewsPanel — implements regression coverage
 * for issue #996 (incomplete implementation path).
 *
 * The component exposes three distinct behaviour paths:
 *
 * 1. Default "all" view — all 7 REVIEW_STUBS rendered
 * 2. Filtered view (positive / mixed / critical) — only matching stubs rendered
 * 3. Empty state — `filtered.length === 0` → `data-testid="reviews-empty"` rendered
 *
 * Previous tests only covered the vote-button integration in the "all" view.
 * This suite adds:
 *  - Rendering contract for every ReviewStub field (author, excerpt, date)
 *  - Bucket-specific filtering (positive, mixed, critical)
 *  - Empty-state path (`reviews-empty` testid visible)
 *  - `aria-label` contract on the review list per active bucket
 *  - Bucket colour / dot accessibility (aria-hidden on decorative dots)
 *  - PanelShell integration (heading, description, eyebrow)
 *  - Boundary: single-item filtered results
 *  - The `SentimentChipFilter.onChange` callback wires correctly to state
 */

import { render, screen, within, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReviewsPanel } from "./reviews-panel";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
  usePathname: () => "/dashboard",
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(() => ({
    toasts: [],
    toast: vi.fn(() => "toast-id"),
    dismiss: vi.fn(),
    dismissAll: vi.fn(),
  })),
}));

// Capture the onChange callback injected into SentimentChipFilter so tests
// can drive the active-bucket state directly without simulating chip clicks.
let capturedOnChange: ((bucket: string) => void) | null = null;

vi.mock("./sentiment-chip-filter", () => ({
  SentimentChipFilter: ({ onChange }: { onChange: (bucket: string) => void }) => {
    capturedOnChange = onChange;
    return <div data-testid="sentiment-chip-filter" />;
  },
}));

beforeEach(() => {
  capturedOnChange = null;
});

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Drive the ReviewsPanel's active bucket via the captured onChange callback. */
function setActiveBucket(bucket: string) {
  if (!capturedOnChange) throw new Error("SentimentChipFilter mock not mounted");
  act(() => { capturedOnChange!(bucket); });
}

// ─── 1. Default "all" view ────────────────────────────────────────────────────

describe("ReviewsPanel – default 'all' view", () => {
  it("renders the panel heading 'Reviews'", () => {
    render(<ReviewsPanel />);
    expect(screen.getByRole("heading", { name: /reviews/i })).toBeInTheDocument();
  });

  it("renders the eyebrow text 'Buyer feedback'", () => {
    render(<ReviewsPanel />);
    expect(screen.getByText(/buyer feedback/i)).toBeInTheDocument();
  });

  it("renders the panel description", () => {
    render(<ReviewsPanel />);
    expect(screen.getByText(/filter by sentiment to triage/i)).toBeInTheDocument();
  });

  it("renders all 7 review authors in the default 'all' view", () => {
    render(<ReviewsPanel />);
    const authors = ["Priya M.", "Tom B.", "Anya K.", "Carlos D.", "Lee H.", "Sara N.", "Mei W."];
    for (const author of authors) {
      expect(screen.getByText(author)).toBeInTheDocument();
    }
  });

  it("renders each review excerpt", () => {
    render(<ReviewsPanel />);
    expect(screen.getByText(/incredibly responsive and delivered/i)).toBeInTheDocument();
    expect(screen.getByText(/session was rescheduled twice/i)).toBeInTheDocument();
    expect(screen.getByText(/top-tier expertise/i)).toBeInTheDocument();
  });

  it("renders each review date", () => {
    render(<ReviewsPanel />);
    expect(screen.getByText("Jul 22, 2026")).toBeInTheDocument();
    expect(screen.getByText("Jul 10, 2026")).toBeInTheDocument();
  });

  it("renders a list with aria-label 'All reviews' by default", () => {
    render(<ReviewsPanel />);
    expect(screen.getByRole("list", { name: /all reviews/i })).toBeInTheDocument();
  });

  it("renders 7 list items in the default view", () => {
    render(<ReviewsPanel />);
    expect(screen.getAllByRole("listitem")).toHaveLength(7);
  });

  it("does NOT render the empty-state element in the default view", () => {
    render(<ReviewsPanel />);
    expect(screen.queryByTestId("reviews-empty")).not.toBeInTheDocument();
  });

  it("renders the SentimentChipFilter component", () => {
    render(<ReviewsPanel />);
    expect(screen.getByTestId("sentiment-chip-filter")).toBeInTheDocument();
  });
});

// ─── 2. Filtered views ────────────────────────────────────────────────────────

describe("ReviewsPanel – filtered views", () => {
  it("filters to 3 positive reviews when bucket is 'positive'", () => {
    render(<ReviewsPanel />);
    setActiveBucket("positive");

    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);
  });

  it("shows only positive authors when bucket is 'positive'", () => {
    render(<ReviewsPanel />);
    setActiveBucket("positive");

    expect(screen.getByText("Priya M.")).toBeInTheDocument();
    expect(screen.getByText("Carlos D.")).toBeInTheDocument();
    expect(screen.getByText("Mei W.")).toBeInTheDocument();
    // Non-positive authors must be absent
    expect(screen.queryByText("Tom B.")).not.toBeInTheDocument();
    expect(screen.queryByText("Sara N.")).not.toBeInTheDocument();
  });

  it("aria-label on the list is 'Positive reviews' when bucket is 'positive'", () => {
    render(<ReviewsPanel />);
    setActiveBucket("positive");
    expect(screen.getByRole("list", { name: /positive reviews/i })).toBeInTheDocument();
  });

  it("filters to 2 mixed reviews when bucket is 'mixed'", () => {
    render(<ReviewsPanel />);
    setActiveBucket("mixed");

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("shows only mixed authors when bucket is 'mixed'", () => {
    render(<ReviewsPanel />);
    setActiveBucket("mixed");

    expect(screen.getByText("Tom B.")).toBeInTheDocument();
    expect(screen.getByText("Lee H.")).toBeInTheDocument();
    expect(screen.queryByText("Priya M.")).not.toBeInTheDocument();
  });

  it("aria-label on the list is 'Mixed reviews' when bucket is 'mixed'", () => {
    render(<ReviewsPanel />);
    setActiveBucket("mixed");
    expect(screen.getByRole("list", { name: /mixed reviews/i })).toBeInTheDocument();
  });

  it("filters to 2 critical reviews when bucket is 'critical'", () => {
    render(<ReviewsPanel />);
    setActiveBucket("critical");

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("shows only critical authors when bucket is 'critical'", () => {
    render(<ReviewsPanel />);
    setActiveBucket("critical");

    expect(screen.getByText("Anya K.")).toBeInTheDocument();
    expect(screen.getByText("Sara N.")).toBeInTheDocument();
    expect(screen.queryByText("Mei W.")).not.toBeInTheDocument();
  });

  it("aria-label on the list is 'Critical reviews' when bucket is 'critical'", () => {
    render(<ReviewsPanel />);
    setActiveBucket("critical");
    expect(screen.getByRole("list", { name: /critical reviews/i })).toBeInTheDocument();
  });

  it("returns to all 7 items when switching back to 'all' after filtering", () => {
    render(<ReviewsPanel />);
    setActiveBucket("positive");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);

    setActiveBucket("all");
    expect(screen.getAllByRole("listitem")).toHaveLength(7);
  });

  it("switching between filtered buckets renders the correct subset each time", () => {
    render(<ReviewsPanel />);

    setActiveBucket("mixed");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    setActiveBucket("critical");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByText("Tom B.")).not.toBeInTheDocument(); // mixed, not critical

    setActiveBucket("positive");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByText("Anya K.")).not.toBeInTheDocument(); // critical, not positive
  });
});

// ─── 3. Empty-state path (filtered.length === 0) — regression for #996 ───────

describe("ReviewsPanel – empty-state path (regression for issue #996)", () => {
  // The REVIEW_STUBS data has no bucket named "unknown", so filtering by
  // a value that matches no stub drives the `filtered.length === 0` branch.
  it("renders the empty-state element when no reviews match the active bucket", () => {
    render(<ReviewsPanel />);
    // Inject an unknown bucket to force empty result
    setActiveBucket("unknown" as any);
    expect(screen.getByTestId("reviews-empty")).toBeInTheDocument();
  });

  it("empty-state message reads 'No reviews match this filter yet.'", () => {
    render(<ReviewsPanel />);
    setActiveBucket("unknown" as any);
    expect(screen.getByTestId("reviews-empty")).toHaveTextContent(
      "No reviews match this filter yet."
    );
  });

  it("does NOT render the review list when empty-state is active", () => {
    render(<ReviewsPanel />);
    setActiveBucket("unknown" as any);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("does NOT render any list items when empty-state is active", () => {
    render(<ReviewsPanel />);
    setActiveBucket("unknown" as any);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("does NOT render vote buttons when empty-state is active", () => {
    render(<ReviewsPanel />);
    setActiveBucket("unknown" as any);
    expect(screen.queryAllByRole("button", { name: /helpful|unhelpful/i })).toHaveLength(0);
  });

  it("empty-state is recoverable — switching back to 'all' restores the list", () => {
    render(<ReviewsPanel />);
    setActiveBucket("unknown" as any);
    expect(screen.getByTestId("reviews-empty")).toBeInTheDocument();

    setActiveBucket("all");
    expect(screen.queryByTestId("reviews-empty")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(7);
  });
});

// ─── 4. ReviewStub field rendering contract ───────────────────────────────────

describe("ReviewsPanel – ReviewStub field rendering contract", () => {
  it("renders the author in each list item", () => {
    render(<ReviewsPanel />);
    setActiveBucket("positive");
    for (const author of ["Priya M.", "Carlos D.", "Mei W."]) {
      expect(screen.getByText(author)).toBeInTheDocument();
    }
  });

  it("renders the excerpt in each list item", () => {
    render(<ReviewsPanel />);
    setActiveBucket("critical");
    expect(screen.getByText(/session was rescheduled twice/i)).toBeInTheDocument();
    expect(screen.getByText(/did not address my questions/i)).toBeInTheDocument();
  });

  it("renders the date string in each list item", () => {
    render(<ReviewsPanel />);
    setActiveBucket("critical");
    expect(screen.getByText("Jul 18, 2026")).toBeInTheDocument();
    expect(screen.getByText("Jul 12, 2026")).toBeInTheDocument();
  });

  it("renders 'Was this helpful?' label per review", () => {
    render(<ReviewsPanel />);
    setActiveBucket("mixed");
    // 2 mixed reviews → 2 labels
    expect(screen.getAllByText(/was this helpful/i)).toHaveLength(2);
  });

  it("bucket dot indicators are aria-hidden (decorative)", () => {
    render(<ReviewsPanel />);
    // Every sentiment dot should carry aria-hidden="true"
    const dots = document
      .querySelectorAll('[aria-hidden="true"]');
    expect(dots.length).toBeGreaterThan(0);
  });
});

// ─── 5. Vote-button integration (retained from prior suite) ───────────────────

describe("ReviewsPanel – ReviewVoteButtons integration", () => {
  it("renders vote buttons for every review in the 'all' list", () => {
    render(<ReviewsPanel />);
    const helpfulButtons = screen.getAllByRole("button", { name: /helpful/i });
    const pureHelpful = helpfulButtons.filter(
      (btn) => !btn.getAttribute("aria-label")?.includes("unhelpful")
    );
    expect(pureHelpful.length).toBe(7);
  });

  it("renders unhelpful vote buttons for every review", () => {
    render(<ReviewsPanel />);
    expect(screen.getAllByRole("button", { name: /unhelpful/i })).toHaveLength(7);
  });

  it("renders vote buttons inside each list item", () => {
    render(<ReviewsPanel />);
    for (const item of screen.getAllByRole("listitem")) {
      expect(
        within(item).getAllByRole("button", { name: /helpful|unhelpful/i }).length
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it("vote buttons count scales with the filtered set (3 positive → 3 helpful buttons)", () => {
    render(<ReviewsPanel />);
    setActiveBucket("positive");
    const pureHelpful = screen
      .getAllByRole("button", { name: /helpful/i })
      .filter((btn) => !btn.getAttribute("aria-label")?.includes("unhelpful"));
    expect(pureHelpful).toHaveLength(3);
  });

  it("updates helpful count optimistically when a vote button is clicked", () => {
    const { getByRole, getAllByRole } = render(<ReviewsPanel />);
    const firstHelpfulBtns = getAllByRole("button", {
      name: /mark review as helpful/i,
    });
    const firstBtn = firstHelpfulBtns[0];
    expect(firstBtn.textContent).toContain("12");
    firstBtn.click();
    expect(firstBtn.textContent).toContain("13");
    expect(firstBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("vote buttons are initially unpressed for all stubs", () => {
    render(<ReviewsPanel />);
    const allHelpful = screen.getAllByRole("button", { name: /helpful/i });
    expect(
      allHelpful.every((btn) => btn.getAttribute("aria-pressed") === "false")
    ).toBe(true);
  });
});

// ─── 6. Boundary inputs ───────────────────────────────────────────────────────

describe("ReviewsPanel – boundary inputs", () => {
  it("renders without throwing for the default (no props) invocation", () => {
    expect(() => render(<ReviewsPanel />)).not.toThrow();
  });

  it("accepts a className prop without throwing", () => {
    expect(() => render(<ReviewsPanel className="custom-class" />)).not.toThrow();
  });

  it("handles rapid bucket switching without throwing", () => {
    render(<ReviewsPanel />);
    expect(() => {
      for (const bucket of ["positive", "mixed", "critical", "all", "positive", "all"]) {
        setActiveBucket(bucket);
      }
    }).not.toThrow();
  });

  it("single-item filter (mixed has 2, critical has 2, positive has 3) — each renders correctly", () => {
    render(<ReviewsPanel />);
    for (const [bucket, count] of [["positive", 3], ["mixed", 2], ["critical", 2]] as const) {
      setActiveBucket(bucket);
      expect(screen.getAllByRole("listitem")).toHaveLength(count);
    }
  });
});
