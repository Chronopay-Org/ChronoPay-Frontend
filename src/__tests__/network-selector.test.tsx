import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  NetworkSelector,
  NetworkProvider,
  TestnetRibbon,
  readPersistedNetwork,
  type StellarNetwork,
} from "@/components/checkout/NetworkSelector";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("readPersistedNetwork", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("returns 'mainnet' when no preference is stored", () => {
    expect(readPersistedNetwork()).toBe("mainnet");
  });

  it("returns the stored network when valid", () => {
    localStorageMock.getItem.mockReturnValueOnce("testnet");
    expect(readPersistedNetwork()).toBe("testnet");
  });

  it("returns 'mainnet' for invalid stored values", () => {
    localStorageMock.getItem.mockReturnValueOnce("invalid");
    expect(readPersistedNetwork()).toBe("mainnet");
  });
});

describe("NetworkSelector", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("renders both Mainnet and Testnet options", () => {
    render(
      <NetworkProvider>
        <NetworkSelector />
      </NetworkProvider>,
    );

    expect(screen.getByText(/Mainnet/i)).toBeInTheDocument();
    expect(screen.getByText(/Testnet/i)).toBeInTheDocument();
  });

  it("selects Mainnet by default", () => {
    render(
      <NetworkProvider>
        <NetworkSelector />
      </NetworkProvider>,
    );

    const mainnetRadio = screen.getByRole("radio", { name: /Mainnet/i });
    expect(mainnetRadio).toHaveAttribute("aria-checked", "true");
  });

  it("shows warning modal when switching to Testnet", () => {
    render(
      <NetworkProvider>
        <NetworkSelector />
      </NetworkProvider>,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Testnet/i }));

    expect(
      screen.getByText(/Switch to Stellar Testnet/i),
    ).toBeInTheDocument();
  });

  it("shows warning modal when switching to Mainnet from Testnet", () => {
    render(
      <NetworkProvider>
        <NetworkSelector network="testnet" onChange={vi.fn()} />
      </NetworkProvider>,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Mainnet/i }));

    expect(
      screen.getByText(/Switch to Stellar Mainnet/i),
    ).toBeInTheDocument();
  });

  it("does not switch network when cancel is clicked on warning modal", () => {
    const onChange = vi.fn();
    render(
      <NetworkProvider>
        <NetworkSelector onChange={onChange} />
      </NetworkProvider>,
    );

    // Click Testnet to show warning
    fireEvent.click(screen.getByRole("radio", { name: /Testnet/i }));
    expect(
      screen.getByText(/Switch to Stellar Testnet/i),
    ).toBeInTheDocument();

    // Click Cancel
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    // Warning should be dismissed
    expect(
      screen.queryByText(/Switch to Stellar Testnet/i),
    ).not.toBeInTheDocument();

    // onChange should NOT have been called
    expect(onChange).not.toHaveBeenCalled();
  });

  it("switches network when confirm is clicked on warning modal", () => {
    const onChange = vi.fn();
    render(
      <NetworkProvider>
        <NetworkSelector onChange={onChange} />
      </NetworkProvider>,
    );

    // Click Testnet to show warning
    fireEvent.click(screen.getByRole("radio", { name: /Testnet/i }));
    expect(
      screen.getByText(/Switch to Stellar Testnet/i),
    ).toBeInTheDocument();

    // Click confirm
    fireEvent.click(screen.getByRole("button", { name: /Switch to Testnet/i }));

    // onChange should have been called
    expect(onChange).toHaveBeenCalledWith("testnet");
  });

  it("calls onChange with the selected network", () => {
    const onChange = vi.fn();
    render(
      <NetworkProvider>
        <NetworkSelector onChange={onChange} />
      </NetworkProvider>,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Testnet/i }));
    fireEvent.click(screen.getByRole("button", { name: /Switch to Testnet/i }));

    expect(onChange).toHaveBeenCalledWith("testnet");
  });

  it("persists selection to localStorage", () => {
    render(
      <NetworkProvider>
        <NetworkSelector />
      </NetworkProvider>,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Testnet/i }));
    fireEvent.click(screen.getByRole("button", { name: /Switch to Testnet/i }));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "chronopay:stellar-network",
      "testnet",
    );
  });
});

describe("TestnetRibbon", () => {
  it("renders when network is testnet", () => {
    render(<TestnetRibbon network="testnet" />);

    expect(screen.getByText(/Testnet/i)).toBeInTheDocument();
  });

  it("does not render when network is mainnet", () => {
    render(<TestnetRibbon network="mainnet" />);

    expect(screen.queryByText(/Testnet/i)).not.toBeInTheDocument();
  });
});

describe("TestnetRibbon — StellarNetwork failure handling regression", () => {
  // Regression coverage for the branch at NetworkSelector.tsx:
  //   if (network !== "testnet") return null;
  // The failure/empty-result path must stay deterministic: any network value
  // other than "testnet" produces *no* DOM output at all.

  it("returns an empty result (null branch) for the mainnet failure path", () => {
    const { container } = render(<TestnetRibbon network="mainnet" />);

    // The component's contract is a bare `null` — not an empty shell — so the
    // container must contain no DOM nodes whatsoever.
    expect(container.firstChild).toBeNull();
    expect(container.innerHTML).toBe("");
  });

  it("renders the accessible ribbon for the normal testnet path", () => {
    render(<TestnetRibbon network="testnet" />);

    const ribbon = screen.getByLabelText("Testnet network — play XLM");
    expect(ribbon).toBeInTheDocument();
    expect(screen.getByText("Testnet")).toBeInTheDocument();
    // The decorative icon must stay hidden from the accessibility tree.
    expect(ribbon.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it.each([
    ["undefined value", undefined],
    ["null value", null],
    ["empty string", ""],
    ["unknown network", "staging"],
  ])("renders nothing for boundary input: %s", (_label, boundaryValue) => {
    // StellarNetwork is a closed union at compile time, but runtime inputs
    // (storage reads, query params) can be anything — all non-"testnet"
    // values must hit the same empty-result path without crashing.
    const { container } = render(
      <TestnetRibbon network={boundaryValue as unknown as StellarNetwork} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("flips deterministically between the failure and normal paths across remounts", () => {
    const first = render(<TestnetRibbon network="testnet" />);
    expect(screen.getByLabelText("Testnet network — play XLM")).toBeInTheDocument();
    first.unmount();

    const second = render(<TestnetRibbon network="mainnet" />);
    expect(second.container.firstChild).toBeNull();
    second.unmount();

    render(<TestnetRibbon network="testnet" />);
    expect(screen.getByLabelText("Testnet network — play XLM")).toBeInTheDocument();
  });
});
