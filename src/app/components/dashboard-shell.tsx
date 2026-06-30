"use client";

// src/app/components/dashboard-shell.tsx
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { HeaderSearch } from "@/app/components/header-search";

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
    <div className="app-shell min-h-screen text-slate-50">
      <header className="border-b border-white/8 bg-slate-950/40 backdrop-blur-xl">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-6 md:py-4"
          aria-label="Dashboard navigation"
        >
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-white"
              aria-label="ChronoPay home"
            >
              ChronoPay
            </Link>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Time economy dashboard
            </p>
          </div>

          {/* Desktop: inline links + search */}
          <div className="hidden md:flex items-center gap-3 text-sm text-slate-300">
            {routes.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="rounded-full px-3 py-2 hover:bg-white/6 hover:text-white focus-ring-white"
              >
                {r.label}
              </Link>
            ))}
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/10 px-3 py-2 hover:border-cyan-200/30 hover:bg-white/6 hover:text-white focus-ring-white"
            >
              Stellar
            </a>
            {/* Header search affordance */}
            <HeaderSearch />
          </div>

          {/* Mobile: search + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            <HeaderSearch />
            <button
              className="rounded-md p-2 focus-ring-white"
              aria-label="Open navigation menu"
              onClick={() => setIsOpen(true)}
            >
              <svg
                className="h-6 w-6 text-white"
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-40"
        >
          <aside className="w-64 bg-slate-900 text-slate-100 h-full p-4">
            <button
              className="mb-4 rounded-md p-2 focus-ring-white"
              aria-label="Close navigation menu"
              onClick={() => setIsOpen(false)}
            >
              <svg
                className="h-6 w-6"
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
                  className="block rounded-md px-3 py-2 hover:bg-slate-800 focus-ring-white"
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

      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-100 md:hidden flex justify-around items-center py-2 z-30">
        {routes.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="flex flex-col items-center text-xs hover:text-white focus-ring-white"
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

      {children}
    </div>
  );
}
