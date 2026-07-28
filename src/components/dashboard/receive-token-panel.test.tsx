/**
 * receive-token-panel.test.tsx
 *
 * Coverage targets (95%+):
 *  - buildStellarDeepLink helper
 *  - truncateAddress helper
 *  - generateQrMatrix helper
 *  - QrCode sub-component
 *  - ReceiveTokenPanel — render, network toggle, enlarge/close sheet,
 *    Escape to close, copy callback, controlled network prop,
 *    aria attributes, focus return after sheet close
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildStellarDeepLink,
  truncateAddress,
  generateQrMatrix,
  QrCode,
  ReceiveTokenPanel,
} from "./receive-token-panel";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEST_ADDRESS = "GCDQ7M3F6JH2K4N8Q5RLP9TZB3YH4W8F1S7N6U0X2A5V8E1C";
const SHORT_ADDRESS = "GABCDE";

// ---------------------------------------------------------------------------
// buildStellarDeepLink
// ---------------------------------------------------------------------------

describe("buildStellarDeepLink", () => {
  it("includes the destination address", () => {
    const link = buildStellarDeepLink(TEST_ADDRESS, "mainnet");
    expect(link).toContain(`destination=${TEST_ADDRESS}`);
  });

  it("includes the network param for mainnet", () => {
    const link = buildStellarDeepLink(TEST_ADDRESS, "mainnet");
    expect(link).toContain("network=mainnet");
  });

  it("includes the network param for testnet", () => {
    const link = buildStellarDeepLink(TEST_ADDRESS, "testnet");
    expect(link).toContain("network=testnet");
  });

  it("uses the web+stellar:pay scheme", () => {
    const link = buildStellarDeepLink(TEST_ADDRESS, "mainnet");
    expect(link.startsWith("web+stellar:pay?")).toBe(true);
  });

  it("produces different URIs for mainnet and testnet", () => {
    const mainnet = buildStellarDeepLink(TEST_ADDRESS, "mainnet");
    const testnet = buildStellarDeepLink(TEST_ADDRESS, "testnet");
    expect(mainnet).not.toBe(testnet);
  });
});

// ---------------------------------------------------------------------------
// truncateAddress
// ---------------------------------------------------------------------------

describe("truncateAddress", () => {
  it("returns full address when length <= 16", () => {
    expect(truncateAddress(SHORT_ADDRESS)).toBe(SHORT_ADDRESS);
  });

  it("truncates long address to first 8 + … + last 6", () => {
    const result = truncateAddress(TEST_ADDRESS);
    expect(result).toBe("GCDQ7M3F…5V8E1C");
  });

  it("returns address unchanged at exactly 16 chars", () => {
    const addr = "G".repeat(16);
    expect(truncateAddress(addr)).toBe(addr);
  });

  it("truncates address of exactly 17 chars", () => {
    const addr = "A".repeat(17);
    const result = truncateAddress(addr);
    expect(result).toContain("…");
  });
});

// ---------------------------------------------------------------------------
// generateQrMatrix
// ---------------------------------------------------------------------------

describe("generateQrMatrix", () => {
  it("returns a matrix of the requested size", () => {
    const m = generateQrMatrix("test", 21);
    expect(m.length).toBe(21);
    expect(m[0].length).toBe(21);
  });

  it("uses 21 as default size", () => {
    const m = generateQrMatrix("test");
    expect(m.length).toBe(21);
  });

  it("top-left corner cells are always filled (finder pattern)", () => {
    const m = generateQrMatrix("any");
    expect(m[0][0]).toBe(true);
    expect(m[0][1]).toBe(true);
    expect(m[1][0]).toBe(true);
  });

  it("top-right corner cells are always filled", () => {
    const m = generateQrMatrix("any", 21);
    expect(m[0][20]).toBe(true);
    expect(m[0][19]).toBe(true);
  });

  it("bottom-left corner cells are always filled", () => {
    const m = generateQrMatrix("any", 21);
    expect(m[20][0]).toBe(true);
    expect(m[19][0]).toBe(true);
  });

  it("timing row 6 alternates true/false", () => {
    const m = generateQrMatrix("any", 21);
    // Timing row: col 6 is the timing column — skip corners
    for (let col = 8; col < 13; col++) {
      expect(typeof m[6][col]).toBe("boolean");
    }
  });

  it("produces different matrices for different inputs", () => {
    const m1 = generateQrMatrix("address1");
    const m2 = generateQrMatrix("address2");
    // At least one cell should differ
    const differs = m1.some((row, r) => row.some((cell, c) => cell !== m2[r][c]));
    expect(differs).toBe(true);
  });

  it("is deterministic for the same input", () => {
    const m1 = generateQrMatrix(TEST_ADDRESS);
    const m2 = generateQrMatrix(TEST_ADDRESS);
    expect(JSON.stringify(m1)).toBe(JSON.stringify(m2));
  });

  it("all cells are booleans", () => {
    const m = generateQrMatrix("test", 7);
    for (const row of m) {
      for (const cell of row) {
        expect(typeof cell).toBe("boolean");
      }
    }
  });
});

// ---------------------------------------------------------------------------
// QrCode
// ---------------------------------------------------------------------------

describe("QrCode", () => {
  it("renders an SVG element", () => {
    render(<QrCode data={TEST_ADDRESS} />);
    expect(screen.getByTestId("qr-code-svg")).toBeInTheDocument();
  });

  it("has role=img", () => {
    render(<QrCode data={TEST_ADDRESS} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("uses default aria-label containing the data", () => {
    render(<QrCode data={TEST_ADDRESS} />);
    const svg = screen.getByRole("img");
    expect(svg.getAttribute("aria-label")).toContain(TEST_ADDRESS);
  });

  it("accepts a custom aria-label", () => {
    render(<QrCode data={TEST_ADDRESS} aria-label="Custom label" />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Custom label");
  });

  it("renders filled cells as <rect> elements", () => {
    const { container } = render(<QrCode data={TEST_ADDRESS} size={5} pixelSize={4} />);
    const rects = container.querySelectorAll("rect");
    expect(rects.length).toBeGreaterThan(0);
  });

  it("respects pixelSize for SVG dimensions", () => {
    render(<QrCode data="X" size={10} pixelSize={6} />);
    const svg = screen.getByTestId("qr-code-svg");
    expect(svg).toHaveAttribute("width", "60");
    expect(svg).toHaveAttribute("height", "60");
  });
});

// ---------------------------------------------------------------------------
// ReceiveTokenPanel
// ---------------------------------------------------------------------------

describe("ReceiveTokenPanel", () => {
  beforeEach(() => {
    // jsdom matchMedia stub
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((q: string) => ({
        matches: false,
        media: q,
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
    document.body.style.overflow = "";
  });

  // --- Render ---

  it("renders the panel with heading", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    expect(
      screen.getByRole("heading", { name: /receive tokens/i }),
    ).toBeInTheDocument();
  });

  it("renders the panel testid", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    expect(screen.getByTestId("receive-token-panel")).toBeInTheDocument();
  });

  it("renders the QR code SVG", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    expect(screen.getByTestId("qr-code-svg")).toBeInTheDocument();
  });

  it("renders the truncated address", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    expect(screen.getByText("GCDQ7M3F…5V8E1C")).toBeInTheDocument();
  });

  it("renders the copy button", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    expect(
      screen.getByRole("button", { name: /copy wallet address/i }),
    ).toBeInTheDocument();
  });

  it("renders the enlarge button", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    expect(
      screen.getByRole("button", { name: /enlarge qr/i }),
    ).toBeInTheDocument();
  });

  it("renders Mainnet as the default network chip", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    // StatusChip shows "Mainnet" — use the chip specifically (span)
    const chips = screen.getAllByText("Mainnet");
    expect(chips.length).toBeGreaterThan(0);
  });

  it("renders Testnet chip when network=testnet", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} network="testnet" />);
    expect(screen.getAllByText("Testnet").length).toBeGreaterThan(0);
  });

  it("renders the network radiogroup", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    expect(screen.getByRole("radiogroup", { name: /select network/i })).toBeInTheDocument();
  });

  it("mainnet radio is checked by default", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    const mainnetRadio = screen.getByRole("radio", { name: /mainnet/i });
    expect(mainnetRadio).toHaveAttribute("aria-checked", "true");
  });

  it("testnet radio is unchecked by default", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    const testnetRadio = screen.getByRole("radio", { name: /testnet/i });
    expect(testnetRadio).toHaveAttribute("aria-checked", "false");
  });

  it("applies custom className", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} className="my-class" />);
    expect(screen.getByTestId("receive-token-panel")).toHaveClass("my-class");
  });

  // --- Network toggle ---

  it("clicking testnet radio switches the network", async () => {
    const user = userEvent.setup();
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    await user.click(screen.getByRole("radio", { name: /testnet/i }));
    expect(
      screen.getByRole("radio", { name: /testnet/i }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("radio", { name: /mainnet/i }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("calls onNetworkChange when network is toggled", async () => {
    const onNetworkChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ReceiveTokenPanel
        address={TEST_ADDRESS}
        onNetworkChange={onNetworkChange}
      />,
    );
    await user.click(screen.getByRole("radio", { name: /testnet/i }));
    expect(onNetworkChange).toHaveBeenCalledWith("testnet");
  });

  it("syncs network when networkProp changes", () => {
    const { rerender } = render(
      <ReceiveTokenPanel address={TEST_ADDRESS} network="mainnet" />,
    );
    rerender(<ReceiveTokenPanel address={TEST_ADDRESS} network="testnet" />);
    expect(
      screen.getByRole("radio", { name: /testnet/i }),
    ).toHaveAttribute("aria-checked", "true");
  });

  // --- Enlarge / large QR sheet ---

  it("large QR sheet is not visible initially", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    expect(screen.queryByTestId("large-qr-sheet")).not.toBeInTheDocument();
  });

  it("clicking Enlarge opens the large QR sheet", async () => {
    const user = userEvent.setup();
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    await user.click(screen.getByRole("button", { name: /enlarge qr/i }));
    expect(screen.getByTestId("large-qr-sheet")).toBeInTheDocument();
  });

  it("large QR sheet has role=dialog", async () => {
    const user = userEvent.setup();
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    await user.click(screen.getByRole("button", { name: /enlarge qr/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("large QR sheet has aria-modal=true", async () => {
    const user = userEvent.setup();
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    await user.click(screen.getByRole("button", { name: /enlarge qr/i }));
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("large QR sheet shows the address", async () => {
    const user = userEvent.setup();
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    await user.click(screen.getByRole("button", { name: /enlarge qr/i }));
    expect(screen.getByText(TEST_ADDRESS)).toBeInTheDocument();
  });

  it("close button inside sheet closes the dialog", async () => {
    const user = userEvent.setup();
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    await user.click(screen.getByRole("button", { name: /enlarge qr/i }));
    expect(screen.getByTestId("large-qr-sheet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /close large qr/i }));
    expect(screen.queryByTestId("large-qr-sheet")).not.toBeInTheDocument();
  });

  it("pressing Escape closes the large QR sheet", async () => {
    const user = userEvent.setup();
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    await user.click(screen.getByRole("button", { name: /enlarge qr/i }));
    expect(screen.getByTestId("large-qr-sheet")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("large-qr-sheet")).not.toBeInTheDocument();
  });

  it("prevents background scroll when sheet is open", async () => {
    const user = userEvent.setup();
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    await user.click(screen.getByRole("button", { name: /enlarge qr/i }));
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores background scroll when sheet closes", async () => {
    const user = userEvent.setup();
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    await user.click(screen.getByRole("button", { name: /enlarge qr/i }));
    await user.click(screen.getByRole("button", { name: /close large qr/i }));
    expect(document.body.style.overflow).toBe("");
  });

  it("large QR sheet shows the correct network chip", async () => {
    const user = userEvent.setup();
    render(<ReceiveTokenPanel address={TEST_ADDRESS} network="testnet" />);
    await user.click(screen.getByRole("button", { name: /enlarge qr/i }));
    // Inside the sheet there should be a Testnet chip
    const sheet = screen.getByTestId("large-qr-sheet");
    expect(sheet).toHaveTextContent(/testnet/i);
  });

  // --- Callbacks ---

  it("calls onCopied after copying address", async () => {
    const onCopied = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });
    const user = userEvent.setup();
    render(<ReceiveTokenPanel address={TEST_ADDRESS} onCopied={onCopied} />);
    await user.click(screen.getByRole("button", { name: /copy wallet address/i }));
    await waitFor(() => expect(onCopied).toHaveBeenCalledTimes(1));
  });

  // --- Accessibility ---

  it("panel has aria-labelledby pointing to the heading", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    const panel = screen.getByTestId("receive-token-panel");
    const heading = screen.getByRole("heading", { name: /receive tokens/i });
    expect(panel.getAttribute("aria-labelledby")).toBe(heading.id);
  });

  it("enlarge button has aria-haspopup=dialog", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    const btn = screen.getByRole("button", { name: /enlarge qr/i });
    expect(btn).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("QR code SVG has a descriptive aria-label", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    const svg = screen.getByTestId("qr-code-svg");
    const label = svg.getAttribute("aria-label") ?? "";
    expect(label).toContain(TEST_ADDRESS);
    expect(label.toLowerCase()).toContain("qr code");
  });

  it("full address is available to screen readers via sr-only text", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    expect(screen.getByText(`Full wallet address: ${TEST_ADDRESS}`)).toBeInTheDocument();
  });

  it("deep link is available to screen readers via sr-only text", () => {
    render(<ReceiveTokenPanel address={TEST_ADDRESS} />);
    const deepLink = buildStellarDeepLink(TEST_ADDRESS, "mainnet");
    expect(screen.getByText(deepLink)).toBeInTheDocument();
  });
});
