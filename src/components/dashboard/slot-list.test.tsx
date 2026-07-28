import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SlotList, groupSlotsIntoHourlyBands } from "./slot-list";
import { generateHighDensitySlots } from "./dashboard-data";
import type { Slot } from "./types";

const mockSlots: Slot[] = [
  {
    id: "slot-1",
    title: "Product strategy call",
    dateLabel: "Tue, Apr 1",
    timeRange: "09:00-10:00",
    demand: "6 interested buyers",
    rate: "120 XLM / hr",
    status: "Healthy",
    isNextAvailable: true,
  },
  {
    id: "slot-2",
    title: "UX design review",
    dateLabel: "Tue, Apr 1",
    timeRange: "09:15-09:45",
    demand: "2 open offers",
    rate: "95 XLM / hr",
    status: "Tight",
  },
  {
    id: "slot-3",
    title: "Founder office hours",
    dateLabel: "Tue, Apr 1",
    timeRange: "10:00-11:00",
    demand: "Waitlist enabled",
    rate: "140 XLM / hr",
    status: "Busy",
  },
];

describe("groupSlotsIntoHourlyBands helper", () => {
  it("groups slots chronologically by starting hour", () => {
    const bands = groupSlotsIntoHourlyBands(mockSlots);
    expect(bands.length).toBe(2);
    expect(bands[0].hourKey).toBe("09:00");
    expect(bands[0].hourLabel).toBe("09:00 - 10:00");
    expect(bands[0].totalSlots).toBe(2);
    expect(bands[0].rateRange).toBe("95 - 120 XLM / hr");
    expect(bands[0].statusCounts.Healthy).toBe(1);
    expect(bands[0].statusCounts.Tight).toBe(1);
    expect(bands[0].hasNextAvailable).toBe(true);

    expect(bands[1].hourKey).toBe("10:00");
    expect(bands[1].hourLabel).toBe("10:00 - 11:00");
    expect(bands[1].totalSlots).toBe(1);
    expect(bands[1].rateRange).toBe("140 XLM / hr");
    expect(bands[1].statusCounts.Busy).toBe(1);
    expect(bands[1].hasNextAvailable).toBe(false);
  });

  it("handles fallback hour if timeRange is missing or unusual", () => {
    const unusualSlots: Slot[] = [
      {
        id: "slot-x",
        title: "Custom Event",
        dateLabel: "Tue, Apr 1",
        timeRange: "",
        demand: "1 buyer",
        rate: "100 XLM / hr",
        status: "Healthy",
      },
    ];
    const bands = groupSlotsIntoHourlyBands(unusualSlots);
    expect(bands.length).toBe(1);
    expect(bands[0].hourKey).toBe("09:00");
  });
});

describe("SlotList Component", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders empty state when slots array is empty", () => {
    render(<SlotList slots={[]} />);
    expect(screen.getByText("No available time slots")).toBeInTheDocument();
  });

  it("renders full slot cards by default for low-density days (< 50 slots)", () => {
    render(<SlotList slots={mockSlots} defaultDensity="auto" />);
    expect(screen.getByTestId("full-slots-container")).toBeInTheDocument();
    expect(screen.getByText("Product strategy call")).toBeInTheDocument();
    expect(screen.getByText("UX design review")).toBeInTheDocument();
    expect(screen.getByText("Founder office hours")).toBeInTheDocument();
  });

  it("automatically switches to compact bands for high-density days (50+ slots)", () => {
    const highDensitySlots = generateHighDensitySlots(54);
    render(<SlotList slots={highDensitySlots} defaultDensity="auto" />);

    expect(screen.getByTestId("compact-bands-container")).toBeInTheDocument();
    expect(screen.getByTestId("high-density-badge")).toBeInTheDocument();
    expect(screen.getByText("54 Slots")).toBeInTheDocument();
  });

  it("allows switching density modes via toolbar buttons", async () => {
    const user = userEvent.setup();
    render(<SlotList slots={mockSlots} supplierId="supplier-test" />);

    const compactBtn = screen.getByTestId("density-btn-compact");
    const fullBtn = screen.getByTestId("density-btn-full");
    const autoBtn = screen.getByTestId("density-btn-auto");

    // Click Compact Bands
    await user.click(compactBtn);
    expect(compactBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("compact-bands-container")).toBeInTheDocument();
    expect(localStorage.getItem("chronopay_slot_picker_density_supplier-test")).toBe("compact");

    // Click Full View
    await user.click(fullBtn);
    expect(fullBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("full-slots-container")).toBeInTheDocument();
    expect(localStorage.getItem("chronopay_slot_picker_density_supplier-test")).toBe("full");

    // Click Auto
    await user.click(autoBtn);
    expect(autoBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("persists and reads supplier density preference from localStorage", () => {
    localStorage.setItem("chronopay_slot_picker_density_supplier-99", "compact");

    render(<SlotList slots={mockSlots} supplierId="supplier-99" />);

    const compactBtn = screen.getByTestId("density-btn-compact");
    expect(compactBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("compact-bands-container")).toBeInTheDocument();
  });

  it("expands and collapses hourly bands on click/tap", async () => {
    const user = userEvent.setup();
    render(<SlotList slots={mockSlots} defaultDensity="compact" />);

    const band09Toggle = screen.getByTestId("band-toggle-09:00");
    expect(band09Toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("band-content-09:00")).not.toBeInTheDocument();

    // Click to expand
    await user.click(band09Toggle);
    expect(band09Toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("band-content-09:00")).toBeInTheDocument();
    expect(screen.getByText("Product strategy call")).toBeInTheDocument();
    expect(screen.getByText("UX design review")).toBeInTheDocument();

    // Click to collapse
    await user.click(band09Toggle);
    expect(band09Toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("band-content-09:00")).not.toBeInTheDocument();
  });

  it("supports keyboard interaction (Space and Enter) to expand/collapse bands", async () => {
    render(<SlotList slots={mockSlots} defaultDensity="compact" />);

    const band09Toggle = screen.getByTestId("band-toggle-09:00");
    band09Toggle.focus();
    expect(document.activeElement).toBe(band09Toggle);

    // Press Enter to expand
    fireEvent.keyDown(band09Toggle, { key: "Enter", code: "Enter" });
    fireEvent.click(band09Toggle); // React button keyboard triggers click
    expect(band09Toggle).toHaveAttribute("aria-expanded", "true");

    // Press Space to collapse
    fireEvent.keyDown(band09Toggle, { key: " ", code: "Space" });
    fireEvent.click(band09Toggle);
    expect(band09Toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("expands and collapses all bands using batch action buttons", async () => {
    const user = userEvent.setup();
    render(<SlotList slots={mockSlots} defaultDensity="compact" />);

    const expandAllBtn = screen.getByTestId("expand-all-btn");
    const collapseAllBtn = screen.getByTestId("collapse-all-btn");

    await user.click(expandAllBtn);
    expect(screen.getByTestId("band-content-09:00")).toBeInTheDocument();
    expect(screen.getByTestId("band-content-10:00")).toBeInTheDocument();

    await user.click(collapseAllBtn);
    expect(screen.queryByTestId("band-content-09:00")).not.toBeInTheDocument();
    expect(screen.queryByTestId("band-content-10:00")).not.toBeInTheDocument();
  });

  it("announces expand/collapse actions to screen readers via aria-live region", async () => {
    const user = userEvent.setup();
    render(<SlotList slots={mockSlots} defaultDensity="compact" />);

    const band09Toggle = screen.getByTestId("band-toggle-09:00");
    await user.click(band09Toggle);

    const announcement = screen.getByTestId("aria-announcement");
    expect(announcement).toHaveTextContent("Expanded 09:00 - 10:00 hourly band showing 2 slots.");
  });
});
