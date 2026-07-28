"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { WalletStatusBadge } from "./WalletStatusBadge";
import { AccountMenu } from "./AccountMenu";

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
      <header className="border-b border-zinc-800 bg-zinc-950 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-slate-100"
            >
              ChronoPay
            </Link>
            <div className="hidden sm:flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <Link
                href="/"
                className="rounded-full px-3 py-2 hover:bg-white/6 hover:text-slate-100 transition duration-200 ease-in-out"
              >
                Home
              </Link>
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/10 px-3 py-2 hover:border-white/20 hover:bg-white/6 hover:text-slate-100 transition duration-200 ease-in-out"
              >
                Stellar
              </a>
            </div>
          </div>

          <div className="hidden sm:flex flex-wrap items-center gap-3">
            <WalletStatusBadge />
            <AccountMenu />
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10 sm:hidden"
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
          className="fixed inset-0 z-50 overflow-y-auto bg-neutral-600/50 p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div className="mx-auto max-w-sm rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  Menu
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-100">
                  ChronoPay
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="rounded-full border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-slate-100 hover:bg-white/10"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <Link
                href="/"
                className="block rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-slate-100 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                Home
              </Link>
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-slate-100 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                Stellar
              </a>
            </div>

            <div className="mt-6 space-y-4">
              <WalletStatusBadge />
              <AccountMenu />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
