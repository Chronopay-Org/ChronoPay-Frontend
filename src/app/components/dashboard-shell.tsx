"use client";

// src/app/components/dashboard-shell.tsx

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { HeaderSearch } from "@/app/components/header-search";
import { ThemeSwitcher } from "@/app/components/ui/theme-switcher";
import { ButtonLink } from "@/app/components/ui/button-link";
import { useRole } from "@/app/components/navigation/RoleContext";
import { getNavForRole, ROLE_META } from "@/app/components/navigation/role-nav";

// ─── Inner shell (consumes RoleContext) ───────────────────────────────────────

function ShellInner({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLSpanElement>(null);

  // Respect prefers-reduced-motion via CSS media query check
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;
  void prefersReducedMotion; // available for future animation use

  const routes = getNavForRole(role);
  const meta = ROLE_META[role];

  // ── Announce role change to screen readers ──────────────────────────────
  useEffect(() => {
    const handleRoleChange = (e: Event) => {
      const { role: newRole } = (e as CustomEvent<{ role: string }>).detail;
      const newMeta = ROLE_META[newRole as keyof typeof ROLE_META];
      if (liveRef.current && newMeta) {
        liveRef.current.textContent = `Role switched to ${newMeta.label}. Navigation updated.`;
        setTimeout(() => {
          if (liveRef.current) liveRef.current.textContent = "";
        }, 3000);
      }
    };
    window.addEventListener("chronopay:rolechange", handleRoleChange);
    return () => window.removeEventListener("chronopay:rolechange", handleRoleChange);
  }, []);

  // ── Close drawer on Escape ──────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

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

  // ── Scroll detection for header shadow ────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="app-shell min-h-screen"
      style={{ color: "var(--shell-text)" }}
    >
      {/* Hidden live region for role-change announcements */}
      <span
        ref={liveRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <header
        className={[
          "sticky top-0 z-30 border-b backdrop-blur-xl transition-shadow",
          isScrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.4)]" : "",
        ].join(" ")}
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

          {/* Desktop: role-aware links + search + theme switcher */}
          <div className="hidden md:flex items-center gap-3 text-sm">
            {routes.map((r) => {
              const isActive = pathname === r.href;
              return (
                <Link
                  key={r.href}
                  href={r.href}
                  aria-label={r.ariaLabel ?? r.label}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "flex items-center gap-1.5 rounded-full px-3 py-2 focus-ring-white transition-colors",
                    isActive
                      ? "bg-white/10 font-medium"
                      : "hover:bg-white/6",
                  ].join(" ")}
                  style={{ color: isActive ? "var(--shell-text)" : "var(--shell-text-muted)" }}
                >
                  <span aria-hidden="true">{r.icon}</span>
                  <span>{r.label}</span>
                </Link>
              );
            })}
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
            <HeaderSearch />
          </div>

          {/* Mobile: search + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            <HeaderSearch />
            <button
              type="button"
              className="rounded-md p-2 focus-ring-white"
              aria-label="Open navigation menu"
              aria-expanded={isOpen}
              aria-controls="mobile-nav-drawer"
              onClick={() => setIsOpen(true)}
            >
              <svg
                className="h-6 w-6"
                style={{ color: "var(--shell-text)" }}
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

      {/* ── Mobile drawer ──────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          ref={drawerRef}
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-sm"
        >
          <aside
            className="flex h-full w-64 flex-col p-4"
            style={{
              background: "var(--shell-drawer-bg)",
              color: "var(--shell-text)",
            }}
          >
            <button
              type="button"
              className="mb-4 self-start rounded-md p-2 focus-ring-white"
              aria-label="Close navigation menu"
              onClick={() => setIsOpen(false)}
            >
              <svg
                className="h-6 w-6"
                style={{ color: "var(--shell-text)" }}
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

            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {routes.map((r) => {
                const isActive = pathname === r.href;
                return (
                  <Link
                    key={r.href}
                    href={r.href}
                    aria-label={r.ariaLabel ?? r.label}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "flex items-center gap-2 rounded-md px-3 py-2 focus-ring-white transition-colors",
                      isActive
                        ? "bg-white/10 font-medium"
                        : "hover:bg-white/10",
                    ].join(" ")}
                    style={{ color: "var(--shell-text)" }}
                    onClick={() => setIsOpen(false)}
                  >
                    <span aria-hidden="true" className="text-base">{r.icon}</span>
                    <span>{r.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Primary CTA */}
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

            {/* Stellar link */}
            <div className="mt-auto border-t border-white/8 pt-6">
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white focus-ring-white"
              >
                <span aria-hidden="true">🌐</span>
                <span>Stellar network</span>
              </a>
            </div>
          </aside>

          {/* Scrim — click to close */}
          <button
            type="button"
            className="flex-1 cursor-default"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation drawer"
            tabIndex={-1}
          />
        </div>
      )}

      {/* Mobile Bottom Bar */}
      <nav
        aria-label="Bottom navigation"
        className="fixed bottom-0 left-0 right-0 z-30 flex justify-around items-center py-2 md:hidden"
        style={{ background: "var(--shell-bottom-bar-bg)", color: "var(--shell-text)" }}
      >
        {routes.map((r) => {
          const isActive = pathname === r.href;
          return (
            <Link
              key={r.href}
              href={r.href}
              aria-label={r.ariaLabel ?? r.label}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-xs focus-ring-white transition-colors",
                isActive ? "text-cyan-300" : "text-slate-400 hover:text-white",
              ].join(" ")}
            >
              <span aria-hidden="true" className="text-lg">{r.icon}</span>
              <span>{r.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Page content — padded to clear the bottom bar on mobile */}
      <main id="main-content" className="pb-16 md:pb-0">
        <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

// ─── Public export wraps inner shell with RoleProvider ───────────────────────

import { RoleProvider } from "@/app/components/navigation/RoleContext";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <ShellInner>{children}</ShellInner>
    </RoleProvider>
  );
}
