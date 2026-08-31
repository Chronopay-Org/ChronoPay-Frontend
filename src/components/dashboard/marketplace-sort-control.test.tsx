import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarketplaceSortControl } from "./marketplace-sort-control";

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

function setSearch(queryString: string) {
  h.search = new URLSearchParams(queryString);
}

describe("MarketplaceSortControl", () => {
  beforeEach(() => {
    setSearch("");
    h.router.replace.mockClear();
  });

  it("renders a labelled select with all three sort options", () => {
    render(<MarketplaceSortControl />);

    const select = screen.getByRole("combobox", { name: "Sort marketplace items by" });
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Newest" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Price" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Soonest" })).toBeInTheDocument();
  });

  it("defaults to newest when no sort param is present", () => {
    render(<MarketplaceSortControl />);
    expect(
      screen.getByRole("combobox", { name: "Sort marketplace items by" })
    ).toHaveValue("newest");
  });

  it("reflects the sort URL param in the select value", () => {
    setSearch("sort=price");
    render(<MarketplaceSortControl />);
    expect(
      screen.getByRole("combobox", { name: "Sort marketplace items by" })
    ).toHaveValue("price");
  });

  it("falls back to newest for an invalid sort param", () => {
    setSearch("sort=asc");
    render(<MarketplaceSortControl />);
    expect(
      screen.getByRole("combobox", { name: "Sort marketplace items by" })
    ).toHaveValue("newest");
  });

  it("writes the sort param to the URL on change", async () => {
    const user = userEvent.setup();
    render(<MarketplaceSortControl />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Sort marketplace items by" }),
      "price"
    );

    await waitFor(() =>
      expect(h.router.replace).toHaveBeenCalledWith("/dashboard?sort=price")
    );
  });

  it("preserves existing params when updating the sort", async () => {
    setSearch("q=kit&density=compact");
    const user = userEvent.setup();
    render(<MarketplaceSortControl />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Sort marketplace items by" }),
      "soonest"
    );

    await waitFor(() =>
      expect(h.router.replace).toHaveBeenCalledWith(
        "/dashboard?q=kit&density=compact&sort=soonest"
      )
    );
  });

  it("supports controlled usage without touching the router", async () => {
    const onSortChange = vi.fn();
    const user = userEvent.setup();
    render(<MarketplaceSortControl value="price" onSortChange={onSortChange} />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Sort marketplace items by" }),
      "soonest"
    );

    expect(onSortChange).toHaveBeenCalledWith("soonest");
    expect(h.router.replace).not.toHaveBeenCalled();
  });
});