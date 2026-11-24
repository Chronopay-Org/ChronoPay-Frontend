import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ReceiptVerifyView } from "./page";
import { buildShareLink } from "@/components/receipt/masking";
import { buildReceipt } from "@/components/receipt/receipt-builder";

describe("ReceiptVerifyView (/receipt/verify)", () => {
  const receipt = buildReceipt({
    slot: {
      id: "slot-1",
      title: "Architecture Review",
      rate: "120 XLM/hr",
      dateLabel: "Apr 1, 2026",
      timeRange: "10:00 UTC",
    },
    seller: { name: "Alex Rivera" },
    durationHours: 1.5,
    subtotal: 180,
    escrowFee: 2.7,
    stellarFee: 0.0001,
    totalCost: 182.7001,
    effectiveTotalCost: 182.7001,
    txHash:
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  });

  it("renders only masked fields from a buildShareLink URL", () => {
    const url = new URL(buildShareLink(receipt, "https://chronopay.app"));
    const query = Object.fromEntries(url.searchParams.entries());

    render(<ReceiptVerifyView query={query} />);

    expect(screen.getByText("Receipt Verification")).toBeInTheDocument();
    expect(screen.getByText("CHRONO-SLOT-1")).toBeInTheDocument();
    expect(screen.getByText("012345...abcdef")).toBeInTheDocument();
    expect(screen.getByText("Y.")).toBeInTheDocument();
    expect(screen.getByText("A. R.")).toBeInTheDocument();
    expect(screen.queryByText(/Alex Rivera/i)).not.toBeInTheDocument();
    expect(screen.queryByText(receipt.txHash)).not.toBeInTheDocument();
  });

  it("rejects malformed or unmasked buyer/seller names and never renders them", () => {
    render(
      <ReceiptVerifyView
        query={{
          asset: "CHRONO-SLOT-1",
          tx: "012345...abcdef",
          buyer: "Jordan Taylor",
          seller: "Alex Rivera",
          total: "182.70 XLM",
          settled: "Apr 1, 2026",
        }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /Invalid verification link/i,
    );
    expect(screen.queryByText(/Jordan Taylor/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Alex Rivera/i)).not.toBeInTheDocument();
  });

  it("rejects missing required parameters", () => {
    render(<ReceiptVerifyView query={{}} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      /missing required receipt parameters/i,
    );
  });
});
