"use client";

import { useId } from "react";
import { StatusChip } from "./status-chip";
import { Tooltip } from "@/app/components/ui/tooltip";
import { AsyncButton } from "@/app/components/ui/async-button";
import { useToast } from "@/hooks/use-toast";
import type { WalletSnapshot } from "./types";
import { useState, useEffect } from "react";
import { WalletConnectModal, type WalletProvider } from "./WalletConnectModal";

// Define the wallet providers used in the picker. Icons are placeholders; replace with real SVGs.
const walletProviders: WalletProvider[] = [
  {
    id: "freighter",
    name: "Freighter",
    icon: <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l9 21H3L12 2z"/></svg>,
  },
  {
    id: "albedo",
    name: "Albedo",
    icon: <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/></svg>,
  },
];

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

/** Simulated async wallet action — replace with real Stellar SDK call. */
async function simulateWalletAction(
  connection: WalletSnapshot["connection"],
): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    setTimeout(() => {
      // Simulate occasional failure for demo purposes
      if (connection === "error") {
        reject(new Error("RPC node unreachable"));
      } else {
        resolve();
      }
    }, 1800),
  );
}

export function WalletCard({ wallet }: { wallet: WalletSnapshot }) {
  const titleId = useId();
  const balanceId = useId();
  const securityId = useId();
  const statusId = useId();
  const { toast } = useToast();

  const isConnected = wallet.connection === "connected";

  async function handleWalletAction() {
    await simulateWalletAction(wallet.connection);

    if (wallet.connection === "disconnected") {
      toast({
        variant: "success",
        title: "Wallet connected",
        description: `Address ${wallet.address?.slice(0, 8)}… linked to your account.`,
      });
    } else if (wallet.connection === "connected") {
      toast({
        variant: "info",
        title: "Wallet details",
        description: "Your wallet is already connected and synced.",
      });
    }
  }

  const buttonLabels = {
    connected: {
      idle: "Review wallet",
      pending: "Loading…",
      confirmed: "Loaded",
      error: "Retry",
    },
    disconnected: {
      idle: "Connect wallet",
      pending: "Connecting…",
      confirmed: "Connected",
      error: "Retry connection",
    },
    error: {
      idle: "Retry connection",
      pending: "Retrying…",
      confirmed: "Connected",
      error: "Still failing",
    },
  };

  return (
    <article
      className="rounded-[24px] border border-cyan-400/20 bg-[linear-gradient(160deg,rgba(14,116,144,0.18),rgba(15,23,42,0.92))] p-5 motion-safe:transition hover:border-cyan-400/40"
      aria-labelledby={titleId}
      aria-describedby={`${balanceId} ${securityId} ${statusId}`}
    >
      <div className="flex items-start justify-between gap-4">
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
      </div>

      <dl className="mt-6 space-y-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <dt id={securityId} className="flex items-center gap-2 text-slate-300">
            Pending escrow
            <Tooltip content="Time tokens held in escrow for active bookings. Released upon completion or cancellation." />
          </dt>
          <dd className="font-medium text-white">{wallet.pending}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <dt className="flex items-center gap-2 text-slate-300">
            Next payout
            <Tooltip content="Scheduled release of earnings from completed time token transactions." />
          </dt>
          <dd className="font-medium text-white">{wallet.nextPayout}</dd>
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
      <button type="button" className="focus-ring-cyan">
        {actionLabel[wallet.connection]}
      </button>
    </article>
  );
}
