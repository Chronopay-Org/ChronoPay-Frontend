import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletStatusBadge } from "./WalletStatusBadge";

const walletMock = vi.hoisted(() => ({
  state: {
    status: "disconnected" as "connected" | "disconnected" | "loading" | "error",
    address: undefined as string | undefined,
  },
  connect: vi.fn(),
}));

vi.mock("./useWallet", () => ({
  useWallet: () => ({
    ...walletMock.state,
    connect: walletMock.connect,
  }),
}));

describe("WalletStatusBadge", () => {
  beforeEach(() => {
    walletMock.state = { status: "disconnected", address: undefined };
    walletMock.connect.mockReset();
  });

  it("shows a loading status while the wallet is connecting", () => {
    walletMock.state.status = "loading";

    render(<WalletStatusBadge />);

    expect(screen.getByRole("status")).toHaveTextContent("Connecting wallet");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers wallet connection from the disconnected state", async () => {
    const user = userEvent.setup();

    render(<WalletStatusBadge />);

    expect(screen.getByText("Disconnected")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Connect wallet" }));

    expect(walletMock.connect).toHaveBeenCalledTimes(1);
  });

  it("offers retry when the wallet is in an error state", async () => {
    const user = userEvent.setup();
    walletMock.state.status = "error";

    render(<WalletStatusBadge />);

    expect(screen.getByText("Wallet error")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry wallet connection" }));

    expect(walletMock.connect).toHaveBeenCalledTimes(1);
  });

  it("formats a connected wallet address using its visible boundary characters", () => {
    walletMock.state = {
      status: "connected",
      address: "0x1234567890abcdef",
    };

    render(<WalletStatusBadge />);

    expect(screen.getByText("0x1234…cdef")).toBeInTheDocument();
    expect(screen.getByTitle("Connected wallet 0x1234567890abcdef")).toBeInTheDocument();
  });

  it("uses a stable connected label when the connected address is absent", () => {
    walletMock.state = { status: "connected", address: undefined };

    render(<WalletStatusBadge />);

    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByTitle("Connected wallet")).toBeInTheDocument();
  });

  it("transitions from loading to the connected representation", () => {
    walletMock.state.status = "loading";
    const { rerender } = render(<WalletStatusBadge />);

    expect(screen.getByRole("status")).toBeInTheDocument();

    walletMock.state = {
      status: "connected",
      address: "0x1234567890abcdef",
    };
    rerender(<WalletStatusBadge />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("0x1234…cdef")).toBeInTheDocument();
  });
});
