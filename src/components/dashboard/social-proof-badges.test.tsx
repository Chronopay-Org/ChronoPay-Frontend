import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SocialProofBadges } from "./social-proof-badges";
import { BADGE_PRESETS } from "./social-proof-badge";
import type { SocialProofBadgeEntry } from "./types";

const badges: SocialProofBadgeEntry[] = [
  { type: "topRated", ...BADGE_PRESETS.topRated },
  { type: "highPayouts", ...BADGE_PRESETS.highPayouts },
  { type: "repeatBuyers", ...BADGE_PRESETS.repeatBuyers },
  { type: "fastResponse", ...BADGE_PRESETS.fastResponse },
  { type: "verified", ...BADGE_PRESETS.verified },
];

describe("SocialProofBadges", () => {
  it("renders all badges when under maxVisible limit", () => {
    render(<SocialProofBadges badges={badges} maxVisible={5} />);
    expect(screen.getByText("Top 5% rated")).toBeInTheDocument();
    expect(screen.getByText("200+ payouts")).toBeInTheDocument();
    expect(screen.getByText("12 repeat buyers")).toBeInTheDocument();
    expect(screen.getByText("Fast response")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  it("truncates badges beyond maxVisible with +N indicator", () => {
    render(<SocialProofBadges badges={badges} maxVisible={2} />);
    expect(screen.getByText("Top 5% rated")).toBeInTheDocument();
    expect(screen.getByText("200+ payouts")).toBeInTheDocument();
    expect(screen.queryByText("12 repeat buyers")).not.toBeInTheDocument();
    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  it("renders nothing for empty badges array", () => {
    const { container } = render(<SocialProofBadges badges={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("uses default maxVisible of 3", () => {
    render(<SocialProofBadges badges={badges} />);
    expect(screen.getByText("Top 5% rated")).toBeInTheDocument();
    expect(screen.getByText("200+ payouts")).toBeInTheDocument();
    expect(screen.getByText("12 repeat buyers")).toBeInTheDocument();
    expect(screen.queryByText("Fast response")).not.toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("renders +0 when all badges fit (does not show truncation)", () => {
    render(<SocialProofBadges badges={badges.slice(0, 3)} />);
    expect(screen.getByText("Top 5% rated")).toBeInTheDocument();
    expect(screen.getByText("200+ payouts")).toBeInTheDocument();
    expect(screen.getByText("12 repeat buyers")).toBeInTheDocument();
    expect(screen.queryByText("+0")).not.toBeInTheDocument();
    expect(screen.queryByText("+")).not.toBeInTheDocument();
  });

  it("renders tooltip trigger in overflow chip", () => {
    render(<SocialProofBadges badges={badges} maxVisible={2} />);
    const helpButtons = screen.getAllByLabelText("Help information");
    expect(helpButtons.length).toBe(3); // 2 visible badges + 1 overflow
  });

  it("applies custom className", () => {
    const { container } = render(
      <SocialProofBadges badges={badges.slice(0, 1)} className="custom-wrap" />,
    );
    expect(container.firstChild).toHaveClass("custom-wrap");
  });
});
