/**
 * AvailabilityConflictDetector Unit Tests
 *
 * Target test coverage: >= 95%
 */

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AvailabilityConflictDetector,
  DEFAULT_AVAILABILITY_CONFLICTS,
  type AvailabilityConflict,
  type ConflictResolutionEvent,
} from "./availability-conflict-detector";

const customConflicts: AvailabilityConflict[] = [
  {
    id: "conflict-custom-1",
    incomingBlockTitle: "Web3 Payout Design Sync",
    incomingTimeRange: "Wed, 14:00 - 15:00 UTC",
    collidingSlotId: "slot-custom-1",
    collidingTitle: "Client Onboarding Review",
    collidingTimeRange: "Wed, 14:30 - 15:30 UTC",
    conflictType: "booking_overlap",
    severity: "critical",
    description: "Overlaps by 30 minutes with Client Onboarding Review.",
    suggestedShiftTimeRange: "Wed, 15:30 - 16:30 UTC",
    suggestedSplitRanges: ["Wed, 14:00 - 14:30 UTC (30m window)"],
    affectedSlotId: "slot-custom-1",
  },
  {
    id: "conflict-custom-2",
    incomingBlockTitle: "Security Audit Call",
    incomingTimeRange: "Thu, 10:00 - 11:00 UTC",
    collidingSlotId: "slot-custom-2",
    collidingTitle: "Architecture Planning",
    collidingTimeRange: "Thu, 10:00 - 11:00 UTC",
    conflictType: "double_booking",
    severity: "warning",
    description: "Direct double booking with Architecture Planning.",
    suggestedShiftTimeRange: "Thu, 11:00 - 12:00 UTC",
    suggestedSplitRanges: [],
    affectedSlotId: "slot-custom-2",
  },
  {
    id: "conflict-custom-3",
    incomingBlockTitle: "Informational Buffer Block",
    incomingTimeRange: "Fri, 16:00 - 17:00 UTC",
    collidingSlotId: "slot-custom-3",
    collidingTitle: "Buffer Time Notice",
    collidingTimeRange: "Fri, 16:15 - 16:45 UTC",
    conflictType: "buffer_violation",
    severity: "info",
    description: "Encroaches on 15 minute buffer rule.",
    affectedSlotId: "slot-custom-3",
  },
];

describe("AvailabilityConflictDetector", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("Initial Rendering & Default State", () => {
    it("renders default title, severity badge, and collision details", () => {
      render(<AvailabilityConflictDetector />);

      expect(screen.getByRole("heading", { name: /Availability Conflict Detector/i })).toBeInTheDocument();
      expect(screen.getByText(/Critical Overlap/i)).toBeInTheDocument();
      expect(screen.getByText(/Team Strategy & Alignment Block/i)).toBeInTheDocument();
      expect(screen.getByText(/1-on-1 Architecture Consultation/i)).toBeInTheDocument();
    });

    it("renders custom title when title prop is supplied", () => {
      render(<AvailabilityConflictDetector title="Custom Overlap Alert" />);

      expect(screen.getByRole("heading", { name: "Custom Overlap Alert" })).toBeInTheDocument();
    });

    it("renders three primary one-tap resolution action buttons", () => {
      render(<AvailabilityConflictDetector />);

      expect(screen.getByRole("button", { name: /Shift block to Today, 15:15 - 16:15 UTC/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Split block around 1-on-1 Architecture Consultation/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Cancel incoming block Team Strategy & Alignment Block/i })).toBeInTheDocument();
    });

    it("renders compact layout variant when compact is true", () => {
      const { container } = render(<AvailabilityConflictDetector compact />);

      expect(container.querySelector(".grid-cols-1")).toBeInTheDocument();
    });

    it("returns null when conflicts array is empty", () => {
      const { container } = render(<AvailabilityConflictDetector conflicts={[]} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("One-Tap Resolution Actions", () => {
    it("handles Shift action and invokes onResolveConflict callback", () => {
      const onResolveConflict = vi.fn();
      render(
        <AvailabilityConflictDetector
          conflicts={customConflicts}
          onResolveConflict={onResolveConflict}
        />
      );

      const shiftBtn = screen.getByRole("button", { name: /Shift block to Wed, 15:30 - 16:30 UTC/i });
      fireEvent.click(shiftBtn);

      expect(onResolveConflict).toHaveBeenCalledWith(
        expect.objectContaining({
          conflictId: "conflict-custom-1",
          action: "shift",
          details: {
            shiftedTimeRange: "Wed, 15:30 - 16:30 UTC",
          },
        })
      );

      // Verify Undo banner is shown
      expect(screen.getByText(/Action 'shift' applied to/i)).toBeInTheDocument();
    });

    it("handles Split action and invokes onResolveConflict callback", () => {
      const onResolveConflict = vi.fn();
      render(
        <AvailabilityConflictDetector
          conflicts={customConflicts}
          onResolveConflict={onResolveConflict}
        />
      );

      const splitBtn = screen.getByRole("button", { name: /Split block around Client Onboarding Review/i });
      fireEvent.click(splitBtn);

      expect(onResolveConflict).toHaveBeenCalledWith(
        expect.objectContaining({
          conflictId: "conflict-custom-1",
          action: "split",
          details: {
            splitTimeRanges: ["Wed, 14:00 - 14:30 UTC (30m window)"],
          },
        })
      );
    });

    it("handles Cancel action and invokes onResolveConflict callback", () => {
      const onResolveConflict = vi.fn();
      render(
        <AvailabilityConflictDetector
          conflicts={customConflicts}
          onResolveConflict={onResolveConflict}
        />
      );

      const cancelBtn = screen.getByRole("button", { name: /Cancel incoming block Web3 Payout Design Sync/i });
      fireEvent.click(cancelBtn);

      expect(onResolveConflict).toHaveBeenCalledWith(
        expect.objectContaining({
          conflictId: "conflict-custom-1",
          action: "cancel",
        })
      );
    });
  });

  describe("Undo Resolution Flow", () => {
    it("allows undoing a resolution action and restores the conflict card", () => {
      const onUndoResolution = vi.fn();
      render(
        <AvailabilityConflictDetector
          conflicts={[customConflicts[0]]}
          onUndoResolution={onUndoResolution}
        />
      );

      // Resolve conflict via Shift
      const shiftBtn = screen.getByRole("button", { name: /Shift block to Wed, 15:30 - 16:30 UTC/i });
      fireEvent.click(shiftBtn);

      // Verify resolved banner
      const undoBtn = screen.getByRole("button", { name: /Undo/i });
      expect(undoBtn).toBeInTheDocument();

      // Click Undo
      fireEvent.click(undoBtn);

      expect(onUndoResolution).toHaveBeenCalledWith(
        expect.objectContaining({
          conflictId: "conflict-custom-1",
          action: "shift",
        })
      );

      // Conflict card restored
      expect(screen.getByText(/Web3 Payout Design Sync/i)).toBeInTheDocument();
    });
  });

  describe("Dismissal & Non-blocking Behavior", () => {
    it("dismisses conflict when dismiss button is clicked and calls onDismissConflict", () => {
      const onDismissConflict = vi.fn();
      render(
        <AvailabilityConflictDetector
          conflicts={[customConflicts[0]]}
          onDismissConflict={onDismissConflict}
        />
      );

      const dismissBtn = screen.getByRole("button", { name: /Dismiss conflict notice for Web3 Payout Design Sync/i });
      fireEvent.click(dismissBtn);

      expect(onDismissConflict).toHaveBeenCalledWith("conflict-custom-1");
      expect(screen.queryByText(/Web3 Payout Design Sync/i)).not.toBeInTheDocument();
    });
  });

  describe("Multiple Simultaneous Conflicts & Stepping", () => {
    it("allows navigating between multiple conflicts using Next and Previous buttons", () => {
      render(<AvailabilityConflictDetector conflicts={customConflicts} />);

      expect(screen.getByText(/Web3 Payout Design Sync/i)).toBeInTheDocument();
      expect(screen.getByText(/1\/3/i)).toBeInTheDocument();

      const nextBtn = screen.getByRole("button", { name: /Next conflict/i });
      fireEvent.click(nextBtn);

      expect(screen.getByText(/Security Audit Call/i)).toBeInTheDocument();
      expect(screen.getByText(/2\/3/i)).toBeInTheDocument();

      const prevBtn = screen.getByRole("button", { name: /Previous conflict/i });
      fireEvent.click(prevBtn);

      expect(screen.getByText(/Web3 Payout Design Sync/i)).toBeInTheDocument();
    });

    it("supports keyboard left and right arrow keys to navigate conflicts", () => {
      const { container } = render(<AvailabilityConflictDetector conflicts={customConflicts} />);
      const cardSection = container.querySelector("section");

      if (cardSection) {
        fireEvent.keyDown(cardSection, { key: "ArrowRight" });
        expect(screen.getByText(/Security Audit Call/i)).toBeInTheDocument();

        fireEvent.keyDown(cardSection, { key: "ArrowLeft" });
        expect(screen.getByText(/Web3 Payout Design Sync/i)).toBeInTheDocument();
      }
    });
  });

  describe("Focus Transfer to Calendar Cell", () => {
    it("calls onFocusAffectedSlot when Focus Affected Calendar Cell button is clicked", () => {
      const onFocusAffectedSlot = vi.fn();
      render(
        <AvailabilityConflictDetector
          conflicts={customConflicts}
          onFocusAffectedSlot={onFocusAffectedSlot}
        />
      );

      const focusCellBtn = screen.getByRole("button", { name: /Focus affected slot element Client Onboarding Review/i });
      fireEvent.click(focusCellBtn);

      expect(onFocusAffectedSlot).toHaveBeenCalledWith("slot-custom-1");
    });
  });

  describe("Accessibility & Live Regions", () => {
    it("contains an aria-live region for announcements", () => {
      render(<AvailabilityConflictDetector conflicts={customConflicts} />);

      const liveRegion = screen.getByRole("status");
      expect(liveRegion).toBeInTheDocument();
    });

    it("renders Info severity level correctly", () => {
      render(<AvailabilityConflictDetector conflicts={[customConflicts[2]]} />);

      expect(screen.getByText(/Info Notice/i)).toBeInTheDocument();
    });
  });
});
