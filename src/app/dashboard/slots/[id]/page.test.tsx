import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { axe } from "jest-axe";
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

  it("traps focus within checkout dialog and passes axe accessibility audit", async () => {
    const user = userEvent.setup();
    const { container } = render(<SlotDetailPage params={defaultParams} />);

    const purchaseButton = await screen.findByRole("button", { name: /Purchase Time Token/i });
    expect(purchaseButton).toBeInTheDocument();

    // Focus trigger and open checkout modal
    purchaseButton.focus();
    await user.click(purchaseButton);

    const dialog = await screen.findByRole("dialog", { name: /How would you like to continue\?/i });
    expect(dialog).toBeInTheDocument();

    // Focus must land inside the dialog
    expect(dialog).toContainElement(document.activeElement);

    // Background must be inert and aria-hidden while dialog is open
    const pageBackground = container.querySelector(".space-y-6");
    expect(pageBackground).toHaveAttribute("inert");
    expect(pageBackground).toHaveAttribute("aria-hidden", "true");

    // Tab through all focusable elements inside the dialog and ensure focus never leaves
    for (let i = 0; i < 10; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement);
    }

    // Shift+Tab backwards and ensure focus never leaves the dialog
    for (let i = 0; i < 10; i++) {
      await user.tab({ shift: true });
      expect(dialog).toContainElement(document.activeElement);
    }

    // Run axe check on the open dialog
    const axeResults = await axe(dialog);
    expect(axeResults).toHaveNoViolations();

    // Closing the dialog returns focus to the trigger button
    const closeBtn = screen.getByRole("button", { name: /Close modal dialog/i });
    await user.click(closeBtn);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(purchaseButton);
    expect(pageBackground).not.toHaveAttribute("inert");
    expect(pageBackground).not.toHaveAttribute("aria-hidden");
  });

  it("traps focus within dispute dialog and passes axe accessibility audit", async () => {
    const user = userEvent.setup();
    const { container } = render(<SlotDetailPage params={defaultParams} />);

    const disputeButton = await screen.findByRole("button", { name: /View Dispute/i });
    expect(disputeButton).toBeInTheDocument();

    // Focus trigger and open dispute modal
    disputeButton.focus();
    await user.click(disputeButton);

    const disputeDialog = await screen.findByRole("dialog", { name: /Dispute/i });
    expect(disputeDialog).toBeInTheDocument();

    // Focus must land inside the dispute dialog
    expect(disputeDialog).toContainElement(document.activeElement);

    // Background must be inert and aria-hidden while dialog is open
    const pageBackground = container.querySelector(".space-y-6");
    expect(pageBackground).toHaveAttribute("inert");
    expect(pageBackground).toHaveAttribute("aria-hidden", "true");

    // Tab through all focusable elements inside dispute dialog and ensure focus never leaves
    for (let i = 0; i < 10; i++) {
      await user.tab();
      expect(disputeDialog).toContainElement(document.activeElement);
    }

    // Shift+Tab backwards and ensure focus never leaves the dialog
    for (let i = 0; i < 10; i++) {
      await user.tab({ shift: true });
      expect(disputeDialog).toContainElement(document.activeElement);
    }

    // Run axe check on the open dispute dialog
    const axeResults = await axe(disputeDialog);
    expect(axeResults).toHaveNoViolations();

    // Closing dispute dialog returns focus to the trigger button
    const closeDisputeBtn = screen.getByRole("button", { name: /Close dispute modal/i });
    await user.click(closeDisputeBtn);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(disputeButton);
    expect(pageBackground).not.toHaveAttribute("inert");
    expect(pageBackground).not.toHaveAttribute("aria-hidden");
  });
});
