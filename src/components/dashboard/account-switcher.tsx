"use client";

/**
 * AccountSwitcher
 *
 * A dropdown that lists all connected Stellar accounts and lets the user
 * switch between them, add a new account, or remove one.
 *
 * Uses the existing `useAccounts` hook as its data source so no new state
 * management is needed. In production, wire `onAddAccount` to open the
 * `WalletConnectModal`.
 *
 * Accessibility:
 *   - Trigger is a <button> with aria-expanded and aria-haspopup="listbox".
 *   - Listbox uses role="listbox" + role="option" semantics.
 *   - Active account carries aria-selected="true".
 *   - Arrow-key navigation cycles through options.
 *   - Escape closes the dropdown and returns focus to the trigger.
 *   - Full address is in aria-label; truncated display is aria-hidden.
 *   - Remove action has an explicit aria-label identifying the account.
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ChevronDown, Plus, Trash2, Check } from "lucide-react";
import clsx from "clsx";
import {
  useAccounts,
  truncateAddress,
  avatarColour,
  avatarInitials,
  type Account,
} from "@/hooks/use-accounts";

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ account }: { account: Account }) {
  return (
    <span
      className={clsx(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
        avatarColour(account.address),
      )}
      aria-hidden="true"
    >
      {avatarInitials(account)}
    </span>
  );
}

// ─── Provider badge ───────────────────────────────────────────────────────────

const providerLabel: Record<string, string> = {
  freighter: "Freighter",
  albedo: "Albedo",
  xbull: "xBull",
};

function ProviderBadge({ provider }: { provider?: string }) {
  if (!provider) return null;
  return (
    <span className="ml-auto shrink-0 rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
      {providerLabel[provider] ?? provider}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AccountSwitcherProps {
  /** Called when the user clicks "Add account" — open WalletConnectModal here. */
  onAddAccount?: () => void;
  className?: string;
}

export function AccountSwitcher({
  onAddAccount,
  className,
}: AccountSwitcherProps) {
  const { accounts, activeAccount, switchAccount, removeAccount } = useAccounts();

  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const triggerId = useId();
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // ── Close on outside click ──────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        listboxRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // ── Focus first option when opening ────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const activeIdx = accounts.findIndex(
      (a) => a.address === activeAccount?.address,
    );
    setFocusedIndex(activeIdx >= 0 ? activeIdx : 0);
    // Move focus into listbox
    requestAnimationFrame(() => {
      const options = listboxRef.current?.querySelectorAll<HTMLElement>('[role="option"]');
      options?.[activeIdx >= 0 ? activeIdx : 0]?.focus();
    });
  }, [open, accounts, activeAccount]);

  const closeAndRefocus = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // ── Keyboard handler on trigger ─────────────────────────────────────────
  const handleTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
    }
  };

  // ── Keyboard handler on listbox ─────────────────────────────────────────
  const handleListboxKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const options = Array.from(
      listboxRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
    );

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = (focusedIndex + 1) % options.length;
        setFocusedIndex(next);
        options[next]?.focus();
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = (focusedIndex - 1 + options.length) % options.length;
        setFocusedIndex(prev);
        options[prev]?.focus();
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        const account = accounts[focusedIndex];
        if (account) {
          switchAccount(account.address);
          closeAndRefocus();
        }
        break;
      }
      case "Escape":
        e.preventDefault();
        closeAndRefocus();
        break;
    }
  };

  const handleSwitch = (address: string) => {
    switchAccount(address);
    closeAndRefocus();
  };

  const handleRemove = (e: React.MouseEvent, address: string) => {
    // Stop click from also triggering the option select
    e.stopPropagation();
    removeAccount(address);
    // If we removed the last account, close
    if (accounts.length <= 1) closeAndRefocus();
  };

  if (!activeAccount) return null;

  return (
    <div className={clsx("relative", className)}>
      {/* ── Trigger ──────────────────────────────────────────────────────── */}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-label={`Active wallet: ${activeAccount.label ?? truncateAddress(activeAccount.address)}. Click to switch accounts.`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleTriggerKey}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:border-white/20 hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      >
        <Avatar account={activeAccount} />
        <span className="max-w-[6rem] truncate font-medium">
          {activeAccount.label ?? truncateAddress(activeAccount.address)}
        </span>
        <ChevronDown
          className={clsx(
            "h-3.5 w-3.5 text-slate-400 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {/* ── Dropdown ─────────────────────────────────────────────────────── */}
      {open && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={triggerId}
          aria-label="Wallet accounts"
          onKeyDown={handleListboxKey}
          className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40 focus:outline-none"
        >
          {/* Account options */}
          {accounts.map((account, index) => {
            const isActive = account.address === activeAccount.address;
            const isFocused = index === focusedIndex;
            const truncated = truncateAddress(account.address);

            return (
              <li
                key={account.address}
                role="option"
                tabIndex={isFocused ? 0 : -1}
                aria-selected={isActive}
                aria-label={`${account.label ?? "Account"}: ${account.address}${isActive ? " (active)" : ""}`}
                onClick={() => handleSwitch(account.address)}
                className={clsx(
                  "group flex cursor-pointer items-center gap-3 px-4 py-3 text-sm transition-colors",
                  "focus:outline-none",
                  isActive
                    ? "bg-white/6 text-white"
                    : "text-slate-300 hover:bg-white/5 focus:bg-white/5",
                )}
              >
                <Avatar account={account} />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {account.label ?? "Wallet"}
                  </p>
                  <p
                    className="font-mono text-[11px] text-slate-400"
                    aria-hidden="true"
                  >
                    {truncated}
                  </p>
                </div>

                <ProviderBadge provider={account.provider} />

                {/* Active checkmark */}
                {isActive && (
                  <Check
                    className="h-4 w-4 shrink-0 text-cyan-400"
                    aria-hidden="true"
                  />
                )}

                {/* Remove button — only show for non-active accounts on hover/focus */}
                {!isActive && (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => handleRemove(e, account.address)}
                    aria-label={`Remove account ${account.label ?? truncated}`}
                    className="ml-1 shrink-0 rounded-full p-1 text-slate-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}

          {/* Divider */}
          <li role="separator" className="border-t border-white/8" />

          {/* Add account */}
          <li>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAddAccount?.();
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 focus-visible:bg-white/5 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-1 focus-visible:ring-cyan-300"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-white/20 text-slate-500">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span>Add account</span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
