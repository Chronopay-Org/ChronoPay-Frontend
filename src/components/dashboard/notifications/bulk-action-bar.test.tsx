import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BulkActionBar } from "./bulk-action-bar";

describe("BulkActionBar", () => {
  it("shows the selected count and fires mark-as-read", () => {
    const onMarkAsRead = vi.fn();
    const onArchive = vi.fn();
    render(
      <BulkActionBar
        selectedCount={3}
        onMarkAsRead={onMarkAsRead}
        onArchive={onArchive}
      />,
    );

    expect(screen.getByText("3 selected")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Mark 3 notifications as read" }),
    );
    expect(onMarkAsRead).toHaveBeenCalledTimes(1);
    expect(onArchive).not.toHaveBeenCalled();
  });

  it("uses singular labels for one selection and fires archive", () => {
    const onMarkAsRead = vi.fn();
    const onArchive = vi.fn();
    render(
      <BulkActionBar
        selectedCount={1}
        onMarkAsRead={onMarkAsRead}
        onArchive={onArchive}
      />,
    );

    expect(screen.getByText("1 selected")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Archive 1 notification" }),
    );
    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(onMarkAsRead).not.toHaveBeenCalled();
  });
});
