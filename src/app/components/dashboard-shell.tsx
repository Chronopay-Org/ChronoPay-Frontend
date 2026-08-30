"use client";

// src/app/components/dashboard-shell.tsx
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ThemeSwitcher } from "@/app/components/ui/theme-switcher";
import { HeaderSearch } from "@/app/components/header-search";
import { ButtonLink } from "@/app/components/ui/button-link";
import { useRole } from "@/app/components/navigation/RoleContext";
import { getNavForRole, ROLE_META } from "@/app/components/navigation/role-nav";
import { ShortcutOverlay } from "@/app/components/ui/shortcut-overlay";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  const routes = getNavForRole(role);
  const meta = ROLE_META[role];

  // ── Announce role change to screen readers ──────────────────────────────
  useEffect(() => {
    const handleRoleChange = (e: Event) => {
      const { role: newRole } = (e as CustomEvent<{ role: string }>).detail;
      const newMeta = ROLE_META[newRole as keyof typeof ROLE_META];
      if (liveRef.current && newMeta) {
        liveRef.current.textContent = `Role switched to ${newMeta.label}. Navigation updated.`;
        // Clear after announcement so repeat switches are re-announced
        setTimeout(() => {
          if (liveRef.current) liveRef.current.textContent = "";
        }, 3000);
      }
    };
    window.addEventListener("chronopay:rolechange", handleRoleChange);
    return () => window.removeEventListener("chronopay:rolechange", handleRoleChange);
  }, []);

  // ── Bind ? (Shift+/) globally to open/close the shortcuts overlay ──────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Never hijack ? while the user is typing in a field
      const target = e.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (isEditable) return;

      const isQuestionMark = e.key === "?" || (e.shiftKey && e.key === "/");
      if (!isQuestionMark) return;

      e.preventDefault();
      setIsShortcutsOpen((prev) => !prev);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // ── Close drawer / shortcuts overlay on Escape ──────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (isShortcutsOpen) {
        setIsShortcutsOpen(false);
      } else if (isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, isShortcutsOpen]);

  // ── Focus trap for mobile drawer ────────────────────────────────────────
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
          className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-6 md:py-4"
          aria-label="Dashboard navigation"
        >
          {/* Brand */}
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

          {/* Desktop: inline links + search */}
          <div className="hidden items-center gap-3 text-sm text-slate-300 md:flex">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="rounded-full px-3 py-2 transition-colors hover:bg-white/6 focus-ring-white"
                style={{ color: "var(--shell-text-muted)" }}
                aria-label={route.ariaLabel}
              >
                <span aria-hidden="true" className="mr-1.5">
                  {route.icon}
                </span>
                <span>{route.label}</span>
              </Link>
            ))}
            <ThemeSwitcher />
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border px-3 py-2 transition-colors hover:bg-white/6 focus-ring-white"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--shell-text-muted)",
              }}
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

      {/* ── Mobile drawer ──────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-sm"
        >
          <aside
            className="h-full w-64 p-4"
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
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="block rounded-md px-3 py-2 transition-colors hover:bg-white/10 focus-ring-white"
                  style={{ color: "var(--shell-text)" }}
                  onClick={() => setIsOpen(false)}
                  aria-label={route.ariaLabel}
                >
                  <span aria-hidden="true" className="mr-1.5">
                    {route.icon}
                  </span>
                  <span>{route.label}</span>
                </Link>
              ))}
            </nav>

            {/* Primary CTA in drawer */}
            <div className="mt-6 px-1">
              <ButtonLink
                href={meta.primaryCta.href}
                variant="primary"
                size="md"
                className="w-full justify-center"
              >
                {meta.primaryCta.label}
              </ButtonLink>
            </div>

            {/* Stellar link in drawer */}
            <div className="mt-auto border-t border-white/8 pt-6">
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-ring-white"
              >
                <span aria-hidden="true">🌐</span>
                <span>Stellar network</span>
              </a>
            </div>
          </aside>

          {/* Scrim — click to close */}
          <button
            className="flex-1 cursor-default"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation drawer"
            tabIndex={-1}
          />
        </div>
      )}

      {/* Mobile Bottom Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around bg-slate-900 py-2 text-slate-100 md:hidden"
        aria-label="Mobile bottom navigation"
      >
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="flex flex-col items-center text-xs transition-colors hover:text-white focus-ring-white"
            onClick={() => setIsOpen(false)}
            aria-label={route.ariaLabel}
          >
            <span aria-hidden="true" className="text-lg">
              {route.icon}
            </span>
            <span>{route.label}</span>
          </Link>
        ))}
      </nav>

      {children}

      {/* Screen-reader live region for role-change announcements */}
      <div
        ref={liveRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Keyboard shortcuts reference overlay — toggled with ? (Shift+/) */}
      <ShortcutOverlay
        open={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
