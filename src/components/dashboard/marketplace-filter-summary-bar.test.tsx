import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarketplaceFilterSummaryBar } from "./marketplace-filter-summary-bar";

const h = vi.hoisted(() => ({
  search: new URLSearchParams(),
  router: { replace: vi.fn(), push: vi.fn() },
  pathname: "/dashboard",
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => h.search,
  useRouter: () => h.router,
  usePathname: () => h.pathname,
}));

vi.mock("@/components/common/LiveRegion", () => ({
  LiveRegion: ({ children }: { children: React.ReactNode }) => (
    <div role="status">{children}</div>
  ),
}));

function setSearch(queryString: string) {
  h.search = new URLSearchParams(queryString);
}

describe("MarketplaceFilterSummaryBar", () => {
  beforeEach(() => {
    setSearch("");
    h.router.replace.mockClear();
  });

  it("summarises default state and disables Clear all", () => {
    render(<MarketplaceFilterSummaryBar />);

    expect(
      within(screen.getByRole("region", { name: "Marketplace filter summary" })).getByText(
        "Sorting by Newest · Comfortable density · 0 active filters"
      )
    ).toBeInTheDocument();
    const clear = screen.getByRole("button", { name: "Clear all marketplace filters" });
    expect(clear).toBeDisabled();
  });

  it("summarises active sort, density and filter count from the URL", () => {
    setSearch("sort=price&density=compact&category=Design");
    render(<MarketplaceFilterSummaryBar activeFilterCount={2} />);

    expect(
      within(screen.getByRole("region", { name: "Marketplace filter summary" })).getByText(
        "Sorting by Price · Compact density · 2 active filters"
      )
    ).toBeInTheDocument();
  });

  it("enables Clear all when anything is non-default", () => {
    setSearch("sort=soonest");
    render(<MarketplaceFilterSummaryBar />);

    const clear = screen.getByRole("button", { name: "Clear all marketplace filters" });
    expect(clear).toBeEnabled();
  });

  it("enables Clear all when filters are active even with default sort", () => {
    render(<MarketplaceFilterSummaryBar activeFilterCount={1} />);

    const clear = screen.getByRole("button", { name: "Clear all marketplace filters" });
    expect(clear).toBeEnabled();
  });

  it("enables Clear all when a search query is set", () => {
    setSearch("q=kit");
    render(<MarketplaceFilterSummaryBar />);

    const clear = screen.getByRole("button", { name: "Clear all marketplace filters" });
    expect(clear).toBeEnabled();
  });

  it("clears all params back to the bare pathname", async () => {
    setSearch("q=kit&sort=price&density=compact&category=Design&tags=wcag");
    const user = userEvent.setup();
    render(<MarketplaceFilterSummaryBar activeFilterCount={4} />);

    await user.click(screen.getByRole("button", { name: "Clear all marketplace filters" }));

    await waitFor(() => expect(h.router.replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("is sticky by default (below the shell header)", () => {
    const { container } = render(<MarketplaceFilterSummaryBar />);
    const bar = container.querySelector('[aria-label="Marketplace filter summary"]')?.parentElement;
    expect(bar).toHaveClass("sticky", "top-14", "z-20");
  });

  it("can opt out of stickiness", () => {
    const { container } = render(<MarketplaceFilterSummaryBar sticky={false} />);
    const bar = container.querySelector('[aria-label="Marketplace filter summary"]')?.parentElement;
    expect(bar).not.toHaveClass("sticky");
  });

  it("announces the summary to assistive tech", () => {
    setSearch("sort=price");
    render(<MarketplaceFilterSummaryBar activeFilterCount={1} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      /Sorting by Price · Comfortable density · 1 active filter/
    );
  });
});