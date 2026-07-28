import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { WalletConnectModal } from "./WalletConnectModal";
import React from "react";

const providers = [
  { id: "freighter", name: "Freighter", icon: <span>F</span>, capabilities: ["sign"] },
  { id: "albedo", name: "Albedo", icon: <span>A</span>, capabilities: ["sign", "auth"] },
];

describe("WalletConnectModal", () => {
  it("renders idle state with wallet list", () => {
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
    expect(screen.getByText("Signature rejected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Different wallet/i })).toBeInTheDocument();
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
});
