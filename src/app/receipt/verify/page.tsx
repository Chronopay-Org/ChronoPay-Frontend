import Link from "next/link";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { StatusChip } from "@/components/dashboard/status-chip";
import { parseVerifyParams } from "@/components/receipt/masking";

export interface ReceiptVerifyViewProps {
  query: Record<string, string | string[] | undefined>;
}

export function ReceiptVerifyView({ query }: ReceiptVerifyViewProps) {
  const parsed = parseVerifyParams(query);

  if (!parsed.ok) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-12 text-slate-100">
        <article
          role="alert"
          className="glass-panel rounded-[2rem] border border-rose-400/30 bg-slate-950/60 p-6 sm:p-8"
        >
          <header className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 h-6 w-6 shrink-0 text-rose-400"
              aria-hidden={true}
            />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-300">
                ChronoPay
              </p>
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                Invalid verification link
              </h1>
              <p className="text-sm text-slate-300">{parsed.error}</p>
            </div>
          </header>

          <div className="mt-6 border-t border-white/10 pt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-300/30 hover:bg-white/10"
            >
              Return to ChronoPay
            </Link>
          </div>
        </article>
      </main>
    );
  }

  const { asset, tx, buyer, seller, total, settled } = parsed.data;

  const rows = [
    { label: "Minted asset", value: asset },
    { label: "Buyer", value: buyer },
    { label: "Seller", value: seller },
    { label: "Transaction hash", value: tx },
    { label: "Total settled", value: total },
    { label: "Settled at", value: settled },
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-12 text-slate-100">
      <article
        className="glass-panel rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 sm:p-8"
        aria-labelledby="verify-receipt-title"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              ChronoPay
            </p>
            <h1
              id="verify-receipt-title"
              className="text-xl font-extrabold tracking-tight text-white"
            >
              Receipt Verification
            </h1>
            <p className="helper-text helper-text--muted">
              Masked public summary of a settled transaction.
            </p>
          </div>
          <StatusChip tone="positive">Verified</StatusChip>
        </header>

        <dl className="mt-5 space-y-3 text-sm">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-4"
            >
              <dt className="text-slate-300">{row.label}</dt>
              <dd className="shrink-0 font-mono font-semibold text-white">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <footer className="mt-6 flex items-start gap-2 border-t border-white/10 pt-5 text-xs text-slate-400">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400"
            aria-hidden={true}
          />
          <p className="leading-relaxed">
            Sensitive fields are masked. Full counterparty names, transaction
            hashes, and escrow contracts are never exposed on public
            verification links.
          </p>
        </footer>
      </article>
    </main>
  );
}

type ReceiptVerifyPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReceiptVerifyPage({
  searchParams,
}: ReceiptVerifyPageProps) {
  const query = await searchParams;
  return <ReceiptVerifyView query={query} />;
}
