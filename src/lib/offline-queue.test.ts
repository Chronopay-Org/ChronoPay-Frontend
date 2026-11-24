import { beforeEach, describe, expect, it, vi } from "vitest";
import type { QueuedAction } from "@/components/dashboard/types";
import { cancel, enqueue, retry } from "@/lib/offline-queue";

describe("offline queue", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("retries with exponential backoff and stops after success", async () => {
    vi.useFakeTimers();
    const action: QueuedAction = {
      id: "action-1",
      label: "Save booking",
      queuedAt: new Date().toISOString(),
      status: "pending",
    };
    const executor = vi.fn()
      .mockRejectedValueOnce(new Error("Temporary failure"))
      .mockRejectedValueOnce(new Error("Still offline"))
      .mockResolvedValueOnce(undefined);
    const onChange = vi.fn();

    const result = retry(action, executor, { baseDelayMs: 100, onChange });
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);
    await expect(result).resolves.toMatchObject({ status: "completed", attempts: 3 });
    expect(executor).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: "pending", nextRetryAt: expect.any(String) }));
    vi.useRealTimers();
  });

  it("caps retries and supports enqueueing and cancelling persisted items", async () => {
    const queued = enqueue([], { id: "save-booking", label: "Save booking" }, new Date("2026-01-01T00:00:00Z"));
    expect(queued[0]).toMatchObject({
      executorId: "save-booking",
      label: "Save booking",
      status: "pending",
      queuedAt: "2026-01-01T00:00:00.000Z",
    });

    const executor = vi.fn().mockRejectedValue(new Error("Unavailable"));
    const result = await retry(queued[0], executor, {
      maxAttempts: 2,
      wait: async () => {},
    });
    expect(result).toMatchObject({ status: "failed", attempts: 2, error: "Unavailable" });
    expect(executor).toHaveBeenCalledTimes(2);
    expect(cancel([result], result.id)).toEqual([]);
  });
});
