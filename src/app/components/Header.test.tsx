import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("./WalletStatusBadge", () => ({
  WalletStatusBadge: () => <div data-testid="wallet-status-badge" />,
}));

vi.mock("./AccountMenu", () => ({
  AccountMenu: () => <div data-testid="account-menu" />,
}));

describe("Header", () => {
  it("renders the main navigation and child components", () => {
    render(<Header />);

    expect(screen.getByText("ChronoPay")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Stellar")).toBeInTheDocument();
    expect(screen.getByTestId("wallet-status-badge")).toBeInTheDocument();
    expect(screen.getByTestId("account-menu")).toBeInTheDocument();
  });

  it("renders the mobile menu closed by default", () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", {
      name: /open navigation menu/i,
    });

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the mobile menu and updates its expanded state", () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", {
      name: /open navigation menu/i,
    });

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close navigation menu/i }))
      .toBeInTheDocument();
  });

  it("closes the mobile menu with the close button", () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", {
      name: /open navigation menu/i,
    });

    fireEvent.click(menuButton);
    fireEvent.click(
      screen.getByRole("button", { name: /close navigation menu/i }),
    );

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the mobile menu when the backdrop is clicked", () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", {
      name: /open navigation menu/i,
    });

    fireEvent.click(menuButton);

    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the mobile menu when Escape is pressed", () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", {
      name: /open navigation menu/i,
    });

    fireEvent.click(menuButton);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the mobile menu when the Home link is clicked", () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", {
      name: /open navigation menu/i,
    });

    fireEvent.click(menuButton);

    const homeLinks = screen.getAllByRole("link", { name: "Home" });
    const mobileHomeLink = homeLinks[homeLinks.length - 1];

    expect(mobileHomeLink).toHaveAttribute("href", "/");

    fireEvent.click(mobileHomeLink);

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the mobile menu when the Stellar link is clicked", () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", {
      name: /open navigation menu/i,
    });

    fireEvent.click(menuButton);

    const stellarLinks = screen.getAllByRole("link", { name: "Stellar" });
    const mobileStellarLink = stellarLinks[stellarLinks.length - 1];

    expect(mobileStellarLink).toHaveAttribute("href", "https://stellar.org");
    expect(mobileStellarLink).toHaveAttribute("target", "_blank");
    expect(mobileStellarLink).toHaveAttribute("rel", "noopener noreferrer");

    fireEvent.click(mobileStellarLink);

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ignores Escape safely when the mobile menu is already closed", () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", {
      name: /open navigation menu/i,
    });

    expect(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    }).not.toThrow();

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});