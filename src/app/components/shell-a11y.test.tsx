import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import { Header } from "./Header";
import { SiteFooter } from "./SiteFooter";

describe("Contrast and Accessibility for Shell Components", () => {
  it("passes axe contrast checks for Header in light mode", async () => {
    document.documentElement.setAttribute("data-theme", "light");
    const { container } = render(<Header />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("passes axe contrast checks for Header in dark mode", async () => {
    document.documentElement.setAttribute("data-theme", "dark");
    const { container } = render(<Header />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("passes axe contrast checks for SiteFooter in light mode", async () => {
    document.documentElement.setAttribute("data-theme", "light");
    const { container } = render(<SiteFooter />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("passes axe contrast checks for SiteFooter in dark mode", async () => {
    document.documentElement.setAttribute("data-theme", "dark");
    const { container } = render(<SiteFooter />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
