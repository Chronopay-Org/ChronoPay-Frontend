import { Suspense } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import SlotDetailPage from "@/app/dashboard/slots/[id]/page";

vi.mock("@/app/components/dashboard-shell", () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}));

async function renderSlotDetailPage(id = "slot-1") {
  const params = Promise.resolve({ id });
  await act(async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <SlotDetailPage params={params} />
      </Suspense>,
    );
  });
}

describe("SlotDetailPage smoke test", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
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
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("applies a promo code and updates the total", async () => {
    await renderSlotDetailPage("slot-1");

    const toggleBtn = screen.getByRole("button", { name: /promo code/i });
    fireEvent.click(toggleBtn);

    const promoInput = screen.getByPlaceholderText(/save20|promo|code/i);
    fireEvent.change(promoInput, { target: { value: "SAVE20" } });
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/20% promo applied/i)).toBeInTheDocument();
    expect(screen.getByText("Discounted total")).toBeInTheDocument();
  });

  it("completes checkout and opens the redeem token modal", async () => {
    await renderSlotDetailPage("slot-1");

    fireEvent.click(screen.getByRole("button", { name: "Purchase Time Token" }));
    expect(screen.getByText("How would you like to continue?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue as Guest" }));
    expect(screen.getByText("Confirm Escrow Booking")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Confirm & Lock Funds/i }));
    expect(screen.getByText("Stellar Blockchain Syncing")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4100);
    });

    expect(screen.getByText("Time Token Purchased")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Redeem Time Token" }));
    expect(screen.getByLabelText("QR Code for redemption")).toBeInTheDocument();
  });

  it("opens and closes the dispute modal while restoring focus", async () => {
    await renderSlotDetailPage("slot-1");

    const disputeBtn = screen.getByRole("button", { name: /View Dispute/i });
    disputeBtn.focus();
    fireEvent.click(disputeBtn);

    expect(screen.getByText("Dispute Tracking")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close dispute modal"));
    expect(screen.queryByText("Dispute Tracking")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(disputeBtn);
  });
});
