import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RebookingDialog } from "./rebooking-dialog";
import type { AlternativeSlot } from "./rebooking-utils";

const alternatives: AlternativeSlot[] = [
  {
    id: "alt-same",
    title: "Same-time strategy session",
    dateLabel: "Fri, Apr 4",
    timeRange: "10:00-11:00",
    demand: "3 interested buyers",
    rate: "110 XLM / hr",
    status: "Healthy",
    priceXlm: 120,
  },
  {
    id: "alt-near",
    title: "Near-time planning review",
    dateLabel: "Fri, Apr 4",
    timeRange: "10:30-11:30",
    demand: "1 open offer",
    rate: "100 XLM / hr",
    status: "Tight",
  },
  {
    id: "alt-far",
    title: "Late-afternoon catchup",
    dateLabel: "Fri, Apr 4",
    timeRange: "16:00-17:00",
    demand: "5 interested buyers",
    rate: "95 XLM / hr",
    status: "Busy",
  },
];

const baseProps = {
  open: true,
  onClose: vi.fn(),
  tokenTitle: "Pair Programming Session",
  tokenDateLabel: "Fri, Apr 4",
  tokenTimeRange: "10:00-11:30",
  originalPriceXlm: 150,
  alternatives,
  onConfirm: vi.fn(),
};

type DialogOverrides = Partial<typeof baseProps> & {
  confirmActionLabel?: string;
  currency?: string;
};

function renderDialog(overrides: DialogOverrides = {}) {
  return render(<RebookingDialog {...baseProps} {...overrides} />);
}

describe("RebookingDialog", () => {
  it("renders nothing when closed", () => {
    render(<RebookingDialog {...baseProps} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("exposes an accessible labelled modal dialog", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName(/Rebook this time-token/i);
  });

  it("shows the original time-token context", () => {
    renderDialog();
    expect(screen.getByText("Pair Programming Session")).toBeInTheDocument();
    expect(
      screen.getByText("Fri, Apr 4 · 10:00-11:30"),
    ).toBeInTheDocument();
    expect(screen.getByText("150 XLM")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("omits the price when not provided", () => {
    renderDialog({ originalPriceXlm: undefined });
    expect(screen.queryByText("150 XLM")).not.toBeInTheDocument();
  });

  it("offers all three choices with distinguishing help text", () => {
    renderDialog();
    expect(
      screen.getByRole("radio", { name: /Rebook with the same supplier/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Convert to account credit/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Request a refund/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Replaces this time-token/i)).toBeInTheDocument();
    expect(screen.getByText(/spendable account credit/i)).toBeInTheDocument();
  });

  it("disables rebook and explains when there are no alternatives", () => {
    renderDialog({ alternatives: [] });
    const rebook = screen.getByRole("radio", {
      name: /Rebook with the same supplier/i,
    });
    expect(rebook).toBeDisabled();
    expect(
      screen.getByText(/No matching slots available from this supplier/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /Convert to account credit/i }),
    ).toBeEnabled();
  });

  it("stays disabled for rebook when alternatives are undefined", () => {
    renderDialog({ alternatives: undefined });
    expect(
      screen.getByRole("radio", { name: /Rebook with the same supplier/i }),
    ).toBeDisabled();
  });

  it("keeps Continue disabled until a choice is made", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: /^Continue$/ })).toBeDisabled();
  });

  it("lists alternatives nearest-first when rebook is selected", () => {
    renderDialog();
    fireEvent.click(
      screen.getByRole("radio", { name: /Rebook with the same supplier/i }),
    );

    const group = screen.getByRole("radiogroup", {
      name: /Alternative slots from the same supplier/i,
    });
    const cards = within(group).getAllByRole("radio");
    expect(cards[0]).toHaveAccessibleName(/Same-time strategy session/i);
    expect(cards[1]).toHaveAccessibleName(/Near-time planning review/i);
    expect(cards[2]).toHaveAccessibleName(/Late-afternoon catchup/i);
  });

  it("shows a proximity label and price on each alternative", () => {
    renderDialog();
    fireEvent.click(
      screen.getByRole("radio", { name: /Rebook with the same supplier/i }),
    );
    expect(
      screen.getByText(/Same start time as your original booking/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Starts 30 min from your original time/i),
    ).toBeInTheDocument();
    expect(screen.getByText("120 XLM")).toBeInTheDocument();
  });

  it("moves between choices with arrow keys", () => {
    renderDialog();
    const rebook = screen.getByRole("radio", {
      name: /Rebook with the same supplier/i,
    });
    rebook.focus();
    fireEvent.keyDown(rebook, { key: "ArrowDown" });

    expect(
      screen.getByRole("radio", { name: /Convert to account credit/i }),
    ).toHaveFocus();
    expect(
      screen.getByText(/spendable account credit/i),
    ).toBeInTheDocument();
  });

  it("navigates choices with ArrowLeft, Home, and End", () => {
    renderDialog();
    const refund = screen.getByRole("radio", { name: /Request a refund/i });
    refund.focus();
    fireEvent.keyDown(refund, { key: "ArrowLeft" });
    expect(
      screen.getByRole("radio", { name: /Convert to account credit/i }),
    ).toHaveFocus();

    fireEvent.keyDown(refund, { key: "Home" });
    expect(
      screen.getByRole("radio", { name: /Rebook with the same supplier/i }),
    ).toHaveFocus();

    fireEvent.keyDown(refund, { key: "End" });
    expect(
      screen.getByRole("radio", { name: /Request a refund/i }),
    ).toHaveFocus();
  });

  it("navigates alternative slots with arrow keys and Home/End", () => {
    renderDialog();
    fireEvent.click(
      screen.getByRole("radio", { name: /Rebook with the same supplier/i }),
    );

    const group = screen.getByRole("radiogroup", {
      name: /Alternative slots from the same supplier/i,
    });
    const same = within(group).getByRole("radio", {
      name: /Same-time strategy session/i,
    });
    const near = within(group).getByRole("radio", {
      name: /Near-time planning review/i,
    });
    const far = within(group).getByRole("radio", {
      name: /Late-afternoon catchup/i,
    });

    near.focus();
    fireEvent.keyDown(near, { key: "ArrowDown" });
    expect(far).toHaveFocus();

    far.focus();
    fireEvent.keyDown(far, { key: "ArrowUp" });
    expect(near).toHaveFocus();

    near.focus();
    fireEvent.keyDown(near, { key: "Home" });
    expect(same).toHaveFocus();

    same.focus();
    fireEvent.keyDown(same, { key: "End" });
    expect(far).toHaveFocus();
    expect(far).toBeChecked();
  });

  it("arrows across the choice boundary wrap around", () => {
    renderDialog();
    const rebook = screen.getByRole("radio", {
      name: /Rebook with the same supplier/i,
    });
    rebook.focus();
    fireEvent.keyDown(rebook, { key: "ArrowUp" });
    expect(
      screen.getByRole("radio", { name: /Request a refund/i }),
    ).toHaveFocus();
  });

  it("returns focus to the dialog scope when Tab lands outside", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog");
    (document.activeElement as HTMLElement).blur();

    fireEvent.keyDown(dialog, { key: "Tab" });

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled])',
    );
    expect(focusable[0]).toHaveFocus();
  });

  it("wraps Tab+Shift back to the last focusable element", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog");
    const first = dialog.querySelector<HTMLElement>(
      'button:not([disabled]), input:not([disabled])',
    )!;
    first.focus();

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled])',
    );
    expect(focusable[focusable.length - 1]).toHaveFocus();
  });

  it("ignores non-navigation keys inside the alternative list", () => {
    renderDialog();
    fireEvent.click(
      screen.getByRole("radio", { name: /Rebook with the same supplier/i }),
    );
    const group = screen.getByRole("radiogroup", {
      name: /Alternative slots from the same supplier/i,
    });
    const near = within(group).getByRole("radio", { name: /Near-time/i });
    const first = within(group).getByRole("radio", { name: /Same-time/i });
    fireEvent.keyDown(near, { key: "x" });
    expect(first).toBeChecked();
  });

  it("defaults the currency label to XLM", () => {
    renderDialog({ originalPriceXlm: 120.5 });
    expect(screen.getByText(/120\.5 XLM/)).toBeInTheDocument();
  });

  it("confirms a rebook with the selected alternative id", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onConfirm });

    fireEvent.click(
      screen.getByRole("radio", { name: /Rebook with the same supplier/i }),
    );
    // Auto-selects the nearest alternative; pick the second one instead.
    fireEvent.click(
      screen.getByRole("radio", { name: /Near-time planning review/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/ }));

    expect(screen.getByText(/You chose/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Confirm rebooking/i }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("rebook", {
        alternativeId: "alt-near",
      });
    });
    expect(screen.getAllByText(/same supplier confirmed/i).length).toBeGreaterThan(0);
  });

  it("confirms a credit conversion without an alternative", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onConfirm });

    fireEvent.click(
      screen.getByRole("radio", { name: /Convert to account credit/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Confirm credit/i }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("credit", {
        alternativeId: undefined,
      });
    });
    expect(screen.getAllByText(/spendable account credit/i).length).toBeGreaterThan(0);
  });

  it("confirms a refund", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onConfirm });

    fireEvent.click(
      screen.getByRole("radio", { name: /Request a refund/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Confirm refund/i }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("refund", {
        alternativeId: undefined,
      });
    });
  });

  it("returns to the choices with the Back button", async () => {
    renderDialog();
    fireEvent.click(
      screen.getByRole("radio", { name: /Convert to account credit/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Back$/ }));

    expect(
      screen.getByRole("radio", { name: /Convert to account credit/i }),
    ).toBeInTheDocument();
  });

  it("surfaces a rejection and allows retrying", async () => {
    const onConfirm = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(undefined);
    renderDialog({ onConfirm });

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
    expect(screen.getByRole("button", { name: /Try again/i })).toBeInTheDocument();
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(2);
      expect(screen.getAllByText(/confirmed/i).length).toBeGreaterThan(0);
    });
  });

  it("guards against double submission while pending", async () => {
    let release!: () => void;
    const pendingPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    const onConfirm = vi.fn().mockReturnValue(pendingPromise);
    renderDialog({ onConfirm });

    fireEvent.click(
      screen.getByRole("radio", { name: /Request a refund/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/ }));

    const confirmButton = screen.getByRole("button", { name: /Confirm refund/i });
    fireEvent.click(confirmButton);
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(/Submitting…/i)).toBeInTheDocument();
    expect(confirmButton).toBeDisabled();

    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    release();
    await waitFor(() => {
      expect(screen.getAllByText(/confirmed/i).length).toBeGreaterThan(0);
    });
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    renderDialog({ onClose });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on backdrop click", () => {
    const onClose = vi.fn();
    renderDialog({ onClose });
    fireEvent.click(screen.getByTestId("rebooking-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes via the close button", () => {
    const onClose = vi.fn();
    renderDialog({ onClose });
    fireEvent.click(
      screen.getByRole("button", { name: /Close rebooking dialog/i }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes via "Keep my time-token"', () => {
    const onClose = vi.fn();
    renderDialog({ onClose });
    fireEvent.click(
      screen.getByRole("button", { name: /Keep my time-token/i }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes via Done after a successful submission", async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onClose, onConfirm });

    fireEvent.click(
      screen.getByRole("radio", { name: /Convert to account credit/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Confirm credit/i }));
    await waitFor(() => {
      expect(screen.getAllByText(/confirmed/i).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /^Done$/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("moves focus into the dialog on open", () => {
    renderDialog();
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("announces selections through the live region", async () => {
    renderDialog();
    fireEvent.click(
      screen.getByRole("radio", { name: /Convert to account credit/i }),
    );
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Convert to account credit selected.");
  });

  it("traps Tab focus within the dialog", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog");
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    last.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(first).toHaveFocus();

    first.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });

  it("passes confirmActionLabel through to the confirm button", () => {
    renderDialog({ confirmActionLabel: "Approve the swap" });
    fireEvent.click(
      screen.getByRole("radio", { name: /Convert to account credit/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/ }));
    expect(
      screen.getByRole("button", { name: /Approve the swap/i }),
    ).toBeInTheDocument();
  });

  it("resets the flow when reopened while staying mounted", async () => {
    const { rerender } = renderDialog({ onConfirm: vi.fn().mockResolvedValue(undefined) });
    fireEvent.click(
      screen.getByRole("radio", { name: /Convert to account credit/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Confirm credit/i }));
    await waitFor(() => {
      expect(screen.getAllByText(/confirmed/i).length).toBeGreaterThan(0);
    });

    rerender(
      <RebookingDialog {...baseProps} open={false} onConfirm={vi.fn()} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(
      <RebookingDialog {...baseProps} open onConfirm={vi.fn()} />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.queryByText(/confirmed/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Continue$/ }),
    ).toBeDisabled();
  });
});