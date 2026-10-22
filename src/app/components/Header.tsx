"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { WalletStatusBadge } from "./WalletStatusBadge";
import { AccountMenu } from "./AccountMenu";
import { ThemeSwitcher } from "@/components/dashboard/theme-switcher";

export function Header() {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <>
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-xl"
        style={{
          backgroundColor: "var(--shell-header-bg)",
          borderColor: "var(--shell-header-border)",
        }}
      >
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              ChronoPay
            </Link>
            <div
              className="hidden sm:flex flex-wrap items-center gap-3 text-sm"
              style={{ color: "var(--muted)" }}
            >
              <Link
                href="/"
                className="rounded-full px-3 py-2 hover:bg-slate-500/10 transition duration-200 ease-in-out"
                style={{ color: "var(--foreground)" }}
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full px-3 py-2 hover:bg-slate-500/10 transition duration-200 ease-in-out"
                style={{ color: "var(--foreground)" }}
              >
                Dashboard
              </Link>
              <Link
                href="/marketplace"
                className="rounded-full px-3 py-2 hover:bg-slate-500/10 transition duration-200 ease-in-out"
                style={{ color: "var(--foreground)" }}
              >
                Marketplace
              </Link>
              <Link
                href="/pricing"
                className="rounded-full px-3 py-2 hover:bg-slate-500/10 transition duration-200 ease-in-out"
                style={{ color: "var(--foreground)" }}
              >
                Pricing
              </Link>
              <Link
                href="/status"
                className="rounded-full px-3 py-2 hover:bg-slate-500/10 transition duration-200 ease-in-out"
                style={{ color: "var(--foreground)" }}
              >
                Status
              </Link>
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-slate-400/20 px-3 py-2 hover:border-slate-400/40 hover:bg-slate-500/10 transition duration-200 ease-in-out"
                style={{ color: "var(--foreground)" }}
              >
                Stellar
              </a>
              <a
                href="https://github.com/Chronopay-Org/ChronoPay-Frontend"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-slate-400/20 px-3 py-2 hover:border-slate-400/40 hover:bg-slate-500/10 transition duration-200 ease-in-out"
                style={{ color: "var(--foreground)" }}
              >
                GitHub
              </a>
            </div>
          </div>

          <div className="hidden sm:flex flex-wrap items-center gap-3">
            <ThemeSwitcher />
            <WalletStatusBadge />
            <AccountMenu />
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-400/20 px-4 py-2 text-sm font-medium transition hover:bg-slate-500/10 sm:hidden"
            style={{
              backgroundColor: "var(--surface)",
              color: "var(--foreground)",
            }}
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Open navigation menu"
          >
            Menu
          </button>
        </nav>
      </header>

      {open && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 p-6 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div
            className="mx-auto max-w-sm rounded-3xl border p-6 shadow-2xl"
            style={{
              backgroundColor: "var(--surface-strong)",
              borderColor: "var(--border-subtle)",
              color: "var(--foreground)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em]" style={{ color: "var(--muted)" }}>
                  Menu
                </p>
                <h2 className="mt-2 text-xl font-semibold" style={{ color: "var(--foreground)" }}>
                  ChronoPay
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="rounded-full border px-3 py-2 text-sm hover:bg-slate-500/10"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--foreground)",
                }}
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <Link
                href="/"
                className="block rounded-2xl border px-4 py-3 hover:bg-slate-500/10"
                style={{
                  borderColor: "var(--border-subtle)",
                  backgroundColor: "var(--surface)",
                  color: "var(--foreground)",
                }}
                onClick={() => setOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                className="block rounded-2xl border px-4 py-3 hover:bg-slate-500/10"
                style={{
                  borderColor: "var(--border-subtle)",
                  backgroundColor: "var(--surface)",
                  color: "var(--foreground)",
                }}
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/marketplace"
                className="block rounded-2xl border px-4 py-3 hover:bg-slate-500/10"
                style={{
                  borderColor: "var(--border-subtle)",
                  backgroundColor: "var(--surface)",
                  color: "var(--foreground)",
                }}
                onClick={() => setOpen(false)}
              >
                Marketplace
              </Link>
              <Link
                href="/pricing"
                className="block rounded-2xl border px-4 py-3 hover:bg-slate-500/10"
                style={{
                  borderColor: "var(--border-subtle)",
                  backgroundColor: "var(--surface)",
                  color: "var(--foreground)",
                }}
                onClick={() => setOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/status"
                className="block rounded-2xl border px-4 py-3 hover:bg-slate-500/10"
                style={{
                  borderColor: "var(--border-subtle)",
                  backgroundColor: "var(--surface)",
                  color: "var(--foreground)",
                }}
                onClick={() => setOpen(false)}
              >
                Status
              </Link>
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border px-4 py-3 hover:bg-slate-500/10"
                style={{
                  borderColor: "var(--border-subtle)",
                  backgroundColor: "var(--surface)",
                  color: "var(--foreground)",
                }}
                onClick={() => setOpen(false)}
              >
                Stellar
              </a>
              <a
                href="https://github.com/Chronopay-Org/ChronoPay-Frontend"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border px-4 py-3 hover:bg-slate-500/10"
                style={{
                  borderColor: "var(--border-subtle)",
                  backgroundColor: "var(--surface)",
                  color: "var(--foreground)",
                }}
                onClick={() => setOpen(false)}
              >
                GitHub
              </a>
            </div>

            <div className="mt-6 space-y-4">
              <ThemeSwitcher />
              <WalletStatusBadge />
              <AccountMenu />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
