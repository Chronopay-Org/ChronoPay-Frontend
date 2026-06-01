import { useId } from "react";
import { StatusChip } from "./status-chip";
import { Tooltip } from "@/app/components/ui/tooltip";
import type { WalletSnapshot } from "./types";

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

export function WalletCard({ wallet }: { wallet: WalletSnapshot }) {

  const titleId = useId();
  const balanceId = useId();
  const securityId = useId();
  const statusId = useId();

  return (
    <article
      className="rounded-[24px] border border-cyan-400/20 bg-[linear-gradient(160deg,rgba(14,116,144,0.18),rgba(15,23,42,0.92))] p-5 motion-safe:transition hover:border-cyan-400/40"
      aria-labelledby={titleId}
      aria-describedby={`${balanceId} ${securityId} ${statusId}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p id={titleId} className="text-sm text-cyan-100/80">Primary wallet</p>
          <p id={balanceId} className="mt-3 truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">
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
      <button type="button" className="focus-ring-cyan">
        {actionLabel[wallet.connection]}
      </button>
    </article>
  );
}
