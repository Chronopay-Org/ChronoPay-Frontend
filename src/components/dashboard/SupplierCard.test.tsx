import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SupplierCard } from "./supplier-card";

const supplier = {
  id: "supplier-1",
  name: "Test Supplier",
  role: "Product consultant",
  badges: ["Verified"],
};

describe('SupplierCard', () => {
  it("renders a grid card linking to the dashboard supplier profile", () => {
    render(<SupplierCard supplier={supplier} />);

    expect(screen.getByRole("link", { name: /test supplier/i })).toHaveAttribute(
      "href",
      "/dashboard/suppliers/supplier-1",
    );
    expect(screen.getByText("Product consultant")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  it("renders the compact-list card linking to the dashboard supplier profile", () => {
    render(<SupplierCard supplier={supplier} viewMode="compact-list" />);

    const link = screen.getByRole("link", { name: /test supplier/i });
    expect(link).toHaveAttribute("href", "/dashboard/suppliers/supplier-1");
    expect(link).toHaveClass("card--compact-list");
  });
});
