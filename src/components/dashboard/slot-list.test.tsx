import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SlotList } from "./slot-list";
import type { AlternativeSlot } from "./rebooking-utils";
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

function reorderableSlots(): Slot[] {
  return [
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
}

const dataTransfer = () =>
  ({
    setData: vi.fn(),
    getData: vi.fn().mockReturnValue("slot-main-1"),
    dropEffect: "",
    effectAllowed: "move",
  }) as unknown as DataTransfer;

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
    const { container } = render(<SlotList slots={reorderableSlots()} />);

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent(/Product strategy call/i);

    fireEvent.keyDown(items[0], { key: "ArrowDown", altKey: true });

    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(
      /Code Review & Optimization/i,
    );

    const source = container.querySelector(
      "li[aria-label*='availability slot']",
    ) as HTMLElement;
    const target = container.querySelectorAll(
      "li[aria-label*='availability slot']",
    )[1] as HTMLElement;

    fireEvent.dragStart(source, { dataTransfer: dataTransfer() });
    fireEvent.dragOver(target, { dataTransfer: dataTransfer(), clientY: 20 });
    fireEvent.drop(target, { dataTransfer: dataTransfer() });

    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(
      /Product strategy call/i,
    );
  });

  it("nudges a slot up with Alt+ArrowUp", () => {
    render(<SlotList slots={reorderableSlots()} />);
    const items = screen.getAllByRole("listitem");

    fireEvent.keyDown(items[1], { key: "ArrowUp", altKey: true });

    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(
      /Code Review & Optimization/i,
    );
  });

  it("selects a slot with Enter and announces the count", () => {
    render(<SlotList slots={reorderableSlots()} />);
    const items = screen.getAllByRole("listitem");

    fireEvent.keyDown(items[0], { key: "Enter" });
    expect(items[0]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status", { name: /Slot list announcements/i })).toHaveTextContent("1 slot selected.");

    fireEvent.keyDown(items[0], { key: "Enter" });
    expect(screen.getByRole("status", { name: /Slot list announcements/i })).toHaveTextContent("0 slots selected.");
  });

  it("adds to the selection with Meta and shows the clear control", () => {
    render(<SlotList slots={reorderableSlots()} />);
    const items = screen.getAllByRole("listitem");

    fireEvent.keyDown(items[0], { key: "Enter" });
    fireEvent.keyDown(items[1], { key: "Enter", metaKey: true });

    expect(items[0]).toHaveAttribute("aria-pressed", "true");
    expect(items[1]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Clear selection (2)")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Clear selection (2)"));
    expect(items[0]).toHaveAttribute("aria-pressed", "false");
  });

  it("selects a range with Shift+Enter", () => {
    const three: Slot[] = [
      ...reorderableSlots(),
      {
        id: "slot-main-3",
        title: "Deep-dive workshop",
        dateLabel: "Thu, Apr 3",
        timeRange: "09:00-11:00",
        demand: "2 interested buyers",
        rate: "140 XLM / hr",
        status: "Busy",
      },
    ];
    render(<SlotList slots={three} />);
    const items = screen.getAllByRole("listitem");

    fireEvent.keyDown(items[0], { key: "Enter" });
    fireEvent.keyDown(items[2], { key: "Enter", shiftKey: true });

    expect(items[0]).toHaveAttribute("aria-pressed", "true");
    expect(items[1]).toHaveAttribute("aria-pressed", "true");
    expect(items[2]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Clear selection (3)")).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: /Slot list announcements/i }),
    ).toHaveTextContent("3 slots selected.");
  });

  it("toggles a slot off with Meta", () => {
    render(<SlotList slots={reorderableSlots()} />);
    const items = screen.getAllByRole("listitem");

    fireEvent.keyDown(items[0], { key: "Enter" });
    fireEvent.keyDown(items[1], { key: "Enter", metaKey: true });
    fireEvent.keyDown(items[0], { key: "Enter", metaKey: true });

    expect(items[0]).toHaveAttribute("aria-pressed", "false");
    expect(items[1]).toHaveAttribute("aria-pressed", "true");
  });

  it("clears a multi selection with Escape", () => {
    render(<SlotList slots={reorderableSlots()} />);
    const items = screen.getAllByRole("listitem");

    fireEvent.keyDown(items[0], { key: "Enter" });
    fireEvent.keyDown(items[1], { key: "Enter", metaKey: true });
    fireEvent.keyDown(items[0], { key: "Escape" });

    expect(items[0]).toHaveAttribute("aria-pressed", "false");
    expect(items[1]).toHaveAttribute("aria-pressed", "false");
  });

  it("leaves the order unchanged when nudging past the boundary", () => {
    render(<SlotList slots={reorderableSlots()} />);
    const items = screen.getAllByRole("listitem");

    fireEvent.keyDown(items[0], { key: "ArrowUp", altKey: true });

    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(
      /Product strategy call/i,
    );
  });

  it("flags the dragged row as Moving and shows after a dragOver", () => {
    const { container } = render(<SlotList slots={reorderableSlots()} />);
    const items = container.querySelectorAll(
      "li[aria-label*='availability slot']",
    );

    fireEvent.dragStart(items[0], { dataTransfer: dataTransfer() });
    expect(screen.getByText(/Moving/i)).toBeInTheDocument();

    fireEvent.dragOver(items[1], { dataTransfer: dataTransfer(), clientY: 20 });
    expect(
      container.querySelector("[class*='bg-cyan-400/80']"),
    ).toBeInTheDocument();
  });

  it("defaults drops without a dragOver to the before position", () => {
    const { container } = render(<SlotList slots={reorderableSlots()} />);
    const items = container.querySelectorAll(
      "li[aria-label*='availability slot']",
    );
    const codeDataTransfer = {
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue("slot-main-2"),
      dropEffect: "",
      effectAllowed: "move",
    } as unknown as DataTransfer;

    fireEvent.dragStart(items[1], { dataTransfer: codeDataTransfer });
    fireEvent.drop(items[0], { dataTransfer: codeDataTransfer });

    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(
      /Code Review & Optimization/i,
    );
  });

  it("renders the empty state card when there are no slots", () => {
    render(<SlotList slots={[]} />);
    expect(screen.getByText(/No slots available/i)).toBeInTheDocument();
    expect(
      screen.getByText(/no scheduled availability slots/i),
    ).toBeInTheDocument();
  });

  it("offers the price-preservation chip on pricier alternatives", () => {
    const priced: AlternativeSlot[] = [
      {
        id: "alt-1",
        title: "Pricier alternative",
        dateLabel: "Fri, Apr 4",
        timeRange: "11:00-12:00",
        demand: "3 interested buyers",
        rate: "140 XLM / hr",
        status: "Healthy",
        priceXlm: 140,
      },
    ];
    const onApplyCredit = vi.fn();
    render(
      <SlotList
        slots={slots}
        suggestedAlternatives={priced}
        originalPriceXlm={120}
        availableCreditXlm={30}
        onApplyCredit={onApplyCredit}
      />,
    );

    const chip = screen.getByRole("button", {
      name: /^Keep original price: 120 XLM$/,
    });
    expect(chip).toBeInTheDocument();
    fireEvent.click(chip);
    expect(onApplyCredit).toHaveBeenCalledWith("alt-1", 20);
  });

  it("uses the neutral tone for unrecognized statuses", () => {
    const soldOut: Slot[] = [
      { ...slots[0], id: "sold", title: "Sold-out slot", status: "Sold Out" },
    ];
    render(<SlotList slots={soldOut} />);
    expect(screen.getByText("Sold Out")).toBeInTheDocument();
  });

  it("syncs the list when the slots prop changes", () => {
    const { rerender } = render(<SlotList slots={reorderableSlots()} />);
    const replaced = [
      { ...slots[0], id: "fresh", title: "Fresh opening" },
    ];
    rerender(<SlotList slots={replaced} />);
    expect(screen.getByText("Fresh opening")).toBeInTheDocument();
    expect(screen.queryByText("Code Review & Optimization")).not.toBeInTheDocument();
  });

  it("surfaces blocked-slot conflicts during a drag", () => {
    const { container } = render(
      <SlotList
        slots={
          [
            { ...slots[0], id: "free", title: "Free slot" },
            {
              ...slots[0],
              id: "blocked",
              title: "Existing booking",
              status: "booked",
            },
          ] as Slot[]
        }
      />,
    );
    const items = container.querySelectorAll(
      "li[aria-label*='availability slot']",
    );

    fireEvent.dragStart(items[0], { dataTransfer: dataTransfer() });

    expect(
      screen.getByRole("status", { name: /Slot list announcements/i }),
    ).toHaveTextContent("1 blocked target");
    expect(container.querySelector("[class*='bg-red-400/10']")).toBeInTheDocument();
  });

  it("ignores drops whose source slot no longer exists", () => {
    render(<SlotList slots={reorderableSlots()} />);
    const items = screen.getAllByRole("listitem");

    fireEvent.dragStart(items[0], { dataTransfer: dataTransfer() });
    fireEvent.drop(items[0], {
      dataTransfer: {
        setData: vi.fn(),
        getData: vi.fn().mockReturnValue("missing-source"),
        effectAllowed: "move",
      } as unknown as DataTransfer,
    });

    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(
      /Product strategy call/i,
    );
  });

  it("places a drop below the midpoint as after", () => {
    const { container } = render(<SlotList slots={reorderableSlots()} />);
    const items = container.querySelectorAll(
      "li[aria-label*='availability slot']",
    );
    const rectSpy = vi
      .spyOn(items[1], "getBoundingClientRect")
      .mockReturnValue({
        top: 0,
        height: 100,
        left: 0,
        right: 100,
        bottom: 100,
        width: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect);

    fireEvent.dragStart(items[0], { dataTransfer: dataTransfer() });
    fireEvent.dragOver(items[1], { dataTransfer: dataTransfer(), clientY: 80 });

    fireEvent.drop(items[1], { dataTransfer: dataTransfer() });
    expect(screen.getAllByRole("listitem")[1]).toHaveTextContent(
      /Product strategy call/i,
    );
    rectSpy.mockRestore();
  });

  it("announces a drop using the remembered dragged id when data is empty", () => {
    const { container } = render(<SlotList slots={reorderableSlots()} />);
    const items = container.querySelectorAll(
      "li[aria-label*='availability slot']",
    );
    const emptyTransfer = {
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue(""),
      effectAllowed: "move",
    } as unknown as DataTransfer;

    fireEvent.dragStart(items[0], { dataTransfer: emptyTransfer });
    fireEvent.dragOver(items[1], { dataTransfer: emptyTransfer, clientY: 5 });
    fireEvent.drop(items[1], { dataTransfer: emptyTransfer });

    expect(
      screen.getByRole("status", { name: /Slot list announcements/i }),
    ).toHaveTextContent(/Moved Product strategy call/);
  });

  it("announces when placing after another slot", () => {
    const { container } = render(<SlotList slots={reorderableSlots()} />);
    const items = container.querySelectorAll(
      "li[aria-label*='availability slot']",
    );
    const rectSpy = vi
      .spyOn(items[1], "getBoundingClientRect")
      .mockReturnValue({
        top: 0,
        height: 100,
        left: 0,
        right: 100,
        bottom: 100,
        width: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect);

    fireEvent.dragStart(items[0], { dataTransfer: dataTransfer() });
    fireEvent.dragOver(items[1], { dataTransfer: dataTransfer(), clientY: 80 });
    fireEvent.drop(items[1], { dataTransfer: dataTransfer() });

    expect(
      screen.getByRole("status", { name: /Slot list announcements/i }),
    ).toHaveTextContent(/Moved Product strategy call after Code Review/);
    rectSpy.mockRestore();
  });

  it("announces multiple blocked targets during a drag", () => {
    const { container } = render(
      <SlotList
        slots={
          [
            { ...slots[0], id: "free", title: "Free slot" },
            { ...slots[0], id: "b1", title: "Booking one", status: "booked" },
            { ...slots[0], id: "b2", title: "Booking two", status: "booked" },
          ] as Slot[]
        }
      />,
    );
    const items = container.querySelectorAll(
      "li[aria-label*='availability slot']",
    );
    fireEvent.dragStart(items[0], { dataTransfer: dataTransfer() });
    expect(
      screen.getByRole("status", { name: /Slot list announcements/i }),
    ).toHaveTextContent("2 blocked targets");
  });

  it("flags slots whose blocked property is set", () => {
    const { container } = render(
      <SlotList
        slots={
          [
            { ...slots[0], id: "free", title: "Free slot" },
            {
              ...slots[0],
              id: "blocked",
              title: "Hard-blocked day",
              blocked: true,
            },
          ] as Slot[]
        }
      />,
    );
    const items = container.querySelectorAll(
      "li[aria-label*='availability slot']",
    );
    fireEvent.dragStart(items[0], { dataTransfer: dataTransfer() });
    expect(
      screen.getByRole("status", { name: /Slot list announcements/i }),
    ).toHaveTextContent("1 blocked target");
  });

  it("navigates the alternative cards with Home and End keys", () => {
    render(
      <SlotList
        slots={reorderableSlots()}
        suggestedAlternatives={suggestedAlternatives}
      />,
    );
    const cards = screen
      .getByRole("list", { name: "Suggested alternative slots" })
      .querySelectorAll("[aria-label^='Alternative slot']");

    fireEvent.keyDown(cards[1], { key: "Home" });
    expect(cards[0]).toHaveFocus();

    fireEvent.keyDown(cards[0], { key: "End" });
    expect(cards[cards.length - 1]).toHaveFocus();
  });

  it("navigates the alternative cards with arrow keys", () => {
    render(
      <SlotList
        slots={reorderableSlots()}
        suggestedAlternatives={suggestedAlternatives}
      />,
    );
    const cards = screen
      .getByRole("list", { name: "Suggested alternative slots" })
      .querySelectorAll("[aria-label^='Alternative slot']");

    fireEvent.keyDown(cards[0], { key: "ArrowRight" });
    expect(cards[1]).toHaveFocus();

    fireEvent.keyDown(cards[1], { key: "ArrowLeft" });
    expect(cards[0]).toHaveFocus();

    fireEvent.keyDown(cards[0], { key: "ArrowUp" });
    expect(cards[cards.length - 1]).toHaveFocus();

    fireEvent.keyDown(cards[cards.length - 1], { key: "ArrowDown" });
    expect(cards[0]).toHaveFocus();
  });

  it("renders a rebook trigger for cancelled time-tokens only", () => {
    const withLifecycle: Slot[] = [
      { ...slots[0], lifecycleStatus: "cancelled" },
      {
        ...slots[0],
        id: "slot-active",
        title: "Active consultation",
        lifecycleStatus: "active",
      },
    ];
    render(<SlotList slots={withLifecycle} />);

    expect(
      screen.getByRole("button", { name: /Rebook Product strategy call/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Rebook Active consultation/i }),
    ).not.toBeInTheDocument();
  });

  it("opens the rebooking dialog with token context and alternatives", () => {
    const cancelled: Slot[] = [
      {
        ...slots[0],
        title: "Cancelled Strategy Review",
        lifecycleStatus: "cancelled",
      },
    ];
    render(
      <SlotList
        slots={cancelled}
        suggestedAlternatives={suggestedAlternatives}
        originalPriceXlm={120}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Rebook Cancelled Strategy Review/i }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      within(screen.getByRole("dialog")).getByText("Cancelled Strategy Review"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Rebook with the same supplier/i }),
    ).toBeEnabled();
    fireEvent.click(
      screen.getByRole("radio", { name: /Rebook with the same supplier/i }),
    );
    expect(
      screen.getByRole("radio", { name: /Alternative strategy session/i }),
    ).toBeInTheDocument();
  });

  it("completes a rebook through the dialog and reports the decision", async () => {
    const onRebookConfirm = vi.fn().mockResolvedValue(undefined);
    const cancelled: Slot[] = [
      {
        ...slots[0],
        title: "Cancelled Strategy Review",
        lifecycleStatus: "rescheduled",
      },
    ];
    render(
      <SlotList
        slots={cancelled}
        suggestedAlternatives={suggestedAlternatives}
        originalPriceXlm={120}
        onRebookConfirm={onRebookConfirm}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Rebook Cancelled Strategy Review/i }),
    );
    fireEvent.click(
      screen.getByRole("radio", { name: /Convert to account credit/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Confirm credit/i }));

    await waitFor(() => {
      expect(onRebookConfirm).toHaveBeenCalledWith("credit", {
        alternativeId: undefined,
      });
    });
    expect(
      within(screen.getByRole("dialog")).getAllByText(/confirmed/i).length,
    ).toBeGreaterThan(0);
  });

  it("rebook with a chosen alternative passes the alternative id", async () => {
    const onRebookConfirm = vi.fn().mockResolvedValue(undefined);
    const cancelled: Slot[] = [
      { ...slots[0], lifecycleStatus: "cancelled" },
    ];
    render(
      <SlotList
        slots={cancelled}
        suggestedAlternatives={suggestedAlternatives}
        originalPriceXlm={120}
        onRebookConfirm={onRebookConfirm}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Rebook Product strategy call/i }),
    );
    fireEvent.click(
      screen.getByRole("radio", { name: /Rebook with the same supplier/i }),
    );
    fireEvent.click(
      screen.getByRole("radio", { name: /Alternative planning review/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Confirm rebooking/i }));

    await waitFor(() => {
      expect(onRebookConfirm).toHaveBeenCalledWith("rebook", {
        alternativeId: "slot-alt-2",
      });
    });
  });

  it("surfaces a failed rebooking decision in the dialog and allows retry", async () => {
    const onRebookConfirm = vi
      .fn()
      .mockRejectedValueOnce(new Error("busy"))
      .mockResolvedValueOnce(undefined);
    const cancelled: Slot[] = [{ ...slots[0], lifecycleStatus: "cancelled" }];
    render(
      <SlotList
        slots={cancelled}
        suggestedAlternatives={suggestedAlternatives}
        onRebookConfirm={onRebookConfirm}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Rebook Product strategy call/i }),
    );
    fireEvent.click(
      screen.getByRole("radio", { name: /Request a refund/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Confirm refund/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/We couldn't complete your request/i),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));
    await waitFor(() => {
      expect(onRebookConfirm).toHaveBeenCalledTimes(2);
    });
  });

  it("closes the rebooking dialog via its close affordance", () => {
    const onRebookConfirm = vi.fn().mockResolvedValue(undefined);
    const cancelled: Slot[] = [{ ...slots[0], lifecycleStatus: "cancelled" }];
    render(
      <SlotList
        slots={cancelled}
        suggestedAlternatives={suggestedAlternatives}
        onRebookConfirm={onRebookConfirm}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Rebook Product strategy call/i }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /Keep my time-token/i,
      }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clears the live announcement after the timeout", () => {
    vi.useFakeTimers();
    try {
      render(<SlotList slots={reorderableSlots()} />);
      const items = screen.getAllByRole("listitem");
      fireEvent.keyDown(items[0], { key: "Enter" });
      expect(
        screen.getByRole("status", { name: /Slot list announcements/i }),
      ).toHaveTextContent("1 slot selected.");

      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(
        screen.getByRole("status", { name: /Slot list announcements/i }),
      ).toHaveTextContent("");
    } finally {
      vi.useRealTimers();
    }
  });
});