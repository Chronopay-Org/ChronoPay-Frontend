import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, act } from "@testing-library/react";
import { axe } from "jest-axe";
import { WalletConnectModal } from "./WalletConnectModal";
import React from "react";

const providers = [
  { id: "freighter", name: "Freighter", icon: <span>F</span>, capabilities: ["sign"] },
  { id: "albedo", name: "Albedo", icon: <span>A</span>, capabilities: ["sign", "auth"] },
];

describe("WalletConnectModal", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Default matchMedia mock (no preference)
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)" ? false : true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    });
  });

  it("renders wallet and email options on initial state", () => {
    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="idle"
        onConnect={vi.fn()}
      />
    );
    expect(screen.getByRole("heading", { name: /Choose how to connect/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Connect to Freighter/i })).toBeInTheDocument();
  });

  it("renders error state with retry and different wallet options", () => {
    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="error"
        errorMessage="Signature rejected"
        onConnect={vi.fn()}
        onRetry={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Connect Stellar wallet/i }),
    );

    expect(
      screen.getByRole("button", { name: /Connect to Freighter/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Connect to Albedo/i }),
    ).toBeInTheDocument();
  });

  it("shows alternative wallet picker when 'Different wallet' is clicked", () => {
    const onConnect = vi.fn();
    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="error"
        onConnect={onConnect}
      />
    );
    
    fireEvent.click(screen.getByRole("button", { name: /Different wallet/i }));
    
    // The alternative wallet picker should now be visible
    expect(screen.getByText("Select alternative")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Back to retry/i })).toBeInTheDocument();
    
    // The provider list is visible as buttons containing the provider name
    const freighterBtn = screen.getByText("Freighter").closest("button")!;
    expect(freighterBtn).toBeInTheDocument();
    
    // Clicking alternative connects to that provider
    fireEvent.click(freighterBtn);
    expect(onConnect).toHaveBeenCalledWith("freighter");
  });

  /* ── Reduced Motion & Success State Tests ────────────────────────────── */

  it("renders standard motion success mark when prefers-reduced-motion is false", () => {
    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="success"
        onConnect={vi.fn()}
      />,
    );

    expect(screen.getByTestId("standard-motion-success-mark")).toBeInTheDocument();
    expect(screen.queryByTestId("reduced-motion-success-mark")).not.toBeInTheDocument();
    expect(screen.getByText("Wallet Connected Successfully")).toBeInTheDocument();
  });

  it("renders static reduced-motion success mark when prefers-reduced-motion: reduce is active", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    });

    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="success"
        onConnect={vi.fn()}
      />,
    );

    expect(screen.getByTestId("reduced-motion-success-mark")).toBeInTheDocument();
    expect(screen.queryByTestId("standard-motion-success-mark")).not.toBeInTheDocument();
    expect(screen.getByText("Wallet Connected Successfully")).toBeInTheDocument();
  });

  it("announces success message via LiveRegion on success status", () => {
    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="success"
        onConnect={vi.fn()}
      />,
    );

    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveTextContent("Wallet connected successfully.");
  });

  it("updates state dynamically when prefers-reduced-motion changes mid-flow", () => {
    let listener: ((e: MediaQueryListEvent) => void) | null = null;

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        addEventListener: vi.fn((event, fn) => {
          if (event === "change") listener = fn;
        }),
        removeEventListener: vi.fn(),
      })),
    });

    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="success"
        onConnect={vi.fn()}
      />,
    );

    expect(screen.getByTestId("standard-motion-success-mark")).toBeInTheDocument();

    act(() => {
      if (listener) {
        listener({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(screen.getByTestId("reduced-motion-success-mark")).toBeInTheDocument();
  });

  it("passes accessibility check (axe) in success state", async () => {
    const { container } = render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="success"
        onConnect={vi.fn()}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /* ── Reduced Motion & Success State Tests ────────────────────────────── */

  it("renders standard motion success mark when prefers-reduced-motion is false", () => {
    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="success"
        onConnect={vi.fn()}
      />,
    );

    expect(screen.getByTestId("standard-motion-success-mark")).toBeInTheDocument();
    expect(screen.queryByTestId("reduced-motion-success-mark")).not.toBeInTheDocument();
    expect(screen.getByText("Wallet Connected Successfully")).toBeInTheDocument();
  });

  it("renders static reduced-motion success mark when prefers-reduced-motion: reduce is active", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    });

    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="success"
        onConnect={vi.fn()}
      />,
    );

    expect(screen.getByTestId("reduced-motion-success-mark")).toBeInTheDocument();
    expect(screen.queryByTestId("standard-motion-success-mark")).not.toBeInTheDocument();
    expect(screen.getByText("Wallet Connected Successfully")).toBeInTheDocument();
  });

  it("announces success message via LiveRegion on success status", () => {
    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="success"
        onConnect={vi.fn()}
      />,
    );

    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveTextContent("Wallet connected successfully.");
  });

  it("updates state dynamically when prefers-reduced-motion changes mid-flow", () => {
    let listener: ((e: MediaQueryListEvent) => void) | null = null;

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        addEventListener: vi.fn((event, fn) => {
          if (event === "change") listener = fn;
        }),
        removeEventListener: vi.fn(),
      })),
    });

    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="success"
        onConnect={vi.fn()}
      />,
    );

    expect(screen.getByTestId("standard-motion-success-mark")).toBeInTheDocument();

    act(() => {
      if (listener) {
        listener({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(screen.getByTestId("reduced-motion-success-mark")).toBeInTheDocument();
  });

  it("passes accessibility check (axe) in success state", async () => {
    const { container } = render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="success"
        onConnect={vi.fn()}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

