import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarketplaceDensityToggle } from "./marketplace-density-toggle";

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

describe("MarketplaceDensityToggle", () => {
  beforeEach(() => {
    setSearch("");
    h.router.replace.mockClear();
  });

  it("renders a labelled group with comfortable and compact buttons", () => {
    render(<MarketplaceDensityToggle />);

    const group = screen.getByRole("group", { name: "Density" });
    expect(
      within(group).getByRole("button", { name: "Comfortable density" })
    ).toBeInTheDocument();
    expect(
      within(group).getByRole("button", { name: "Compact density" })
    ).toBeInTheDocument();
  });

  it("defaults to comfortable pressed when no param is present", () => {
    render(<MarketplaceDensityToggle />);

    expect(
      screen.getByRole("button", { name: "Comfortable density" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Compact density" })
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("reflects a compact density URL param", () => {
    setSearch("density=compact");
    render(<MarketplaceDensityToggle />);

    expect(
      screen.getByRole("button", { name: "Compact density" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("falls back to comfortable for an invalid density param", () => {
    setSearch("density=wide");
    render(<MarketplaceDensityToggle />);

    expect(
      screen.getByRole("button", { name: "Comfortable density" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("writes the density param to the URL on press", async () => {
    const user = userEvent.setup();
    render(<MarketplaceDensityToggle />);

    await user.click(screen.getByRole("button", { name: "Compact density" }));

    await waitFor(() =>
      expect(h.router.replace).toHaveBeenCalledWith("/dashboard?density=compact")
    );
  });

  it("preserves existing params when updating density", async () => {
    setSearch("sort=price");
    const user = userEvent.setup();
    render(<MarketplaceDensityToggle />);

    await user.click(screen.getByRole("button", { name: "Compact density" }));

    await waitFor(() =>
      expect(h.router.replace).toHaveBeenCalledWith(
        "/dashboard?sort=price&density=compact"
      )
    );
  });

  it("supports controlled usage without touching the router", async () => {
    const onDensityChange = vi.fn();
    const user = userEvent.setup();
    render(
      <MarketplaceDensityToggle value="comfortable" onDensityChange={onDensityChange} />
    );

    await user.click(screen.getByRole("button", { name: "Compact density" }));

    expect(onDensityChange).toHaveBeenCalledWith("compact");
    expect(h.router.replace).not.toHaveBeenCalled();
  });
});