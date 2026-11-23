import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEMO_URL, REPO_URL } from "@/lib/site-links";
import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  it("links the live demo to DEMO_URL", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("link", { name: "Live demo" })).toHaveAttribute(
      "href",
      DEMO_URL,
    );
  });

  it("links the source to REPO_URL with noopener noreferrer", () => {
    render(<SiteFooter />);

    const source = screen.getByRole("link", { name: "Source on GitHub" });
    expect(source).toHaveAttribute("href", REPO_URL);
    expect(source).toHaveAttribute("target", "_blank");
    expect(source).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("sets rel=noopener noreferrer on every target=_blank link", () => {
    const { container } = render(<SiteFooter />);

    const blankLinks = container.querySelectorAll('a[target="_blank"]');
    expect(blankLinks.length).toBeGreaterThan(0);
    blankLinks.forEach((link) => {
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    });
  });
});
