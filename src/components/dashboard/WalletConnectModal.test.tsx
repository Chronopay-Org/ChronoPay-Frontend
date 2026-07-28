import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { WalletConnectModal } from "./WalletConnectModal";

const providers = [
  { id: "freighter", name: "Freighter", icon: <span>F</span> },
  { id: "albedo", name: "Albedo", icon: <span>A</span> },
];

describe("WalletConnectModal", () => {
  it("renders wallet provider list on initial idle state", () => {
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
      screen.getByRole("button", { name: /Connect to Freighter/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Connect to Albedo/i }),
    ).toBeInTheDocument();
  });

  it("shows signing skeleton when status is pending", () => {
    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="pending"
        onConnect={vi.fn()}
        onEmailSubmit={vi.fn()}
      />,
    );

    // The text appears in both the visible <p> and an sr-only <span>
    const messages = screen.getAllByText(/Waiting for signature/i);
    expect(messages.length).toBeGreaterThanOrEqual(1);
  });

  it("shows success status when connected", () => {
    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="success"
        onConnect={vi.fn()}
        onEmailSubmit={vi.fn()}
      />,
    );

    // "Connected" appears in both the LiveRegion (sr-only) and the StatusChip
    expect(screen.getByText(/Your wallet is ready/i)).toBeInTheDocument();
    const connectedElements = screen.getAllByText(/Connected/i);
    expect(connectedElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows error status with retry button", () => {
    const onRetry = vi.fn();
    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="error"
        errorMessage="Connection rejected"
        onConnect={vi.fn()}
        onRetry={onRetry}
        onEmailSubmit={vi.fn()}
      />,
    );

    // "Connection issue" appears in StatusChip (visible) and LiveRegion (sr-only)
    const statusElements = screen.getAllByText(/Connection issue/i);
    expect(statusElements.length).toBeGreaterThanOrEqual(1);
    // "Connection rejected" appears in visible <p> and within LiveRegion sr-only text
    const errorElements = screen.getAllByText(/Connection rejected/i);
    expect(errorElements.length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("button", { name: /Retry connection/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Retry connection/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("calls onConnect when a wallet connect button is clicked", () => {
    const onConnect = vi.fn();
    render(
      <WalletConnectModal
        isOpen
        onClose={vi.fn()}
        providers={providers}
        status="idle"
        onConnect={onConnect}
        onEmailSubmit={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Connect to Freighter/i }),
    );

    expect(onConnect).toHaveBeenCalledWith("freighter");
  });

  it("does not render when closed", () => {
    render(
      <WalletConnectModal
        isOpen={false}
        onClose={vi.fn()}
        providers={providers}
        status="idle"
        onConnect={vi.fn()}
        onEmailSubmit={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("heading", { name: /Choose how to connect/i }),
    ).not.toBeInTheDocument();
  });
});
