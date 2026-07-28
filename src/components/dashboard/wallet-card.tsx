"use client";

import { useId, useState } from "react";
import { StatusChip } from "./status-chip";
import { Tooltip } from "@/app/components/ui/tooltip";
import { CopyButton } from "@/app/components/ui/copy-button";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { Card, CardHeader, CardBody, CardFooter } from "./card";
import type { WalletSnapshot } from "./types";
import { WalletConnectModal, type WalletProvider } from "./WalletConnectModal";
import { useToast } from "@/hooks/use-toast";
import { glossary } from "@/lib/glossary";

// ─── Wallet providers ─────────────────────────────────────────────────────────
// Icons are illustrative placeholders; swap for real SVG assets or the
// official Freighter / Albedo brand icons in production.

const walletProviders: WalletProvider[] = [
  {
    id: "freighter",
    name: "Freighter",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path d="M12 2l9 21H3L12 2z" />
      </svg>
    ),
  },
  {
    id: "albedo",
    name: "Albedo",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
];

// ─── Tone / label maps ────────────────────────────────────────────────────────

const statusTone = {
  connected: "positive",
  disconnected: "warning",
  error: "critical",
} as const;

const statusLabel = {
  connected: "Connected",
  disconnected: "Disconnected",
  error: "Connection issue",
} as const;

const actionLabel = {
  connected: "Review wallet",
  disconnected: "Connect wallet",
  error: "Retry connection",
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function WalletCard({ wallet }: { wallet: WalletSnapshot }) {
  const { toast } = useToast();

  const titleId = useId();
  const balanceId = useId();
  const escrowId = useId();
  const statusId = useId();

  // Modal state — open when user clicks the footer CTA on disconnected/error states
  const [modalOpen, setModalOpen] = useState(false);
  const [connectStatus, setConnectStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [connectError, setConnectError] = useState<string | undefined>();

  const handleConnect = async (providerId: string) => {
    setConnectStatus("pending");
    setConnectError(undefined);
    try {
      // Placeholder — replace with real Stellar wallet SDK call.
      // e.g.: await freighter.requestAccess(); or albedo.publicKey({});
      await new Promise<void>((resolve, reject) =>
        setTimeout(
          () => (Math.random() > 0.2 ? resolve() : reject(new Error("Extension not found"))),
          1500,
        ),
      );
      setConnectStatus("success");
      toast({
        variant: "success",
        title: "Wallet connected",
        description: `${providerId.charAt(0).toUpperCase() + providerId.slice(1)} is now connected.`,
        duration: 3000,
      });
      // Close modal after brief success display
      setTimeout(() => setModalOpen(false), 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setConnectStatus("error");
      setConnectError(msg);
      toast({
        variant: "error",
        title: "Connection failed",
        description: msg,
      });
    }
  };

  const handleRetry = () => {
    setConnectStatus("idle");
    setConnectError(undefined);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setConnectStatus("idle");
    setConnectError(undefined);
  };

  const handleFooterClick = () => {
    if (wallet.connection === "connected") {
      // "Review wallet" — could open a detail panel; toast as placeholder
      toast({ variant: "info", title: "Wallet details", description: "Full wallet management coming soon." });
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <Card
        variant="accent"
        aria-labelledby={titleId}
        aria-describedby={`${balanceId} ${escrowId} ${statusId}`}
      >
        <CardHeader>
          <div className="min-w-0">
            <p id={titleId} className="text-sm text-cyan-100/80">
              Primary wallet
            </p>
            <p
              id={balanceId}
              className="mt-3 truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl"
              aria-live="polite"
              aria-atomic="true"
            >
              {wallet.balance ?? "—"}
            </p>
          </div>

          <StatusChip tone={statusTone[wallet.connection]}>
            {statusLabel[wallet.connection]}
          </StatusChip>
        </CardHeader>

        <CardBody className="mt-6">
          <dl className="space-y-4">
            {/* Wallet address — only shown when connected */}
            {wallet.address && (
              <div className="flex items-center justify-between gap-4 text-sm">
                <dt className="flex items-center gap-2 text-slate-300">
                  Wallet address
                  <Tooltip content="Public wallet address for receiving payments." />
                </dt>
                <dd className="flex items-center gap-2 font-mono text-xs text-white">
                  <span
                    className="truncate max-w-[9rem]"
                    title={wallet.address}
                  >
                    {wallet.address.slice(0, 8)}…{wallet.address.slice(-6)}
                  </span>
                  <CopyButton
                    text={wallet.address}
                    variant="icon"
                    label="Copy wallet address"
                    onCopied={() =>
                      toast({
                        variant: "success",
                        title: "Copied",
                        description: "Wallet address copied to clipboard.",
                        duration: 2000,
                      })
                    }
                  />
                </dd>
              </div>
            )}

            {/* Pending escrow */}
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt id={escrowId} className="flex items-center gap-2 text-slate-300">
                Pending escrow
                <HelpPopover term={glossary.pendingEscrow} />
              </dt>
              <dd className="font-medium text-white">{wallet.pending ?? "—"}</dd>
            </div>

            {/* Next payout */}
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="flex items-center gap-2 text-slate-300">
                Next payout
                <HelpPopover term={glossary.nextPayout} />
              </dt>
              <dd className="font-medium text-white">{wallet.nextPayout ?? "—"}</dd>
            </div>
          </dl>

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
            onClick={handleFooterClick}
            className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:border-cyan-200/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            {actionLabel[wallet.connection]}
          </button>
        </CardFooter>
      </Card>

      {/* Wallet connect modal — rendered outside the card so it sits in the portal layer */}
      <WalletConnectModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        providers={walletProviders}
        status={connectStatus}
        errorMessage={connectError}
        onConnect={handleConnect}
        onRetry={handleRetry}
      />
    </>
  );
}
