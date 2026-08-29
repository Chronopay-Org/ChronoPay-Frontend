"use client";

/**
 * Shared receipt view. Renders the masked fields carried by buildShareLink
 * (truncated tx hash, masked counterparty initials, no full hash or escrow
 * contract). This is the public-facing destination of the "Copy share link"
 * action, so it intentionally shows less than the owner's in-app receipt.
 */

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, LayoutDashboard, RefreshCw, AlertTriangle, Info } from "lucide-react";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { BreadcrumbOverflow } from "@/app/components/ui/breadcrumb-overflow";
import { StatusChip } from "@/components/dashboard/status-chip";
import { Tooltip } from "@/app/components/ui/tooltip";

type SharedReceiptPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

export default function SharedReceiptPage({ params, searchParams }: SharedReceiptPageProps) {
  use(params);
  const query = use(searchParams);

  const asset = first(query.asset);
  const tx = first(query.tx);
  const buyer = first(query.buyer);
  const seller = first(query.seller);
  const total = first(query.total);
  const settled = first(query.settled);

  // Mock state for gas fee estimate refreshing and staleness
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    // Mark estimate as stale after 15 seconds
    const timer = setTimeout(() => setIsStale(true), 15000);
    return () => clearTimeout(timer);
  }, [isRefreshing]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setIsStale(false);
    }, 1000);
  };

  const rows: { label: string; value: string }[] = [
    { label: "Minted asset", value: asset },
    { label: "Buyer", value: buyer },
    { label: "Seller", value: seller },
    { label: "Transaction hash", value: tx },
    { label: "Settled at", value: settled },
  ].filter((row) => row.value);

  // Parse total to separate mock token and network cost
  const parsedTotal = parseFloat(total.replace(/[^0-9.]/g, "")) || 0;
  const tokenCost = parsedTotal > 0 ? (parsedTotal * 0.98).toFixed(2) : "0.00";
  const totalCost = parsedTotal > 0 ? parsedTotal.toFixed(2) : "0.00";
  const currencyMatch = total.match(/[A-Za-z]+$/);
  const currency = currencyMatch ? currencyMatch[0] : "USDC";

  // Mock network fees
  const networkFeeTotal = parsedTotal > 0 ? (parsedTotal * 0.02).toFixed(2) : "0.00";
  const baseFee = parsedTotal > 0 ? (parsedTotal * 0.015).toFixed(2) : "0.00";
  const priorityFee = parsedTotal > 0 ? (parsedTotal * 0.005).toFixed(2) : "0.00";

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/40 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:border-cyan-300/30 hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <ArrowLeft className="icon-directional h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </Link>

          <BreadcrumbOverflow
            className="relative"
            items={[
              { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
              { label: "Slots", href: "/dashboard/slots" },
              { label: "Receipt" },
            ]}
          />
        </div>

        <article
          className="glass-panel mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/40 p-6 text-slate-100 sm:p-8"
          aria-labelledby="shared-receipt-title"
        >
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">ChronoPay</p>
              <h1 id="shared-receipt-title" className="text-xl font-extrabold tracking-tight text-white">
                Shared Receipt
              </h1>
              <p className="helper-text helper-text--muted">Masked summary of a settled transaction.</p>
            </div>
            <StatusChip tone="positive">Settled</StatusChip>
          </header>

          {rows.length > 0 ? (
            <div className="mt-5 space-y-6">
              <dl className="space-y-3 text-sm">
                {rows.map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-4">
                    <dt className="text-slate-300">{row.label}</dt>
                    <dd className="shrink-0 font-mono font-semibold text-white">{row.value}</dd>
                  </div>
                ))}
              </dl>

              {/* Gas / Network Fee Breakdown */}
              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    Fee Breakdown
                    {isStale && (
                      <Tooltip content="Estimate may be outdated due to network volatility.">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                      </Tooltip>
                    )}
                  </h3>
                  <button
                    onClick={handleRefresh}
                    className="group flex items-center gap-1.5 text-xs font-medium text-cyan-400 transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 rounded"
                    aria-label="Refresh network fee estimate"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : 'transition-transform group-hover:rotate-180'}`} />
                    Refresh
                  </button>
                </div>
                
                <dl className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-300">Token Cost</dt>
                    <dd className="font-mono text-white">{tokenCost} {currency}</dd>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-slate-300">
                      Network Fee
                      <Tooltip content="Total cost to process your transaction on the blockchain.">
                        <Info className="h-3.5 w-3.5 text-slate-400" />
                      </Tooltip>
                    </dt>
                    <dd className="font-mono text-white">{networkFeeTotal} {currency}</dd>
                  </div>

                  <div className="pl-4 space-y-2 border-l border-white/10 ml-2">
                    <div className="flex items-center justify-between text-xs">
                      <dt className="flex items-center gap-1.5 text-slate-400">
                        Base Fee
                        <Tooltip content="The minimum network fee required to include this transaction in a block. Burned by the network.">
                          <Info className="h-3 w-3 text-slate-500" />
                        </Tooltip>
                      </dt>
                      <dd className="font-mono text-slate-300">{baseFee} {currency}</dd>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <dt className="flex items-center gap-1.5 text-slate-400">
                        Priority Fee
                        <Tooltip content="An extra tip paid to validators to process your transaction faster.">
                          <Info className="h-3 w-3 text-slate-500" />
                        </Tooltip>
                      </dt>
                      <dd className="font-mono text-slate-300">{priorityFee} {currency}</dd>
                    </div>
                  </div>
                </dl>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <dt className="font-semibold text-white">Total Settled</dt>
                  <dd className="font-mono font-bold text-cyan-300">{totalCost} {currency}</dd>
                </div>
              </div>
            </div>
          ) : (
            <p className="helper-text helper-text--muted mt-5">
              This shared link has no receipt details to display.
            </p>
          )}

          <footer className="mt-5 flex items-start gap-2 border-t border-white/10 pt-5 text-xs text-slate-400">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" aria-hidden={true} />
            <p className="leading-relaxed">
              Sensitive fields are masked. The full transaction hash and escrow contract are
              visible only to the parties in their ChronoPay dashboard.
            </p>
          </footer>
        </article>
      </div>
    </DashboardShell>
  );
}
