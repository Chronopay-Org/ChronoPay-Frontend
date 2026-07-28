import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { KycStatusTimeline } from "./kyc-status-timeline";
import type { KycTimelineEntry, KycPromptPanel } from "./timeline-types";

// ─── Test data factories ──────────────────────────────────────────────────────

/** Entries where current = reviewing, last = verified. Shows "In Progress" with verified last. */
function makeReviewingEntries(): KycTimelineEntry[] {
  return [
    {
      id: "kyc-1",
      title: "Documents submitted",
      stage: "submitted",
      timestamp: "2026-07-10 2:15 PM",
      actor: "You",
      details: "Passport scan uploaded.",
    },
    {
      id: "kyc-2",
      title: "Under review",
      stage: "reviewing",
      timestamp: "2026-07-11 9:30 AM",
      actor: "Compliance Team",
      details: "Your documents are being reviewed.",
      isCurrent: true,
    },
    {
      id: "kyc-3",
      title: "Verification complete",
      stage: "verified",
      timestamp: "—",
    },
  ];
}

/** Two entries only — reviewing is current, no verified yet. Overall = "In Progress". */
function makeInProgressEntries(): KycTimelineEntry[] {
  return [
    {
      id: "kyc-1",
      title: "Documents submitted",
      stage: "submitted",
      timestamp: "2026-07-10 2:15 PM",
      actor: "You",
    },
    {
      id: "kyc-2",
      title: "Under review",
      stage: "reviewing",
      timestamp: "2026-07-11 9:30 AM",
      actor: "Compliance Team",
      details: "Your documents are being reviewed.",
      isCurrent: true,
    },
  ];
}

function makeNeedsInfoEntries(): KycTimelineEntry[] {
  return [
    {
      id: "kyc-1",
      title: "Documents submitted",
      stage: "submitted",
      timestamp: "2026-07-10 2:15 PM",
      actor: "You",
      details: "Passport scan uploaded.",
    },
    {
      id: "kyc-2",
      title: "Under review",
      stage: "reviewing",
      timestamp: "2026-07-11 9:30 AM",
      actor: "Compliance Team",
      details: "Reviewed initial documents.",
    },
    {
      id: "kyc-3",
      title: "Additional information needed",
      stage: "needs_info",
      timestamp: "2026-07-14 11:00 AM",
      actor: "Compliance Team",
      details: "Proof of address was unclear.",
      isCurrent: true,
    },
    {
      id: "kyc-4",
      title: "Verification complete",
      stage: "verified",
      timestamp: "—",
    },
  ];
}

function makeVerifiedEntries(): KycTimelineEntry[] {
  return [
    {
      id: "kyc-1",
      title: "Documents submitted",
      stage: "submitted",
      timestamp: "2026-07-10 2:15 PM",
      actor: "You",
      details: "Passport scan uploaded.",
    },
    {
      id: "kyc-2",
      title: "Under review",
      stage: "reviewing",
      timestamp: "2026-07-11 9:30 AM",
      actor: "Compliance Team",
      details: "Reviewed documents.",
    },
    {
      id: "kyc-3",
      title: "Verification complete",
      stage: "verified",
      timestamp: "2026-07-16 10:00 AM",
      actor: "Compliance Team",
      isCurrent: true,
    },
  ];
}

function makeRejectedEntries(): KycTimelineEntry[] {
  return [
    {
      id: "kyc-1",
      title: "Documents submitted",
      stage: "submitted",
      timestamp: "2026-07-10 2:15 PM",
      actor: "You",
      details: "Passport scan uploaded.",
    },
    {
      id: "kyc-2",
      title: "Under review",
      stage: "reviewing",
      timestamp: "2026-07-11 9:30 AM",
      actor: "Compliance Team",
      details: "Reviewed initial documents.",
    },
    {
      id: "kyc-3",
      title: "Verification rejected",
      stage: "rejected",
      timestamp: "2026-07-18 3:00 PM",
      actor: "Compliance Team",
      details: "Unable to verify identity with provided documents.",
      isCurrent: true,
    },
  ];
}

const samplePromptPanel: KycPromptPanel = {
  title: "Additional information required",
  description: "Please upload a clearer proof of address.",
  uploadHref: "/dashboard/settings",
  guidance: [
    "Accepted documents: utility bill, bank statement.",
    "Must be dated within the last 90 days.",
  ],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("KycStatusTimeline", () => {
  // ── Rendering ────────────────────────────────────────────────────────────

  it("renders the KYC heading and eyebrow", () => {
    render(<KycStatusTimeline entries={makeInProgressEntries()} />);
    expect(screen.getByRole("heading", { name: /KYC Status/i })).toBeInTheDocument();
    expect(screen.getByText("Identity")).toBeInTheDocument();
  });

  it("renders all timeline entries", () => {
    render(<KycStatusTimeline entries={makeReviewingEntries()} />);
    expect(screen.getByText("Documents submitted")).toBeInTheDocument();
    expect(screen.getByText("Under review")).toBeInTheDocument();
    expect(screen.getByText("Verification complete")).toBeInTheDocument();
  });

  it("renders timestamps for each entry", () => {
    render(<KycStatusTimeline entries={makeReviewingEntries()} />);
    expect(screen.getByText("2026-07-10 2:15 PM")).toBeInTheDocument();
    expect(screen.getByText("2026-07-11 9:30 AM")).toBeInTheDocument();
  });

  it("renders actor labels when provided", () => {
    render(<KycStatusTimeline entries={makeReviewingEntries()} />);
    expect(screen.getByText("By: You")).toBeInTheDocument();
    expect(screen.getByText("By: Compliance Team")).toBeInTheDocument();
  });

  it("renders details text when provided", () => {
    render(<KycStatusTimeline entries={makeReviewingEntries()} />);
    expect(screen.getByText("Passport scan uploaded.")).toBeInTheDocument();
    expect(screen.getByText("Your documents are being reviewed.")).toBeInTheDocument();
  });

  it("does not render actor/detail lines when omitted", () => {
    const entries: KycTimelineEntry[] = [
      {
        id: "kyc-1",
        title: "Documents submitted",
        stage: "submitted",
        timestamp: "2026-07-10 2:15 PM",
        isCurrent: true,
      },
    ];
    render(<KycStatusTimeline entries={entries} />);
    expect(screen.queryByText(/^By:/)).not.toBeInTheDocument();
  });

  // ── Accessibility ────────────────────────────────────────────────────────

  it("uses aria-current on the active step", () => {
    render(<KycStatusTimeline entries={makeInProgressEntries()} />);
    const activeStep = screen.getByText("Under review");
    expect(activeStep).toHaveAttribute("aria-current", "step");
  });

  it("does not set aria-current on non-active steps", () => {
    render(<KycStatusTimeline entries={makeInProgressEntries()} />);
    const inactiveStep = screen.getByText("Documents submitted");
    expect(inactiveStep).not.toHaveAttribute("aria-current");
  });

  it("renders stage status chips inside the timeline list", () => {
    render(<KycStatusTimeline entries={makeReviewingEntries()} />);
    // Status chips appear inside list items — use getAllByText for labels
    // that also appear as titles
    const list = screen.getByRole("list", { name: /KYC verification timeline/i });
    expect(within(list).getByText("Submitted")).toBeInTheDocument();
    expect(within(list).getByText("Reviewing")).toBeInTheDocument();
    expect(within(list).getByText("Verified")).toBeInTheDocument();
  });

  it("renders an ordered list for the timeline", () => {
    render(<KycStatusTimeline entries={makeInProgressEntries()} />);
    const list = screen.getByRole("list", { name: /KYC verification timeline/i });
    expect(list.tagName).toBe("OL");
  });

  it("renders correct number of list items", () => {
    render(<KycStatusTimeline entries={makeReviewingEntries()} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
  });

  it("renders each timeline entry heading as an h3", () => {
    render(<KycStatusTimeline entries={makeReviewingEntries()} />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(3);
  });

  // ── isPast / dot color logic (bug fix verification) ──────────────────────

  it("marks all stages before the current entry as completed (green dot)", () => {
    // Current = needs_info (index 2). Indices 0,1 (submitted, reviewing) → emerald dots.
    const { container } = render(
      <KycStatusTimeline
        entries={makeNeedsInfoEntries()}
        promptPanel={samplePromptPanel}
      />
    );
    const dots = container.querySelectorAll("span[aria-hidden='true']");
    const dotClasses = Array.from(dots)
      .slice(0, 2)
      .map((d) => d.className);
    dotClasses.forEach((cls) => {
      expect(cls).toMatch(/bg-emerald-500/);
    });
  });

  it("shows amber dot for current needs_info stage", () => {
    const { container } = render(
      <KycStatusTimeline
        entries={makeNeedsInfoEntries()}
        promptPanel={samplePromptPanel}
      />
    );
    const dots = container.querySelectorAll("span[aria-hidden='true']");
    // Third dot (needs_info, index 2) should be amber
    expect(dots[2].className).toMatch(/bg-amber-500/);
  });

  // ── Overall status chip ──────────────────────────────────────────────────

  it("shows 'In Progress' when current is reviewing and no verified is last", () => {
    render(<KycStatusTimeline entries={makeInProgressEntries()} />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("shows 'Action Required' when needs_info is current", () => {
    render(
      <KycStatusTimeline
        entries={makeNeedsInfoEntries()}
        promptPanel={samplePromptPanel}
      />
    );
    expect(screen.getByText("Action Required")).toBeInTheDocument();
  });

  it("shows 'Verified' overall when last stage is verified", () => {
    render(<KycStatusTimeline entries={makeVerifiedEntries()} />);
    // "Verified" appears as a stage chip AND as the overall chip — both valid
    const verifiedElements = screen.getAllByText("Verified");
    expect(verifiedElements.length).toBeGreaterThanOrEqual(2);
  });

  it("shows 'Rejected' when rejected stage is current", () => {
    render(<KycStatusTimeline entries={makeRejectedEntries()} />);
    // "Rejected" appears as a stage chip AND as the overall chip — both valid
    const rejectedElements = screen.getAllByText("Rejected");
    expect(rejectedElements.length).toBeGreaterThanOrEqual(2);
  });

  // ── Prompt panel (needs_info) ────────────────────────────────────────────

  it("renders the prompt panel when needs_info is current and promptPanel is provided", () => {
    render(
      <KycStatusTimeline
        entries={makeNeedsInfoEntries()}
        promptPanel={samplePromptPanel}
      />
    );
    expect(
      screen.getByRole("region", { name: /re-submission required/i })
    ).toBeInTheDocument();
  });

  it("renders prompt panel title and description", () => {
    render(
      <KycStatusTimeline
        entries={makeNeedsInfoEntries()}
        promptPanel={samplePromptPanel}
      />
    );
    expect(screen.getByText("Additional information required")).toBeInTheDocument();
    expect(
      screen.getByText("Please upload a clearer proof of address.")
    ).toBeInTheDocument();
  });

  it("renders guidance bullets in the prompt panel", () => {
    render(
      <KycStatusTimeline
        entries={makeNeedsInfoEntries()}
        promptPanel={samplePromptPanel}
      />
    );
    expect(
      screen.getByText("Accepted documents: utility bill, bank statement.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Must be dated within the last 90 days.")
    ).toBeInTheDocument();
  });

  it("renders upload CTA button with deep-link", () => {
    render(
      <KycStatusTimeline
        entries={makeNeedsInfoEntries()}
        promptPanel={samplePromptPanel}
      />
    );
    const cta = screen.getByRole("link", { name: /Upload documents/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "/dashboard/settings");
  });

  it("does NOT render prompt panel when needs_info is not current", () => {
    const entries: KycTimelineEntry[] = [
      {
        id: "kyc-1",
        title: "Documents submitted",
        stage: "submitted",
        timestamp: "2026-07-10 2:15 PM",
        isCurrent: true,
      },
      {
        id: "kyc-2",
        title: "Additional information needed",
        stage: "needs_info",
        timestamp: "—",
      },
    ];
    render(
      <KycStatusTimeline entries={entries} promptPanel={samplePromptPanel} />
    );
    expect(
      screen.queryByRole("region", { name: /re-submission required/i })
    ).not.toBeInTheDocument();
  });

  it("does NOT render prompt panel when promptPanel prop is omitted", () => {
    render(<KycStatusTimeline entries={makeNeedsInfoEntries()} />);
    expect(
      screen.queryByRole("region", { name: /re-submission required/i })
    ).not.toBeInTheDocument();
  });

  // ── Verified confirmation banner ─────────────────────────────────────────

  it("renders verified confirmation banner when last stage is verified", () => {
    render(<KycStatusTimeline entries={makeVerifiedEntries()} />);
    expect(
      screen.getByRole("status", { name: /verification complete/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your identity has been verified")
    ).toBeInTheDocument();
  });

  it("does NOT render verified banner when last stage is not verified", () => {
    render(<KycStatusTimeline entries={makeInProgressEntries()} />);
    expect(
      screen.queryByRole("status", { name: /verification complete/i })
    ).not.toBeInTheDocument();
  });

  it("verified banner includes listing/payout copy", () => {
    render(<KycStatusTimeline entries={makeVerifiedEntries()} />);
    expect(
      screen.getByText(
        /You can now list time slots, receive bookings, and withdraw payouts./i
      )
    ).toBeInTheDocument();
  });

  it("does NOT show verified banner when rejected is current", () => {
    const entries: KycTimelineEntry[] = [
      { id: "kyc-1", title: "Submitted", stage: "submitted", timestamp: "TS" },
      { id: "kyc-2", title: "Reviewing", stage: "reviewing", timestamp: "TS" },
      {
        id: "kyc-3",
        title: "Rejected",
        stage: "rejected",
        timestamp: "TS",
        isCurrent: true,
      },
      { id: "kyc-4", title: "Verified", stage: "verified", timestamp: "TS" },
    ];
    render(<KycStatusTimeline entries={entries} />);
    expect(
      screen.queryByRole("status", { name: /verification complete/i })
    ).not.toBeInTheDocument();
  });

  // ── Rejected state banner ────────────────────────────────────────────────

  it("renders rejected alert banner when rejected is current", () => {
    render(<KycStatusTimeline entries={makeRejectedEntries()} />);
    expect(
      screen.getByRole("alert", { name: /verification rejected/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your KYC verification was not approved")
    ).toBeInTheDocument();
  });

  it("rejected banner includes support guidance", () => {
    render(<KycStatusTimeline entries={makeRejectedEntries()} />);
    expect(
      screen.getByText(/contact support for assistance/i)
    ).toBeInTheDocument();
  });

  it("does NOT render rejected banner when rejected is not current", () => {
    render(<KycStatusTimeline entries={makeInProgressEntries()} />);
    expect(
      screen.queryByRole("alert", { name: /verification rejected/i })
    ).not.toBeInTheDocument();
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it("handles a single-entry timeline", () => {
    const single: KycTimelineEntry[] = [
      {
        id: "kyc-1",
        title: "Documents submitted",
        stage: "submitted",
        timestamp: "2026-07-10 2:15 PM",
        isCurrent: true,
      },
    ];
    render(<KycStatusTimeline entries={single} />);
    expect(screen.getByText("Documents submitted")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("handles entries with no isCurrent set on any", () => {
    const entries: KycTimelineEntry[] = [
      {
        id: "kyc-1",
        title: "Documents submitted",
        stage: "submitted",
        timestamp: "2026-07-10 2:15 PM",
      },
    ];
    render(<KycStatusTimeline entries={entries} />);
    expect(screen.getByText("Documents submitted")).toBeInTheDocument();
    const heading = screen.getByText("Documents submitted");
    expect(heading).not.toHaveAttribute("aria-current");
  });

  it("handles empty guidance array in prompt panel", () => {
    render(
      <KycStatusTimeline
        entries={makeNeedsInfoEntries()}
        promptPanel={{
          title: "Resubmit",
          description: "Please resubmit.",
          uploadHref: "/upload",
          guidance: [],
        }}
      />
    );
    expect(
      screen.getByRole("region", { name: /re-submission required/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: /guidance/i })
    ).not.toBeInTheDocument();
  });

  // ── Dark mode / styling ──────────────────────────────────────────────────

  it("applies dark theme border classes for the timeline line", () => {
    render(<KycStatusTimeline entries={makeInProgressEntries()} />);
    const list = screen.getByRole("list", { name: /KYC verification timeline/i });
    expect(list).toHaveClass("border-white/10");
  });

  // ── RTL support (logical properties) ─────────────────────────────────────

  it("uses logical CSS properties for RTL support (border-s, ms-, -start-)", () => {
    render(<KycStatusTimeline entries={makeInProgressEntries()} />);
    const list = screen.getByRole("list", { name: /KYC verification timeline/i });
    expect(list.className).toMatch(/border-s/);
    expect(list.className).toMatch(/ms-3/);
  });

  // ── Responsive layout ────────────────────────────────────────────────────

  it("renders the section with responsive padding classes", () => {
    render(<KycStatusTimeline entries={makeInProgressEntries()} />);
    const sections = document.querySelectorAll("section");
    const kycSection = sections[0];
    expect(kycSection.className).toMatch(/p-4/);
    expect(kycSection.className).toMatch(/sm:p-5/);
    expect(kycSection.className).toMatch(/xl:p-6/);
  });

  // ── className prop ───────────────────────────────────────────────────────

  it("appends custom className to the section", () => {
    render(
      <KycStatusTimeline entries={makeInProgressEntries()} className="my-custom-class" />
    );
    const sections = document.querySelectorAll("section");
    const kycSection = sections[0];
    expect(kycSection).toHaveClass("my-custom-class");
  });

  // ── Help popovers ────────────────────────────────────────────────────────

  it("renders KYC help popover trigger", () => {
    render(<KycStatusTimeline entries={makeInProgressEntries()} />);
    expect(
      screen.getByLabelText("Help: what is KYC verification?")
    ).toBeInTheDocument();
  });

  it("renders re-submission help popover trigger in prompt panel", () => {
    render(
      <KycStatusTimeline
        entries={makeNeedsInfoEntries()}
        promptPanel={samplePromptPanel}
      />
    );
    expect(
      screen.getByLabelText("Help: what does KYC re-submission mean?")
    ).toBeInTheDocument();
  });

  // ── Stage format labels ──────────────────────────────────────────────────

  it("maps all five KYC stages to correct display labels within the timeline list", () => {
    const allStages: KycTimelineEntry[] = [
      { id: "1", title: "S1", stage: "submitted", timestamp: "TS" },
      { id: "2", title: "S2", stage: "reviewing", timestamp: "TS", isCurrent: true },
      { id: "3", title: "S3", stage: "needs_info", timestamp: "TS" },
      { id: "4", title: "S4", stage: "rejected", timestamp: "TS" },
      { id: "5", title: "S5", stage: "verified", timestamp: "TS" },
    ];
    render(<KycStatusTimeline entries={allStages} />);
    const list = screen.getByRole("list", { name: /KYC verification timeline/i });
    expect(within(list).getByText("Submitted")).toBeInTheDocument();
    expect(within(list).getByText("Reviewing")).toBeInTheDocument();
    expect(within(list).getByText("Needs Info")).toBeInTheDocument();
    expect(within(list).getByText("Rejected")).toBeInTheDocument();
    expect(within(list).getByText("Verified")).toBeInTheDocument();
  });

  // ── Long review edge case ────────────────────────────────────────────────

  it("renders a long review timeline with each stage correctly", () => {
    const longReview: KycTimelineEntry[] = [
      {
        id: "kyc-1",
        title: "Documents submitted",
        stage: "submitted",
        timestamp: "2026-01-05 10:00 AM",
        actor: "You",
      },
      {
        id: "kyc-2",
        title: "Under review",
        stage: "reviewing",
        timestamp: "2026-01-06 9:30 AM",
        actor: "Compliance Team",
        details: "Review is taking longer than expected due to high volume.",
        isCurrent: true,
      },
    ];
    render(<KycStatusTimeline entries={longReview} />);
    expect(screen.getByText("2026-01-05 10:00 AM")).toBeInTheDocument();
    expect(
      screen.getByText("Review is taking longer than expected due to high volume.")
    ).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });
});

