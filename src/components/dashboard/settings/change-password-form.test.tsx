import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChangePasswordForm } from "@/components/dashboard/settings/change-password-form";

const NEW_PASSWORD = "Abcdefg1!";

describe("ChangePasswordForm", () => {
  it("lets the user type in all three password fields", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm onChangePassword={vi.fn().mockResolvedValue(undefined)} />);

    await user.type(screen.getByLabelText("Current password"), "current-pass");
    await user.type(screen.getByLabelText("New password"), NEW_PASSWORD);
    await user.type(screen.getByLabelText("Confirm new password"), NEW_PASSWORD);

    expect(screen.getByLabelText("Current password")).toHaveValue("current-pass");
    expect(screen.getByLabelText("New password")).toHaveValue(NEW_PASSWORD);
    expect(screen.getByLabelText("Confirm new password")).toHaveValue(NEW_PASSWORD);
  });

  it("links mismatched confirmation to its inline validation error", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm onChangePassword={vi.fn().mockResolvedValue(undefined)} />);

    await user.type(screen.getByLabelText("Current password"), "current-pass");
    await user.type(screen.getByLabelText("New password"), NEW_PASSWORD);
    const confirmation = screen.getByLabelText("Confirm new password");
    await user.type(confirmation, "Abcdefg1?");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    const error = screen.getByText("Passwords do not match.");
    expect(confirmation).toHaveAttribute("aria-describedby", error.id);
    expect(confirmation).toHaveAttribute("aria-invalid", "true");
  });

  it("submits valid passwords once and disables the button while pending", async () => {
    const user = userEvent.setup();
    let resolveChange!: () => void;
    const onChangePassword = vi.fn(
      () => new Promise<void>((resolve) => { resolveChange = resolve; }),
    );
    render(<ChangePasswordForm onChangePassword={onChangePassword} />);

    await user.type(screen.getByLabelText("Current password"), "current-pass");
    await user.type(screen.getByLabelText("New password"), NEW_PASSWORD);
    await user.type(screen.getByLabelText("Confirm new password"), NEW_PASSWORD);
    const submit = screen.getByRole("button", { name: "Change password" });
    await user.click(submit);

    expect(onChangePassword).toHaveBeenCalledTimes(1);
    expect(onChangePassword).toHaveBeenCalledWith({
      current: "current-pass",
      next: NEW_PASSWORD,
    });
    expect(submit).toBeDisabled();

    resolveChange();
    await waitFor(() => expect(submit).not.toBeDisabled());
    expect(screen.getByText("Password changed successfully.")).toHaveAttribute("role", "status");
  });

  it("rejects weak passwords and announces callback errors", async () => {
    const user = userEvent.setup();
    const onChangePassword = vi.fn().mockRejectedValue(new Error("Incorrect current password."));
    render(<ChangePasswordForm onChangePassword={onChangePassword} />);

    await user.type(screen.getByLabelText("Current password"), "current-pass");
    await user.type(screen.getByLabelText("New password"), "abcdefg1");
    await user.type(screen.getByLabelText("Confirm new password"), "abcdefg1");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(onChangePassword).not.toHaveBeenCalled();
    expect(screen.getByText("Choose a password rated Strong or Very Strong.")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("New password"));
    await user.type(screen.getByLabelText("New password"), NEW_PASSWORD);
    await user.clear(screen.getByLabelText("Confirm new password"));
    await user.type(screen.getByLabelText("Confirm new password"), NEW_PASSWORD);
    await user.click(screen.getByRole("button", { name: "Change password" }));

    await waitFor(() => {
      const errorMessage = "Unable to change password: Incorrect current password.";
      expect(screen.getByText(errorMessage, { selector: "p:not(.sr-only)" })).toBeInTheDocument();
      expect(
        screen.getAllByRole("status").some((status) => status.textContent?.includes(errorMessage)),
      ).toBe(true);
    });
  });
});
