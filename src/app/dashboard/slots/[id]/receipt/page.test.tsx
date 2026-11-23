import React, { Suspense } from "react";
import { act, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SharedReceiptPage from "./page";
import { mockSlots } from "@/components/dashboard/dashboard-data";
import { buildShareLink } from "@/components/receipt/masking";
import type { ReceiptData } from "@/components/receipt/types";

const mockNotFound = vi.fn();

vi.mock("@/app/components/dashboard-shell", () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}));

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return {
    ...actual,
    notFound: () => mockNotFound(),
    usePathname: () => "/dashboard/slots/slot-1/receipt",
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
    }),
  };
});

class TestErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) return <div data-testid="error-fallback" />;
    return this.props.children;
  }
}

const KNOWN_SLOT_ID = mockSlots[0].id;

describe("SharedReceiptPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
  });

  it("calls notFound when the slot id is not in mockSlots", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const caughtErrors: Error[] = [];

    const params = Promise.resolve({ id: "unknown-slot-id-999" });
    const searchParams = Promise.resolve({
      asset: "CHRONO-001",
      buyer: "A. B.",
      seller: "C. D.",
      total: "100.00 USDC",
    });

    await act(async () => {
      render(
        <TestErrorBoundary onError={(err) => caughtErrors.push(err)}>
          <Suspense fallback={<div>Loading...</div>}>
            <SharedReceiptPage params={params} searchParams={searchParams} />
          </Suspense>
        </TestErrorBoundary>,
      );
    });

    expect(mockNotFound).toHaveBeenCalled();
    expect(caughtErrors.some((err) => err.message === "NEXT_NOT_FOUND")).toBe(true);

    consoleErrorSpy.mockRestore();
  });

  it("renders query values (asset, masked buyer/seller, tx, settled, total) for a known slot id", async () => {
    const sampleReceipt: ReceiptData = {
      id: KNOWN_SLOT_ID,
      title: "Product Roadmap Deep Dive",
      status: "settled",
      settledAt: "2026-05-01 14:30 UTC",
      buyer: { name: "Alice Johnson", role: "Buyer", address: "GABCD1234567890WXYZ" },
      seller: { name: "Bob Smith", role: "Supplier", address: "GDEFG1234567890STUV" },
      lineItems: [{ label: "Session", value: "100.00 USDC" }],
      net: "98.00 USDC",
      total: "100.00 USDC",
      assetCode: "CHRONO-2026",
      txHash: "abcdef1234567890fedcba0987654321",
      escrowContract: "CESCROW1234567890CONTRACT",
      explorerBaseUrl: "https://stellar.expert/explorer/public/tx",
      trace: [],
    };

    const shareUrl = new URL(buildShareLink(sampleReceipt, "https://chronopay.example"));
    const queryFromLink = Object.fromEntries(shareUrl.searchParams.entries());

    const params = Promise.resolve({ id: KNOWN_SLOT_ID });
    const searchParams = Promise.resolve(queryFromLink);

    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <SharedReceiptPage params={params} searchParams={searchParams} />
        </Suspense>,
      );
    });

    expect(
      await screen.findByRole("heading", { level: 1, name: /shared receipt/i }),
    ).toBeInTheDocument();
    expect(mockNotFound).not.toHaveBeenCalled();

    // Receipt fields from buildShareLink
    expect(screen.getByText("CHRONO-2026")).toBeInTheDocument();
    expect(screen.getByText("A. J.")).toBeInTheDocument();
    expect(screen.getByText("B. S.")).toBeInTheDocument();
    expect(screen.getByText("abcdef...654321")).toBeInTheDocument();
    expect(screen.getByText("2026-05-01 14:30 UTC")).toBeInTheDocument();

    // Fee breakdown & total derived from total="100.00 USDC"
    expect(screen.getByText("98.00 USDC")).toBeInTheDocument();
    expect(screen.getByText("2.00 USDC")).toBeInTheDocument();
    expect(screen.getByText("1.50 USDC")).toBeInTheDocument();
    expect(screen.getByText("0.50 USDC")).toBeInTheDocument();
    expect(screen.getByText("100.00 USDC")).toBeInTheDocument();
  });

  it("uses the first value when query parameters are passed as string arrays", async () => {
    const params = Promise.resolve({ id: KNOWN_SLOT_ID });
    const searchParams = Promise.resolve({
      asset: ["CHRONO-FIRST", "CHRONO-SECOND"],
      buyer: ["J. D.", "X. Y."],
      seller: ["M. K."],
      total: ["250 XLM", "999 USDC"],
    });

    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <SharedReceiptPage params={params} searchParams={searchParams} />
        </Suspense>,
      );
    });

    expect(await screen.findByText("CHRONO-FIRST")).toBeInTheDocument();
    expect(screen.queryByText("CHRONO-SECOND")).not.toBeInTheDocument();
    expect(screen.getByText("J. D.")).toBeInTheDocument();
    expect(screen.getByText("M. K.")).toBeInTheDocument();
    expect(screen.getByText("250.00 XLM")).toBeInTheDocument();
  });

  it("falls back gracefully when all query parameters are missing", async () => {
    const params = Promise.resolve({ id: KNOWN_SLOT_ID });
    const searchParams = Promise.resolve({});

    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <SharedReceiptPage params={params} searchParams={searchParams} />
        </Suspense>,
      );
    });

    expect(
      await screen.findByText(/this shared link has no receipt details to display\./i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/fee breakdown/i)).not.toBeInTheDocument();
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("falls back gracefully when total is missing or malformed", async () => {
    const params = Promise.resolve({ id: KNOWN_SLOT_ID });
    const searchParams = Promise.resolve({
      asset: "CHRONO-PARTIAL",
      total: "!!!",
      buyer: undefined,
    });

    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <SharedReceiptPage params={params} searchParams={searchParams} />
        </Suspense>,
      );
    });

    expect(await screen.findByText("CHRONO-PARTIAL")).toBeInTheDocument();
    expect(screen.queryByText("Buyer")).not.toBeInTheDocument();
    expect(screen.queryByText("Seller")).not.toBeInTheDocument();

    // Malformed total falls back to 0.00 USDC across fee breakdown and total settled
    const zeroUsdcValues = screen.getAllByText("0.00 USDC");
    expect(zeroUsdcValues.length).toBeGreaterThanOrEqual(5);
  });
});
