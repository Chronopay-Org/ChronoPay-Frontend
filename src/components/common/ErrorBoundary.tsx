"use client";

/**
 * ErrorBoundary — React class-based error boundary for the ChronoPay dashboard.
 *
 * Next.js App Router provides a built-in error.tsx convention, but React error
 * boundaries are still the only way to catch errors inside deeply nested
 * client subtrees without unmounting the entire page.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <WalletCard wallet={wallet} />
 *   </ErrorBoundary>
 *
 *   // With custom fallback:
 *   <ErrorBoundary fallback={<p>Wallet unavailable.</p>}>
 *     <WalletCard wallet={wallet} />
 *   </ErrorBoundary>
 *
 * The default fallback is a minimal card that shows the error message and a
 * retry button that resets the boundary state.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI. Receives the error and a reset callback. */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Called when an error is caught — useful for logging to Sentry etc. */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
    // Log to console in development; swap for Sentry.captureException in production
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  reset = () => this.setState({ error: null });

  override render() {
    const { error } = this.state;

    if (error) {
      const { fallback } = this.props;

      if (typeof fallback === "function") {
        return fallback(error, this.reset);
      }
      if (fallback) {
        return fallback;
      }

      return <DefaultFallback error={error} onReset={this.reset} />;
    }

    return this.props.children;
  }
}

// ─── Default fallback UI ──────────────────────────────────────────────────────

function DefaultFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-start gap-4 rounded-[1.5rem] border border-rose-400/20 bg-rose-950/30 p-5 text-sm backdrop-blur-sm"
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="mt-0.5 h-5 w-5 shrink-0 text-rose-400"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="font-semibold text-rose-100">Something went wrong</p>
          <p className="text-rose-200/70">
            {error.message || "An unexpected error occurred in this section."}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-xs font-medium text-rose-100 transition-colors hover:bg-rose-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}
