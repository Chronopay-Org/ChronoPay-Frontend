import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TwoFactorEnroll, { type TwoFactorAdapter } from "./two-factor-enroll";

const MOCK_SECRET = "JBSWY3DPEHPK3PXP";
const MOCK_OTPAUTH_URI = `otpauth://totp/ChronoPay:user@chronopay.com?secret=${MOCK_SECRET}&issuer=ChronoPay`;
const MOCK_RECOVERY_CODES = [
  "ABCD1234",
  "EFGH5678",
  "IJKL9012",
  "MNOP3456",
];

function createMockAdapter(
  overrides: Partial<TwoFactorAdapter> = {}
): TwoFactorAdapter {
  return {
    startEnrollment: vi.fn().mockResolvedValue({
      otpauthUri: MOCK_OTPAUTH_URI,
      secret: MOCK_SECRET,
    }),
    verifyCode: vi.fn().mockResolvedValue(true),
    getRecoveryCodes: vi.fn().mockResolvedValue(MOCK_RECOVERY_CODES),
    ...overrides,
  };
}

async function advanceToVerifyStep(adapter: TwoFactorAdapter) {
  fireEvent.click(screen.getByRole("button", { name: /begin setup/i }));
  await screen.findByText(MOCK_SECRET);
  fireEvent.click(screen.getByRole("button", { name: /i have scanned it/i }));
  return screen.getByLabelText(/enter the 6-digit code/i);
}

describe("TwoFactorEnroll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("completes the happy path through intro, qr, verify, recovery, and success and calls onComplete", async () => {
    const adapter = createMockAdapter();
    const onComplete = vi.fn();

    render(<TwoFactorEnroll adapter={adapter} onComplete={onComplete} />);

    // Intro step
    expect(
      screen.getByRole("region", { name: /two-factor authentication enrollment/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/we'll guide you through setting up 2fa/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /begin setup/i }));

    // QR step
    expect(await screen.findByText(MOCK_SECRET)).toBeInTheDocument();
    expect(screen.getByText(MOCK_OTPAUTH_URI)).toBeInTheDocument();
    expect(adapter.startEnrollment).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /i have scanned it/i }));

    // Verify step
    const codeInput = screen.getByLabelText(/enter the 6-digit code/i);
    expect(codeInput).toHaveFocus();

    fireEvent.change(codeInput, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

    // Recovery step
    expect(
      await screen.findByRole("heading", { name: /save your recovery codes/i })
    ).toBeInTheDocument();
    expect(adapter.verifyCode).toHaveBeenCalledWith("123456");
    expect(adapter.getRecoveryCodes).toHaveBeenCalledTimes(1);

    const completeBtn = screen.getByRole("button", { name: /complete setup/i });
    expect(completeBtn).toBeDisabled();

    fireEvent.click(
      screen.getByLabelText(/i have saved these recovery codes in a safe place/i)
    );
    expect(completeBtn).toBeEnabled();

    fireEvent.click(completeBtn);

    // Success step
    expect(
      screen.getByRole("heading", { name: /2fa enabled successfully/i })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /return to settings/i })
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("shows the init error and stays on intro when startEnrollment rejects", async () => {
    const adapter = createMockAdapter({
      startEnrollment: vi.fn().mockRejectedValue(new Error("Service unavailable")),
    });

    render(<TwoFactorEnroll adapter={adapter} />);

    fireEvent.click(screen.getByRole("button", { name: /begin setup/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Failed to initialize 2FA enrollment. Please try again."
    );
    expect(
      screen.getByRole("button", { name: /begin setup/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(MOCK_SECRET)).not.toBeInTheDocument();
  });

  it("shows the invalid-code message when verifyCode resolves to false", async () => {
    const adapter = createMockAdapter({
      verifyCode: vi.fn().mockResolvedValue(false),
    });

    render(<TwoFactorEnroll adapter={adapter} />);
    const codeInput = await advanceToVerifyStep(adapter);

    fireEvent.change(codeInput, { target: { value: "654321" } });
    fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Invalid verification code. Please check your app and try again."
    );
    expect(codeInput).toHaveAttribute("aria-invalid", "true");
    expect(adapter.getRecoveryCodes).not.toHaveBeenCalled();

    // Typing again clears the error
    fireEvent.change(codeInput, { target: { value: "111111" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the network error when verifyCode rejects", async () => {
    const adapter = createMockAdapter({
      verifyCode: vi.fn().mockRejectedValue(new Error("Network down")),
    });

    render(<TwoFactorEnroll adapter={adapter} />);
    const codeInput = await advanceToVerifyStep(adapter);

    fireEvent.change(codeInput, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Network error during code verification. Please try again."
    );
    expect(adapter.getRecoveryCodes).not.toHaveBeenCalled();
  });

  it("ignores verification until 6 digits are typed and strips non-numeric characters", async () => {
    const adapter = createMockAdapter();

    render(<TwoFactorEnroll adapter={adapter} />);
    const codeInput = await advanceToVerifyStep(adapter);
    const verifyBtn = screen.getByRole("button", { name: /verify code/i });

    expect(verifyBtn).toBeDisabled();

    // Non-numeric input is stripped and leaves fewer than 6 digits
    fireEvent.change(codeInput, { target: { value: "12ab345" } });
    expect(codeInput).toHaveValue("12345");
    expect(verifyBtn).toBeDisabled();

    // Pressing Enter with fewer than 6 digits does not trigger verification
    fireEvent.keyDown(codeInput, { key: "Enter" });
    expect(adapter.verifyCode).not.toHaveBeenCalled();

    // Typing the 6th digit enables verification and allows Enter submission
    fireEvent.change(codeInput, { target: { value: "123456" } });
    expect(verifyBtn).toBeEnabled();

    fireEvent.keyDown(codeInput, { key: "Enter" });
    await waitFor(() => {
      expect(adapter.verifyCode).toHaveBeenCalledWith("123456");
    });
  });

  it("masks recovery codes until revealed and toggles visibility", async () => {
    const adapter = createMockAdapter();

    render(<TwoFactorEnroll adapter={adapter} />);
    const codeInput = await advanceToVerifyStep(adapter);

    fireEvent.change(codeInput, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

    await screen.findByRole("heading", { name: /save your recovery codes/i });

    // Codes are initially masked with bullets
    const maskedCode = "•".repeat(MOCK_RECOVERY_CODES[0].length);
    expect(screen.getAllByText(maskedCode)).toHaveLength(
      MOCK_RECOVERY_CODES.length
    );
    for (const code of MOCK_RECOVERY_CODES) {
      expect(screen.queryByText(code)).not.toBeInTheDocument();
    }

    const toggleBtn = screen.getByRole("button", { name: /reveal all/i });
    expect(toggleBtn).toHaveAttribute("aria-pressed", "false");

    // Reveal all codes
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent(/hide all/i);
    expect(toggleBtn).toHaveAttribute("aria-pressed", "true");
    for (const code of MOCK_RECOVERY_CODES) {
      expect(screen.getByText(code)).toBeInTheDocument();
    }

    // Hide all codes again
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent(/reveal all/i);
    expect(toggleBtn).toHaveAttribute("aria-pressed", "false");
    expect(screen.getAllByText(maskedCode)).toHaveLength(
      MOCK_RECOVERY_CODES.length
    );
  });
});
