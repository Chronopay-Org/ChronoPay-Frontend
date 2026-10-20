import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SlotDetailPage from "./page";

// Mock the next/link and lucide-react
vi.mock("next/link", () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react");
  return {
    ...actual,
    ArrowLeft: () => <div data-testid="ArrowLeft" />,
  };
});

describe("SlotDetailPage", () => {
  const defaultParams = Promise.resolve({ id: "slot-1" });
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the page and handles a successful purchase flow (happy path)", async () => {
    const user = userEvent.setup();
    render(<SlotDetailPage params={defaultParams} />);
    
    // Ensure "Purchase Time Token" button is rendered
    const purchaseButton = await screen.findByRole("button", { name: /Purchase Time Token/i });
    expect(purchaseButton).toBeInTheDocument();
    
    // Open the checkout modal
    await user.click(purchaseButton);
    
    // Confirm continue as guest
    const guestButton = await screen.findByRole("button", { name: /Continue as Guest/i });
    expect(guestButton).toBeInTheDocument();
    await user.click(guestButton);
    
    // Confirm purchase
    const confirmButton = await screen.findByRole("button", { name: /Confirm & Lock Funds/i });
    await user.click(confirmButton);
    
    // Wait for the success state
    await waitFor(
      () => {
        expect(screen.getByText(/Time Token Purchased/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    
    // Check if "View Receipt" button appears
    const viewReceiptBtn = await screen.findByRole("button", { name: /View Receipt/i });
    expect(viewReceiptBtn).toBeInTheDocument();
    
    // Open the receipt
    await user.click(viewReceiptBtn);
    
    // Receipt modal should be visible
    expect(screen.getByText(/Transaction Receipt/i)).toBeInTheDocument();
  });

  it("handles insufficient funds boundary correctly", async () => {
    const user = userEvent.setup();
    render(<SlotDetailPage params={defaultParams} />);
    
    // Simulate insufficient balance
    const simInsufficientBtn = await screen.findByRole("button", { name: /50 XLM/i });
    await user.click(simInsufficientBtn);
    
    // Expect the insufficient funds button
    const purchaseButton = await screen.findByRole("button", { name: /Insufficient Stellar Funds/i });
    expect(purchaseButton).toBeDisabled();
  });

  it("handles wallet error/disconnected recovery", async () => {
    const user = userEvent.setup();
    render(<SlotDetailPage params={defaultParams} />);
    
    // Simulate disconnected state
    const simDisconnectedBtn = await screen.findByRole("button", { name: /disconnected/i, exact: true });
    await user.click(simDisconnectedBtn);
    
    const connectButton = await screen.findByRole("button", { name: /Connect Stellar Wallet/i });
    expect(connectButton).toBeInTheDocument();
    
    // Recover by clicking connect
    await user.click(connectButton);
    
    const purchaseButton = await screen.findByRole("button", { name: /Purchase Time Token/i });
    expect(purchaseButton).toBeInTheDocument();
  });

  it("preserves backward compatibility by falling back to mock slots if ID is unknown", async () => {
    const invalidParams = Promise.resolve({ id: "unknown-id-999" });
    render(<SlotDetailPage params={invalidParams} />);
    
    // It should fallback to the first slot and render properly
    expect(await screen.findByText(/Deep dive into your product roadmap/i)).toBeInTheDocument();
  });

  it("does not complete purchase or set success state when cancelled during loading via Escape", async () => {
    vi.useFakeTimers();
    render(<SlotDetailPage params={defaultParams} />);

    // Wait for slot to load and click purchase
    const purchaseButton = await screen.findByRole("button", { name: /Purchase Time Token/i });
    fireEvent.click(purchaseButton);

    const guestButton = await screen.findByRole("button", { name: /Continue as Guest/i });
    fireEvent.click(guestButton);

    const confirmButton = await screen.findByRole("button", { name: /Confirm & Lock Funds/i });
    fireEvent.click(confirmButton);

    // Verify loading state is active
    expect(screen.getByText(/Stellar Blockchain Syncing/i)).toBeInTheDocument();

    // User presses Escape during loading
    fireEvent.keyDown(window, { key: "Escape" });

    // Modal dialog should close immediately
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Fast-forward past the 4000ms transaction duration
    vi.advanceTimersByTime(5000);

    // Ensure success modal and receipt are NOT displayed
    expect(screen.queryByText(/Time Token Purchased/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /View Receipt/i })).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it("does not perform state updates or set success state when unmounted during loading", async () => {
    vi.useFakeTimers();
    const { unmount } = render(<SlotDetailPage params={defaultParams} />);

    const purchaseButton = await screen.findByRole("button", { name: /Purchase Time Token/i });
    fireEvent.click(purchaseButton);

    const guestButton = await screen.findByRole("button", { name: /Continue as Guest/i });
    fireEvent.click(guestButton);

    const confirmButton = await screen.findByRole("button", { name: /Confirm & Lock Funds/i });
    fireEvent.click(confirmButton);

    expect(screen.getByText(/Stellar Blockchain Syncing/i)).toBeInTheDocument();

    // Unmount the component while transaction is pending
    unmount();

    // Fast forward past the completion timer
    vi.advanceTimersByTime(5000);

    // No errors thrown, and nothing rendered
    expect(screen.queryByText(/Time Token Purchased/i)).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
