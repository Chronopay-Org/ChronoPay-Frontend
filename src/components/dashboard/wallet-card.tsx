"use client";

import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { StatusChip } from "./status-chip";
import { Tooltip } from "@/app/components/ui/tooltip";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { CopyButton } from "@/app/components/ui/copy-button";
import { Card, CardHeader, CardBody, CardFooter } from "./card";
import type { WalletHolding, WalletHoldingStatus, WalletSnapshot, WalletActivityEntry, WalletLifetimeStats } from "./types";
import { WalletConnectModal } from "./WalletConnectModal";
import { useToast } from "@/hooks/use-toast";
import { glossary } from "@/lib/glossary";
import { useNetwork, TestnetRibbon } from "@/components/checkout/NetworkSelector";

const statusTone = {
  connected: "positive",
  disconnected: "warning",
  error: "critical",
} as const;

const actionLabel = {
  connected: "Review wallet",
  disconnected: "Connect wallet",
  error: "Retry connection",
} as const;

const HOLDINGS_TAB_IDS = ["holdings-available", "holdings-escrowed", "holdings-redeemed", "activity", "lifetime"] as const;

type WalletPanelTabId = (typeof HOLDINGS_TAB_IDS)[number];

type WalletPanelTabConfig = {
  id: WalletPanelTabId;
  label: string;
  category: "holdings" | "activity" | "lifetime";
};

const walletPanelTabConfig: readonly WalletPanelTabConfig[] = [
  { id: "holdings-available", label: "Available", category: "holdings" },
  { id: "holdings-escrowed", label: "Escrowed", category: "holdings" },
  { id: "holdings-redeemed", label: "Redeemed", category: "holdings" },
  { id: "activity", label: "Activity", category: "activity" },
  { id: "lifetime", label: "Lifetime stats", category: "lifetime" },
];

const HOLDINGS_STORAGE_KEY = "chronopay.wallet-panel.active-tab";
const HOLDINGS_SCROLL_STORAGE_KEY = "chronopay.wallet-panel.scroll";

function getHoldingsByStatus(
  holdings: readonly WalletHolding[] | undefined,
  status: WalletHoldingStatus,
): WalletHolding[] {
  return (holdings ?? []).filter((holding) => holding.status === status);
}

/**
 * Returns true when the wallet balance is zero.
 *
 * Matches "0 XLM", "0.00 XLM", "0", "0.0", "0,0 XLM", and the
 * empty/undefined case so callers never need to guard the value.
 */
export function isZeroBalance(balance: string | undefined): boolean {
  if (!balance) return false;
  // Strip currency suffix (e.g. " XLM"), commas, and whitespace then parse.
  const numeric = balance.replace(/[^0-9.]/g, "");
  if (numeric === "") return false;
  return parseFloat(numeric) === 0;
}

// ---------------------------------------------------------------------------
// Zero-balance nudge action definitions
// ---------------------------------------------------------------------------

type NudgeAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  /** When true the action is only shown on testnet. */
  testnetOnly: boolean;
  /** lucide-react icon name (kept as a string; rendered via aria-label). */
  icon: string;
  /** Primary CTA button label. */
  ctaLabel: string;
};

export const ZERO_BALANCE_NUDGE_ACTIONS: readonly NudgeAction[] = [
  {
    id: "testnet-tokens",
    label: "Get testnet tokens",
    description:
      "Grab free Friendbot XLM to explore features without real funds.",
    href: "https://laboratory.stellar.org/#account-creator?network=testnet",
    testnetOnly: true,
    icon: "Zap",
    ctaLabel: "Open Friendbot",
  },
  {
    id: "buy-xlm",
    label: "Buy XLM",
    description:
      "Fund your wallet from an exchange to start selling time tokens.",
    href: "https://www.stellar.org/lumens/exchanges",
    testnetOnly: false,
    icon: "ShoppingCart",
    ctaLabel: "Find an exchange",
  },
  {
    id: "learn-time-tokens",
    label: "Learn about time tokens",
    description:
      "Understand how ChronoPay tokenises availability on the Stellar network.",
    href: "/dashboard",
    testnetOnly: false,
    icon: "BookOpen",
    ctaLabel: "Read the guide",
  },
] as const;

// ---------------------------------------------------------------------------
// ZeroBalanceNudge sub-component
// ---------------------------------------------------------------------------

export type ZeroBalanceNudgeProps = {
  /** When true the testnet-only CTA is shown. Defaults to false. */
  isTestnet?: boolean;
  /** Override the nudge action list (useful for tests). */
  actions?: readonly NudgeAction[];
};

/**
 * ZeroBalanceNudge — rendered inside WalletCard when the connected wallet
 * has a zero balance.  Shows friendly next-step action chips.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Section is labelled by its heading
 *   - State change announced via aria-live="polite" on mount
 *   - All CTAs are anchor elements with descriptive aria-label
 *   - Visible focus rings via focus-visible:ring-cyan-300
 */
export function ZeroBalanceNudge({
  isTestnet = false,
  actions = ZERO_BALANCE_NUDGE_ACTIONS,
}: ZeroBalanceNudgeProps) {
  const baseId = useId();
  const headingId = `${baseId}-heading`;
  const announceId = `${baseId}-announce`;

  const visibleActions = actions.filter(
    (a) => !a.testnetOnly || isTestnet,
  );

  return (
    <section
      aria-labelledby={headingId}
      className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-950/30 px-4 py-4"
      data-testid="zero-balance-nudge"
    >
      {/* Polite announcement on mount so screen readers notice the state */}
      <p
        id={announceId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Your wallet balance is zero. Here are some next steps to get started.
      </p>

      <h3
        id={headingId}
        className="text-sm font-semibold text-cyan-100"
      >
        Your wallet is empty — here&apos;s how to get started
      </h3>
      <div className="helper-text helper-text--emphasis mt-1">
        Add funds or explore the testnet to start listing time tokens
        <HelpPopover
          term={glossary.timeToken}
          triggerLabel="Help: Time tokens"
          className="ml-1 align-middle"
        />
        .
      </div>

      <ul
        role="list"
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
        aria-label="Next steps for empty wallet"
      >
        {visibleActions.map((action) => (
          <li key={action.id} className="flex-1 min-w-0 sm:min-w-[180px]">
            <a
              href={action.href}
              target={action.href.startsWith("http") ? "_blank" : undefined}
              rel={
                action.href.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
              aria-label={`${action.ctaLabel}: ${action.description}`}
              className={[
                "group flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 p-3",
                "transition-colors",
                "hover:border-cyan-300/30 hover:bg-white/8",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                "active:bg-white/12",
              ].join(" ")}
            >
              <span className="text-xs font-semibold text-cyan-100">
                {action.label}
                {action.testnetOnly && (
                  <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                    Testnet
                  </span>
                )}
              </span>
              <span className="text-xs leading-5 text-slate-300 group-hover:text-slate-200">
                {action.description}
              </span>
              <span className="mt-1 text-xs font-medium text-cyan-300/80 group-hover:text-cyan-300">
                {action.ctaLabel} →
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// WalletCard
// ---------------------------------------------------------------------------

export function WalletCard({
  wallet,
  isTestnet = false,
  holdings,
  activity,
  lifetimeStats,
}: {
  wallet: WalletSnapshot;
  /** Pass true when the app is running on the Stellar testnet. */
  isTestnet?: boolean;
  holdings?: WalletHolding[];
  activity?: WalletActivityEntry[];
  lifetimeStats?: WalletLifetimeStats;
}) {
  const titleId = useId();
  const balanceId = useId();
  const securityId = useId();
  const statusId = useId();
  const holdingsHeadingId = useId();
  const { toast } = useToast();
  const { network } = useNetwork();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] =
    useState<WalletPanelTabId>(() => {
      if (typeof window === "undefined") return "holdings-available";
      const savedTab = window.localStorage.getItem(HOLDINGS_STORAGE_KEY);
      return savedTab && HOLDINGS_TAB_IDS.some((tabId) => tabId === savedTab)
        ? (savedTab as WalletPanelTabId)
        : "holdings-available";
    });
  const [panelScrollPositions, setpanelScrollPositions] = useState<
    Record<WalletPanelTabId, number>
  >(() => {
    const defaults: Record<WalletPanelTabId, number> = {
      "holdings-available": 0,
      "holdings-escrowed": 0,
      "holdings-redeemed": 0,
      activity: 0,
      lifetime: 0,
    };
    if (typeof window === "undefined") return defaults;
    const savedScrolls = window.localStorage.getItem(HOLDINGS_SCROLL_STORAGE_KEY);
    if (!savedScrolls) return defaults;
    try {
      const parsed = JSON.parse(savedScrolls) as Partial<Record<WalletPanelTabId, number>>;
      if (parsed && typeof parsed === "object") {
        return { ...defaults, ...parsed };
      }
    } catch {
      // ignore malformed saved scroll positions
    }
    return defaults;
  });
  const panelRef = useRef<HTMLDivElement | null>(null);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const showZeroBalanceNudge =
    wallet.connection === "connected" && isZeroBalance(wallet.balance);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(HOLDINGS_STORAGE_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      HOLDINGS_SCROLL_STORAGE_KEY,
      JSON.stringify(panelScrollPositions),
    );
  }, [panelScrollPositions]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const scrollValue = panelScrollPositions[activeTab] ?? 0;
    panel.scrollTop = scrollValue;
  }, [activeTab, panelScrollPositions]);

  const handlePanelScroll = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    setpanelScrollPositions((current) => ({
      ...current,
      [activeTab]: panel.scrollTop,
    }));
  }, [activeTab]);

  const handleTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, tabId: WalletPanelTabId) => {
      const currentIndex = walletPanelTabConfig.findIndex((tab) => tab.id === tabId);
      const nextTabIds = walletPanelTabConfig.map((tab) => tab.id);

      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const step = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex =
          (currentIndex + step + nextTabIds.length) % nextTabIds.length;
        const nextTab = nextTabIds[nextIndex];
        setActiveTab(nextTab);
      }

      if (event.key === "Home") {
        event.preventDefault();
        setActiveTab(nextTabIds[0]);
      }

      if (event.key === "End") {
        event.preventDefault();
        setActiveTab(nextTabIds[nextTabIds.length - 1]);
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveTab(tabId);
      }
    },
    [],
  );

  const getHoldingsByCategory = (tabId: WalletPanelTabId): WalletHolding[] => {
    if (tabId === "holdings-available") return getHoldingsByStatus(holdings, "available");
    if (tabId === "holdings-escrowed") return getHoldingsByStatus(holdings, "escrowed");
    if (tabId === "holdings-redeemed") return getHoldingsByStatus(holdings, "redeemed");
    return [];
  };

  const activeHoldings = getHoldingsByCategory(activeTab);
  const activeTabLabel =
    walletPanelTabConfig.find((tab) => tab.id === activeTab)?.label ?? "Holdings";

  return (
    <>
      <Card
        variant="accent"
        aria-labelledby={titleId}
        aria-describedby={`${balanceId} ${securityId} ${statusId}`}
      >
        <CardHeader>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p id={titleId} className="text-sm text-cyan-100/80">
                Primary wallet
              </p>
              <TestnetRibbon network={network} />
            </div>
            <p
              id={balanceId}
              className="mt-3 truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl"
              aria-live="polite"
              aria-atomic="true"
            >
              {wallet.balance}
            </p>
          </div>

          <StatusChip tone={statusTone[wallet.connection]}>
            {wallet.connection === "connected"
              ? "Connected"
              : wallet.connection === "error"
                ? "Connection issue"
                : "Disconnected"}
          </StatusChip>
        </CardHeader>

        <CardBody className="mt-6">
          <dl className="space-y-4">
            {wallet.address && (
              <div className="flex items-center justify-between gap-4 text-sm">
                <dt className="text-slate-300 flex items-center gap-2">
                  Wallet address
                  <Tooltip content="Public wallet address for receiving payments." />
                </dt>
                <dd className="flex items-center gap-2 font-mono text-white text-xs">
                  <span className="truncate">
                    {wallet.address.slice(0, 8)}…{wallet.address.slice(-6)}
                  </span>
                  <CopyButton
                    text={wallet.address}
                    variant="icon"
                    label="Copy address"
                    onCopied={() => {
                      toast({
                        variant: "success",
                        title: "Copied",
                        description: "Wallet address copied to clipboard.",
                        duration: 2000,
                      });
                    }}
                  />
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt
                id={securityId}
                className="text-slate-300 flex items-center gap-2"
              >
                Pending escrow
                <HelpPopover term={glossary.pendingEscrow} />
              </dt>
              <dd className="font-medium text-white">{wallet.pending}</dd>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-slate-300 flex items-center gap-2">
                Next payout
                <HelpPopover term={glossary.nextPayout} />
              </dt>
              <dd className="font-medium text-white">{wallet.nextPayout}</dd>
            </div>
          </dl>

          <section
            aria-labelledby={holdingsHeadingId}
            className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 id={holdingsHeadingId} className="text-sm font-semibold text-white">
                  Wallet panel
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Track holdings, activity, and lifetime metrics.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Wallet panel">
              {walletPanelTabConfig.map((tab) => {
                const isActive = activeTab === tab.id;
                const count = tab.category === "holdings" ? getHoldingsByCategory(tab.id).length : null;

                return (
                  <button
                    key={tab.id}
                    id={`wallet-panel-tab-${tab.id}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`wallet-panel-content-${tab.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setActiveTab(tab.id)}
                    onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "border-cyan-300/40 bg-cyan-500/15 text-cyan-100"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white",
                    ].join(" ")}
                  >
                    {tab.label} {count !== null ? count : ""}
                  </button>
                );
              })}
            </div>

            <div
              id={`wallet-panel-content-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`wallet-panel-tab-${activeTab}`}
              ref={panelRef}
              onScroll={handlePanelScroll}
              tabIndex={0}
              className="mt-4 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3"
            >
              {/* Holdings tabs */}
              {(activeTab === "holdings-available" || activeTab === "holdings-escrowed" || activeTab === "holdings-redeemed") && (
                <>
                  {activeHoldings.length > 0 ? (
                    <ul className="space-y-2" aria-label={`${activeTabLabel} holdings`}>
                      {activeHoldings.map((holding) => (
                        <li
                          key={holding.id}
                          className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">{holding.title}</p>
                            <p className="mt-1 text-sm text-slate-400">{holding.detail}</p>
                          </div>
                          <span className="text-sm font-medium text-cyan-100">
                            {holding.amount}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex min-h-[140px] flex-col justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center">
                      <p className="text-sm font-semibold text-white">
                        No {activeTabLabel.toLowerCase()} holdings yet
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        Next step: {activeTab === "holdings-available"
                          ? "add funds or wait for a booking to settle"
                          : activeTab === "holdings-escrowed"
                            ? "keep this tab open while a booking is pending"
                            : "review recently settled activity"}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Activity tab */}
              {activeTab === "activity" && (
                <>
                  {activity && activity.length > 0 ? (
                    <ul className="space-y-2" aria-label="Wallet activity">
                      {activity.map((entry) => (
                        <li
                          key={entry.id}
                          className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">{entry.title}</p>
                            <p className="mt-1 text-xs text-slate-400">{entry.date}</p>
                            <p className="mt-1 text-sm text-slate-400">{entry.detail}</p>
                          </div>
                          <span className="text-sm font-medium text-cyan-100">
                            {entry.amount}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex min-h-[140px] flex-col justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center">
                      <p className="text-sm font-semibold text-white">
                        No activity yet
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        Your transaction history will appear here as you use the wallet.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Lifetime stats tab */}
              {activeTab === "lifetime" && (
                <>
                  {lifetimeStats ? (
                    <dl className="space-y-3" aria-label="Lifetime statistics">
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <dt className="text-sm font-semibold text-white">Total minted</dt>
                        <dd className="text-sm font-medium text-cyan-100">{lifetimeStats.totalMinted}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <dt className="text-sm font-semibold text-white">Total traded value</dt>
                        <dd className="text-sm font-medium text-cyan-100">{lifetimeStats.totalTraded}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <dt className="text-sm font-semibold text-white">Total redeemed</dt>
                        <dd className="text-sm font-medium text-cyan-100">{lifetimeStats.totalRedeemed}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <dt className="text-sm font-semibold text-white">Transaction count</dt>
                        <dd className="text-sm font-medium text-cyan-100">{lifetimeStats.transactionCount}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <dt className="text-sm font-semibold text-white">Account age</dt>
                        <dd className="text-sm font-medium text-cyan-100">{lifetimeStats.accountAge}</dd>
                      </div>
                    </dl>
                  ) : (
                    <div className="flex min-h-[140px] flex-col justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center">
                      <p className="text-sm font-semibold text-white">
                        No lifetime data available
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        Lifetime statistics will be generated after your first transaction.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Zero-balance nudge — only rendered for connected wallets at 0 XLM */}
          {showZeroBalanceNudge && (
            <ZeroBalanceNudge isTestnet={isTestnet} />
          )}

          <p
            id={statusId}
            className="mt-6 text-sm text-cyan-100/75"
            aria-live="polite"
            aria-atomic="true"
          >
            {wallet.status}
          </p>
        </CardBody>

        <CardFooter className="mt-6">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 px-4 py-2.5 text-sm border border-white/12 bg-white/6 text-slate-100 hover:border-cyan-200/30 hover:bg-white/10"
          >
            {actionLabel[wallet.connection]}
          </button>
        </CardFooter>
      </Card>

      <WalletConnectModal
        isOpen={isModalOpen}
        onClose={handleClose}
        providers={[]}
        status="idle"
        onConnect={() => setIsModalOpen(false)}
      />
    </>
  );
}
