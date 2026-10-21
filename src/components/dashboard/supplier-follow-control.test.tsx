/**
 * SupplierFollowControl tests
 *
 * Coverage targets:
 *  - Renders unfollowed by default with aria-pressed=false
 *  - Follow click subscribes, flips aria-pressed, opens preferences popover
 *  - Announces follow/unfollow state via LiveRegion
 *  - Subscribe failure surfaces an error message and keeps state unfollowed
 *  - Preferences popover toggles channel checkboxes and calls onPreferencesChange
 *  - Escape closes the popover and returns focus to its trigger
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SupplierFollowControl } from "./supplier-follow-control";

describe("SupplierFollowControl", () => {
  it("renders unfollowed by default", () => {
    render(<SupplierFollowControl supplierName="Nova Studio" />);
    const followBtn = screen.getByRole("button", { name: /follow/i });
    expect(followBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("subscribes on click, flips state, and opens the preferences popover", async () => {
    const onSubscribe = vi.fn().mockResolvedValue(undefined);
    render(
      <SupplierFollowControl supplierName="Nova Studio" onSubscribe={onSubscribe} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /follow/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /following/i })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    expect(onSubscribe).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/Following Nova Studio\. Notifications via/i),
    ).toBeInTheDocument();
  });

  it("shows an error and stays unfollowed when subscribe fails", async () => {
    const onSubscribe = vi.fn().mockRejectedValue(new Error("Network unavailable"));
    render(
      <SupplierFollowControl supplierName="Nova Studio" onSubscribe={onSubscribe} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /follow/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Network unavailable/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByRole("button", { name: /follow/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("toggles a channel preference and calls onPreferencesChange", async () => {
    const onPreferencesChange = vi.fn().mockResolvedValue(undefined);
    render(
      <SupplierFollowControl
        supplierName="Nova Studio"
        initialFollowing
        onPreferencesChange={onPreferencesChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /notification preferences/i }));
    const pushCheckbox = screen.getByRole("checkbox", { name: /push/i });
    expect(pushCheckbox).not.toBeChecked();

    fireEvent.click(pushCheckbox);

    await waitFor(() => {
      expect(onPreferencesChange).toHaveBeenCalledWith(
        expect.objectContaining({ push: true }),
      );
    });
  });

  it("closes the popover on Escape and returns focus to its trigger", async () => {
    render(<SupplierFollowControl supplierName="Nova Studio" initialFollowing />);

    const prefsBtn = screen.getByRole("button", { name: /notification preferences/i });
    fireEvent.click(prefsBtn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(prefsBtn).toHaveFocus();
  });
});
