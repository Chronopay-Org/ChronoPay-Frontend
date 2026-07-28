import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SlotList } from "./slot-list";
import type { Slot } from "./types";

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

describe("SlotList", () => {
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

  it("renders a 'NEW' freshness pip with a tooltip for slots minted within the last 24 hours", () => {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    const freshSlot = { ...slots[0], mintedAt: threeHoursAgo };

    render(<SlotList slots={[freshSlot]} />);
    
    // The visual NEW pip should exist
    const newPip = screen.getByText("NEW");
    expect(newPip).toBeInTheDocument();
    
    // Check tooltip functionality/aria label
    const triggerBtn = screen.getByLabelText("New slot: added within the last 24 hours");
    expect(triggerBtn).toBeInTheDocument();
  });
});
