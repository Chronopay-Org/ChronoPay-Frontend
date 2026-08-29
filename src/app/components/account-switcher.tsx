"use client";

/**
 * AccountSwitcher — dropdown menu in the dashboard header for switching between
 * Stellar wallet accounts with typeahead search and recent-accounts list.
 *
 * Features:
 *   - Trigger button showing the active account avatar + label + chevron
 *   - Dropdown panel with:
 *       - Search input with real-time typeahead filtering
 *       - Current active account pinned at top (with "Active" badge)
 *       - Recent accounts section (up to MAX_RECENTS, ordered by last-used)
 *       - Filtered search results with highlighted matches
 *       - "Add account" action at the bottom
 *   - Full keyboard navigation (Arrow keys, Enter, Escape, Tab)
 *   - ARIA combobox pattern (role="combobox" on input / role="listbox" on list)
 *   - Click-outside to dismiss
 *   - Polite aria-live announcements for account switches
 *
 * Accessibility (WCAG 2.1 AA):
 *   - All interactive elements have visible focus rings
 *   - Search input uses role="combobox" with aria-expanded / aria-controls
 *   - Account list uses role="listbox" with role="option"
 *   - Current account has aria-current="true"
 *   - Account switches announced via role="status" aria-live="polite"
 *   - Keyboard navigable: Arrow keys, Enter, Escape, Tab
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { ChevronDown, Plus, Search, X, Clock, Copy } from "lucide-react";
import {
  useAccounts,
  truncateAddress,
  avatarColour,
  avatarInitials,
  type Account,
} from "@/hooks/use-accounts";
import { WalletConnectModal } from "@/components/dashboard/WalletConnectModal";

// ─── Component ────────────────────────────────────────────────────────────────

interface AccountSwitcherProps {
  /** Optional class name for the wrapper */
  className?: string;
}

export function AccountSwitcher({ className = "" }: AccountSwitcherProps) {
  const {
    accounts,
    activeAccount,
    activeAddress,
    recentAddresses,
    switchAccount,
    addAccount,
  } = useAccounts();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState("");
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const inputId = useId();
  const listboxId = `${inputId}-listbox`;

  // ── Derived data ─────────────────────────────────────────────────────────

  // Recent accounts (excluding the active account since it's pinned)
  const recentAccounts = useMemo(() => {
    if (!activeAddress) return [];
    return recentAddresses
      .filter((addr) => addr !== activeAddress)
      .map((addr) => accounts.find((a) => a.address === addr))
      .filter((a): a is Account => a !== undefined);
  }, [recentAddresses, activeAddress, accounts]);

  // Filtered accounts based on search query
  const filteredAccounts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return accounts.filter((a) => {
      const label = a.label?.toLowerCase() ?? "";
      const address = a.address.toLowerCase();
      const provider = a.provider?.toLowerCase() ?? "";
      return (
        label.includes(q) ||
        address.includes(q) ||
        provider.includes(q)
      );
    });
  }, [query, accounts]);

  // Keyboard-navigable items:
  // - When searching: filteredAccounts
  // - When not searching: active account pinned first, then recents
  const listItems = useMemo(() => {
    const q = query.trim();
    if (q) {
      return filteredAccounts;
    }
    const items: Account[] = [];
    if (activeAccount) {
      items.push(activeAccount);
    }
    items.push(...recentAccounts);
    return items;
  }, [query, filteredAccounts, activeAccount, recentAccounts]);

  const isSearching = query.trim().length > 0;
  const showEmptyState = isSearching && filteredAccounts.length === 0;

  // ── Open / close helpers ─────────────────────────────────────────────────

  const open = useCallback(() => {
    setIsOpen(true);
    setAnnouncement("");
    // Focus the search input when the dropdown opens
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // ── Switch account ───────────────────────────────────────────────────────

  const handleSwitchAccount = useCallback(
    (address: string) => {
      if (address === activeAddress) {
        close();
        return;
      }
      const account = accounts.find((a) => a.address === address);
      const label = account?.label ?? truncateAddress(address);
      switchAccount(address);
      setAnnouncement(`Switched to account ${label}`);
      close();
    },
    [activeAddress, accounts, switchAccount, close],
  );

  // ── Handle "Add account" ─────────────────────────────────────────────────

  const handleAddAccount = useCallback(() => {
    setIsWalletModalOpen(true);
    close();
  }, [close]);

  // ── Click-outside to close ───────────────────────────────────────────────

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    if (isOpen) {
      document.addEventListener("pointerdown", handlePointerDown);
    }
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, close]);

  // ── Keyboard navigation ─────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          if (!isOpen) {
            open();
            return;
          }
          setActiveIndex((prev) =>
            prev < listItems.length - 1 ? prev + 1 : 0,
          );
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : listItems.length - 1,
          );
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (activeIndex >= 0 && listItems[activeIndex]) {
            handleSwitchAccount(listItems[activeIndex].address);
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          if (query) {
            setQuery("");
            setActiveIndex(-1);
          } else {
            close();
          }
          break;
        }
        case "Tab": {
          close();
          break;
        }
      }
    },
    [isOpen, listItems, activeIndex, query, open, close, handleSwitchAccount],
  );

  // ── Scroll active item into view ─────────────────────────────────────────

  useEffect(() => {
    if (activeIndex < 0 || !containerRef.current) return;
    const listbox = containerRef.current.querySelector<HTMLElement>(
      `[role="listbox"]`,
    );
    if (!listbox) return;
    const item = listbox.children[activeIndex] as HTMLElement | undefined;
    if (item && typeof item.scrollIntoView === "function") {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  // ── Clear announcement after 3 seconds ──────────────────────────────────

  useEffect(() => {
    if (!announcement) return;
    const timer = setTimeout(() => setAnnouncement(""), 3000);
    return () => clearTimeout(timer);
  }, [announcement]);

  // ── Render helpers ───────────────────────────────────────────────────────

  const activeItemId =
    activeIndex >= 0 ? `${listboxId}-item-${activeIndex}` : undefined;

  function renderAccountItem(
    account: Account,
    idx: number,
    isActive: boolean,
    label?: string,
  ) {
    const displayName = account.label ?? truncateAddress(account.address);
    return (
      <li
        key={account.address}
        id={`${listboxId}-item-${idx}`}
        role="option"
        aria-selected={idx === activeIndex}
        aria-current={isActive ? "true" : undefined}
        className={[
          "group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
          idx === activeIndex
            ? "bg-cyan-500/10 text-white"
            : "text-slate-300 hover:bg-white/6 hover:text-white",
        ].join(" ")}
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => handleSwitchAccount(account.address)}
      >
        {/* Avatar */}
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColour(account.address)}`}
          aria-hidden="true"
        >
          {avatarInitials(account)}
        </span>

        {/* Label + address */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium" data-testid="account-label">
              {isSearching && query.trim() ? (
                <HighlightMatch text={displayName} query={query.trim()} />
              ) : (
                displayName
              )}
            </span>
            {isActive && (
              <span className="shrink-0 rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-400">
                Active
              </span>
            )}
            {label && !isActive && (
              <span className="shrink-0 text-[10px] text-slate-500 uppercase tracking-wider">
                {label}
              </span>
            )}
          </div>
            <p className="truncate text-xs text-slate-500 font-mono" aria-label={account.address} data-testid="account-address">
              {truncateAddress(account.address)}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(account.address).catch(() => {});
                  setAnnouncement("Address copied to clipboard");
                }
              }}
              className="ml-2 rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
              aria-label={`Copy address ${account.address}`}
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Provider badge */}
        {account.provider && (
          <span className="shrink-0 rounded-md bg-white/6 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
            {account.provider}
          </span>
        )}
      </li>
    );
  }

  function renderSection(
    items: Account[],
    startIdx: number,
    sectionLabel: string,
    sectionId?: string,
  ) {
    return (
      <ul
        role="listbox"
        aria-label={sectionLabel}
        id={sectionId}
        className="py-0.5 px-1.5"
      >
        {items.map((account, i) =>
          renderAccountItem(
            account,
            startIdx + i,
            account.address === activeAddress,
          ),
        )}
      </ul>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* ── Trigger button ──────────────────────────────────────────────── */}
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Switch account — current: ${activeAccount?.label ?? truncateAddress(activeAccount?.address ?? "")}`}
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-haspopup="listbox"
        onClick={toggle}
        className={[
          "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
          "hover:bg-white/6",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
          isOpen ? "bg-white/8" : "",
        ].join(" ")}
      >
        {/* Active account avatar */}
        {activeAccount && (
          <>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColour(activeAccount.address)}`}
              aria-hidden="true"
            >
              {avatarInitials(activeAccount)}
            </span>
            <span className="hidden sm:inline truncate max-w-[100px]">
              {activeAccount.label ?? truncateAddress(activeAccount.address)}
            </span>
          </>
        )}
        {!activeAccount && (
          <span className="text-slate-400 text-xs">No account</span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {/* ── Dropdown panel ──────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={[
            "absolute right-0 top-full mt-2 w-80 rounded-xl",
            "border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl",
            "ring-1 ring-black/20 z-50",
          ].join(" ")}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-3 pb-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Switch account
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close account switcher"
              className="rounded-full p-1 text-slate-500 hover:text-slate-300 hover:bg-white/6 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 transition-colors"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Search input */}
          <div className="px-3 pt-1 pb-2">
            <label htmlFor={inputId} className="sr-only">
              Search accounts
            </label>
            <div className="relative flex items-center">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                id={inputId}
                type="search"
                role="combobox"
                autoComplete="off"
                spellCheck={false}
                placeholder="Search accounts by name, address, or provider…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(-1);
                }}
                onFocus={() => {
                  if (!isOpen) open();
                }}
                onKeyDown={handleKeyDown}
                aria-expanded={listItems.length > 0 || showEmptyState}
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-activedescendant={activeItemId}
                className={[
                  "h-9 w-full rounded-lg border border-white/10 bg-white/6 pl-8 pr-7",
                  "text-sm text-white placeholder:text-slate-500",
                  "focus:border-cyan-300/40 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-1 focus:ring-offset-slate-950",
                  "transition-[background-color,border-color] duration-200",
                ].join(" ")}
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    setActiveIndex(-1);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-500 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 transition-colors"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* ── Content: Search mode ────────────────────────────────────── */}
          {isSearching && (
            <>
              {filteredAccounts.length > 0 && (
                <>
                  <div className="px-3 pb-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                      Matching accounts
                    </span>
                  </div>
                  {renderSection(filteredAccounts, 0, "Matching accounts", listboxId)}
                </>
              )}
              {showEmptyState && (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm text-slate-500">
                    No accounts matching &ldquo;{query}&rdquo;
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Try a different name, address, or provider.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── Content: Default view ───────────────────────────────────── */}
          {!isSearching && (
            <>
              {/* Pinned active account */}
              <div className="px-3 pb-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                  Current account
                </span>
              </div>
              {activeAccount
                ? renderSection([activeAccount], 0, "Current account", listboxId)
                : renderSection(accounts, 0, "All accounts", listboxId)}

              {/* Recent accounts */}
              {recentAccounts.length > 0 && activeAccount && (
                <>
                  <div className="border-t border-white/6 mx-3" />
                  <div className="px-3 pt-2 pb-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-600">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      Recent
                    </span>
                  </div>
                  {renderSection(recentAccounts, 1, "Recent accounts")}
                </>
              )}
            </>
          )}

          {/* ── Add account button ──────────────────────────────────────── */}
          <div className="border-t border-white/6 px-2 py-2">
            <button
              type="button"
              onClick={handleAddAccount}
              className={[
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                "text-slate-400 hover:bg-white/6 hover:text-white",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950",
              ].join(" ")}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Add account</span>
            </button>
          </div>

          {/* Keyboard hint footer */}
          <div className="border-t border-white/6 px-3 py-2">
            <p className="text-xs text-slate-600">
              <kbd className="font-mono">↑↓</kbd> navigate
              &nbsp;&middot;&nbsp;
              <kbd className="font-mono">Enter</kbd> switch
              &nbsp;&middot;&nbsp;
              <kbd className="font-mono">Esc</kbd> close
            </p>
          </div>
        </div>
      )}

      {/* ── Screen reader announcement ────────────────────────────────── */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <WalletConnectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        providers={[]}
        status="idle"
        onConnect={() => setIsWalletModalOpen(false)}
      />
    </div>
  );
}

// ─── HighlightMatch ───────────────────────────────────────────────────────────

/**
 * Renders a label with the matching portion of the query highlighted.
 */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent text-cyan-300 font-semibold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
