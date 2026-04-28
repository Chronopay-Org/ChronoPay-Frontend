import { StatusChip } from "./status-chip";
import type { WalletSnapshot } from "./types";

export function WalletCard({ wallet }: { wallet: WalletSnapshot }) {
  return (
    <article className="rounded-[24px] border border-cyan-400/20 bg-[linear-gradient(160deg,rgba(14,116,144,0.18),rgba(15,23,42,0.92))] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="helper-text helper-text--emphasis">Primary wallet</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {wallet.balance}
          </p>
        </div>
        <StatusChip tone="neutral">secured</StatusChip>
      </div>
      <dl className="mt-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <dt className="helper-text">Pending escrow</dt>
          <dd className="text-sm font-medium text-white">{wallet.pending}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="helper-text">Next payout</dt>
          <dd className="text-sm font-medium text-white">{wallet.nextPayout}</dd>
        </div>
      </dl>
      <p className="helper-text helper-text--emphasis mt-6">{wallet.status}</p>
    </article>
  );
}
