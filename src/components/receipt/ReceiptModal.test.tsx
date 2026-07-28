import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReceiptModal } from "./ReceiptModal";
import type { ReceiptData } from "./types";

const receipt: ReceiptData = {
  id: "slot-123",
  assetCode: "CHRONO-SLOT-123",
  title: "Deep dive time slot",
  status: "settled",
  settledAt: "Apr 1, 2026 · 10:04 UTC",
  buyer: { name: "You", role: "Buyer", address: "GTEST...ADDRESS" },
  seller: {
    name: "Dr. Sarah Jenkins",
    role: "Seller",
    address: "GSLLR...ADDRESS",
  },
  lineItems: [
    { label: "Token subtotal", value: "180.00 XLM", note: "120.00 × 1.5 hrs" },
    {
      label: "Smart escrow fee",
      value: "2.7000 XLM",
      note: "1.5% held in contract",
    },
    {
      label: "Stellar network fee",
      value: "0.0001 XLM",
      note: "Paid to validators",
    },
  ],
  net: "180.00 XLM",
  total: "182.7001 XLM",
  txHash: "abcdef1234567890",
  escrowContract: "GCSW67F2Y3MQK4N8Q5RLP9TZB3YH4W8F1S7N6U0X2A5V8T9H3K2",
  trace: [
    { label: "Stellar transaction initiated", status: "complete" },
    { label: "Trustline established for asset", status: "complete" },
    { label: "Funds locked in multi-sig escrow", status: "complete" },
    { label: "Token minted and funds released", status: "complete" },
  ],
  explorerBaseUrl: "https://stellar.expert/explorer/public/tx",
};

describe("ReceiptModal", () => {
  beforeEach(() => {
    vi.spyOn(window, "print").mockImplementation(() => undefined);
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
  });

  it("renders optional tip prompt when opened", () => {
    render(<ReceiptModal isOpen onClose={vi.fn()} receipt={receipt} />);
    expect(
      screen.getByText("Optional tip for the supplier"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /No thanks, continue/i }),
    ).toBeInTheDocument();
  });

  it("allows skipping the tip prompt", () => {
    render(<ReceiptModal isOpen onClose={vi.fn()} receipt={receipt} />);
    fireEvent.click(
      screen.getByRole("button", { name: /No thanks, continue/i }),
    );
    expect(
      screen.getByText(/Tip skipped\. The receipt is ready\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Optional tip for the supplier/i),
    ).not.toBeInTheDocument();
  });

  it("applies a preset tip and updates the receipt total", () => {
    render(<ReceiptModal isOpen onClose={vi.fn()} receipt={receipt} />);
    fireEvent.click(screen.getByRole("button", { name: "2.50 XLM" }));
    fireEvent.click(screen.getByRole("button", { name: /Confirm tip/i }));
    expect(screen.getByText(/Added 2\.50 XLM tip\./i)).toBeInTheDocument();
    expect(screen.getByText(/184\.7001 XLM/i)).toBeInTheDocument();
  });

  it("renders custom tip and preserves the selected value", () => {
    render(<ReceiptModal isOpen onClose={vi.fn()} receipt={receipt} />);
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "3.75" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Confirm tip/i }));
    expect(screen.getByText(/Added 3\.75 XLM tip\./i)).toBeInTheDocument();
    expect(screen.getByText(/186\.4501 XLM/i)).toBeInTheDocument();
  });

  it("disables confirm when no tip is selected", () => {
    render(<ReceiptModal isOpen onClose={vi.fn()} receipt={receipt} />);
    expect(screen.getByRole("button", { name: /Confirm tip/i })).toBeDisabled();
  });
});
