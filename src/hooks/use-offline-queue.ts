"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  OfflineQueueConnectionState,
  OfflineQueueState,
  QueuedAction,
} from "@/components/dashboard/types";
import { useStoredState } from "@/hooks/use-stored-state";
import {
  cancel,
  enqueue,
  getOfflineExecutor,
  isActionInFlight,
  retry,
  setActionInFlight,
  subscribeToExecutorRegistration,
  type OfflineActionInput,
  type OfflineQueueExecutor,
} from "@/lib/offline-queue";

const STORAGE_KEY = "chronopay:offline-queue";

function parseQueue(raw: string): QueuedAction[] | undefined {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    return parsed.filter(isQueuedAction).map((action) => ({
      ...action,
      status: action.status === "retrying" ? "pending" : action.status,
    }));
  } catch {
    return undefined;
  }
}

function isQueuedAction(value: unknown): value is QueuedAction {
  if (typeof value !== "object" || value === null) return false;
  const action = value as Partial<QueuedAction>;
  return (
    typeof action.id === "string" &&
    typeof action.label === "string" &&
    typeof action.queuedAt === "string" &&
    ["pending", "retrying", "completed", "failed"].includes(action.status ?? "")
  );
}

function getConnection(): OfflineQueueConnectionState {
  return typeof navigator === "undefined" || navigator.onLine ? "online" : "offline";
}

export type UseOfflineQueueResult = {
  state: OfflineQueueState;
  enqueue: (action: OfflineActionInput) => void;
  cancel: (actionId: string) => void;
  retry: (actionId: string) => Promise<void>;
};

export function useOfflineQueue(
  fallbackExecutor?: OfflineQueueExecutor,
): UseOfflineQueueResult {
  const stored = useStoredState<QueuedAction[]>(STORAGE_KEY, {
    defaultValue: [],
    parse: parseQueue,
  });
  const [connection, setConnection] = useState(getConnection);
  const queueRef = useRef(stored.value);
  const cancelledRef = useRef(new Set<string>());
  const executorRef = useRef(fallbackExecutor);
  executorRef.current = fallbackExecutor;
  queueRef.current = stored.value;

  const updateQueue = useCallback(
    (update: (queue: QueuedAction[]) => QueuedAction[]) => {
      const next = update(queueRef.current);
      queueRef.current = next;
      stored.setValue(next);
    },
    [stored.setValue],
  );

  const retryAction = useCallback(
    async (actionId: string) => {
      const action = queueRef.current.find((entry) => entry.id === actionId);
      if (!action) return;
      if (isActionInFlight(actionId)) return;
      const executor =
        (action.executorId ? getOfflineExecutor(action.executorId) : undefined) ??
        executorRef.current;
      if (!executor) {
        updateQueue((queue) =>
          queue.map((entry) =>
            entry.id === actionId
              ? { ...entry, status: "failed", error: "This action cannot be retried on this page." }
              : entry,
          ),
        );
        return;
      }

      cancelledRef.current.delete(actionId);
      setActionInFlight(actionId, true);
      try {
        await retry(action, executor, {
          shouldContinue: () =>
            !cancelledRef.current.has(actionId) &&
            (typeof navigator === "undefined" || navigator.onLine),
          onChange: (changed) => {
            updateQueue((queue) =>
              queue.map((entry) => (entry.id === actionId ? changed : entry)),
            );
          },
        });
      } finally {
        setActionInFlight(actionId, false);
      }
    },
    [updateQueue],
  );

  const flush = useCallback(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    const pending = queueRef.current.filter((action) => action.status === "pending");
    for (const action of pending) {
      const executor =
        (action.executorId ? getOfflineExecutor(action.executorId) : undefined) ??
        executorRef.current;
      if (executor) void retryAction(action.id);
    }
  }, [retryAction]);

  const enqueueAction = useCallback(
    (action: OfflineActionInput) => updateQueue((queue) => enqueue(queue, action)),
    [updateQueue],
  );

  const cancelAction = useCallback(
    (actionId: string) => {
      cancelledRef.current.add(actionId);
      updateQueue((queue) => cancel(queue, actionId));
    },
    [updateQueue],
  );

  useEffect(() => {
    const handleOnline = () => {
      setConnection("online");
      flush();
    };
    const handleOffline = () => setConnection("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flush]);

  useEffect(() => {
    if (stored.hydrated && connection === "online") flush();
  }, [connection, flush, stored.hydrated]);

  useEffect(() => subscribeToExecutorRegistration(flush), [flush]);

  return {
    state: { connection, queue: stored.value },
    enqueue: enqueueAction,
    cancel: cancelAction,
    retry: retryAction,
  };
}
