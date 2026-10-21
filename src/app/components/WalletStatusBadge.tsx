"use client";

import { StatusChip } from "./ui/status-chip";
import { useWallet } from "./useWallet";

function formatAddress(address?: string) {
  if (!address) return "Connected";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletStatusBadge() {
  const { status, address, connect } = useWallet();

  if (status === "loading") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-300"
      >
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
        <span>Connecting wallet</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip tone="danger">Wallet error</StatusChip>
        <button
          type="button"
          onClick={connect}
          className="inline-flex items-center rounded-full border border-rose-300/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20"
          aria-label="Retry wallet connection"
        >
          Retry
        </button>
      </div>
    );
  }

  if (status === "disconnected") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip tone="warning">Disconnected</StatusChip>
        <button
          type="button"
          onClick={connect}
          className="inline-flex items-center rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
          aria-label="Connect wallet"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <span title={address ? `Connected wallet ${address}` : "Connected wallet"}>
      <StatusChip tone="success">{formatAddress(address)}</StatusChip>
    </span>
  );
}
