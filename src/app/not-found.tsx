/**
 * src/app/not-found.test.tsx
 *
 * Render tests for the 404 page (NotFound):
 *  - level-1 heading and "404" text
 *  - recovery links (/ and /marketplace)
 *  - main landmark id (skip-link target)
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import NotFound from "./not-found";

describe("NotFound", () => {
  it("renders 'Page not found' as the level-1 heading", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" })
    ).toBeInTheDocument();
  });

  it("renders the 404 text", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("renders the 'Back to home' link pointing to /", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("renders the 'Browse marketplace' link pointing to /marketplace", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("link", { name: "Browse marketplace" })
    ).toHaveAttribute("href", "/marketplace");
  });

  it("renders a main landmark with id 'main-content'", () => {
    render(<NotFound />);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });
});
