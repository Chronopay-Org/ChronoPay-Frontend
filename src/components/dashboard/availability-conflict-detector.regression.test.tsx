/**
 * Regression coverage for the failure / empty-result paths in
 * AvailabilityConflictDetector (ConflictType).
 *
 * The component has two explicit bail-out branches: it renders nothing when
 * there is neither a conflict nor a pending undo, and it falls back to the
 * undo-only banner when the last conflict has been resolved. Both are silent
 * behaviour changes if they regress, so they are pinned here.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AvailabilityConflictDetector,
  type AvailabilityConflict,
} from "./availability-conflict-detector";

const conflicts: AvailabilityConflict[] = [
  {
    id: "regression-1",
    incomingBlockTitle: "Regression Block One",
    incomingTimeRange: "Mon, 09:00 - 10:00 UTC",
    collidingSlotId: "slot-regression-1",
    collidingTitle: "Existing Booking One",
    collidingTimeRange: "Mon, 09:30 - 10:30 UTC",
    conflictType: "booking_overlap",
    severity: "critical",
    description: "Overlaps Existing Booking One by 30 minutes.",
    suggestedShiftTimeRange: "Mon, 10:30 - 11:30 UTC",
    suggestedSplitRanges: ["Mon, 10:00 - 10:30 UTC (30m window)"],
    affectedSlotId: "slot-regression-1",
  },
  {
    id: "regression-2",
    incomingBlockTitle: "Regression Block Two",
    incomingTimeRange: "Tue, 14:00 - 15:00 UTC",
    collidingSlotId: "slot-regression-2",
    collidingTitle: "Existing Booking Two",
    collidingTimeRange: "Tue, 14:00 - 15:00 UTC",
    conflictType: "double_booking",
    severity: "warning",
    description: "Double books Existing Booking Two.",
    suggestedShiftTimeRange: "Tue, 15:00 - 16:00 UTC",
    affectedSlotId: "slot-regression-2",
  },
  {
    id: "regression-3",
    incomingBlockTitle: "Regression Block Three",
    incomingTimeRange: "Wed, 11:00 - 12:00 UTC",
    collidingSlotId: "slot-regression-3",
    collidingTitle: "Existing Booking Three",
    collidingTimeRange: "Wed, 11:15 - 11:45 UTC",
    conflictType: "buffer_violation",
    severity: "info",
    description: "Encroaches on the buffer around Existing Booking Three.",
    affectedSlotId: "slot-regression-3",
  },
];

describe("AvailabilityConflictDetector failure handling (regression)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("empty-result branch", () => {
    it("renders nothing when the conflicts list is empty", () => {
      const { container } = render(<AvailabilityConflictDetector conflicts={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when every supplied conflict is dismissed", () => {
      const onDismissConflict = vi.fn();
      const { container } = render(
        <AvailabilityConflictDetector
          conflicts={[conflicts[0]]}
          onDismissConflict={onDismissConflict}
        />,
      );

      expect(container.firstChild).not.toBeNull();

      fireEvent.click(
        screen.getByRole("button", {
          name: "Dismiss conflict notice for Regression Block One",
        }),
      );

      expect(onDismissConflict).toHaveBeenCalledWith("regression-1");
      expect(container.firstChild).toBeNull();
      expect(screen.queryByText("Regression Block One")).not.toBeInTheDocument();
    });
  });

  describe("undo-only branch", () => {
    it("falls back to the undo banner when the last conflict is resolved", () => {
      const { container } = render(<AvailabilityConflictDetector conflicts={[conflicts[0]]} />);

      fireEvent.click(
        screen.getByRole("button", { name: /Cancel incoming block Regression Block One/i }),
      );

      // The conflict card is gone, but the component must not unmount: it still
      // has a resolution the user is allowed to undo.
      expect(container.firstChild).not.toBeNull();
      expect(screen.queryByText("Regression Block One")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: "Undo cancel resolution for Regression Block One",
        }),
      ).toBeInTheDocument();
    });

    it("restores the conflict card after undoing the last resolution", () => {
      render(<AvailabilityConflictDetector conflicts={[conflicts[0]]} />);

      fireEvent.click(
        screen.getByRole("button", { name: /Cancel incoming block Regression Block One/i }),
      );
      fireEvent.click(
        screen.getByRole("button", {
          name: "Undo cancel resolution for Regression Block One",
        }),
      );

      expect(screen.getByText("Regression Block One")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", {
          name: "Undo cancel resolution for Regression Block One",
        }),
      ).not.toBeInTheDocument();
    });

    it("returns to the empty state once a restored conflict is dismissed", () => {
      const { container } = render(<AvailabilityConflictDetector conflicts={[conflicts[0]]} />);

      fireEvent.click(
        screen.getByRole("button", { name: /Cancel incoming block Regression Block One/i }),
      );
      fireEvent.click(
        screen.getByRole("button", {
          name: "Undo cancel resolution for Regression Block One",
        }),
      );
      fireEvent.click(
        screen.getByRole("button", {
          name: "Dismiss conflict notice for Regression Block One",
        }),
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("index boundary after removal", () => {
    it("clamps the active index and keeps rendering after the last conflict is dismissed", () => {
      const onDismissConflict = vi.fn();
      const { container } = render(
        <AvailabilityConflictDetector
          conflicts={conflicts}
          onDismissConflict={onDismissConflict}
        />,
      );

      // Step to the final conflict so the active index is at the end of the list.
      fireEvent.click(screen.getByRole("button", { name: /Next conflict/i }));
      fireEvent.click(screen.getByRole("button", { name: /Next conflict/i }));
      expect(screen.getByText("Regression Block Three")).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", {
          name: "Dismiss conflict notice for Regression Block Three",
        }),
      );

      // The stale index no longer points at a conflict, but the detector must
      // recover onto the previous conflict instead of dropping to null.
      expect(onDismissConflict).toHaveBeenCalledWith("regression-3");
      expect(container.firstChild).not.toBeNull();
      expect(screen.getByText("Regression Block Two")).toBeInTheDocument();
      expect(screen.queryByText("Regression Block Three")).not.toBeInTheDocument();
    });

    it("keeps the remaining conflict interactive after a boundary removal", () => {
      const onResolveConflict = vi.fn();
      render(
        <AvailabilityConflictDetector
          conflicts={conflicts}
          onResolveConflict={onResolveConflict}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /Next conflict/i }));
      fireEvent.click(screen.getByRole("button", { name: /Next conflict/i }));
      fireEvent.click(
        screen.getByRole("button", {
          name: "Dismiss conflict notice for Regression Block Three",
        }),
      );

      fireEvent.click(
        screen.getByRole("button", { name: /Shift block to Tue, 15:00 - 16:00 UTC/i }),
      );

      expect(onResolveConflict).toHaveBeenCalledWith(
        expect.objectContaining({ conflictId: "regression-2", action: "shift" }),
      );
    });
  });

  describe("optional callback boundaries", () => {
    it("does not throw when no resolution callbacks are supplied", () => {
      render(<AvailabilityConflictDetector conflicts={[conflicts[0]]} />);

      expect(() => {
        fireEvent.click(screen.getByRole("button", { name: /Shift block to/i }));
      }).not.toThrow();
    });

    it("does not throw when a resolution is undone without a callback", () => {
      render(<AvailabilityConflictDetector conflicts={[conflicts[0]]} />);

      fireEvent.click(screen.getByRole("button", { name: /Shift block to/i }));

      expect(() => {
        fireEvent.click(screen.getByRole("button", { name: /^Undo/i }));
      }).not.toThrow();
    });
  });
});
