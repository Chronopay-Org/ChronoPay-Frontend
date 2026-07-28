"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ThemeSwitcher } from "@/app/components/ui/theme-switcher";
import { HeaderSearch } from "@/app/components/header-search";
import { OfflineQueueIndicator } from "@/app/components/offline-queue-indicator";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const routes = getNavForRole(role);
  const meta = ROLE_META[role];

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
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
                key={route.href}
                href={route.href}
                className="rounded-full px-3 py-2 transition-colors hover:bg-white/10 hover:text-white"
              >
                <span aria-hidden={true} className="mr-1.5">
                  {route.icon}
                </span>
                <span>{route.label}</span>
              </Link>
            ))}
            <ThemeSwitcher />
            <OfflineQueueIndicator />
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/10 px-3 py-2 transition-colors hover:bg-white/10"
            >
              Stellar
            </a>
            <HeaderSearch />
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <HeaderSearch />
            <button
              className="rounded-md p-2 text-white transition-colors hover:bg-white/10"
              aria-label="Open navigation menu"
              onClick={() => setIsOpen(true)}
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
          className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-sm"
        >
          <aside className="h-full w-64 bg-slate-950 p-4 text-slate-100">
            <button
              className="mb-4 rounded-md p-2 transition-colors hover:bg-white/10"
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
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="block rounded-md px-3 py-2 transition-colors hover:bg-white/10"
                  onClick={() => setIsOpen(false)}
                >
                  <span aria-hidden={true} className="mr-1.5">
                    {route.icon}
                  </span>
                  <span>{route.label}</span>
                </Link>
              ))}
            </nav>

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
          </aside>

          <button
            className="flex-1 cursor-default"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation drawer"
            tabIndex={-1}
          />
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around bg-slate-900 py-2 text-slate-100 md:hidden">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="flex flex-col items-center text-xs hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <span aria-hidden={true} className="text-lg">
              {route.icon}
            </span>
            <span>{route.label}</span>
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
