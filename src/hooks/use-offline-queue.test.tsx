import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOfflineQueue } from "@/hooks/use-offline-queue";

function QueueHarness({ executor }: { executor: (action: { id: string }) => Promise<void> }) {
  const queue = useOfflineQueue(executor);
  return (
    <div>
      <output data-testid="queue-size">{queue.state.queue.length}</output>
      <button onClick={() => queue.enqueue({ id: "save", label: "Save changes" })}>Queue</button>
      <button onClick={() => queue.cancel(queue.state.queue[0]?.id ?? "")}>Cancel</button>
    </div>
  );
}

describe("useOfflineQueue", () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
  });

  it("persists queued actions, flushes them on reconnect, and allows cancellation", async () => {
    const executor = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(<QueueHarness executor={executor} />);

    fireEvent.click(screen.getByRole("button", { name: "Queue" }));
    expect(screen.getByTestId("queue-size")).toHaveTextContent("1");
    expect(window.localStorage.getItem("chronopay:offline-queue")).toContain("Save changes");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByTestId("queue-size")).toHaveTextContent("0");

    fireEvent.click(screen.getByRole("button", { name: "Queue" }));
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    rerender(<QueueHarness executor={executor} />);
    window.dispatchEvent(new Event("online"));

    await waitFor(() => expect(executor).toHaveBeenCalledTimes(1));
  });
});
