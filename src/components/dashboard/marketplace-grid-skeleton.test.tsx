import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarketplaceGridSkeleton } from "./marketplace-grid-skeleton";

const h = vi.hoisted(() => ({
  search: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => h.search,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/dashboard",
}));

describe("MarketplaceGridSkeleton", () => {
  beforeEach(() => {
    h.search = new URLSearchParams();
  });

  it("renders a polite loading announcement", () => {
    render(<MarketplaceGridSkeleton />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading marketplace items");
  });

  it("marks the container busy for assistive tech", () => {
    const { container } = render(<MarketplaceGridSkeleton />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it("renders the requested number of skeleton cards by default", () => {
    const { container } = render(<MarketplaceGridSkeleton />);
    expect(container.querySelectorAll("[aria-hidden='true']").length).toBe(6);
  });

  it("honours a custom card count", () => {
    const { container } = render(<MarketplaceGridSkeleton count={9} />);
    expect(container.querySelectorAll("[aria-hidden='true']").length).toBe(9);
  });

  it("uses comfortable gap/padding by default", () => {
    const { container } = render(<MarketplaceGridSkeleton />);
    expect(container.querySelector(".grid")).toHaveClass("gap-4");
  });

  it("uses compact gap and padding when density is compact", () => {
    const { container } = render(<MarketplaceGridSkeleton density="compact" />);
    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("gap-3");
    expect(grid?.querySelector("div")).toHaveClass("p-3");
  });

  it("mirrors the responsive column classes for the given count", () => {
    const { container } = render(<MarketplaceGridSkeleton columns={4} />);
    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("md:grid-cols-2");
    expect(grid).toHaveClass("lg:grid-cols-4");
  });

  it("exposes the density on a data attribute", () => {
    const { container } = render(<MarketplaceGridSkeleton density="compact" />);
    expect(container.querySelector('[data-density="compact"]')).toBeInTheDocument();
  });
});