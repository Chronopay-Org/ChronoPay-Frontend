import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Header } from "./Header";
import { I18nProvider } from "@/lib/i18n";
import { ToastProvider } from "@/hooks/use-toast";
import { NotificationsProvider } from "@/components/dashboard/notifications/notifications-provider";

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

  it("moves focus into the drawer on open and wraps Tab and Shift+Tab inside the drawer", () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", {
      name: /open navigation menu/i,
    });

    fireEvent.click(menuButton);

    const dialog = screen.getByRole("dialog");
    const closeButton = screen.getByRole("button", {
      name: /close navigation menu/i,
    });

    expect(document.activeElement).toBe(closeButton);

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
      ),
    );
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    expect(firstFocusable).toBe(closeButton);
    expect(lastFocusable).not.toBe(firstFocusable);

    // Shift+Tab from the first focusable element wraps to the last
    fireEvent.keyDown(firstFocusable, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(lastFocusable);

    // Tab from the last focusable element wraps back to the first
    fireEvent.keyDown(lastFocusable, { key: "Tab" });
    expect(document.activeElement).toBe(firstFocusable);
  });

  it("returns focus to the menu button when closed via Close button, Escape, or backdrop", () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", {
      name: /open navigation menu/i,
    });

    // Close via Close button
    fireEvent.click(menuButton);
    fireEvent.click(
      screen.getByRole("button", { name: /close navigation menu/i }),
    );
    expect(document.activeElement).toBe(menuButton);

    // Close via Escape
    fireEvent.click(menuButton);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(menuButton);

    // Close via backdrop click
    fireEvent.click(menuButton);
    fireEvent.click(screen.getByRole("dialog"));
    expect(document.activeElement).toBe(menuButton);
  });

  it("marks background content aria-hidden and inert while the drawer is open and restores it on close", () => {
    const { container } = render(
      <>
        <Header />
        <main>Page content</main>
      </>,
    );

    const header = container.querySelector("header")!;
    const main = container.querySelector("main")!;
    const menuButton = screen.getByRole("button", {
      name: /open navigation menu/i,
    });

    expect(header).not.toHaveAttribute("aria-hidden");
    expect(header.inert).toBe(false);
    expect(main).not.toHaveAttribute("aria-hidden");
    expect(main.inert).toBe(false);

    fireEvent.click(menuButton);

    expect(header).toHaveAttribute("aria-hidden", "true");
    expect(header.inert).toBe(true);
    expect(main).toHaveAttribute("aria-hidden", "true");
    expect(main.inert).toBe(true);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(header).not.toHaveAttribute("aria-hidden");
    expect(header.inert).toBe(false);
    expect(main).not.toHaveAttribute("aria-hidden");
    expect(main.inert).toBe(false);
  });
});
describe("Header notification bell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  function renderWithProviders() {
    return render(
      <ToastProvider>
        <NotificationsProvider>
          <Header />
        </NotificationsProvider>
      </ToastProvider>,
    );
  }

  it("shows the unread badge in the desktop header", () => {
    renderWithProviders();

    const bell = screen.getByRole("link", {
      name: /Notifications, 3 unread/i,
    });
    expect(bell).toHaveAttribute("href", "/dashboard/notifications");
    expect(screen.getByText("3")).toHaveAttribute("aria-live", "polite");
  });

  it("shows the bell in the mobile menu too", () => {
    renderWithProviders();

    fireEvent.click(
      screen.getByRole("button", { name: /open navigation menu/i }),
    );

    const bells = screen.getAllByRole("link", {
      name: /Notifications, 3 unread/i,
      hidden: true,
    });
    expect(bells).toHaveLength(2);
    for (const bell of bells) {
      expect(bell).toHaveAttribute("href", "/dashboard/notifications");
    }
  });
});

describe("Header locale picker", () => {
  it("renders LocalePicker in desktop header and mobile drawer, and switches to Arabic RTL", () => {
    render(
      <I18nProvider locale="en">
        <Header />
      </I18nProvider>,
    );

    const desktopPicker = screen.getByRole("combobox", {
      name: /language selector/i,
    });
    expect(desktopPicker).toHaveValue("en");

    fireEvent.change(desktopPicker, { target: { value: "ar" } });

    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.cookie).toContain("locale=ar");
    expect(screen.getByText("الرئيسية")).toBeInTheDocument();
    expect(screen.getByText("لوحة التحكم")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "فتح قائمة التنقل" }),
    );
    const pickers = screen.getAllByRole("combobox", { name: "محدد اللغة" });
    expect(pickers).toHaveLength(2);
    expect(pickers[1]).toHaveValue("ar");
  });
});
