"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "./useWallet";

export function AccountMenu() {
  const { status, address, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const firstItemRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      firstItemRef.current?.focus();
    }
  }, [open]);

  const copyAddress = async () => {
    if (!address) {
      setCopyMessage("No address available");
      return;
    }

    try {
      await navigator.clipboard.writeText(address);
      setCopyMessage("Copied");
    } catch {
      setCopyMessage("Copy failed");
    }

    window.setTimeout(() => {
      setCopyMessage("");
    }, 1500);
  };

  if (status !== "connected") {
    return null;
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-menu"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="hidden sm:inline">Account</span>
        <span>
          {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Account"}
        </span>
        <span aria-hidden="true" className="text-slate-500">
          ▾
        </span>
      </button>

      {open && (
        <div
          ref={menuRef}
          id="account-menu"
          role="menu"
          aria-label="Account actions"
          className="absolute right-0 z-10 mt-2 w-56 rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.3)] backdrop-blur-xl"
        >
          <button
            ref={firstItemRef}
            type="button"
            role="menuitem"
            onClick={copyAddress}
            disabled={!address}
            className="w-full rounded-2xl px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-slate-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center justify-between gap-2">
              <span>Copy address</span>
              <span className="text-xs text-slate-500">
                {copyMessage || "Clipboard"}
              </span>
            </div>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="mt-2 w-full rounded-2xl px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-slate-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
