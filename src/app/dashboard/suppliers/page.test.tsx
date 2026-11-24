import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SuppliersPage from "./page";

vi.mock("@/app/components/dashboard-shell", () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}));

describe("SuppliersPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders seed suppliers in grid view with links to their profiles", () => {
    render(<SuppliersPage />);

    expect(screen.getByTestId("dashboard-shell")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Suppliers", level: 1 })).toBeInTheDocument();

    const list = screen.getByRole("list", { name: "Suppliers" });
    expect(within(list).getByText("Alex Rivera")).toBeInTheDocument();
    expect(within(list).getByText("Morgan Chen")).toBeInTheDocument();
    expect(within(list).getByText("Jordan Taylor")).toBeInTheDocument();
    expect(within(list).getByRole("link", { name: /alex rivera/i })).toHaveAttribute(
      "href",
      "/dashboard/suppliers/supplier-1",
    );
    expect(screen.getByRole("button", { name: "Grid view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("switches to compact-list mode and persists the selection across remounts", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SuppliersPage />);

    await user.click(screen.getByRole("button", { name: "Compact list view" }));

    const list = screen.getByRole("list", { name: "Suppliers" });
    expect(screen.getByRole("button", { name: "Compact list view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    for (const [name, id] of [
      ["Alex Rivera", "supplier-1"],
      ["Morgan Chen", "supplier-2"],
      ["Jordan Taylor", "supplier-3"],
    ]) {
      const link = within(list).getByRole("link", { name: new RegExp(name) });
      expect(link).toHaveAttribute("href", `/dashboard/suppliers/${id}`);
      expect(link).toHaveClass("card--compact-list");
    }
    expect(localStorage.getItem("supplier-view-mode")).toBe("compact-list");

    unmount();
    render(<SuppliersPage />);

    expect(screen.getByRole("button", { name: "Compact list view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("link", { name: /morgan chen/i })).toHaveClass(
      "card--compact-list",
    );
  });
});
