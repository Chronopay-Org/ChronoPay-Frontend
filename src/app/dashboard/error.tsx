"use client";

import Link from "next/link";
import { useEffect } from "react";
import { DashboardShell } from "../components/dashboard-shell";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <DashboardShell>
      <section
        role="alert"
        className="glass-panel mx-auto max-w-2xl rounded-[2rem] p-6 sm:p-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-300">
          Error state
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
          We could not load your booking workspace
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          Nothing has been published or charged. Try again to reload the dashboard, or return home if you want to restart from a safe point.
        </p>
        <div className="mt-6 rounded-[1.5rem] border border-rose-300/15 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          {error.message || "Unexpected dashboard error."}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full bg-cyan-300 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-cyan-200"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-medium text-slate-100 hover:border-cyan-200/30 hover:bg-white/10"
          >
            Go home
          </Link>
        </div>
      </section>
    </DashboardShell>
  );
}
