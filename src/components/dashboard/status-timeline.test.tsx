import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusTimeline } from "./status-timeline";
import { TimelineItem } from "./timeline-types";

// ─── Mock data ────────────────────────────────────────────────────────────────

const allItems: TimelineItem[] = [
  {
    id: "1",
    title: "Reserved",
    status: "completed",
    timestamp: "2026-06-30 09:00 AM",
    actor: "Buyer",
    details: "Slot reserved for 30 minutes.",
    isMilestone: true,
  },
  // Exercises the `!!item.actor` branch of `hasDetails` (no details, only actor).
  {
    id: "2",
    title: "Confirmed",
    status: "completed",
    timestamp: "2026-06-30 09:30 AM",
    actor: "System",
    details: "Booking confirmed by seller.",
  },
  {
    id: "3",
    title: "Escrow Funded",
    status: "pending",
    timestamp: "2026-06-30 10:00 AM",
    isMilestone: true,
    isCurrent: true,
  },
  // Exercises the neither-details-nor-actor branch (renders without the
  // expand toggle at all).
  {
    id: "3",
    title: "Step 3",
    status: "pending",
    timestamp: "2026-06-30 11:00 AM",
  },
];

const onlyMilestones: TimelineItem[] = [
  {
    id: "1",
    title: "Reserved",
    status: "completed",
    timestamp: "2026-06-30 09:00 AM",
    isMilestone: true,
  },
  {
    id: "2",
    title: "Approved",
    status: "completed",
    timestamp: "2026-06-30 09:30 AM",
    isMilestone: true,
  },
];

const noMilestones: TimelineItem[] = [
  {
    id: "1",
    title: "Notification Sent",
    status: "completed",
    timestamp: "2026-06-30 09:00 AM",
  },
  {
    id: "2",
    title: "Follow-up",
    status: "pending",
    timestamp: "2026-06-30 10:00 AM",
  },
];


// ─── Tests ────────────────────────────────────────────────────────────────────

describe("StatusTimeline", () => {
  // ── Basic rendering ──────────────────────────────────────────────────────

  it("renders all items when milestones mode is off", () => {
    render(<StatusTimeline items={allItems} />);
    expect(screen.getByText("Reserved")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Escrow Funded")).toBeInTheDocument();
    expect(screen.getByText("Rating Submitted")).toBeInTheDocument();
  });

  it("expands details when clicked", () => {
    render(<StatusTimeline items={mockItems} />);
    // Two of the three mockItems expand their details (item 1 has both
    // `details` and `actor`, item 2 has only `actor`); use getAllByText and
    // click the first match so the test stays focused on row 1's payload.
    const showButtons = screen.getAllByText("Show Details");
    fireEvent.click(showButtons[0]);
    expect(screen.getByText("Hide Details")).toBeInTheDocument();
    expect(screen.getByText("Actor: Buyer")).toBeInTheDocument();
    expect(screen.getByText("Slot reserved for 30 minutes.")).toBeInTheDocument();
  });

  it("applies aria-current to active step", () => {
    render(<StatusTimeline items={allItems} />);
    const activeStep = screen.getByText("Escrow Funded");
    expect(activeStep).toHaveAttribute("aria-current", "step");
  });

  // ── Milestones toggle ────────────────────────────────────────────────────

  it("renders the milestones toggle when items have milestones", () => {
    render(<StatusTimeline items={allItems} />);
    const toggle = screen.getByRole("switch");
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("does not render the milestones toggle when no items are milestones", () => {
    render(<StatusTimeline items={noMilestones} />);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("does not render the milestones toggle when items array is empty", () => {
    render(<StatusTimeline items={[]} />);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("filters to milestones only when toggle is activated", () => {
    render(<StatusTimeline items={allItems} />);
    const toggle = screen.getByRole("switch");
    
    fireEvent.click(toggle);
    
    // Milestones should be visible
    expect(screen.getByText("Reserved")).toBeInTheDocument();
    expect(screen.getByText("Escrow Funded")).toBeInTheDocument();
    
    // Non-milestones should not be visible
    expect(screen.queryByText("Confirmed")).not.toBeInTheDocument();
    expect(screen.queryByText("Rating Submitted")).not.toBeInTheDocument();
  });

  it("toggles back to show all items", () => {
    render(<StatusTimeline items={allItems} />);
    const toggle = screen.getByRole("switch");
    
    // Turn on milestones mode
    fireEvent.click(toggle);
    expect(screen.queryByText("Confirmed")).not.toBeInTheDocument();
    
    // Turn off milestones mode
    fireEvent.click(toggle);
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Rating Submitted")).toBeInTheDocument();
  });

  it("updates aria-checked when toggled", () => {
    render(<StatusTimeline items={allItems} />);
    const toggle = screen.getByRole("switch");
    
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("shows milestone count label in milestones mode", () => {
    render(<StatusTimeline items={allItems} />);
    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);
    
    expect(screen.getByText("2 milestones shown")).toBeInTheDocument();
  });

  it("shows singular count when exactly one milestone", () => {
    const singleMilestone: TimelineItem[] = [
      {
        id: "1",
        title: "Completed",
        status: "completed",
        timestamp: "2026-06-30 09:00 AM",
        isMilestone: true,
      },
      {
        id: "2",
        title: "Notification",
        status: "pending",
        timestamp: "2026-06-30 10:00 AM",
      },
    ];
    render(<StatusTimeline items={singleMilestone} />);
    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);
    
    expect(screen.getByText("1 milestone shown")).toBeInTheDocument();
  });

  // ── Empty state (defensive) ─────────────────────────────────────────────

  it("does not render toggle or empty state when no items have milestones", () => {
    render(<StatusTimeline items={noMilestones} />);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByText(/No milestones found/i)).not.toBeInTheDocument();
    // Still shows all items
    expect(screen.getByText("Notification Sent")).toBeInTheDocument();
    expect(screen.getByText("Follow-up")).toBeInTheDocument();
  });

  // ── Edge case: all items are milestones ──────────────────────────────────

  it("shows all items when all items are milestones and mode is on", () => {
    render(<StatusTimeline items={onlyMilestones} />);
    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);
    
    expect(screen.getByText("Reserved")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("2 milestones shown")).toBeInTheDocument();
  });

  // ── Milestone badge ──────────────────────────────────────────────────────

  it("shows milestone badge on milestone items", () => {
    render(<StatusTimeline items={allItems} />);
    const milestoneBadges = screen.getAllByText("Milestone");
    // Items 1 and 3 have isMilestone
    expect(milestoneBadges).toHaveLength(2);
  });

  it("does not show milestone badge on non-milestone items", () => {
    render(<StatusTimeline items={noMilestones} />);
    expect(screen.queryByText("Milestone")).not.toBeInTheDocument();
  });

  // ── Screen reader announcements ──────────────────────────────────────────

  it("announces milestones mode on toggle via aria-live", () => {
    render(<StatusTimeline items={allItems} />);
    const toggle = screen.getByRole("switch");
    
    // Turn on
    fireEvent.click(toggle);
    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveTextContent("Showing milestones only");
    
    // Turn off
    fireEvent.click(toggle);
    expect(liveRegion).toHaveTextContent("Showing all timeline events");
  });

  // ── Accessibility checks ─────────────────────────────────────────────────

  it("has accessible toggle with proper aria-label", () => {
    render(<StatusTimeline items={allItems} />);
    const toggle = screen.getByRole("switch");
    
    // Default state
    expect(toggle).toHaveAttribute("aria-label", "Show milestones only");
    
    // After toggle
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-label", "Show all timeline events");
  });

  it("uses role switch for the toggle element", () => {
    render(<StatusTimeline items={allItems} />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("has live region for announcements", () => {
    render(<StatusTimeline items={allItems} />);
    const liveRegions = screen.getAllByRole("status");
    // One is the announcements, one is the milestone count
    expect(liveRegions.length).toBeGreaterThanOrEqual(1);
  });
});
