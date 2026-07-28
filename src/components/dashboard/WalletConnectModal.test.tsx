import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { WalletConnectModal } from "./WalletConnectModal";

const providers = [
  { id: "freighter", name: "Freighter", icon: <span>F</span> },
  { id: "albedo", name: "Albedo", icon: <span>A</span> },
];

describe("WalletConnectModal", () => {
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
      screen.getByRole("button", { name: /Freighter/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Albedo/i })).toBeInTheDocument();
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
});
