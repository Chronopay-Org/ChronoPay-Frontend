/**
 * src/components/receipt/QrBadge.test.tsx
 *
 * Tests for QrBadge:
 *  - Verifies NO external network request is made (no img[src*="qrserver"]).
 *  - Verifies an inline SVG QR is rendered.
 *  - Verifies decoding the rendered SVG yields the explorerUrl.
 *  - Verifies click navigation to explorer.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QrBadge } from "./QrBadge";
import { decodeQrSvg } from "@/lib/qr";

describe("QrBadge", () => {
  const EXPLORER_URL = "https://stellar.expert/explorer/public/tx/0123456789abcdef";

  beforeEach(() => {
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render any img with external qrserver API source", () => {
    const { container } = render(<QrBadge explorerUrl={EXPLORER_URL} label="payment #123" />);
    const qrServerImg = container.querySelector('img[src*="qrserver"]');
    expect(qrServerImg).toBeNull();
    const allImages = container.querySelectorAll("img");
    expect(allImages.length).toBe(0);
  });

  it("renders an accessible inline SVG element", () => {
    render(<QrBadge explorerUrl={EXPLORER_URL} label="payment #123" />);
    const svg = screen.getByTestId("receipt-qr-svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("role", "img");
    expect(svg).toHaveAttribute(
      "aria-label",
      "QR code for payment #123. Scan or tap to verify on the ledger explorer.",
    );
  });

  it("decoding the rendered SVG yields the original explorer URL", () => {
    const { container } = render(<QrBadge explorerUrl={EXPLORER_URL} />);
    const svg = container.querySelector("svg[data-testid='receipt-qr-svg']");
    expect(svg).not.toBeNull();
    const svgHtml = svg!.outerHTML;
    const decoded = decodeQrSvg(svgHtml);
    expect(decoded).toBe(EXPLORER_URL);
  });

  it("opens the explorer URL in a new window when tapped/clicked", () => {
    render(<QrBadge explorerUrl={EXPLORER_URL} label="transfer" />);
    const button = screen.getByRole("button", { name: /verify transfer on the ledger explorer/i });
    fireEvent.click(button);
    expect(window.open).toHaveBeenCalledWith(EXPLORER_URL, "_blank", "noopener,noreferrer");
  });

  it("announces verification status to screen readers", () => {
    render(<QrBadge explorerUrl={EXPLORER_URL} label="escrow release" />);
    const button = screen.getByRole("button", { name: /verify escrow release/i });
    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveTextContent("");

    fireEvent.click(button);
    expect(liveRegion).toHaveTextContent("Opening explorer for escrow release.");
  });
});
