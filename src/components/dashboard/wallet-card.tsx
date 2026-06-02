import { useId } from "react";
import { StatusChip } from "./status-chip";
import { Tooltip } from "@/app/components/ui/tooltip";
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

export function WalletCard({ wallet }: { wallet: WalletSnapshot }) {
  const titleId = useId();
  const balanceId = useId();
  const securityId = useId();
  const statusId = useId();

  // Local UI state for the modal and connection flow
  const [isModalOpen, setModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(wallet.connection);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  // Sync external wallet connection changes (e.g., after a successful connection elsewhere)
  useEffect(() => {
    setConnectionStatus(wallet.connection);
  }, [wallet.connection]);

  const handleOpen = () => setModalOpen(true);
  const handleClose = () => {
    setModalOpen(false);
    // Reset any transient UI state when closing
    setErrorMessage(undefined);
    setConnectionStatus(wallet.connection);
  };

  const handleConnect = (providerId: string) => {
    // Simulate async connection flow
    setConnectionStatus("pending");
    // In a real app, replace this with actual SDK call
    setTimeout(() => {
      // Randomly succeed or fail for demo purposes
      const succeeded = Math.random() > 0.3;
      if (succeeded) {
        setConnectionStatus("connected");
        setErrorMessage(undefined);
      } else {
        setConnectionStatus("error");
        setErrorMessage("Unable to reach the wallet service.");
      }
    }, 1500);
  };

  const handleRetry = () => {
    setErrorMessage(undefined);
    setConnectionStatus("idle");
  };

  return (
    <>
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

          <StatusChip tone={statusTone[connectionStatus]}>
            {connectionStatus === "connected"
              ? "Connected"
              : connectionStatus === "error"
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
        <button
          type="button"
          className="mt-6 inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 px-4 py-2.5 text-sm border border-white/12 bg-white/6 text-slate-100 hover:border-cyan-200/30 hover:bg-white/10"
          onClick={handleOpen}
        >
          {actionLabel[connectionStatus]}
        </button>
      </article>

      <WalletConnectModal
        isOpen={isModalOpen}
        onClose={handleClose}
        providers={walletProviders}
        selectedProviderId={undefined}
        status={connectionStatus as any}
        errorMessage={errorMessage}
        onConnect={handleConnect}
        onRetry={handleRetry}
      />
    </>
  );
}
