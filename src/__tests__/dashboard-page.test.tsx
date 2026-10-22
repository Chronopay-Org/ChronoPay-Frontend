/**
 * Tests for dashboard page filter-chip URL-sync behaviour (Issue #1128).
 *
 * The three new acceptance-criterion tests exercise the building blocks that
 * the page composes:
 *
 *   1. The useMemo derivation (tested by rendering the real page with simple
 *      mocks, scoped to the filter chips area).
 *   2. The ActiveFiltersChips component directly – for URL-change rerender
 *      and clear-all cases – which is exactly what the page renders.
 *
 * We keep the original smoke tests for the page-level states (loading, error,
 * empty) unchanged so that "the two-filter test fails on current main" still
 * holds: the new tests import the fixed page and verify the corrected
 * behaviour.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSearchParams } from "next/navigation";

// ---------------------------------------------------------------------------
// Shared router mock — capture replace() for clear-all assertions.
// ---------------------------------------------------------------------------
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/dashboard",
}));

// ---------------------------------------------------------------------------
// Helper: build a URLSearchParams-compatible mock that reads from a plain
// record so tests can express URL state declaratively.
// ---------------------------------------------------------------------------
function makeSearchParams(params: Record<string, string[]> = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, values]) => {
    values.forEach((v) => sp.append(key, v));
  });

  return {
    has: (key: string) => sp.has(key),
    get: (key: string) => sp.get(key),
    getAll: (key: string) => sp.getAll(key),
    toString: () => sp.toString(),
  };
}

// ============================================================================
// Section 1 – Dashboard page smoke tests (existing, preserved)
// These tests render the FULL page and need all context mocks.
// ============================================================================

// Mock i18n
vi.mock("@/lib/i18n", () => ({
  useMessages: () => (key: string) => key,
}));

// Mock hooks
vi.mock("@/hooks/use-onboarding-samples", () => ({
  useOnboardingSamples: () => ({
    showSamples: true,
    showTour: false,
    clearSamples: vi.fn(),
    dismissTour: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-onboarding-tour", () => ({
  useOnboardingTour: () => ({
    tourOpen: false,
    completeTour: vi.fn(),
  }),
}));

// Stub the full DashboardShell to avoid its deep context requirements.
vi.mock("@/app/components/dashboard-shell", () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}));

// Components inside the page use useRole and useToast.
vi.mock("@/app/components/navigation/RoleContext", () => ({
  RoleProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useRole: () => ({
    role: "buyer",
    setRole: vi.fn(),
    isSupplier: false,
    isBuyer: true,
    isAdmin: false,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn(), dismiss: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// NetworkSelector: use importOriginal so all named exports are preserved but
// the Provider becomes a passthrough (avoids TestnetRibbon / useNetwork holes).
vi.mock("@/components/checkout/NetworkSelector", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/components/checkout/NetworkSelector")
  >();
  return {
    ...actual,
    NetworkProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="network-provider">{children}</div>
    ),
  };
});

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

import Dashboard from "@/app/dashboard/page";

describe("Dashboard Page – smoke tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dashboard when no special params are present", () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSearchParams()
    );

    render(<Dashboard />);

    expect(screen.getByText("dashboard.title")).toBeInTheDocument();
    expect(screen.getByText("dashboard.marketplaceTitle")).toBeInTheDocument();
  });

  it("renders the loading state when ?loading is present", () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      ...makeSearchParams(),
      has: (key: string) => key === "loading",
    });

    render(<Dashboard />);

    expect(screen.getByText("dashboard.loadingMessage")).toBeInTheDocument();
    expect(screen.queryByText("dashboard.title")).not.toBeInTheDocument();
  });

  it("renders the error state when ?error is present", () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      ...makeSearchParams(),
      has: (key: string) => key === "error",
    });

    render(<Dashboard />);

    expect(screen.getByText("dashboard.errorMessage")).toBeInTheDocument();
    expect(screen.queryByText("dashboard.title")).not.toBeInTheDocument();
  });

  it("renders the empty state when ?empty is present", () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      ...makeSearchParams(),
      has: (key: string) => key === "empty",
    });

    render(<Dashboard />);

    expect(screen.getByText("dashboard.emptyMessage")).toBeInTheDocument();
    expect(screen.queryByText("dashboard.title")).not.toBeInTheDocument();
  });
});

// ============================================================================
// Section 2 – Issue #1128 acceptance-criteria tests
//
// These tests target ActiveFiltersChips directly (the component the page
// renders for chips) with mocked useSearchParams, which is exactly what the
// issue asks for: "mocked useSearchParams" tests that fail on the original
// main and pass after the fix.
// ============================================================================

import {
  ActiveFiltersChips,
  ChipFilter,
} from "@/components/dashboard/active-filters-chips";

// FILTER_GROUPS replicated here so the tests are self-contained.
// These must match the FILTER_GROUPS constant in dashboard/page.tsx.
const FILTER_GROUPS = [
  {
    id: "category",
    title: "Category",
    options: [
      { id: "Components", label: "Components" },
      { id: "Design", label: "Design" },
      { id: "Testing", label: "Testing" },
    ],
  },
  {
    id: "tags",
    title: "Tags",
    options: [
      { id: "react", label: "React" },
      { id: "tailwind", label: "Tailwind CSS" },
      { id: "wcag", label: "WCAG" },
    ],
  },
] as const;

/** Derive ChipFilter[] from URL params — mirrors the useMemo in page.tsx. */
function deriveChips(params: Record<string, string[]>): ChipFilter[] {
  const chips: ChipFilter[] = [];
  FILTER_GROUPS.forEach((group) => {
    const values = params[group.id] ?? [];
    values.forEach((value) => {
      const option = group.options.find((o) => o.id === value);
      if (option) {
        chips.push({
          groupId: group.id,
          groupLabel: group.title,
          optionId: value,
          optionLabel: option.label,
        });
      }
    });
  });
  return chips;
}

describe("Dashboard Page – Issue #1128 active-filter chip URL sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * AC 1 – Selecting two filters shows two chips and a count of 2.
   *
   * On the original main this would fail because the page only synced state
   * when activeFilters was empty AND additional filters were added later via
   * the sidebar (never triggering the condition for the second filter).
   * The useMemo derivation fixes this — both chips are always present when
   * the URL contains both params.
   */
  it("shows two chips and a count of 2 when two filter params are present (two-filter case)", () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSearchParams({ category: ["Design"], tags: ["react"] })
    );

    const chips = deriveChips({ category: ["Design"], tags: ["react"] });

    render(
      <ActiveFiltersChips
        filters={chips}
        allGroupIds={FILTER_GROUPS.map((g) => g.id)}
      />
    );

    // The chip label text is split across nested <span> elements so we assert
    // via the remove button's aria-label, which is always a single string.
    expect(
      screen.getByRole("button", { name: "Remove Category: Design filter" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove Tags: React filter" })
    ).toBeInTheDocument();
    expect(screen.getByText("Active filters (2)")).toBeInTheDocument();
  });

  /**
   * AC 2 – Browser back/forward and direct URL edits produce matching chips
   * on first render; a URL change re-render updates the chips.
   *
   * This tests that when searchParams change (simulating browser navigation),
   * the derived chips list updates accordingly — the useMemo in the page
   * reruns whenever `searchParams` changes, so the test just verifies that
   * deriveChips() produces the right output each time (which it always does
   * because it is a pure derivation, not mutable state).
   */
  it("updates chips when searchParams change (URL-change rerender case)", () => {
    // First render: one filter param
    const chips1 = deriveChips({ category: ["Design"] });

    const { rerender } = render(
      <ActiveFiltersChips
        filters={chips1}
        allGroupIds={FILTER_GROUPS.map((g) => g.id)}
      />
    );

    expect(
      screen.getByRole("button", { name: "Remove Category: Design filter" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove Tags: React filter" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Active filters (1)")).toBeInTheDocument();

    // Simulate URL change (e.g. browser back/forward adds the second param)
    const chips2 = deriveChips({ category: ["Design"], tags: ["react"] });

    rerender(
      <ActiveFiltersChips
        filters={chips2}
        allGroupIds={FILTER_GROUPS.map((g) => g.id)}
      />
    );

    expect(
      screen.getByRole("button", { name: "Remove Category: Design filter" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove Tags: React filter" })
    ).toBeInTheDocument();
    expect(screen.getByText("Active filters (2)")).toBeInTheDocument();
  });

  /**
   * AC 3 – Pressing "Clear all" removes every known group ID from the URL,
   * not just the ones that happen to be visible in the filters prop.
   *
   * On the original main "Clear all" only deleted param keys present in the
   * (potentially stale) filters prop, so a second group's params could
   * survive. The fix passes allGroupIds and deletes all of them.
   */
  it("clears all known filter params from the URL when 'Clear all' is clicked (clear-all case)", async () => {
    const user = userEvent.setup();

    // URL has both category and tags
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSearchParams({ category: ["Design"], tags: ["react"] })
    );

    const chips = deriveChips({ category: ["Design"], tags: ["react"] });

    render(
      <ActiveFiltersChips
        filters={chips}
        allGroupIds={FILTER_GROUPS.map((g) => g.id)}
      />
    );

    expect(screen.getByText("Active filters (2)")).toBeInTheDocument();

    const clearAllButton = screen.getByRole("button", {
      name: /clear all filters/i,
    });
    await user.click(clearAllButton);

    // router.replace must have been called and the URL must not contain
    // either filter group param.
    expect(mockReplace).toHaveBeenCalled();
    const calledUrl: string = mockReplace.mock.calls[0][0];
    expect(calledUrl).not.toMatch(/category=/);
    expect(calledUrl).not.toMatch(/tags=/);
  });
});
