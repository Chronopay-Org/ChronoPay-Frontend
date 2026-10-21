import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AccountMenu } from "./AccountMenu";
import { useWallet } from "./useWallet";

vi.mock("./useWallet", () => ({
  useWallet: vi.fn(),
}));

describe("AccountMenu", () => {
  const mockDisconnect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useWallet).mockReturnValue({
      status: "connected",
      address: "0x1234567890abcdef1234567890abcdef12345678",
      error: undefined,
      connect: vi.fn(),
      disconnect: mockDisconnect,
    });
    
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it("returns null when status is not connected", () => {
    vi.mocked(useWallet).mockReturnValue({
      status: "disconnected",
      address: undefined,
      error: undefined,
      connect: vi.fn(),
      disconnect: vi.fn(),
    });
    const { container } = render(<AccountMenu />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when status is loading", () => {
    vi.mocked(useWallet).mockReturnValue({
      status: "loading",
      address: undefined,
      error: undefined,
      connect: vi.fn(),
      disconnect: vi.fn(),
    });
    const { container } = render(<AccountMenu />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the account button when connected", () => {
    render(<AccountMenu />);
    const button = screen.getByRole("button", { name: /Account/ });
    expect(button).toBeInTheDocument();
    expect(screen.getByText("0x1234…5678")).toBeInTheDocument();
  });

  it("renders 'Account' if address is missing but status is connected", () => {
    vi.mocked(useWallet).mockReturnValue({
      status: "connected",
      address: undefined,
      error: undefined,
      connect: vi.fn(),
      disconnect: mockDisconnect,
    });
    render(<AccountMenu />);
    const button = screen.getByRole("button", { name: /Account/ });
    expect(button).toBeInTheDocument();
    const accountTexts = screen.getAllByText("Account");
    expect(accountTexts).toHaveLength(2);
  });

  it("opens and closes the menu on click", async () => {
    const user = userEvent.setup();
    render(<AccountMenu />);
    
    const button = screen.getByRole("button", { name: /Account/ });
    
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    
    await user.click(button);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Copy address/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Disconnect/i })).toBeInTheDocument();
    
    await user.click(button);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the menu when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <AccountMenu />
      </div>
    );
    
    const button = screen.getByRole("button", { name: /Account/ });
    await user.click(button);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    
    await user.click(screen.getByTestId("outside"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the menu when pressing Escape", async () => {
    const user = userEvent.setup();
    render(<AccountMenu />);
    
    const button = screen.getByRole("button", { name: /Account/ });
    await user.click(button);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it("calls disconnect when disconnect button is clicked", async () => {
    const user = userEvent.setup();
    render(<AccountMenu />);
    
    await user.click(screen.getByRole("button", { name: /Account/ }));
    await user.click(screen.getByRole("menuitem", { name: /Disconnect/i }));
    
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("copies address to clipboard when copy button is clicked", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<AccountMenu />);
    
    await user.click(screen.getByRole("button", { name: /Account/ }));
    
    const copyButton = screen.getByRole("menuitem", { name: /Copy address/i });
    expect(screen.getByText("Clipboard")).toBeInTheDocument();
    
    await user.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("0x1234567890abcdef1234567890abcdef12345678");
    expect(screen.getByText("Copied")).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    
    expect(screen.getByText("Clipboard")).toBeInTheDocument();
    expect(screen.queryByText("Copied")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("handles copy address failure", async () => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.reject(new Error("Failed"))),
      },
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<AccountMenu />);
    
    await user.click(screen.getByRole("button", { name: /Account/ }));
    const copyButton = screen.getByRole("menuitem", { name: /Copy address/i });
    
    await user.click(copyButton);
    expect(screen.getByText("Copy failed")).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    
    expect(screen.getByText("Clipboard")).toBeInTheDocument();
    expect(screen.queryByText("Copy failed")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("shows error when copying missing address", async () => {
    vi.useFakeTimers();
    vi.mocked(useWallet).mockReturnValue({
      status: "connected",
      address: undefined,
      error: undefined,
      connect: vi.fn(),
      disconnect: mockDisconnect,
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<AccountMenu />);
    
    await user.click(screen.getByRole("button", { name: /Account/ }));
    const copyButton = screen.getByRole("menuitem", { name: /Copy address/i });
    
    await user.click(copyButton);
    expect(screen.getByText("No address available")).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    
    expect(screen.getByText("Clipboard")).toBeInTheDocument();
    expect(screen.queryByText("No address available")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
