import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { StatusTimeline } from "./status-timeline";
import {
  TimelineItem,
  TimelineNode,
  TimelineBranchGroup,
} from "./timeline-types";

// ─── Mock data ────────────────────────────────────────────────────────────────

const allItems: TimelineNode[] = [
  {
    id: "reserved",
    title: "Reserved",
    status: "completed" as const,
    timestamp: "2026-06-30 09:00 AM",
    actor: "Buyer",
    details: "Slot reserved for 30 minutes.",
    isMilestone: true,
  },
  {
    id: "2",
    title: "Confirmed",
    status: "completed" as const,
    timestamp: "2026-06-30 09:30 AM",
    actor: "System",
    details: "Booking confirmed by seller.",
  },
  {
    id: "3",
    title: "Escrow Funded",
    status: "pending" as const,
    timestamp: "2026-06-30 10:00 AM",
    isMilestone: true,
    isCurrent: true,
    variant: "mediator_assigned",
    mediator: {
      name: "Amina Yusuf",
      responseSlaLabel: "Responds within 24 hours",
      responseDueLabel: "Due Tue, Jul 21 at 11:15 AM",
      slaProgress: 42,
      directMessageHref: "/dashboard/messages/amina-yusuf",
    },
  },
  {
    id: "4",
    title: "Step 3",
    status: "pending" as const,
    timestamp: "2026-06-30 11:00 AM",
  },
];

const onlyMilestones: TimelineNode[] = [
  {
    id: "1",
    title: "Reserved",
    status: "completed" as const,
    timestamp: "2026-06-30 09:00 AM",
    isMilestone: true,
  },
  {
    id: "2",
    title: "Approved",
    status: "completed" as const,
    timestamp: "2026-06-30 09:30 AM",
    isMilestone: true,
  },
];

const noMilestones: TimelineNode[] = [
  {
    id: "1",
    title: "Notification Sent",
    status: "completed" as const,
    timestamp: "2026-06-30 09:00 AM",
  },
  {
    id: "2",
    title: "Follow-up",
    status: "pending" as const,
    timestamp: "2026-06-30 10:00 AM",
  },
];

// ─── Branch data ──────────────────────────────────────────────────────────────

const branchItems: TimelineNode[] = [
  {
    id: "pre-branch",
    title: "Payment Received",
    status: "completed" as const,
    timestamp: "2026-06-30 09:00 AM",
    isMilestone: true,
  },
  {
    type: "branch-group",
    id: "dispute-branch",
    label: "Dispute Initiated",
    branches: [
      [
        {
          id: "dispute-review",
          title: "Dispute Under Review",
          status: "warning" as const,
          timestamp: "2026-06-30 10:00 AM",
          details: "Buyer claims item not as described.",
        },
        {
          id: "dispute-resolved",
          title: "Dispute Resolved",
          status: "completed" as const,
          timestamp: "2026-06-30 12:00 PM",
          isMilestone: true,
        },
      ],
      [
        {
          id: "refund-processing",
          title: "Refund Processing",
          status: "pending" as const,
          timestamp: "2026-06-30 10:30 AM",
          details: "Refund of $150.00 to original payment method.",
        },
      ],
    ],
    rejoinLabel: "Case Closed",
  } as TimelineBranchGroup,
  {
    id: "post-branch",
    title: "Rating Submitted",
    status: "completed" as const,
    timestamp: "2026-06-30 01:00 PM",
  },
];

const branchItemsNoRejoin: TimelineNode[] = [
  {
    type: "branch-group",
    id: "multi-branch",
    label: "Parallel Tasks",
    branches: [
      [
        {
          id: "task-a",
          title: "Task A",
          status: "completed" as const,
          timestamp: "2026-06-30 10:00 AM",
        },
      ],
      [
        {
          id: "task-b",
          title: "Task B",
          status: "pending" as const,
          timestamp: "2026-06-30 10:00 AM",
        },
      ],
      [
        {
          id: "task-c",
          title: "Task C",
          status: "completed" as const,
          timestamp: "2026-06-30 10:00 AM",
          isMilestone: true,
        },
      ],
    ],
  } as TimelineBranchGroup,
];

const branchWithMilestones: TimelineNode[] = [
  {
    type: "branch-group",
    id: "branch-milestones",
    label: "Verification",
    branches: [
      [
        {
          id: "auto-check",
          title: "Auto Verification",
          status: "completed" as const,
          timestamp: "2026-06-30 10:00 AM",
          isMilestone: true,
        },
      ],
      [
        {
          id: "manual-check",
          title: "Manual Review",
          status: "pending" as const,
          timestamp: "2026-06-30 10:00 AM",
        },
      ],
    ],
    rejoinLabel: "Verification Complete",
  } as TimelineBranchGroup,
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("StatusTimeline", () => {
  it("renders the mediator-assigned timeline block with SLA and direct message action", () => {
    render(<StatusTimeline items={items} />);

    it("renders all items when milestones mode is off", () => {
      render(<StatusTimeline items={allItems} />);
      expect(screen.getByText("Reserved")).toBeInTheDocument();
      expect(screen.getByText("Confirmed")).toBeInTheDocument();
      expect(screen.getByText("Escrow Funded")).toBeInTheDocument();
      expect(screen.getByText("Step 3")).toBeInTheDocument();
    });

    it("expands details when clicked", () => {
      render(<StatusTimeline items={allItems} />);
      const showButtons = screen.getAllByText("Show Details");
      fireEvent.click(showButtons[0]);
      expect(screen.getByText("Hide Details")).toBeInTheDocument();
      expect(screen.getByText("Actor: Buyer")).toBeInTheDocument();
      expect(
        screen.getByText("Slot reserved for 30 minutes."),
      ).toBeInTheDocument();
    });

    it("announces a mediator assignment for assistive tech", () => {
      render(<StatusTimeline items={items} />);

      expect(screen.getByRole("status")).toHaveTextContent(
        "Mediator Amina Yusuf assigned. Response SLA Responds within 24 hours.",
      );
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
      expect(screen.queryByText("Step 3")).not.toBeInTheDocument();
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
      expect(screen.getByText("Step 3")).toBeInTheDocument();
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
      const singleMilestone: TimelineNode[] = [
        {
          id: "1",
          title: "Completed",
          status: "completed" as const,
          timestamp: "2026-06-30 09:00 AM",
          isMilestone: true,
        },
        {
          id: "2",
          title: "Notification",
          status: "pending" as const,
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
      expect(
        screen.queryByText(/No milestones found/i),
      ).not.toBeInTheDocument();
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

      fireEvent.click(toggle);
      const liveRegion = screen.getByRole("status");
      expect(liveRegion).toHaveTextContent("Showing milestones only");

      fireEvent.click(toggle);
      expect(liveRegion).toHaveTextContent("Showing all timeline events");
    });

    // ── Accessibility checks ─────────────────────────────────────────────────

    it("has accessible toggle with proper aria-label", () => {
      render(<StatusTimeline items={allItems} />);
      const toggle = screen.getByRole("switch");

      expect(toggle).toHaveAttribute("aria-label", "Show milestones only");

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
      expect(liveRegions.length).toBeGreaterThanOrEqual(1);
    });

    // ── Branch rendering ─────────────────────────────────────────────────────

    it("renders branch group label and branches", () => {
      render(<StatusTimeline items={branchItems} />);
      expect(screen.getByText("Dispute Initiated")).toBeInTheDocument();
      expect(screen.getByText("Dispute Under Review")).toBeInTheDocument();
      expect(screen.getByText("Dispute Resolved")).toBeInTheDocument();
      expect(screen.getByText("Refund Processing")).toBeInTheDocument();
    });

    it("renders regular items before and after branch group", () => {
      render(<StatusTimeline items={branchItems} />);
      expect(screen.getByText("Payment Received")).toBeInTheDocument();
      expect(screen.getByText("Rating Submitted")).toBeInTheDocument();
    });

    it("renders rejoin marker when rejoinLabel is provided", () => {
      render(<StatusTimeline items={branchItems} />);
      expect(screen.getByText("Case Closed")).toBeInTheDocument();
    });

    it("does not render rejoin marker when rejoinLabel is omitted", () => {
      render(<StatusTimeline items={branchItemsNoRejoin} />);
      expect(screen.queryByText("Case Closed")).not.toBeInTheDocument();
    });

    it("renders multiple branches (3-way branch)", () => {
      render(<StatusTimeline items={branchItemsNoRejoin} />);
      expect(screen.getByText("Parallel Tasks")).toBeInTheDocument();
      expect(screen.getByText("Task A")).toBeInTheDocument();
      expect(screen.getByText("Task B")).toBeInTheDocument();
      expect(screen.getByText("Task C")).toBeInTheDocument();
    });

    it("renders branch group with accessible role group and aria-label", () => {
      render(<StatusTimeline items={branchItems} />);
      const branchGroup = screen.getByRole("group", {
        name: /Dispute Initiated/,
      });
      expect(branchGroup).toBeInTheDocument();
    });

    it("shows branch count label", () => {
      render(<StatusTimeline items={branchItems} />);
      expect(screen.getByText("2 branches")).toBeInTheDocument();
    });

    it("shows 3 branches label for three-way branch", () => {
      render(<StatusTimeline items={branchItemsNoRejoin} />);
      expect(screen.getByText("3 branches")).toBeInTheDocument();
    });

    it("renders each branch with a 'Branch N' heading", () => {
      render(<StatusTimeline items={branchItems} />);
      expect(screen.getByText("Branch 1")).toBeInTheDocument();
      expect(screen.getByText("Branch 2")).toBeInTheDocument();
    });

    // ── Branch + milestones toggle ───────────────────────────────────────────

    it("shows milestones toggle when branches contain milestones", () => {
      render(<StatusTimeline items={branchWithMilestones} />);
      expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("filters branch items to milestones only when toggle is on", () => {
      render(<StatusTimeline items={branchWithMilestones} />);
      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      // Milestone item from branch should be visible
      expect(screen.getByText("Auto Verification")).toBeInTheDocument();
      // Non-milestone should not be visible
      expect(screen.queryByText("Manual Review")).not.toBeInTheDocument();
    });

    it("renders branch milestones text in milestones mode", () => {
      render(<StatusTimeline items={branchWithMilestones} />);
      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      expect(screen.getByText("1 milestone shown")).toBeInTheDocument();
    });

    it("does not show empty branches in milestones mode when none match", () => {
      render(<StatusTimeline items={branchItemsNoRejoin} />);
      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      // Only Task C is a milestone, so its branch should show
      expect(screen.getByText("Task C")).toBeInTheDocument();
      // Non-milestone tasks should not be visible
      expect(screen.queryByText("Task A")).not.toBeInTheDocument();
      expect(screen.queryByText("Task B")).not.toBeInTheDocument();
    });

    // ── Branch accessibility ─────────────────────────────────────────────────

    it("has focusable branch containers with tabIndex", () => {
      render(<StatusTimeline items={branchItems} />);
      const branchContainers = document.querySelectorAll("[data-branch-index]");
      expect(branchContainers.length).toBeGreaterThan(0);
      branchContainers.forEach((el) => {
        expect(el.getAttribute("tabindex")).toBe("0");
      });
    });

    it("assignes accessible aria-label to each branch", () => {
      render(<StatusTimeline items={branchItems} />);
      const branch = screen.getByRole("group", {
        name: /Branch 1: Dispute Under Review/,
      });
      expect(branch).toBeInTheDocument();
    });

    it("has rejoin marker as accessible region with aria-label", () => {
      render(<StatusTimeline items={branchItems} />);
      const rejoinRegion = screen.getByRole("region", {
        name: /Rejoin: Case Closed/,
      });
      expect(rejoinRegion).toBeInTheDocument();
    });

    // ── Branch empty / edge cases ────────────────────────────────────────────

    it("renders gracefully with empty branch group branches array", () => {
      const emptyBranch: TimelineNode[] = [
        {
          type: "branch-group",
          id: "empty-group",
          label: "Empty Branch",
          branches: [],
        } as TimelineBranchGroup,
      ];
      render(<StatusTimeline items={emptyBranch} />);
      expect(screen.getByText("Empty Branch")).toBeInTheDocument();
    });
  });
});
