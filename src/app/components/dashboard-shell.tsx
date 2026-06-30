"use client";

// src/app/components/dashboard-shell.tsx
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

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
        ease: "easeOut",
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
    <div className="app-shell min-h-screen text-slate-50">
      <header className="border-b border-white/8 bg-slate-950/40 backdrop-blur-xl">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6"
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
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Time economy dashboard
            </p>
          </div>
          {/* Inline links for larger screens */}
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
          </div>
          {/* Hamburger for mobile */}
          <button
            className="md:hidden rounded-md p-2 focus-ring-white"
            aria-label="Open navigation menu"
            onClick={() => setIsOpen(true)}
          >
            {/* Simple burger icon */}
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>
      </header>

      {/* Mobile Drawer */}
      {isOpen && (
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

      {/* Mobile Bottom Bar with Elevated FAB */}
      <nav
        className={`fixed bottom-0 left-0 right-0 md:hidden ${
          isScrolled
            ? "bg-slate-900/95 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
            : "bg-slate-900"
        }`}
        aria-label="Mobile bottom navigation"
      >
        <div className="flex justify-around items-center py-2 pb-safe">
          {routes.map((r, index) => (
            <Link
              key={r.href}
              href={r.href}
              className="relative flex flex-col items-center text-xs hover:text-white focus-ring-white min-w-[64px] py-1"
              onClick={() => setIsOpen(false)}
              aria-current={index === 0 ? "page" : undefined}
            >
              {/* Active indicator with morph animation */}
              <motion.div
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-400 rounded-full"
                variants={tabIndicatorVariants}
                initial="inactive"
                animate="active"
                aria-hidden="true"
              />
              {/* Icon placeholder */}
              <span aria-hidden="true" className="text-lg mb-1">
                {r.label === 'Home' && '🏠'}
                {r.label === 'Marketplace' && '🛒'}
                {r.label === 'Calendar' && '📅'}
                {r.label === 'History' && '🕘'}
              </span>
              <span>{r.label}</span>
            </Link>
          ))}

          {/* Elevated Center FAB for Mint/Book action */}
          <motion.button
            className="relative -mt-8 w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full shadow-lg shadow-cyan-500/50 flex items-center justify-center text-white hover:from-cyan-400 hover:to-cyan-500 focus-ring-cyan min-w-[44px] min-h-[44px]"
            variants={fabVariants}
            initial="idle"
            whileTap="pressed"
            whileHover="idle"
            aria-label="Mint or Book new item"
            title="Mint/Book"
          >
            <Plus className="w-6 h-6" aria-hidden="true" />
            {/* FAB ring effect */}
            <span className="absolute inset-0 rounded-full ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-slate-900" aria-hidden="true" />
          </motion.button>
        </div>
      </nav>

      {/* Main content with bottom padding for mobile nav */}
      <main className="pb-20 md:pb-0">{children}</main>
    </div>
  );
}