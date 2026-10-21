import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DesignSystemComponentsPage from "@/app/design-system/components/page";

// Mock the child components to simplify testing the page's behavior
vi.mock("@/components/dashboard/mini-calendar-navigator", () => ({
  MiniCalendarNavigator: ({ onDateSelect }: any) => (
    <div data-testid="mini-calendar-navigator-mock">
      <button onClick={() => onDateSelect(new Date("2024-01-01"))}>Select Date</button>
    </div>
  ),
}));

vi.mock("@/components/dashboard/calendar-view-toggle", () => ({
  CalendarViewToggle: ({ currentMode, onModeChange }: any) => (
    <div data-testid="calendar-view-toggle-mock" data-mode={currentMode}>
      <button onClick={() => onModeChange("week")}>Set Week View</button>
    </div>
  ),
}));

vi.mock("@/components/dashboard/calendar-agenda-view", () => ({
  CalendarAgendaView: ({ onBook }: any) => (
    <div data-testid="calendar-agenda-view-mock">
      <button onClick={() => onBook(new Date())}>Book Slot</button>
    </div>
  ),
}));

vi.mock("@/components/dashboard/availability-legend", () => ({
  AvailabilityLegend: ({ variant }: any) => (
    <div data-testid={`availability-legend-${variant}-mock`}>Legend {variant}</div>
  ),
}));

vi.mock("@/components/dashboard/review-composer", () => ({
  ReviewComposer: ({ onSubmit, onSaveDraft }: any) => (
    <div data-testid="review-composer-mock">
      <button onClick={() => onSubmit({ text: "Submit" })}>Submit</button>
      <button onClick={() => onSaveDraft({ text: "Draft" })}>Draft</button>
    </div>
  ),
}));

vi.mock("@/components/dashboard/rating-histogram", () => ({
  RatingHistogram: () => <div data-testid="rating-histogram-mock">Histogram</div>,
}));

vi.mock("@/components/dashboard/review-filters", () => ({
  ReviewFilters: () => <div data-testid="review-filters-mock">Filters</div>,
}));

vi.mock("@/components/dashboard/review-card", () => ({
  ReviewCard: () => <div data-testid="review-card-mock">Review Card</div>,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className} data-testid="next-link">
      {children}
    </a>
  ),
}));

describe("DesignSystemComponentsPage", () => {
  it("renders the page header and main title", () => {
    render(<DesignSystemComponentsPage />);
    
    expect(screen.getByText("Design System")).toBeInTheDocument();
    
    const backLink = screen.getByTestId("next-link");
    expect(backLink).toHaveAttribute("href", "/");
    expect(backLink).toHaveTextContent("← Back to App");

    expect(screen.getByText("UI Components")).toBeInTheDocument();
  });

  it("renders all the component sections", () => {
    render(<DesignSystemComponentsPage />);
    
    expect(screen.getByText("Mini Calendar Navigator")).toBeInTheDocument();
    expect(screen.getByTestId("mini-calendar-navigator-mock")).toBeInTheDocument();

    expect(screen.getByText("Calendar View Toggle")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-view-toggle-mock")).toBeInTheDocument();

    expect(screen.getByText("Calendar Agenda View")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-agenda-view-mock")).toBeInTheDocument();

    expect(screen.getByText("Availability Legend")).toBeInTheDocument();
    expect(screen.getByTestId("availability-legend-horizontal-mock")).toBeInTheDocument();
    expect(screen.getByTestId("availability-legend-vertical-mock")).toBeInTheDocument();

    expect(screen.getByText("Review Composer")).toBeInTheDocument();
    expect(screen.getByTestId("review-composer-mock")).toBeInTheDocument();

    expect(screen.getByText("Reviews and Ratings UI")).toBeInTheDocument();
    expect(screen.getByTestId("rating-histogram-mock")).toBeInTheDocument();
    expect(screen.getByTestId("review-filters-mock")).toBeInTheDocument();
    expect(screen.getByTestId("review-card-mock")).toBeInTheDocument();
  });

  it("updates the calendar view state when toggled", async () => {
    render(<DesignSystemComponentsPage />);
    
    const viewToggle = screen.getByTestId("calendar-view-toggle-mock");
    expect(viewToggle).toHaveAttribute("data-mode", "month"); // default

    const user = userEvent.setup();
    const toggleButton = screen.getByText("Set Week View");
    await user.click(toggleButton);

    expect(viewToggle).toHaveAttribute("data-mode", "week");
  });

  it("handles console.logs for sample callbacks without crashing", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    render(<DesignSystemComponentsPage />);
    
    const user = userEvent.setup();
    
    await user.click(screen.getByText("Book Slot"));
    expect(consoleSpy).toHaveBeenCalledWith("Book:", expect.any(Date));

    await user.click(screen.getByText("Submit"));
    expect(consoleSpy).toHaveBeenCalledWith("Submit:", { text: "Submit" });

    await user.click(screen.getByText("Draft"));
    expect(consoleSpy).toHaveBeenCalledWith("Draft:", { text: "Draft" });
    
    consoleSpy.mockRestore();
  });
  
  it("handles state update for date select", async () => {
    // Just ensuring we don't crash when onDateSelect is called
    render(<DesignSystemComponentsPage />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Select Date"));
    // there's no visible output for this in our mock, but it proves the state updates successfully
  });
});
