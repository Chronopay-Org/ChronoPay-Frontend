'use client';
// src/app/components/dashboard-shell.tsx
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ThemeSwitcher } from "./ui/theme-switcher";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled])"
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !focusable) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleTab);
    first?.focus();
    return () => document.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  const routes = [
    { href: "/", label: "Home" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/calendar", label: "Calendar" },
    { href: "/history", label: "History" },
  ];

  return (
    <div
      className="app-shell min-h-screen"
      style={{ color: "var(--shell-text)" }}
    >
      <header
        className="border-b backdrop-blur-xl"
        style={{
          background: "var(--shell-header-bg)",
          borderColor: "var(--shell-header-border)",
        }}
      >
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6"
          aria-label="Dashboard navigation"
        >
          <div>
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight"
              style={{ color: "var(--shell-text)" }}
              aria-label="ChronoPay home"
            >
              ChronoPay
            </Link>
            <p
              className="text-xs uppercase tracking-[0.2em]"
              style={{ color: "var(--shell-text-muted)" }}
            >
              Time economy dashboard
            </p>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3 text-sm">
            {routes.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="rounded-full px-3 py-2 hover:bg-white/6 focus-ring-white transition-colors"
                style={{ color: "var(--shell-text-muted)" }}
              >
                {r.label}
              </Link>
            ))}
            <ThemeSwitcher />
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border px-3 py-2 hover:bg-white/6 focus-ring-white transition-colors"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--shell-text-muted)",
              }}
            >
              Stellar
            </a>
          </div>

          {/* Mobile: theme switcher + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeSwitcher />
            <button
              className="rounded-md p-2 focus-ring-white"
              aria-label="Open navigation menu"
              onClick={() => setIsOpen(true)}
            >
              <svg
                className="h-6 w-6"
                style={{ color: "var(--shell-text)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer */}
      {isOpen && (
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-50"
        >
          <aside
            className="w-64 h-full p-4"
            style={{
              background: "var(--shell-drawer-bg)",
              color: "var(--shell-text)",
            }}
          >
            <button
              className="mb-4 rounded-md p-2 focus-ring-white"
              aria-label="Close navigation menu"
              onClick={() => setIsOpen(false)}
            >
              <svg
                className="h-6 w-6"
                style={{ color: "var(--shell-text)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <nav aria-label="Mobile navigation" className="flex flex-col gap-2">
              {routes.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="block rounded-md px-3 py-2 hover:bg-white/10 focus-ring-white transition-colors"
                  style={{ color: "var(--shell-text)" }}
                  onClick={() => setIsOpen(false)}
                >
                  {r.label}
                </Link>
              ))}
            </nav>
          </aside>
          {/* Click outside to close */}
          <button
            className="flex-1"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation drawer"
          />
        </div>
      )}

      {/* Main content */}
      <main id="main-content" className="mx-auto max-w-6xl px-5 py-8 sm:px-6 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 md:hidden flex justify-around items-center py-2 border-t z-40"
        style={{
          background: "var(--shell-bottom-bar-bg)",
          color: "var(--shell-text)",
          borderColor: "var(--border-subtle)",
        }}
        aria-label="Mobile bottom navigation"
      >
        {routes.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="flex flex-col items-center text-xs hover:opacity-80 focus-ring-white"
            style={{ color: "var(--shell-text-muted)" }}
            onClick={() => setIsOpen(false)}
          >
            <span aria-hidden="true" className="text-lg">
              {r.label === "Home" && "🏠"}
              {r.label === "Marketplace" && "🛒"}
              {r.label === "Calendar" && "📅"}
              {r.label === "History" && "🕘"}
            </span>
            <span>{r.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
