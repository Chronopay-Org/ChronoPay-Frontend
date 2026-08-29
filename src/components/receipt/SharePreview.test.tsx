import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { SharePreview } from "./SharePreview";
import type { ReceiptData } from "./types";

// Mock window.open using vitest's auto-restoring stub
const mockOpen = vi.fn();
beforeAll(() => {
  vi.stubGlobal("open", mockOpen);
});
afterAll(() => {
  vi.unstubAllGlobals();
});

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

describe("SharePreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
  });

  // ── Rendering ────────────────────────────────────────────────────────

  it("renders the share section header and description", () => {
    render(<SharePreview receipt={receipt} />);
    expect(screen.getByText("Share this receipt")).toBeInTheDocument();
    expect(
      screen.getByText(/Customise the subtitle/i),
    ).toBeInTheDocument();
  });

  it("renders the live preview card", () => {
    render(<SharePreview receipt={receipt} />);
    expect(screen.getByLabelText("Share card preview")).toBeInTheDocument();
    expect(screen.getByText("ChronoPay")).toBeInTheDocument();
    expect(screen.getByText("Deep dive time slot")).toBeInTheDocument();
  });

  it("renders preview metadata (total, tx hash, settled date)", () => {
    render(<SharePreview receipt={receipt} />);
    expect(screen.getByText("182.7001 XLM")).toBeInTheDocument();
    expect(screen.getByText("Apr 1, 2026 · 10:04 UTC")).toBeInTheDocument();
  });

  it("shows default placeholder subtitle in preview when empty", () => {
    render(<SharePreview receipt={receipt} />);
    expect(
      screen.getByText("Add a custom subtitle above…"),
    ).toBeInTheDocument();
  });

  // ── Subtitle input ───────────────────────────────────────────────────

  it("renders editable subtitle input with character counter", () => {
    render(<SharePreview receipt={receipt} />);
    const input = screen.getByLabelText("Subtitle") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.placeholder).toBe("Deep dive time slot");
  });

  it("shows initial character count of 120", () => {
    render(<SharePreview receipt={receipt} />);
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("updates character counter as user types", () => {
    render(<SharePreview receipt={receipt} />);
    const input = screen.getByLabelText("Subtitle");
    fireEvent.change(input, { target: { value: "Hello" } });
    expect(screen.getByText("115")).toBeInTheDocument();
  });

  it("updates preview subtitle as user types", () => {
    render(<SharePreview receipt={receipt} />);
    const input = screen.getByLabelText("Subtitle");
    fireEvent.change(input, {
      target: { value: "Check out my confirmed booking!" },
    });
    expect(
      screen.getByText("Check out my confirmed booking!"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Add a custom subtitle above…"),
    ).not.toBeInTheDocument();
  });

  it("shows warning when approaching character limit", () => {
    render(<SharePreview receipt={receipt} />);
    const input = screen.getByLabelText("Subtitle");
    // Type exactly 100 chars (20 remaining = warning threshold)
    fireEvent.change(input, {
      target: { value: "A".repeat(100) },
    });
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("shows red counter and alert when over character limit", () => {
    render(<SharePreview receipt={receipt} />);
    const input = screen.getByLabelText("Subtitle");
    fireEvent.change(input, {
      target: { value: "A".repeat(130) },
    });
    expect(screen.getByText(/over limit/)).toBeInTheDocument();
    expect(
      screen.getByRole("alert"),
    ).toBeInTheDocument();
  });

  it("displays the receipt title as default subtitle when input is empty", () => {
    render(<SharePreview receipt={receipt} />);
    const input = screen.getByLabelText("Subtitle") as HTMLInputElement;
    expect(input.placeholder).toBe("Deep dive time slot");
  });

  // ── Action buttons ────────────────────────────────────────────────────

  it("renders copy link button", () => {
    render(<SharePreview receipt={receipt} />);
    expect(
      screen.getByRole("button", { name: /Copy link/i }),
    ).toBeInTheDocument();
  });

  it("copies masked link to clipboard and shows confirmation", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<SharePreview receipt={receipt} />);
    const copyBtn = screen.getByRole("button", { name: /Copy link/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(screen.getByText("Copied")).toBeInTheDocument();
    // Advance past the 2s auto-reset
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText("Copied")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("renders X (Twitter) share button", () => {
    render(<SharePreview receipt={receipt} />);
    expect(
      screen.getByRole("button", { name: "Share on X (Twitter)" }),
    ).toBeInTheDocument();
  });

  it("renders LinkedIn share button", () => {
    render(<SharePreview receipt={receipt} />);
    expect(
      screen.getByRole("button", { name: "Share on LinkedIn" }),
    ).toBeInTheDocument();
  });

  it("renders WhatsApp share button", () => {
    render(<SharePreview receipt={receipt} />);
    expect(
      screen.getByRole("button", { name: "Share on WhatsApp" }),
    ).toBeInTheDocument();
  });

  it("opens X share URL when X button clicked", () => {
    render(<SharePreview receipt={receipt} />);
    fireEvent.click(screen.getByRole("button", { name: "Share on X (Twitter)" }));
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining("https://x.com/intent/tweet"),
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("opens LinkedIn share URL when LinkedIn button clicked", () => {
    render(<SharePreview receipt={receipt} />);
    fireEvent.click(screen.getByRole("button", { name: "Share on LinkedIn" }));
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining("https://www.linkedin.com/sharing/share-offsite/"),
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("opens WhatsApp share URL when WhatsApp button clicked", () => {
    render(<SharePreview receipt={receipt} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Share on WhatsApp" }),
    );
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/"),
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("includes custom subtitle in X share text", () => {
    render(<SharePreview receipt={receipt} />);
    const input = screen.getByLabelText("Subtitle");
    fireEvent.change(input, {
      target: { value: "My custom subtitle" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Share on X (Twitter)" }));
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining("My%20custom%20subtitle"),
      expect.any(String),
      expect.any(String),
    );
  });

  // ── localStorage persistence ──────────────────────────────────────────

  it("persists subtitle to localStorage", () => {
    render(<SharePreview receipt={receipt} />);
    const input = screen.getByLabelText("Subtitle");
    fireEvent.change(input, {
      target: { value: "Persisted subtitle" },
    });
    expect(
      window.localStorage.getItem("chronopay-share-subtitle-slot-123"),
    ).toBe("Persisted subtitle");
  });

  it("loads persisted subtitle from localStorage on mount", () => {
    window.localStorage.setItem(
      "chronopay-share-subtitle-slot-123",
      "Previously saved",
    );
    render(<SharePreview receipt={receipt} />);
    const input = screen.getByLabelText("Subtitle") as HTMLInputElement;
    expect(input.value).toBe("Previously saved");
    expect(
      screen.getByText("Previously saved"),
    ).toBeInTheDocument();
  });

  it("removes localStorage entry when subtitle is cleared", () => {
    window.localStorage.setItem(
      "chronopay-share-subtitle-slot-123",
      "To be cleared",
    );
    render(<SharePreview receipt={receipt} />);
    const input = screen.getByLabelText("Subtitle");
    fireEvent.change(input, { target: { value: "" } });
    expect(
      window.localStorage.getItem("chronopay-share-subtitle-slot-123"),
    ).toBeNull();
  });

  // Accessibility

  it("has accessible input with proper labels", () => {
    render(<SharePreview receipt={receipt} />);
    const input = screen.getByLabelText("Subtitle");
    expect(input).toHaveAttribute("id");
    expect(input).toHaveAttribute("aria-describedby");
  });
});
