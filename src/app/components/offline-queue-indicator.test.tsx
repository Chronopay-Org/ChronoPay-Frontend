import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfflineQueueIndicator } from "@/app/components/offline-queue-indicator";
import type { QueuedAction } from "@/components/dashboard/types";

const mockQueuedAction: QueuedAction = {
  id: "action-1",
  label: "Create booking",
  status: "pending",
  queuedAt: new Date().toISOString(),
};

const mockFailedAction: QueuedAction = {
  id: "action-2",
  label: "Send message",
  status: "failed",
  queuedAt: new Date().toISOString(),
  error: "Network error",
};

describe("OfflineQueueIndicator", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  it("renders online status when navigator is online by default", () => {
    render(<OfflineQueueIndicator />);
    expect(screen.getByRole("button", { name: /online/i })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /offline queue/i })).not.toBeInTheDocument();
  });

  it("renders offline status when simulateOffline is true", async () => {
    render(<OfflineQueueIndicator simulateOffline />);
    expect(await screen.findByRole("button", { name: /offline/i })).toBeInTheDocument();
  });

  it("shows pending count badge when offline", () => {
    render(
      <OfflineQueueIndicator
        simulateOffline
        initialState={{
          connection: "offline",
          queue: [mockQueuedAction, mockQueuedAction],
        }}
      />
    );
    const trigger = screen.getByRole("button", { name: /offline/i });
    expect(trigger).toHaveTextContent("2");
  });

  it("expands panel on click and shows queued actions", async () => {
    const user = userEvent.setup();
    render(
      <OfflineQueueIndicator
        simulateOffline
        initialState={{
          connection: "offline",
          queue: [mockQueuedAction],
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: /offline/i }));

    const panel = await screen.findByRole("dialog", { name: /offline queue/i });
    expect(panel).toBeInTheDocument();
    expect(screen.getByText("Create booking")).toBeInTheDocument();
    expect(screen.getByText(/1 pending action/)).toBeInTheDocument();
  });

  it("collapses panel on Escape and returns focus to trigger", async () => {
    const user = userEvent.setup();
    render(
      <OfflineQueueIndicator
        simulateOffline
        initialState={{
          connection: "offline",
          queue: [mockQueuedAction],
        }}
      />
    );

    const trigger = screen.getByRole("button", { name: /offline/i });
    await user.click(trigger);

    await screen.findByRole("dialog", { name: /offline queue/i });
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog", { name: /offline queue/i })).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("collapses panel when close button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <OfflineQueueIndicator
        simulateOffline
        initialState={{
          connection: "offline",
          queue: [mockQueuedAction],
        }}
      />
    );

    const trigger = screen.getByRole("button", { name: /offline/i });
    await user.click(trigger);

    await screen.findByRole("dialog", { name: /offline queue/i });
    await user.click(screen.getByRole("button", { name: /close offline queue/i }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: /offline queue/i })).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <OfflineQueueIndicator
        simulateOffline
        initialState={{
          connection: "offline",
          queue: [mockQueuedAction],
        }}
        onRetry={onRetry}
      />
    );

    await user.click(screen.getByRole("button", { name: /offline/i }));
    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(onRetry).toHaveBeenCalledWith("action-1");
  });

  it("shows loading state while retrying", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 100)));
    render(
      <OfflineQueueIndicator
        simulateOffline
        initialState={{
          connection: "offline",
          queue: [mockQueuedAction],
        }}
        onRetry={onRetry}
      />
    );

    await user.click(screen.getByRole("button", { name: /offline/i }));
    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(screen.getByRole("button", { name: /retrying/i })).toBeDisabled();
    expect(screen.getByText("Retrying")).toBeInTheDocument();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <OfflineQueueIndicator
        simulateOffline
        initialState={{
          connection: "offline",
          queue: [mockQueuedAction],
        }}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole("button", { name: /offline/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledWith("action-1");
    expect(screen.queryByText("Create booking")).not.toBeInTheDocument();
  });

  it("marks action as completed after successful retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn(() => Promise.resolve());
    render(
      <OfflineQueueIndicator
        simulateOffline
        initialState={{
          connection: "offline",
          queue: [mockQueuedAction],
        }}
        onRetry={onRetry}
      />
    );

    await user.click(screen.getByRole("button", { name: /offline/i }));
    await user.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() =>
      expect(screen.getByText("completed")).toBeInTheDocument()
    );
    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
  });

  it("hides cancel button when action is completed", async () => {
    const user = userEvent.setup();
    render(
      <OfflineQueueIndicator
        simulateOffline
        initialState={{
          connection: "offline",
          queue: [
            { ...mockQueuedAction, status: "completed" },
          ],
        }}
        onCancel={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /offline/i }));
    expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
  });

  it("shows cancel button for retrying action with onCancel", async () => {
    const user = userEvent.setup();
    render(
      <OfflineQueueIndicator
        simulateOffline
        initialState={{
          connection: "offline",
          queue: [
            { ...mockQueuedAction, status: "retrying" },
          ],
        }}
        onCancel={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /offline/i }));
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("shows cancel button for failed action with onCancel", async () => {
    const user = userEvent.setup();
    render(
      <OfflineQueueIndicator
        simulateOffline
        initialState={{
          connection: "offline",
          queue: [
            { ...mockFailedAction, status: "failed" },
          ],
        }}
        onCancel={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /offline/i }));
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("does not show offline warning when reconnecting", async () => {
    const user = userEvent.setup();
    render(
      <OfflineQueueIndicator
        initialState={{
          connection: "reconnecting",
          queue: [mockQueuedAction],
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: /reconnecting/i }));
    expect(screen.queryByText(/you are currently offline/i)).not.toBeInTheDocument();
  });

  it("marks action as failed after failed retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn(() => Promise.reject("Network error"));
    render(
      <OfflineQueueIndicator
        simulateOffline
        initialState={{
          connection: "offline",
          queue: [mockQueuedAction],
        }}
        onRetry={onRetry}
      />
    );

    await user.click(screen.getByRole("button", { name: /offline/i }));
    await user.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() =>
      expect(screen.getByText("failed")).toBeInTheDocument()
    );
    expect(screen.getByText("Retry failed.")).toBeInTheDocument();
  });

  it("announces reconnection when online event fires", async () => {
    render(
      <OfflineQueueIndicator
        initialState={{
          connection: "offline",
          queue: [mockQueuedAction],
        }}
      />
    );

    window.dispatchEvent(new Event("online"));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/back online/i)
    );
  });

  it("updates queue items from retrying to pending on reconnection", async () => {
    render(
      <OfflineQueueIndicator
        initialState={{
          connection: "offline",
          queue: [
            { ...mockQueuedAction, status: "retrying" },
            { ...mockFailedAction, status: "pending" },
          ],
        }}
      />
    );

    window.dispatchEvent(new Event("online"));

    await waitFor(() => {
      const liveRegion = screen.getByRole("status", { name: /sync status/i });
      expect(liveRegion).toHaveTextContent(/back online/i);
    });
  });

  it("shows reconnecting status when connection is reconnecting", () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });
    render(
      <OfflineQueueIndicator
        initialState={{
          connection: "reconnecting",
          queue: [],
        }}
      />
    );

    expect(screen.getByRole("button", { name: /reconnecting/i })).toBeInTheDocument();
  });

  it("shows no pending actions message when queue is empty", async () => {
    const user = userEvent.setup();
    render(
      <OfflineQueueIndicator
        simulateOffline
        initialState={{
          connection: "offline",
          queue: [],
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: /offline/i }));

    expect(screen.getByText("No pending actions.")).toBeInTheDocument();
  });

  it("hides retry button when onRetry is not provided", async () => {
    const user = userEvent.setup();
    render(
      <OfflineQueueIndicator
        simulateOffline
        initialState={{
          connection: "offline",
          queue: [mockFailedAction],
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: /offline/i }));

    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
  });

  it("hides cancel button when onCancel is not provided", async () => {
    const user = userEvent.setup();
    render(
      <OfflineQueueIndicator
        simulateOffline
        initialState={{
          connection: "offline",
          queue: [mockQueuedAction],
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: /offline/i }));

    expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
  });

  it("triggers offline event when navigator goes offline", async () => {
    render(<OfflineQueueIndicator />);

    Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });
    window.dispatchEvent(new Event("offline"));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /offline/i })).toBeInTheDocument()
    );
  });

  it("clears live region message after timeout", async () => {
    vi.useFakeTimers();
    render(
      <OfflineQueueIndicator
        initialState={{
          connection: "offline",
          queue: [mockQueuedAction],
        }}
      />
    );

    window.dispatchEvent(new Event("online"));

    await vi.advanceTimersByTimeAsync(3100);

    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveTextContent("");
    vi.useRealTimers();
  });

  it("falls back to raw iso string for invalid date", async () => {
    const originalToLocaleTimeString = Date.prototype.toLocaleTimeString;
    Date.prototype.toLocaleTimeString = () => {
      throw new Error("format failed");
    };

    const invalidAction: QueuedAction = {
      ...mockQueuedAction,
      queuedAt: "not-a-date",
    };
    render(
      <OfflineQueueIndicator
        simulateOffline
        initialState={{
          connection: "offline",
          queue: [invalidAction],
        }}
      />
    );

    await userEvent.setup().click(screen.getByRole("button", { name: /offline/i }));
    expect(screen.getByText("Create booking")).toBeInTheDocument();
    expect(screen.getByText(/not-a-date/)).toBeInTheDocument();

    Date.prototype.toLocaleTimeString = originalToLocaleTimeString;
  });
});
