import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SocialProofBadge, BADGE_PRESETS } from "./social-proof-badge";
import type { SocialProofBadgeEntry } from "./types";

const baseBadge: SocialProofBadgeEntry = {
  type: "topRated",
  ...BADGE_PRESETS.topRated,
};

describe("SocialProofBadge", () => {
  it("renders badge label", () => {
    render(<SocialProofBadge badge={baseBadge} />);
    expect(screen.getByText("Top 5% rated")).toBeInTheDocument();
  });

  it("renders with aria-label including criterion", () => {
    render(<SocialProofBadge badge={baseBadge} />);
    const badge = screen.getByLabelText(
      "Top 5% rated: Rated in the top 5% of all sellers based on buyer reviews from the last 90 days.",
    );
    expect(badge).toBeInTheDocument();
  });

  it("applies tone color classes", () => {
    const { container } = render(<SocialProofBadge badge={baseBadge} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-emerald-400/10");
    expect(badge.className).toContain("border-emerald-400/30");
    expect(badge.className).toContain("text-emerald-100");
  });

  it("applies neutral tone for verified badge", () => {
    const verifiedBadge: SocialProofBadgeEntry = {
      type: "verified",
      ...BADGE_PRESETS.verified,
    };
    const { container } = render(<SocialProofBadge badge={verifiedBadge} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-sky-400/10");
    expect(badge.className).toContain("border-sky-400/30");
    expect(badge.className).toContain("text-sky-100");
  });

  it("renders tooltip trigger with help information label", () => {
    render(<SocialProofBadge badge={baseBadge} />);
    const helpButton = screen.getByLabelText("Help information");
    expect(helpButton).toBeInTheDocument();
  });

  it("renders all preset badge types without error", () => {
    const types: SocialProofBadgeEntry["type"][] = [
      "topRated",
      "highPayouts",
      "repeatBuyers",
      "fastResponse",
      "verified",
      "earlyAdopter",
    ];

    for (const type of types) {
      const badge: SocialProofBadgeEntry = { type, ...BADGE_PRESETS[type] };
      const { container } = render(<SocialProofBadge badge={badge} />);
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText(BADGE_PRESETS[type].label)).toBeInTheDocument();
    }
  });

  it("applies custom className", () => {
    const { container } = render(
      <SocialProofBadge badge={baseBadge} className="custom-class" />,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders without crashing when icon name is invalid", () => {
    const invalidIconBadge: SocialProofBadgeEntry = {
      type: "topRated",
      ...BADGE_PRESETS.topRated,
      icon: "NonExistentIcon",
    };
    const { container } = render(<SocialProofBadge badge={invalidIconBadge} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
