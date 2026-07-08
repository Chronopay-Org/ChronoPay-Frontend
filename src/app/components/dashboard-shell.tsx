"use client";

// src/app/components/dashboard-shell.tsx
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { HeaderSearch } from "@/app/components/header-search";

// ─── Bottom-bar icon map (emoji per-route) ────────────────────────────────────
// Icons come from the NavItem definition in role-nav.ts and are displayed with
// aria-hidden="true" alongside the text label.

// ─── Inner shell (consumes RoleContext) ───────────────────────────────────────

function ShellInner({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

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

  // Scroll detection for inset shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const routes = [
    { href: "/", label: "Home" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/calendar", label: "Calendar" },
    { href: "/history", label: "History" },
  ];

  // Animation variants for active tab indicator
  const tabIndicatorVariants = {
    inactive: {
      scale: 0.8,
      opacity: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.2,
      },
    },
    active: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.3,
      },
    },
  };

  // FAB animation variants
  const fabVariants = {
    idle: {
      scale: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.2,
      },
    },
    pressed: {
      scale: 0.95,
      y: 2,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

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
          <div className="hidden md:flex items-center gap-3 text-sm text-slate-300">
            {routes.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="rounded-full px-3 py-2 hover:bg-white/6 focus-ring-white transition-colors"
                style={{ color: "var(--shell-text-muted)" }}
              >
                <span aria-hidden="true">{r.icon}</span>
                <span>{r.label}</span>
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-40"
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