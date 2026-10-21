import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, describe, vi } from "vitest";
import { NotificationItem } from "./notification-item";
import type { NotificationItem as NotificationItemType } from "./types";

const mockNotification: NotificationItemType = {
  id: "test-1",
  title: "Test Notification",
  description: "This is a test notification.",
  timestamp: "10 mins ago",
  read: false,
  tone: "info",
};

describe("NotificationItem", () => {
  test("renders correctly with given props", () => {
    const onToggle = vi.fn();
    const onFocusIndex = vi.fn();

    render(
      <NotificationItem
        notification={mockNotification}
        isSelected={false}
        onToggle={onToggle}
        index={0}
        onFocusIndex={onFocusIndex}
      />
    );

    expect(screen.getByText("Test Notification")).toBeInTheDocument();
    expect(screen.getByText("This is a test notification.")).toBeInTheDocument();
    expect(screen.getByText("10 mins ago")).toBeInTheDocument();
    
    // Checkbox should not be checked
    const checkbox = screen.getByRole("checkbox", { name: /select notification: test notification/i });
    expect(checkbox).not.toBeChecked();
  });

  test("applies selected state when isSelected is true", () => {
    const onToggle = vi.fn();
    const onFocusIndex = vi.fn();

    render(
      <NotificationItem
        notification={mockNotification}
        isSelected={true}
        onToggle={onToggle}
        index={0}
        onFocusIndex={onFocusIndex}
      />
    );

    const checkbox = screen.getByRole("checkbox", { name: /select notification: test notification/i });
    expect(checkbox).toBeChecked();
    
    // Element has aria-selected=true
    const listItem = screen.getByRole("option");
    expect(listItem).toHaveAttribute("aria-selected", "true");
  });

  test("calls onToggle when clicked", async () => {
    const onToggle = vi.fn();
    const onFocusIndex = vi.fn();
    const user = userEvent.setup();

    render(
      <NotificationItem
        notification={mockNotification}
        isSelected={false}
        onToggle={onToggle}
        index={0}
        onFocusIndex={onFocusIndex}
      />
    );

    const listItem = screen.getByRole("option");
    await user.click(listItem);

    expect(onToggle).toHaveBeenCalledWith("test-1");
  });

  test("calls onToggle when spacebar is pressed", async () => {
    const onToggle = vi.fn();
    const onFocusIndex = vi.fn();
    const user = userEvent.setup();

    render(
      <NotificationItem
        notification={mockNotification}
        isSelected={false}
        onToggle={onToggle}
        index={0}
        onFocusIndex={onFocusIndex}
      />
    );

    const listItem = screen.getByRole("option");
    listItem.focus();
    await user.keyboard(" ");

    expect(onToggle).toHaveBeenCalledWith("test-1");
  });

  test("calls onFocusIndex when focused", async () => {
    const onToggle = vi.fn();
    const onFocusIndex = vi.fn();

    render(
      <NotificationItem
        notification={mockNotification}
        isSelected={false}
        onToggle={onToggle}
        index={2}
        onFocusIndex={onFocusIndex}
      />
    );

    const listItem = screen.getByRole("option");
    listItem.focus();

    expect(onFocusIndex).toHaveBeenCalledWith(2);
  });
  
  test("renders read state correctly", () => {
    const onToggle = vi.fn();
    const onFocusIndex = vi.fn();
    
    const readNotification = { ...mockNotification, read: true };

    render(
      <NotificationItem
        notification={readNotification}
        isSelected={false}
        onToggle={onToggle}
        index={0}
        onFocusIndex={onFocusIndex}
      />
    );

    const title = screen.getByText("Test Notification");
    expect(title).toHaveClass("text-slate-300");
  });
  
  test("handles missing description gracefully", () => {
    const onToggle = vi.fn();
    const onFocusIndex = vi.fn();
    
    const noDescNotification = { ...mockNotification, description: undefined };

    render(
      <NotificationItem
        notification={noDescNotification}
        isSelected={false}
        onToggle={onToggle}
        index={0}
        onFocusIndex={onFocusIndex}
      />
    );

    expect(screen.getByText("Test Notification")).toBeInTheDocument();
    expect(screen.queryByText("This is a test notification.")).not.toBeInTheDocument();
  });
});
