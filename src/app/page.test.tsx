import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home landing page", () => {
  it("renders six feature cards with expected CTA text and hrefs", () => {
    render(<Home />);

    const featuresSection = screen.getByRole("region", {
      name: /what you can do/i,
    });
    const featureCards = within(featuresSection).getAllByRole("listitem");
    expect(featureCards).toHaveLength(6);

    const expectedStaticFeatures = [
      {
        title: "Tokenized time slots",
        cta: /Browse marketplace/,
        href: "/marketplace",
      },
      {
        title: "Payments on Stellar",
        cta: /Payout setup/,
        href: "/dashboard/onboarding/payout",
      },
      {
        title: "Buyer and supplier dashboard",
        cta: /Open dashboard/,
        href: "/dashboard",
      },
      {
        title: "Transparent pricing",
        cta: /See pricing/,
        href: "/pricing",
      },
      {
        title: "Accessible by design",
        cta: /Design system/,
        href: "/design-system/components",
      },
    ];

    for (const feature of expectedStaticFeatures) {
      expect(
        within(featuresSection).getByRole("heading", {
          level: 3,
          name: feature.title,
        }),
      ).toBeInTheDocument();

      const link = within(featuresSection).getByRole("link", {
        name: feature.cta,
      });
      expect(link).toHaveAttribute("href", feature.href);
    }

    expect(
      within(featuresSection).getByRole("heading", {
        level: 3,
        name: "Receipts and history",
      }),
    ).toBeInTheDocument();

    const demoReceiptLink = within(featuresSection).getByRole("link", {
      name: /View a demo receipt/,
    });
    expect(demoReceiptLink.getAttribute("href")).toMatch(
      /^\/dashboard\/slots\/demo-1\/receipt\?/,
    );
  });

  it("renders the header navigation with a safe external GitHub link", () => {
    render(<Home />);

    const header = screen.getByRole("banner");
    const nav = within(header).getByRole("navigation", { name: /primary/i });

    expect(
      within(nav).getByRole("link", { name: "Marketplace" }),
    ).toHaveAttribute("href", "/marketplace");
    expect(within(nav).getByRole("link", { name: "Pricing" })).toHaveAttribute(
      "href",
      "/pricing",
    );

    const githubLink = within(nav).getByRole("link", { name: "GitHub" });
    expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/Chronopay-Org/ChronoPay-Frontend",
    );
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink.getAttribute("rel")).toContain("noopener");
  });
});
