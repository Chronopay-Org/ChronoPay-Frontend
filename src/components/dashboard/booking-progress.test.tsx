import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

import {
  BookingFlowShell,
  BookingProgress,
  type BookingFlowStep,
  REFUND_STAGES,
  RefundTracker,
} from "./booking-progress";
import { ToastProvider, useToast } from "@/hooks/use-toast";

expect.extend(toHaveNoViolations);

describe("BookingProgress", () => {
  it("renders the legacy booking stage bars", () => {
    render(
      <BookingProgress
        stages={[
          { label: "Reserved", value: 5 },
          { label: "Confirmed", value: 3 },
        ]}
      />,
    );

    expect(screen.getByText("Booking stages")).toBeInTheDocument();
    expect(screen.getByText("Reserved")).toBeInTheDocument();
    expect(screen.getByText("5 bookings")).toBeInTheDocument();
  });

  it("progress bar fill includes motion-reduce:transition-none for prefers-reduced-motion", () => {
    const { container } = render(
      <BookingProgress
        stages={[
          { label: "Reserved", value: 5 },
          { label: "Confirmed", value: 3 },
        ]}
      />,
    );

    // The fill divs are nested inside the bar track divs (h-2.5 rounded-full)
    const fills = Array.from(container.querySelectorAll("div")).filter((el) =>
      el.className.includes("transition-[width]") &&
      el.className.includes("motion-reduce:transition-none"),
    );
    expect(fills.length).toBe(2);
    for (const fill of fills) {
      expect(fill.className).toContain("transition-[width]");
      expect(fill.className).toContain("motion-reduce:transition-none");
    }
  });
});

describe("BookingFlowShell", () => {
  const steps = [
    {
      id: "details",
      title: "Details",
      description: "Choose the booking details.",
      summary: ["Saturday, May 18", "2 guests"],
      validationSummary: {
        title: "Ready to review",
        items: ["Service selected", "Participants added"],
      },
    },
    {
      id: "payment",
      title: "Payment",
      description: "Review and pay the deposit.",
      summary: ["Visa ending in 4242"],
      validationSummary: {
        title: "Awaiting confirmation",
        items: ["Billing details missing"],
      },
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the sticky booking rail, validation summary, and screen-reader step announcement", () => {
    render(<BookingFlowShell steps={steps} currentStep={1} />);

    expect(
      screen.getByRole("navigation", { name: /booking progress/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Payment" })).toBeInTheDocument();
    expect(screen.getByText("Awaiting confirmation")).toBeInTheDocument();
    expect(screen.getByText("Billing details missing")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Step 2 of 2: Payment",
    );
  });

  it("navigates without prompting when there are no unsaved changes", () => {
    const onBack = vi.fn();
    const onNext = vi.fn();

    render(
      <BookingFlowShell
        steps={steps}
        currentStep={1}
        onBack={onBack}
        onNext={onNext}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole("button", { name: /complete booking/i }));
    expect(onNext).toHaveBeenCalledWith(1);
  });

  it("handles back and next actions and warns before leaving unsaved changes", () => {
    const onBack = vi.fn();
    const onNext = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <BookingFlowShell
        steps={steps}
        currentStep={1}
        onBack={onBack}
        onNext={onNext}
        unsavedChanges
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(confirmSpy).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /complete booking/i }));
    expect(onNext).not.toHaveBeenCalled();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /complete booking/i }));
    expect(onNext).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledWith(1);
  });

  it("renders an empty shell when there are no steps", () => {
    render(<BookingFlowShell steps={[]} />);
    expect(
      screen.getAllByText(/No booking steps available/),
    ).toHaveLength(3);
  });

  it("renders a minimal step with default and fallback copy", () => {
    render(
      <BookingFlowShell
        steps={[{ id: "only", title: "Only step" }]}
        currentStep={0}
      />,
    );
    expect(screen.getByRole("heading", { name: "Only step" })).toBeInTheDocument();
    expect(screen.getByText("Final")).toBeInTheDocument();
    expect(screen.getByText("No issues to review")).toBeInTheDocument();
    expect(screen.getByText("All required booking details are complete.")).toBeInTheDocument();
    expect(screen.getByText("No details have been confirmed yet.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Complete booking" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Back" }),
    ).toBeDisabled();
  });

  it("no-ops when no handlers are provided", () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    render(<BookingFlowShell steps={steps} currentStep={0} />);
    fireEvent.click(screen.getByRole("button", { name: /next|complete/i }));
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("shows the review-required and all-clear copy variants", () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    render(
      <BookingFlowShell
        steps={[
          { title: "Clear", id: "clear" },
          {
            title: "More",
            id: "more",
            validationSummary: { items: [] },
          },
        ]}
        currentStep={1}
      />,
    );
    expect(screen.getByText("Review required")).toBeInTheDocument();
    expect(
      screen.getByText("Looks good. No further validation needed."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("renders pending, current, and complete states across multiple steps", () => {
    render(
      <BookingFlowShell
        steps={[
          { title: "Details" } as BookingFlowStep,
          { title: "Payment", id: "payment" },
          { title: "Done", id: "done", description: "Wrap-up." },
        ]}
        currentStep={1}
      />,
    );
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Back" }),
    ).not.toBeDisabled();
  });
});

const TX_HASH =
  "a3f5b7c9d1e2f304a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f80";

function ToastProbe() {
  const { toasts } = useToast();
  return (
    <>
      {toasts.map((toast) => (
        <div key={toast.id} role="status">
          {toast.title}
          {toast.description ? ` ${toast.description}` : ""}
        </div>
      ))}
    </>
  );
}

function renderTracker(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}<ToastProbe /></ToastProvider>);
}

describe("RefundTracker", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // CopyButton reads window.matchMedia for prefers-reduced-motion; mock it.
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders heading, amount badge, and help popover", () => {
    renderTracker(
      <RefundTracker currentStage="approved" amount="150 XLM" />,
    );
    expect(
      screen.getByRole("heading", { name: "Refund status" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Refund of 150 XLM")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Help: refund tracking" }),
    ).toBeInTheDocument();
  });

  it("omits the amount badge when no amount is provided", () => {
    renderTracker(<RefundTracker currentStage="requested" />);
    expect(screen.queryByText(/Refund of/)).not.toBeInTheDocument();
  });

  it("renders all four stage chips in order with explicit state labels", () => {
    renderTracker(<RefundTracker currentStage="broadcast" />);
    expect(REFUND_STAGES).toEqual([
      "requested",
      "approved",
      "broadcast",
      "settled",
    ]);
    const list = screen.getByRole("list", { name: "Refund stages" });
    const chips = within(list).getAllByRole("listitem");
    expect(chips).toHaveLength(4);
    expect(within(chips[0]).getByText("Requested")).toBeInTheDocument();
    expect(within(chips[0]).getByText("(completed)")).toBeInTheDocument();
    expect(within(chips[1]).getByText("Approved")).toBeInTheDocument();
    expect(within(chips[1]).getByText("(completed)")).toBeInTheDocument();
    expect(within(chips[2]).getByText("Broadcast")).toBeInTheDocument();
    expect(within(chips[2]).getByText("(current)")).toBeInTheDocument();
    expect(within(chips[3]).getByText("Settled")).toBeInTheDocument();
    expect(within(chips[3]).getByText("(upcoming)")).toBeInTheDocument();
  });

  it("marks the current stage item with aria-current=step", () => {
    renderTracker(<RefundTracker currentStage="approved" />);
    const chips = within(
      screen.getByRole("list", { name: "Refund stages" }),
    ).getAllByRole("listitem");
    expect(chips[1]).toHaveAttribute("aria-current", "step");
    expect(chips[0]).not.toHaveAttribute("aria-current");
    expect(chips[2]).not.toHaveAttribute("aria-current");
  });

  it("shows the summary note for the current stage", () => {
    renderTracker(<RefundTracker currentStage="approved" />);
    expect(
      screen.getAllByText(/was approved and is being prepared for broadcast/).length,
    ).toBeGreaterThan(0);
  });

  it("announces the current stage and ETA in a live region", () => {
    renderTracker(
      <RefundTracker currentStage="broadcast" estimatedCompletion="by Apr 3, 12:00 UTC" />,
    );
    const statuses = screen.getAllByRole("status");
    expect(
      statuses.some((status) =>
        status.textContent?.includes("Refund stage 3 of 4: Broadcast"),
      ),
    ).toBe(true);
    expect(
      statuses.some((status) =>
        status.textContent?.includes("Estimated completion: by Apr 3, 12:00 UTC."),
      ),
    ).toBe(true);
  });

  it("shows the default ETA when estimatedCompletion is not provided", () => {
    renderTracker(<RefundTracker currentStage="approved" />);
    expect(
      screen.getAllByText(/typically within 2–4 hours/).length,
    ).toBeGreaterThan(0);
  });

  it("shows a settled summary and omits the ETA when settled", () => {
    renderTracker(
      <RefundTracker currentStage="settled" amount="150 XLM" />,
    );
    expect(
      screen.getByText(/Refund complete — 150 XLM returned to your account/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Estimated completion/)).not.toBeInTheDocument();
    expect(screen.queryByText(/typically within 2–4 hours/)).not.toBeInTheDocument();
  });

  it("shows the hash placeholder when there is no transaction hash", () => {
    renderTracker(<RefundTracker currentStage="approved" />);
    expect(
      screen.getByText("Transaction hash will appear once the refund is broadcast."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /view on explorer/i }),
    ).not.toBeInTheDocument();
  });

  it("truncates the hash and fires a success toast on copy", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    renderTracker(
      <RefundTracker currentStage="broadcast" transactionHash={TX_HASH} />,
    );

    expect(screen.getByTitle(TX_HASH)).toHaveTextContent(
      "a3f5b7...6e7f80",
    );

    await user.click(screen.getByRole("button", { name: /copy transaction hash/i }));
    expect(writeText).toHaveBeenCalledWith(TX_HASH);

    const probes = screen.getAllByRole("status");
    expect(
      probes.some((probe) => probe.textContent?.startsWith("Copied")),
    ).toBe(true);
    expect(
      screen.getByText(/Transaction hash copied to clipboard/),
    ).toBeInTheDocument();
  });

  it("does not crash and shows no toast when copying fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(
      new Error("clipboard denied"),
    );
    renderTracker(
      <RefundTracker currentStage="broadcast" transactionHash={TX_HASH} />,
    );
    const button = screen.getByRole("button", { name: /copy transaction hash/i });

    await user.click(button);
    expect(button).toBeInTheDocument();
    expect(screen.queryByText("Copied")).not.toBeInTheDocument();
    expect(screen.queryByText("Transaction hash copied to clipboard.")).not.toBeInTheDocument();
  });

  it("links to the explorer using the default base URL", () => {
    renderTracker(
      <RefundTracker currentStage="settled" transactionHash={TX_HASH} />,
    );
    const link = screen.getByRole("link", { name: /view on explorer/i });
    expect(link).toHaveAttribute(
      "href",
      `https://stellar.expert/explorer/public/tx/${TX_HASH}`,
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("respects a custom explorer base URL", () => {
    renderTracker(
      <RefundTracker
        currentStage="settled"
        transactionHash={TX_HASH}
        explorerBaseUrl="https://example.com/ledger/tx"
      />,
    );
    expect(
      screen.getByRole("link", { name: /view on explorer/i }),
    ).toHaveAttribute("href", `https://example.com/ledger/tx/${TX_HASH}`);
  });

  it("shows a warning state for an unrecognised stage", () => {
    renderTracker(
      <RefundTracker currentStage={"mystery" as never} />,
    );
    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent("Refund status unavailable");
    expect(screen.queryByText("Refund status")).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Refund stages" })).not.toBeInTheDocument();
  });

  it("does not convey stage state by colour alone", () => {
    renderTracker(<RefundTracker currentStage="approved" />);
    const list = screen.getByRole("list", { name: "Refund stages" });
    const chips = within(list).getAllByRole("listitem");
    expect(chips).toHaveLength(4);
    chips.forEach((chip) => {
      expect(chip.textContent).toMatch(/completed|current|upcoming/);
    });
  });

  it("has no axe violations", async () => {
    const { container } = renderTracker(
      <RefundTracker
        currentStage="broadcast"
        transactionHash={TX_HASH}
        amount="150 XLM"
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
