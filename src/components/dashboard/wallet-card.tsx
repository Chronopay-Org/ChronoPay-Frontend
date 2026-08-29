"use client";

import { useId } from "react";
import { StatusChip } from "./status-chip";
import { Tooltip } from "@/app/components/ui/tooltip";
import { Card, CardHeader, CardBody, CardFooter } from "./card";
import type { WalletSnapshot } from "./types";
import { useToast } from "@/hooks/use-toast";

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

  return (
    <Card
      variant="accent"
      aria-labelledby={titleId}
      aria-describedby={`${balanceId} ${securityId} ${statusId}`}
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
          <div className="flex items-center justify-between gap-4 text-sm">
            <dt id={securityId} className="text-slate-300 flex items-center gap-2">
              Pending escrow
              <Tooltip content="Time tokens held in escrow for active bookings. Released upon completion or cancellation." />
            </dt>
            <dd className="font-medium text-white">{wallet.pending}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <dt className="text-slate-300 flex items-center gap-2">
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
      </CardBody>
      <CardFooter className="mt-6">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 px-4 py-2.5 text-sm border border-white/12 bg-white/6 text-slate-100 hover:border-cyan-200/30 hover:bg-white/10"
          onClick={handleWalletAction}
        >
          {actionLabel[wallet.connection]}
        </button>
      </CardFooter>
    </Card>
  );
}
