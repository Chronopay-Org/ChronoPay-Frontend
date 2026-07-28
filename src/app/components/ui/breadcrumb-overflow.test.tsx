import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { BreadcrumbOverflow } from "./breadcrumb-overflow";

describe("BreadcrumbOverflow", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("max-width: 640px"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("collapses middle segments into an overflow menu on narrow screens", async () => {
    const user = userEvent.setup();

    render(
      <BreadcrumbOverflow
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Slots", href: "/dashboard/slots" },
          { label: "Booking", href: "/dashboard/slots/123" },
          { label: "Details" },
        ]}
      />
    );

    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show hidden breadcrumb items/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /show hidden breadcrumb items/i }));

    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Slots" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Booking" })).toBeInTheDocument();
    expect(document.activeElement).toBe(within(menu).getByRole("menuitem", { name: "Slots" }));
  });

  it("renders a single breadcrumb segment without overflow controls", () => {
    render(<BreadcrumbOverflow items={[{ label: "Receipt" }]} />);

    expect(screen.getByText("Receipt")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /show hidden breadcrumb items/i })).not.toBeInTheDocument();
  });
});
