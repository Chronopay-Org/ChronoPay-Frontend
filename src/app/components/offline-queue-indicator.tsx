"use client";

import { useState, useEffect, useCallback, useRef, useId } from "react";
import { clsx } from "clsx";
import { WifiOff, Loader2, RefreshCw, X } from "lucide-react";
import { StatusChip } from "@/components/dashboard/status-chip";
import type { QueuedAction, OfflineQueueState, OfflineQueueConnectionState } from "@/components/dashboard/types";

type OfflineQueueIndicatorProps = {
  initialState?: OfflineQueueState;
  onRetry?: (actionId: string) => void | Promise<void>;
  onCancel?: (actionId: string) => void;
  simulateOffline?: boolean;
};

export function OfflineQueueIndicator({
  initialState = { connection: "online", queue: [] },
  onRetry,
  onCancel,
  simulateOffline = false,
}: OfflineQueueIndicatorProps) {
  const [connection, setConnection] = useState<OfflineQueueConnectionState>(initialState.connection);
  const [queue, setQueue] = useState<QueuedAction[]>(initialState.queue);
  const [isExpanded, setIsExpanded] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const statusId = useId();
  const panelId = useId();

  const pendingCount = queue.filter((item) => item.status === "pending" || item.status === "retrying").length;

  const announce = useCallback((message: string) => {
    const el = document.getElementById(statusId);
    if (el) {
      el.textContent = message;
      setTimeout(() => {
        if (el) el.textContent = "";
      }, 3000);
    }
  }, [statusId]);

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    if (simulateOffline) {
      queueMicrotask(() => {
        setConnection("offline");
      });
      return;
    }

    const setOnline = () => {
      setConnection("online");
      announce("Back online. Syncing queued actions.");
      setQueue((prev) =>
        prev.map((item) =>
          item.status === "pending" || item.status === "retrying" ? { ...item, status: "pending" as const } : item
        )
      );
    };

    const setOffline = () => {
      setConnection("offline");
      announce("You are offline. Actions will be queued until reconnection.");
    };

    window.addEventListener("online", setOnline);
    window.addEventListener("offline", setOffline);
    return () => {
      window.removeEventListener("online", setOnline);
      window.removeEventListener("offline", setOffline);
    };
  }, [announce, simulateOffline]);

  useEffect(() => {
    if (!isExpanded) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExpanded(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isExpanded]);

  const handleRetry = useCallback(
    async (actionId: string) => {
      if (!onRetry) return;
      setRetryingId(actionId);
      setQueue((prev) => prev.map((item) => (item.id === actionId ? { ...item, status: "retrying" as const } : item)));
      try {
        await onRetry(actionId);
        setQueue((prev) => prev.map((item) => (item.id === actionId ? { ...item, status: "completed" as const } : item)));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Retry failed.";
        setQueue((prev) =>
          prev.map((item) => (item.id === actionId ? { ...item, status: "failed" as const, error: message } : item))
        );
      } finally {
        setRetryingId(null);
      }
    },
    [onRetry]
  );

  const handleCancel = useCallback(
    (actionId: string) => {
      if (!onCancel) return;
      onCancel(actionId);
      setQueue((prev) => prev.filter((item) => item.id !== actionId));
    },
    [onCancel]
  );

  const formatTime = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  };

  const isOffline = connection === "offline";

  return (
    <div className="relative">
      <div id={statusId} role="status" aria-live="polite" aria-atomic="true" aria-label="Sync status" className="sr-only" />
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        aria-haspopup="true"
        className={clsx(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-ring-cyan",
          isOffline
            ? "border-rose-400/25 bg-rose-400/10 text-rose-100"
            : "border-white/10 bg-white/6 text-slate-200 hover:border-white/20"
        )}
      >
        {connection === "reconnecting" ? (
          <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <WifiOff aria-hidden="true" className="h-3.5 w-3.5" />
        )}
        <span>{isOffline ? "Offline" : connection === "reconnecting" ? "Reconnecting" : "Online"}</span>
        {pendingCount > 0 && (
          <span aria-hidden="true" className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold">
            {pendingCount}
          </span>
        )}
      </button>

      {isExpanded && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label="Offline queue"
          className="absolute right-0 z-40 mt-2 w-80 origin-top-right rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-[0_24px_60px_-20px_rgba(2,6,23,0.95)] backdrop-blur-xl sm:w-96"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Offline queue</p>
              <p className="helper-text helper-text--muted">
                {pendingCount} pending action{pendingCount === 1 ? "" : "s"} while {isOffline ? "offline" : "reconnecting"}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                triggerRef.current?.focus();
              }}
              className="rounded-full p-1.5 text-slate-400 hover:text-white focus-ring-cyan"
              aria-label="Close offline queue"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {queue.length === 0 && (
              <p className="helper-text helper-text--muted">No pending actions.</p>
            )}
            {queue.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/6 bg-white/4 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{item.label}</p>
                    <p className="text-[11px] text-slate-400">Queued at {formatTime(item.queuedAt)}</p>
                    {item.error && (
                      <p className="text-[11px] text-rose-300">{item.error}</p>
                    )}
                  </div>
                  <StatusChip tone={item.status === "failed" ? "critical" : item.status === "completed" ? "positive" : item.status === "retrying" ? "warning" : "neutral"}>
                    {item.status}
                  </StatusChip>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {onRetry && item.status !== "completed" && (
                    <button
                      type="button"
                      onClick={() => handleRetry(item.id)}
                      disabled={retryingId === item.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-white/20 focus-ring-cyan disabled:opacity-60"
                    >
                      {retryingId === item.id ? (
                        <Loader2 aria-hidden="true" className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw aria-hidden="true" className="h-3 w-3" />
                      )}
                      {retryingId === item.id ? "Retrying" : "Retry"}
                    </button>
                  )}
                  {onCancel && (item.status === "pending" || item.status === "retrying" || item.status === "failed") && (
                    <button
                      type="button"
                      onClick={() => handleCancel(item.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-rose-300/30 hover:bg-rose-400/10 focus-ring-cyan"
                    >
                      <X aria-hidden="true" className="h-3 w-3" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isOffline && (
            <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/8 p-3">
              <p className="text-xs text-amber-200">
                You are currently offline. Actions will automatically retry when connection is restored.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
