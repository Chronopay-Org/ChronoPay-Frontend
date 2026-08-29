import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AvailabilityStrip, type DayAvailability } from "./availability-strip";

describe("AvailabilityStrip", () => {
  const mockDays: DayAvailability[] = [
    {
      date: new Date("2026-04-01"),
      dayName: "Wed",
      dateLabel: "Wed, Apr 1",
      slotCount: 4,
      status: "available",
    },
    {
      date: new Date("2026-04-02"),
      dayName: "Thu",
      dateLabel: "Thu, Apr 2",
      slotCount: 2,
      status: "limited",
    },
    {
      date: new Date("2026-04-03"),
      dayName: "Fri",
      dateLabel: "Fri, Apr 3",
      slotCount: 0,
      status: "full",
    },
    {
      date: new Date("2026-04-04"),
      dayName: "Sat",
      dateLabel: "Sat, Apr 4",
      slotCount: 0,
      status: "none",
    },
    {
      date: new Date("2026-04-05"),
      dayName: "Sun",
      dateLabel: "Sun, Apr 5",
      slotCount: 3,
      status: "available",
    },
    {
      date: new Date("2026-04-06"),
      dayName: "Mon",
      dateLabel: "Mon, Apr 6",
      slotCount: 1,
      status: "limited",
    },
    {
      date: new Date("2026-04-07"),
      dayName: "Tue",
      dateLabel: "Tue, Apr 7",
      slotCount: 5,
      status: "available",
    },
  ];

  describe("Rendering", () => {
    it("should render the availability strip with days", () => {
      render(<AvailabilityStrip days={mockDays} />);
      
      expect(screen.getByLabelText("7-day availability preview")).toBeInTheDocument();
      expect(screen.getByText("Quick Book - Next 7 Days")).toBeInTheDocument();
    });

    it("should render all visible days", () => {
      render(<AvailabilityStrip days={mockDays} />);
      
      expect(screen.getByText("Wed, Apr 1")).toBeInTheDocument();
      expect(screen.getByText("Thu, Apr 2")).toBeInTheDocument();
      expect(screen.getByText("Fri, Apr 3")).toBeInTheDocument();
      expect(screen.getByText("Sat, Apr 4")).toBeInTheDocument();
      expect(screen.getByText("Sun, Apr 5")).toBeInTheDocument();
      expect(screen.getByText("Mon, Apr 6")).toBeInTheDocument();
      expect(screen.getByText("Tue, Apr 7")).toBeInTheDocument();
    });

    it("should display slot counts correctly", () => {
      render(<AvailabilityStrip days={mockDays} />);
      
      expect(screen.getByText("4 slots")).toBeInTheDocument();
      expect(screen.getByText("2 slots")).toBeInTheDocument();
      expect(screen.getByText("0 slots")).toBeInTheDocument();
      expect(screen.getByText("3 slots")).toBeInTheDocument();
      expect(screen.getByText("1 slot")).toBeInTheDocument();
      expect(screen.getByText("5 slots")).toBeInTheDocument();
    });

    it("should display status chips", () => {
      render(<AvailabilityStrip days={mockDays} />);
      
      expect(screen.getByText("Available")).toBeInTheDocument();
      expect(screen.getByText("Limited")).toBeInTheDocument();
      expect(screen.getByText("Full")).toBeInTheDocument();
      expect(screen.getByText("No slots")).toBeInTheDocument();
    });

    it("should render empty state when no days provided", () => {
      render(<AvailabilityStrip days={[]} />);
      
      expect(screen.getByText("No availability data available")).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  describe("Book Buttons", () => {
    it("should show Book button for available days", () => {
      render(<AvailabilityStrip days={mockDays} />);
      
      const bookButtons = screen.getAllByRole("link", { name: /Book slots for/ });
      expect(bookButtons.length).toBeGreaterThan(0);
    });

    it("should show disabled button for full days", () => {
      render(<AvailabilityStrip days={mockDays} />);
      
      expect(screen.getByText("Fully Booked")).toBeInTheDocument();
    });

    it("should show disabled button for days with no slots", () => {
      render(<AvailabilityStrip days={mockDays} />);
      
      expect(screen.getByText("Unavailable")).toBeInTheDocument();
    });

    it("should call onBook callback when Book button is clicked", () => {
      const mockOnBook = vi.fn();
      render(<AvailabilityStrip days={mockDays} onBook={mockOnBook} />);
      
      const bookButton = screen.getByRole("link", { name: /Book slots for Wed, Apr 1/ });
      fireEvent.click(bookButton);
      
      expect(mockOnBook).toHaveBeenCalledWith(new Date("2026-04-01"));
    });

    it("should generate correct href for book buttons", () => {
      render(<AvailabilityStrip days={mockDays} />);
      
      const bookButton = screen.getByRole("link", { name: /Book slots for Wed, Apr 1/ });
      expect(bookButton).toHaveAttribute("href", expect.stringContaining("date="));
    });
  });

  describe("Navigation", () => {
    it("should show navigation buttons when there are more than 7 days", () => {
      const manyDays = [...mockDays, ...mockDays];
      render(<AvailabilityStrip days={manyDays} />);
      
      expect(screen.getByLabelText("Previous days")).toBeInTheDocument();
      expect(screen.getByLabelText("Next days")).toBeInTheDocument();
    });

    it("should disable previous button when at start", () => {
      const manyDays = [...mockDays, ...mockDays];
      render(<AvailabilityStrip days={manyDays} />);
      
      const prevButton = screen.getByLabelText("Previous days");
      expect(prevButton).toBeDisabled();
    });

    it("should enable previous button after scrolling right", () => {
      const manyDays = [...mockDays, ...mockDays];
      render(<AvailabilityStrip days={manyDays} />);
      
      const nextButton = screen.getByLabelText("Next days");
      fireEvent.click(nextButton);
      
      const prevButton = screen.getByLabelText("Previous days");
      expect(prevButton).not.toBeDisabled();
    });

    it("should scroll to next days when next button is clicked", () => {
      const manyDays = [...mockDays, ...mockDays];
      render(<AvailabilityStrip days={manyDays} />);
      
      const nextButton = screen.getByLabelText("Next days");
      fireEvent.click(nextButton);
      
      // After clicking next, the first day should no longer be visible
      expect(screen.queryByText("Wed, Apr 1")).not.toBeInTheDocument();
    });

    it("should support keyboard navigation", () => {
      const manyDays = [...mockDays, ...mockDays];
      render(<AvailabilityStrip days={manyDays} />);
      
      const nextButton = screen.getByLabelText("Next days");
      nextButton.focus();
      fireEvent.keyDown(nextButton, { key: "Enter" });
      
      expect(screen.queryByText("Wed, Apr 1")).not.toBeInTheDocument();
    });

    it("should show day range indicator when scrolling", () => {
      const manyDays = [...mockDays, ...mockDays];
      render(<AvailabilityStrip days={manyDays} />);
      
      expect(screen.getByText(/Showing \d+-\d+ of \d+ days/)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<AvailabilityStrip days={mockDays} />);
      
      expect(screen.getByRole("region", { name: "7-day availability preview" })).toBeInTheDocument();
      expect(screen.getByRole("list", { name: "Available days for booking" })).toBeInTheDocument();
    });

    it("should have proper ARIA describedby for day cards", () => {
      render(<AvailabilityStrip days={mockDays} />);

      const dayCards = screen.getAllByRole("listitem");
      dayCards.forEach((card: HTMLElement) => {
        expect(card).toHaveAttribute("aria-labelledby");
        expect(card).toHaveAttribute("aria-describedby");
      });
    });

    it("should have proper ARIA labels for status chips", () => {
      render(<AvailabilityStrip days={mockDays} />);

      const statusChips = screen.getAllByText(/Available|Limited|Full|No slots/);
      statusChips.forEach((chip: HTMLElement) => {
        expect(chip).toHaveAttribute("aria-label", expect.stringContaining("Status:"));
      });
    });

    it("should have proper ARIA disabled attributes for navigation", () => {
      const manyDays = [...mockDays, ...mockDays];
      render(<AvailabilityStrip days={manyDays} />);
      
      const prevButton = screen.getByLabelText("Previous days");
      expect(prevButton).toHaveAttribute("aria-disabled", "true");
      expect(prevButton).toHaveAttribute("tabIndex", "-1");
    });

    it("should have proper focus ring class for interactive elements", () => {
      render(<AvailabilityStrip days={mockDays} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button: HTMLElement) => {
        expect(button.className).toContain("focus-ring-cyan");
      });
    });

    it("should have aria-live for empty state", () => {
      render(<AvailabilityStrip days={[]} />);
      
      const emptyState = screen.getByRole("status");
      expect(emptyState).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("Responsive Design", () => {
    it("should render with responsive grid classes", () => {
      const { container } = render(<AvailabilityStrip days={mockDays} />);
      
      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("sm:grid-cols-2");
      expect(grid).toHaveClass("lg:grid-cols-3");
      expect(grid).toHaveClass("xl:grid-cols-4");
    });
  });

  describe("Edge Cases", () => {
    it("should handle single day", () => {
      const singleDay = [mockDays[0]];
      render(<AvailabilityStrip days={singleDay} />);
      
      expect(screen.getByText("Wed, Apr 1")).toBeInTheDocument();
      expect(screen.queryByLabelText("Previous days")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Next days")).not.toBeInTheDocument();
    });

    it("should handle exactly 7 days (no navigation)", () => {
      render(<AvailabilityStrip days={mockDays} />);
      
      expect(screen.queryByLabelText("Previous days")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Next days")).not.toBeInTheDocument();
    });

    it("should handle all days with no slots", () => {
      const noSlotsDays = mockDays.map((day) => ({ ...day, slotCount: 0, status: "none" as const }));
      render(<AvailabilityStrip days={noSlotsDays} />);
      
      expect(screen.getAllByText("Unavailable").length).toBe(7);
    });

    it("should handle all days fully booked", () => {
      const fullDays = mockDays.map((day) => ({ ...day, slotCount: 0, status: "full" as const }));
      render(<AvailabilityStrip days={fullDays} />);
      
      expect(screen.getAllByText("Fully Booked").length).toBe(7);
    });

    it("should handle all days available", () => {
      const availableDays = mockDays.map((day) => ({ ...day, slotCount: 5, status: "available" as const }));
      render(<AvailabilityStrip days={availableDays} />);
      
      const bookButtons = screen.getAllByRole("link", { name: /Book slots for/ });
      expect(bookButtons.length).toBe(7);
    });
  });
});
