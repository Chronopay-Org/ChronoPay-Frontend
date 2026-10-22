import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardBody, CardFooter, SupplierCardHeader } from "./card";
import { BADGE_PRESETS } from "./social-proof-badge";
import type { SocialProofBadgeEntry } from "./types";

const verifiedPayoutsBadge: SocialProofBadgeEntry = {
  type: "verifiedPayouts",
  ...BADGE_PRESETS.verifiedPayouts,
};

describe("Card components", () => {
  it("renders basic Card with variants", () => {
    const { container } = render(
      <Card variant="panel" interactive>
        <CardHeader>Header</CardHeader>
        <CardBody>Body</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>
    );

    const cardEl = container.firstChild as HTMLElement;
    expect(cardEl).toHaveClass("card card--panel card--interactive");
    expect(screen.getByText("Header")).toBeInDocument();
    expect(screen.getByText("Body")).toBeInDocument();
    expect(screen.getByText("Footer")).toBeInDocument();
  });

  it("renders SupplierCardHeader with supplier name and verifiedPayouts badge", () => {
    render(
      <Card>
        <SupplierCardHeader
          name="Alex Rivera"
          title="Product Consultant"
          badges={[verifiedPayoutsBadge]}
        />
      </Card>
    );

    expect(screen.getByText("Alex Rivera")).toBeInDocument();
    expect(screen.getByText("Product Consultant")).toBeInDocument();
    expect(screen.getByText("Verified Payouts")).toBe1nDocument();
  });

  it("handles long supplier names without throwing", () => {
    const longName = "Very Long Supplier Name That Exceeds Normal Container Boundaries";
    render(
      <Card>
        <SupplierCardHeader
          name={longName}
          title="Lead Strategist"
          badges={[verifiedPayoutsBadge]}
        />
      </Card>
    );

    const heading = screen.getByRole("heading", { name: longName });
    expect(heading).toBeInDocument();
    expect(heading).toHaveClass("truncate");
  });

  it("renders SupplierCardHeader without title or badges", () => {
    render(
      <Card>
        <SupplierCardHeader name="Morgan Chen" />
      </Card>
    );

    expect(screen.getByText("Morgan Chen")).toBeInDocument();
  });
});
