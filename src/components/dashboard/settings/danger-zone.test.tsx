import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DangerZone } from "@/components/dashboard/settings/danger-zone";

describe("DangerZone", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders both destructive actions with their opener buttons", () => {
    render(<DangerZone />);

    expect(screen.getByText("Delete account")).toBeInTheDocument();
    expect(screen.getByText("Revoke all sessions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revoke" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps delete-account confirm aria-disabled for wrong case and enables only for exact DELETE", async () => {
    const user = userEvent.setup();
    const alertSpy = vi.fn();
    vi.stubGlobal("alert", alertSpy);
    render(<DangerZone />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    const dialog = screen.getByRole("dialog");
    const input = within(dialog).getByLabelText("Type DELETE to confirm");
    const confirmButton = within(dialog).getByRole("button", { name: "Delete my account" });

    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toHaveAttribute("aria-disabled", "true");
    expect(
      within(dialog).getByText('Type "DELETE" exactly to enable the destructive action.'),
    ).toHaveAttribute("aria-live", "polite");

    // Wrong case must keep confirm disabled and never fire onConfirm
    await user.type(input, "delete");
    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toHaveAttribute("aria-disabled", "true");
    expect(
      within(dialog).getByText("Phrase does not match. Type carefully."),
    ).toBeInTheDocument();

    await user.click(confirmButton);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Exact phrase enables confirm and triggers confirmation
    await user.clear(input);
    await user.type(input, "DELETE");
    expect(confirmButton).toBeEnabled();
    expect(confirmButton).toHaveAttribute("aria-disabled", "false");
    expect(
      within(dialog).getByText("Confirmation phrase matched. You may proceed."),
    ).toBeInTheDocument();

    await user.click(confirmButton);
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("Account deletion initiated"),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps revoke-sessions confirm aria-disabled for wrong case and enables only for exact REVOKE", async () => {
    const user = userEvent.setup();
    const alertSpy = vi.fn();
    vi.stubGlobal("alert", alertSpy);
    render(<DangerZone />);

    await user.click(screen.getByRole("button", { name: "Revoke" }));

    const dialog = screen.getByRole("dialog");
    const input = within(dialog).getByLabelText("Type REVOKE to confirm");
    const confirmButton = within(dialog).getByRole("button", { name: "Revoke all sessions" });

    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toHaveAttribute("aria-disabled", "true");
    expect(
      within(dialog).getByText('Type "REVOKE" exactly to enable the destructive action.'),
    ).toHaveAttribute("aria-live", "polite");

    // Wrong case must keep confirm disabled and never fire onConfirm
    await user.type(input, "revoke");
    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toHaveAttribute("aria-disabled", "true");
    expect(
      within(dialog).getByText("Phrase does not match. Type carefully."),
    ).toBeInTheDocument();

    await user.click(confirmButton);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Exact phrase enables confirm and triggers confirmation
    await user.clear(input);
    await user.type(input, "REVOKE");
    expect(confirmButton).toBeEnabled();
    expect(confirmButton).toHaveAttribute("aria-disabled", "false");
    expect(
      within(dialog).getByText("Confirmation phrase matched. You may proceed."),
    ).toBeInTheDocument();

    await user.click(confirmButton);
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("All sessions revoked"),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the dialog via the Cancel button and returns focus to the opener", async () => {
    const user = userEvent.setup();
    render(<DangerZone />);

    const deleteOpener = screen.getByRole("button", { name: "Delete" });
    await user.click(deleteOpener);

    const dialog = screen.getByRole("dialog");
    const cancelButton = within(dialog).getByText("Cancel").closest("button")!;
    expect(cancelButton).toHaveFocus();

    await user.click(cancelButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(deleteOpener).toHaveFocus();
  });

  it("closes the dialog via the header X button and returns focus to the opener", async () => {
    const user = userEvent.setup();
    render(<DangerZone />);

    const revokeOpener = screen.getByRole("button", { name: "Revoke" });
    await user.click(revokeOpener);

    const dialog = screen.getByRole("dialog");
    const closeXButton = dialog.querySelector<HTMLButtonElement>('button[aria-label="Cancel"]')!;
    expect(closeXButton).toBeInTheDocument();

    await user.click(closeXButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(revokeOpener).toHaveFocus();
  });

  it("closes the dialog on Escape and returns focus to the opener", async () => {
    const user = userEvent.setup();
    render(<DangerZone />);

    const deleteOpener = screen.getByRole("button", { name: "Delete" });
    await user.click(deleteOpener);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(deleteOpener).toHaveFocus();
  });

  it("announces dialog open in the polite status live region and clears it on close", async () => {
    const user = userEvent.setup();
    render(<DangerZone />);

    const statusRegion = screen.getByRole("status");
    expect(statusRegion).toHaveAttribute("aria-live", "polite");
    expect(statusRegion).toHaveTextContent("");

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(statusRegion).toHaveTextContent("Delete account confirmation dialog open");

    await user.click(within(screen.getByRole("dialog")).getByText("Cancel"));
    expect(statusRegion).toHaveTextContent("");

    await user.click(screen.getByRole("button", { name: "Revoke" }));
    expect(statusRegion).toHaveTextContent("Revoke all sessions confirmation dialog open");

    await user.keyboard("{Escape}");
    expect(statusRegion).toHaveTextContent("");
  });

  it("shows each action's own confirmLabel when its dialog opens", async () => {
    const user = userEvent.setup();
    render(<DangerZone />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByLabelText("Type DELETE to confirm")).toBeInTheDocument();
    expect(screen.queryByLabelText("Type REVOKE to confirm")).not.toBeInTheDocument();

    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Revoke" }));
    expect(screen.getByLabelText("Type REVOKE to confirm")).toBeInTheDocument();
    expect(screen.queryByLabelText("Type DELETE to confirm")).not.toBeInTheDocument();
  });
});
