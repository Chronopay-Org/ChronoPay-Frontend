import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import AdminUsersPage, { metadata as adminUsersMetadata } from "../app/admin/users/page";

describe("Admin Users Page", () => {
  it("renders the user management page with title", () => {
    render(<AdminUsersPage />);
    expect(screen.getByText(/User Management/i)).toBeInTheDocument();
    expect(screen.getByText(/All Users/i)).toBeInTheDocument();
  });

  it("exports metadata with the correct title and noindex", () => {
    expect(adminUsersMetadata).toHaveProperty("title", "User Management");
    expect(adminUsersMetadata.robots).toEqual({ index: false, follow: false });
  });
});
