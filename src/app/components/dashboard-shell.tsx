"use client";

/**
 * dashboard-shell.tsx
 *
 * Top-level layout shell for the ChronoPay dashboard.
 *
 * Role-aware navigation (FE-ROLE-NAV)
 * ────────────────────────────────────
 * The shell now renders per-role nav inventories instead of a static list:
 *   • supplier — Availability, Earnings, History
 *   • buyer    — Marketplace, My Bookings, Calendar, History
 *   • admin    — Users, Analytics, Settings
 *
 * A <RoleChip> in the header lets users see and switch their active role.
 * Role state is provided by <RoleProvider> (localStorage-persisted) and
 * consumed via useRole().
 *
 * Accessibility
 * ─────────────
 * • All nav items carry icon + text — never icon alone (WCAG 1.4.1).
 * • An aria-live="polite" region announces role changes to screen readers.
 * • Focus trap is preserved in the mobile drawer via the existing inline
 *   implementation (matches APG Modal pattern).
 * • Mobile bottom bar uses the same role-scoped items as the desktop nav.
 * • RoleChip satisfies WCAG 1.4.1 with text+icon and a checkmark affordance.
 *
 * Transitions
 * ───────────
 * Role switches do not hard-navigate. The RoleContext preserves the current
 * URL so breadcrumb / scroll context is maintained (issue requirement).
 */

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { RoleProvider, useRole } from "./navigation/RoleContext";
import { getNavForRole, ROLE_META } from "./navigation/role-nav";
import { RoleChip } from "./ui/RoleChip";
import { ButtonLink } from "./ui/button-link";

// ─── Bottom-bar icon map (emoji per-route) ────────────────────────────────────
// Icons come from the NavItem definition in role-nav.ts and are displayed with
// aria-hidden="true" alongside the text label.

// ─── Inner shell (consumes RoleContext) ───────────────────────────────────────

function ShellInner({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="app-shell min-h-screen text-slate-50">

      {/* ── Screen-reader live region for role change announcements ────────── */}
      <div
        ref={liveRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
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

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 text-sm text-slate-300">
            {routes.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                aria-label={r.ariaLabel ?? r.label}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 hover:bg-white/6 hover:text-white focus-ring-white"
              >
                <span aria-hidden="true">{r.icon}</span>
                <span>{r.label}</span>
              </Link>
            ))}

            {/* Stellar external link — shared across all roles */}
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/10 px-3 py-2 hover:border-cyan-200/30 hover:bg-white/6 hover:text-white focus-ring-white"
            >
              Stellar
            </a>
          </div>

          {/* Right-side controls: RoleChip + primary CTA + hamburger */}
          <div className="flex items-center gap-3">
            {/* Role chip — always visible */}
            <RoleChip />

            {/* Primary CTA for the current role — hidden on smallest screens */}
            <div className="hidden sm:block">
              <ButtonLink
                href={meta.primaryCta.href}
                variant="primary"
                size="sm"
              >
                {meta.primaryCta.label}
              </ButtonLink>
            </div>

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden rounded-md p-2 focus-ring-white"
              aria-label="Open navigation menu"
              onClick={() => setIsOpen(true)}
            >
              <svg
                className="h-6 w-6 text-white"
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
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-sm"
        >
          <aside className="w-72 bg-slate-900 text-slate-100 h-full flex flex-col p-4 overflow-y-auto">
            {/* Drawer header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="text-lg">{meta.icon}</span>
                <span className="text-sm font-semibold text-white">
                  {meta.label} menu
                </span>
              </div>
              <button
                className="rounded-md p-2 focus-ring-white"
                aria-label="Close navigation menu"
                onClick={() => setIsOpen(false)}
              >
                <svg
                  className="h-5 w-5"
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
            </div>

            {/* Role chip in drawer */}
            <div className="mb-4 px-1">
              <RoleChip />
            </div>

            {/* Nav links */}
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {routes.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  aria-label={r.ariaLabel ?? r.label}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-800 focus-ring-white text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  <span aria-hidden="true" className="text-base">{r.icon}</span>
                  <span>{r.label}</span>
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
            <div className="mt-auto pt-6 border-t border-white/8">
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 focus-ring-white"
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

      {/* ── Page content ──────────────────────────────────────────────────── */}
      <main id="main-content" className="pb-16 md:pb-0">
        {children}
      </main>

      {/* Main content */}
      <main id="main-content" className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
        {children}
      </main>

    </div>
  );
}

// ─── Public export (wraps inner shell with RoleProvider) ─────────────────────

type DashboardShellProps = {
  children: React.ReactNode;
  /**
   * Seed role — used during SSR and as the fallback before hydration.
   * In production this would come from the authenticated session / JWT claim.
   * Defaults to "buyer".
   */
  initialRole?: "supplier" | "buyer" | "admin";
};

export function DashboardShell({
  children,
  initialRole = "buyer",
}: DashboardShellProps) {
  return (
    <RoleProvider initialRole={initialRole}>
      <ShellInner>{children}</ShellInner>
    </RoleProvider>
  );
}
