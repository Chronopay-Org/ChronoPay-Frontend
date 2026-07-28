import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, act } from "@testing-library/react";
import { axe } from "jest-axe";
import { WalletConnectModal } from "./WalletConnectModal";

const providers = [
  { id: "freighter", name: "Freighter", icon: <span>F</span> },
  { id: "albedo", name: "Albedo", icon: <span>A</span> },
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
        onEmailSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /Choose how to connect/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Connect Stellar wallet/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Continue with email/i }),
    ).toBeInTheDocument();
  });

  it("shows wallet provider list after selecting wallet method", () => {
    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="idle"
        onConnect={vi.fn()}
        onEmailSubmit={vi.fn()}
      />,
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

  it("shows email form after selecting email method", () => {
    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="idle"
        onConnect={vi.fn()}
        onEmailSubmit={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Continue with email/i }),
    );

    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Send sign-in link/i }),
    ).toBeInTheDocument();
  });

  it("submits email when valid", () => {
    const onEmailSubmit = vi.fn();
    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="idle"
        onConnect={vi.fn()}
        onEmailSubmit={onEmailSubmit}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Continue with email/i }),
    );
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send sign-in link/i }));

    expect(onEmailSubmit).toHaveBeenCalledWith("user@example.com");
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

