import type { QueuedAction } from "@/components/dashboard/types";

export type OfflineActionInput = {
  id: string;
  label: string;
};

export type OfflineQueueExecutor = (action: QueuedAction) => Promise<void>;

export type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  wait?: (milliseconds: number) => Promise<void>;
  shouldContinue?: () => boolean;
  onChange?: (action: QueuedAction) => void;
};

const registeredExecutors = new Map<string, OfflineQueueExecutor>();
const executorListeners = new Set<() => void>();
const activeActions = new Set<string>();

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export function enqueue(
  queue: QueuedAction[],
  input: OfflineActionInput,
  now = new Date(),
): QueuedAction[] {
  return [
    ...queue,
    {
      id: createActionId(),
      executorId: input.id,
      label: input.label,
      status: "pending",
      queuedAt: now.toISOString(),
      attempts: 0,
    },
  ];
}

export function cancel(queue: QueuedAction[], actionId: string): QueuedAction[] {
  return queue.filter((action) => action.id !== actionId);
}

export function registerOfflineExecutor(
  id: string,
  executor: OfflineQueueExecutor,
): () => void {
  registeredExecutors.set(id, executor);
  for (const listener of Array.from(executorListeners)) listener();
  return () => {
    if (registeredExecutors.get(id) === executor) registeredExecutors.delete(id);
  };
}

export function subscribeToExecutorRegistration(listener: () => void): () => void {
  executorListeners.add(listener);
  return () => executorListeners.delete(listener);
}

export function getOfflineExecutor(id: string): OfflineQueueExecutor | undefined {
  return registeredExecutors.get(id);
}

export function isActionInFlight(id: string): boolean {
  return activeActions.has(id);
}

export function setActionInFlight(id: string, inFlight: boolean): void {
  if (inFlight) activeActions.add(id);
  else activeActions.delete(id);
}

export async function retry(
  action: QueuedAction,
  executor: OfflineQueueExecutor,
  options: RetryOptions = {},
): Promise<QueuedAction> {
  const maxAttempts = options.maxAttempts ?? 5;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const waitForRetry = options.wait ?? wait;
  const shouldContinue = options.shouldContinue ?? (() => true);
  const firstAttempt = action.status === "failed" ? 0 : action.attempts ?? 0;
  let latest = action;

  const remainingDelay = action.nextRetryAt
    ? new Date(action.nextRetryAt).getTime() - Date.now()
    : 0;
  if (remainingDelay > 0) await waitForRetry(remainingDelay);

  for (let attempt = firstAttempt; attempt < maxAttempts; attempt += 1) {
    if (!shouldContinue()) return latest;
    latest = {
      ...latest,
      status: "retrying",
      attempts: attempt + 1,
      error: undefined,
      nextRetryAt: undefined,
    };
    options.onChange?.(latest);

    try {
      await executor(action);
      latest = { ...latest, status: "completed", error: undefined, nextRetryAt: undefined };
      options.onChange?.(latest);
      return latest;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Retry failed.";
      if (attempt + 1 >= maxAttempts) {
        latest = { ...latest, status: "failed", error: message, nextRetryAt: undefined };
        options.onChange?.(latest);
        return latest;
      }

      const delay = baseDelayMs * 2 ** attempt;
      latest = {
        ...latest,
        status: "pending",
        error: message,
        nextRetryAt: new Date(Date.now() + delay).toISOString(),
      };
      options.onChange?.(latest);
      await waitForRetry(delay);
      if (!shouldContinue()) return latest;
    }
  }

  return latest;
}

function createActionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
