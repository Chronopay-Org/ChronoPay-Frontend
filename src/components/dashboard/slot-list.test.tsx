import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SlotList } from "./slot-list";
import type { Slot } from "./types";
import type { AvailabilityConflict } from "./availability-conflict-detector";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/mock-path",
}));

const suggestedAlternatives: Slot[] = [
  {
    id: "slot-alt-1",
    title: "Alternative strategy session",
    dateLabel: "Fri, Apr 4",
    timeRange: "11:00-12:00",
    demand: "3 interested buyers",
    rate: "110 XLM / hr",
    status: "Healthy",
  },
  {
    id: "slot-alt-2",
    title: "Alternative planning review",
    dateLabel: "Fri, Apr 4",
    timeRange: "13:00-14:00",
    demand: "1 open offer",
    rate: "100 XLM / hr",
    status: "Tight",
  },
];

const slots: Slot[] = [
  {
    id: "slot-main-1",
    title: "Product strategy call",
    dateLabel: "Tue, Apr 1",
    timeRange: "10:00-11:30",
    demand: "6 interested buyers",
    rate: "120 XLM / hr",
    status: "Healthy",
  },
];

const testConflicts: AvailabilityConflict[] = [
  {
    id: "test-conflict-1",
    incomingBlockTitle: "Overlap Block Alpha",
    incomingTimeRange: "Tue, 10:15 - 11:15 UTC",
    collidingSlotId: "slot-main-1",
    collidingTitle: "Product strategy call",
    collidingTimeRange: "Tue, 10:00 - 11:30 UTC",
    conflictType: "booking_overlap",
    severity: "critical",
    description: "Overlaps with Product strategy call.",
    suggestedShiftTimeRange: "Tue, 11:30 - 12:30 UTC",
    suggestedSplitRanges: [],
    affectedSlotId: "slot-main-1",
  },
];

describe("SlotList", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders a suggested alternatives carousel when alternatives exist", () => {
    render(
      <SlotList slots={slots} suggestedAlternatives={suggestedAlternatives} />,
    );

    expect(
      screen.getByRole("heading", { name: /Rebook a matching slot/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Suggested alternatives/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Alternative strategy session/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Alternative planning review/i),
    ).toBeInTheDocument();
  });

  it("supports arrow key navigation between alternative cards", () => {
    render(
      <SlotList slots={slots} suggestedAlternatives={suggestedAlternatives} />,
    );

    const firstCard = screen.getByLabelText(
      "Alternative slot: Alternative strategy session, Fri, Apr 4 11:00-12:00",
    );
    const secondCard = screen.getByLabelText(
      "Alternative slot: Alternative planning review, Fri, Apr 4 13:00-14:00",
    );

    firstCard.focus();
    expect(firstCard).toHaveFocus();

    fireEvent.keyDown(firstCard, { key: "ArrowRight" });

    expect(secondCard).toHaveFocus();
  });

  it("renders empty state messaging when suggested alternatives are empty", () => {
    render(<SlotList slots={slots} suggestedAlternatives={[]} />);

    expect(
      screen.getByText(/No matching alternatives found/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/No alternatives/i)).toBeInTheDocument();
  });

  it("supports keyboard nudging and drag-and-drop reordering", () => {
    const reorderableSlots: Slot[] = [
      {
        id: "slot-main-1",
        title: "Product strategy call",
        dateLabel: "Tue, Apr 1",
        timeRange: "10:00-11:30",
        demand: "6 interested buyers",
        rate: "120 XLM / hr",
        status: "Healthy",
      },
      {
        id: "slot-main-2",
        title: "Code Review & Optimization",
        dateLabel: "Wed, Apr 2",
        timeRange: "14:00-15:00",
        demand: "2 interested buyers",
        rate: "90 XLM / hr",
        status: "Tight",
      },
    ];

    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue("slot-main-1"),
      dropEffect: "",
      effectAllowed: "move",
    } as unknown as DataTransfer;

    const { container } = render(<SlotList slots={reorderableSlots} />);

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent(/Product strategy call/i);

    fireEvent.keyDown(items[0], { key: "ArrowDown", altKey: true });

    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(
      /Code Review & Optimization/i,
    );

    const source = container.querySelector("li[aria-label*='availability slot']") as HTMLElement;
    const target = container.querySelectorAll("li[aria-label*='availability slot']")[1] as HTMLElement;

    fireEvent.dragStart(source, { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer, clientY: 20 });
    fireEvent.drop(target, { dataTransfer });

    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(
      /Product strategy call/i,
    );
  });

  it("can switch to calendar views", () => {
    render(<SlotList slots={slots} />);
    
    // Switch to month view
    const monthButton = screen.getByRole("button", { name: /month/i });
    fireEvent.click(monthButton);
    
    // the calendar grid should be rendered
    expect(screen.getByRole("grid", { name: /month calendar view/i })).toBeInTheDocument();
  });
});
