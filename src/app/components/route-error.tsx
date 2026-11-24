"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useOptionalRole } from "@/app/components/navigation/RoleContext";
import { EmptyStateIllustration } from "./empty-state-illustration";
import { reportError } from "@/lib/report-error";

interface RouteErrorProps {
  error?: Error & { digest?: string };
  reset: () => void;
  description?: string;
}

export function RouteError({
  error,
  reset,
  description = "We couldn't load this page. This might be a temporary issue.",
}: RouteErrorProps) {
  const role = useOptionalRole();

  useEffect(() => {
    if (!error) return;

    reportError(error, {
      pathname: window.location.pathname,
      role,
      digest: error.digest,
    });
  }, [error, role]);

  return (
    <main id="main-content" className="min-h-[60vh] px-4 py-12 sm:px-6">
      <section
        role="alert"
        className="glass-panel mx-auto max-w-2xl rounded-[2rem] p-6 sm:p-8"
        aria-labelledby="route-error-title"
        aria-describedby="route-error-description"
      >
        <EmptyStateIllustration
          accentLabel="Error"
          variant="error"
          alt="Error state illustration showing a disconnected UI layout"
        />
        <h1
          id="route-error-title"
          className="mt-4 text-3xl font-semibold tracking-tight text-white"
        >
          Oops! Something went wrong.
        </h1>
        <p
          id="route-error-description"
          className="mt-4 text-sm leading-7 text-slate-300"
        >
          {description}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full bg-cyan-300 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
          >
            Try again
          </button>
          <Link
            href="/status"
            className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-medium text-slate-100 hover:border-cyan-200/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
          >
            View status page
          </Link>
          <Link
            href="mailto:support@chronopay.com"
            className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-medium text-slate-100 hover:border-rose-200/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
          >
            Contact support
          </Link>
        </div>
      </section>
    </main>
  );
}
