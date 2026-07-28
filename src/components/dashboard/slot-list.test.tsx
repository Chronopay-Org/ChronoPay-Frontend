import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SlotList } from "./slot-list";
import type { Slot } from "./types";
import type { AvailabilityConflict } from "./availability-conflict-detector";

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

  it("renders conflict detector and handles focus transfer to target slot", () => {
    render(<SlotList slots={slots} conflicts={testConflicts} />);

    expect(screen.getByText(/Overlap Block Alpha/i)).toBeInTheDocument();

    const focusCellBtn = screen.getByRole("button", { name: /Focus affected slot element Product strategy call/i });
    fireEvent.click(focusCellBtn);

    expect(screen.getByText(/Target Slot/i)).toBeInTheDocument();
  });
});
