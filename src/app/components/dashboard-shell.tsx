"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ThemeSwitcher } from "@/app/components/ui/theme-switcher";
import { HeaderSearch } from "@/app/components/header-search";
import { CommandPalette } from "@/app/components/command-palette";
import { OfflineQueueIndicator } from "@/app/components/offline-queue-indicator";

// ─── Bottom-bar icon map (emoji per-route) ────────────────────────────────────
// Icons come from the NavItem definition in role-nav.ts and are displayed with
// aria-hidden="true" alongside the text label.

// ─── Inner shell (consumes RoleContext) ───────────────────────────────────────

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);





    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled])"
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !focusable) return;
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first?.focus();
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
      {/* Screen-reader live region for role changes */}
      <div
        ref={liveRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <header
        className="border-b backdrop-blur-xl"
        style={{
          background: "var(--shell-header-bg)",
          borderColor: "var(--shell-header-border)",
          boxShadow: isScrolled ? "0 4px 20px rgba(0,0,0,0.3)" : undefined,
        }}
      >
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-6 md:py-4"
          aria-label="Dashboard navigation"
        >
          <div>
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-white"
              aria-label="ChronoPay home"
            >
              ChronoPay
            </Link>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Time economy dashboard
            </p>
          </div>

          <div className="hidden items-center gap-3 text-sm text-slate-300 md:flex">
            {routes.map((route) => (
              <Link
                key={r.href}
                href={r.href}
                className="rounded-full px-3 py-2 hover:bg-white/6 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-colors"
                style={{ color: "var(--shell-text-muted)" }}
              >
                <span>{r.label}</span>
              </Link>
            ))}
            <AccountSwitcher />
            <ThemeSwitcher />
            <OfflineQueueIndicator />
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border px-3 py-2 hover:bg-white/6 transition-colors"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--shell-text-muted)",
              }}
            >
              Stellar
            </a>
            <HeaderSearch />
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <HeaderSearch />
            <button
              className="rounded-md p-2 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              aria-label="Open navigation menu"
              onClick={() => setIsOpen(true)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
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

      {isOpen && (
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-40"
        >
          <aside
            className="w-64 h-full p-4 flex flex-col"
            style={{
              background: "var(--shell-drawer-bg)",
              color: "var(--shell-text)",
            }}
          >
            <button
              className="mb-4 rounded-md p-2 self-start focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              aria-label="Close navigation menu"
              onClick={() => setIsOpen(false)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
              {routes.map((route) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-colors"
                  style={{ color: "var(--shell-text)" }}
                  onClick={() => setIsOpen(false)}
                >
                  <span>{r.label}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-6 px-1">
              <Link
                href="/"
                className="w-full justify-center flex items-center rounded-xl bg-cyan-500 py-2.5 text-sm font-medium text-slate-950 hover:bg-cyan-400 focus-ring-white"
              >
                Get Started
              </Link>
            </div>

            {/* Stellar link in drawer */}
            <div className="mt-auto pt-6 border-t border-white/8">
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              >
                <span aria-hidden="true">🌐</span>
                <span>Stellar network</span>
              </a>
            </div>
          </aside>

          <button
            className="flex-1 cursor-default"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation drawer"
            tabIndex={-1}
          />
        </div>
      )}

      {/* ── Mobile bottom bar with overflow ────────────────────────────────── */}
      <BottomNavOverflow items={routes} role={role} />

      {/* Page content — padded so it clears the bottom bar on mobile */}
      <main id="main-content" className="pb-16 md:pb-0">
        {children}
      </main>

      {/* Command palette — triggered by Cmd+K / Ctrl+K */}
      <CommandPalette />
    </div>
  );
}

// ─── Public shell export (wraps with RoleProvider) ────────────────────────────

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <ShellInner>{children}</ShellInner>
    </RoleProvider>
  );
}
