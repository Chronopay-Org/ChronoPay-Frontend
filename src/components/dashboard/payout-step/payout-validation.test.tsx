import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PayoutStep,
  validateStellarAddress,
  validateStellarMemo,
  STELLAR_ADDRESS_LENGTH,
  STELLAR_MEMO_MAX_BYTES,
} from "./index";

const VALID_STELLAR_KEY =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

describe("validateStellarAddress", () => {
  it("accepts a valid 56-character G-prefixed base32 public key", () => {
    expect(VALID_STELLAR_KEY).toHaveLength(STELLAR_ADDRESS_LENGTH);
    expect(validateStellarAddress(VALID_STELLAR_KEY)).toEqual({ valid: true });
  });

  it("trims surrounding whitespace before validating", () => {
    expect(validateStellarAddress(`  ${VALID_STELLAR_KEY}  `)).toEqual({
      valid: true,
    });
  });

  it("rejects empty strings", () => {
    const res = validateStellarAddress("   ");
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/starting with G/i);
  });

  it("rejects keys that do not start with G", () => {
    const res = validateStellarAddress(
      "SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    );
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/start with "G"/i);
  });

  it("rejects keys with invalid length", () => {
    const res = validateStellarAddress("GSHORT");
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/56 characters/i);
  });

  it("rejects keys containing non-base32 characters (0, 1, 8, 9, lowercase)", () => {
    const withZero = `G${"A".repeat(54)}0`;
    expect(validateStellarAddress(withZero).valid).toBe(false);
    expect(validateStellarAddress(withZero).error).toMatch(/base32/i);

    const withLower = `G${"a".repeat(55)}`;
    expect(validateStellarAddress(withLower).valid).toBe(false);
  });
});

describe("validateStellarMemo", () => {
  it("accepts empty and short ASCII memos", () => {
    expect(validateStellarMemo("")).toEqual({ valid: true, byteLength: 0 });
    expect(validateStellarMemo("INV-12345")).toEqual({
      valid: true,
      byteLength: 9,
    });
  });

  it("accepts memos at the exact 28-byte limit", () => {
    const exact = "A".repeat(STELLAR_MEMO_MAX_BYTES);
    expect(validateStellarMemo(exact)).toEqual({
      valid: true,
      byteLength: STELLAR_MEMO_MAX_BYTES,
    });
  });

  it("rejects memos exceeding 28 UTF-8 bytes", () => {
    const over = "A".repeat(STELLAR_MEMO_MAX_BYTES + 1);
    const res = validateStellarMemo(over);
    expect(res.valid).toBe(false);
    expect(res.byteLength).toBe(29);
    expect(res.error).toMatch(/28 bytes or fewer/i);
  });

  it("counts multi-byte UTF-8 characters accurately", () => {
    // Each emoji is 4 UTF-8 bytes; 8 emojis = 32 bytes > 28
    const emojis = "🚀".repeat(8);
    const res = validateStellarMemo(emojis);
    expect(res.valid).toBe(false);
    expect(res.byteLength).toBe(32);
  });
});

describe("PayoutStep validation, focus management, and persistence", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("shows accessible inline errors for invalid custom Stellar address and memo", () => {
    render(<PayoutStep onSave={vi.fn()} storageKey="test-payout-inline" />);

    fireEvent.click(screen.getByDisplayValue("stellar_address"));

    const addressInput = screen.getByLabelText(/stellar public key/i);
    fireEvent.change(addressInput, { target: { value: "BADKEY" } });
    fireEvent.blur(addressInput);

    expect(addressInput).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/must start with "G"/i)).toHaveAttribute(
      "role",
      "alert",
    );

    const memoInput = screen.getByRole("textbox", { name: /memo/i });
    fireEvent.change(memoInput, { target: { value: "x".repeat(30) } });
    fireEvent.blur(memoInput);

    expect(memoInput).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/28 bytes or fewer/i)).toHaveAttribute(
      "role",
      "alert",
    );
  });

  it("moves focus to the first invalid field when Save & continue is clicked", () => {
    render(<PayoutStep onSave={vi.fn()} storageKey="test-payout-focus" />);

    fireEvent.click(screen.getByDisplayValue("stellar_address"));

    const addressInput = screen.getByLabelText(/stellar public key/i);
    const memoInput = screen.getByRole("textbox", { name: /memo/i });
    const consentCheckbox = screen.getByRole("checkbox", {
      name: /agree to the payout terms/i,
    });
    const saveBtn = screen.getByRole("link", { name: /save & continue/i });

    // 1. Address is empty/invalid -> focus moves to address input
    act(() => {
      fireEvent.click(saveBtn);
    });
    expect(document.activeElement).toBe(addressInput);

    // 2. Fix address, make memo too long -> focus moves to memo input
    fireEvent.change(addressInput, { target: { value: VALID_STELLAR_KEY } });
    fireEvent.change(memoInput, { target: { value: "m".repeat(30) } });
    act(() => {
      fireEvent.click(saveBtn);
    });
    expect(document.activeElement).toBe(memoInput);

    // 3. Fix memo, leave consent unchecked -> focus moves to consent checkbox
    fireEvent.change(memoInput, { target: { value: "valid-memo" } });
    act(() => {
      fireEvent.click(saveBtn);
    });
    expect(document.activeElement).toBe(consentCheckbox);
  });

  it("persists partial entries to sessionStorage and resumes after reload", () => {
    const key = "test-payout-resume";
    const { unmount } = render(<PayoutStep onSave={vi.fn()} storageKey={key} />);

    fireEvent.click(screen.getByDisplayValue("stellar_address"));
    fireEvent.click(screen.getByDisplayValue("USDC"));
    fireEvent.change(screen.getByLabelText(/stellar public key/i), {
      target: { value: VALID_STELLAR_KEY },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /memo/i }), {
      target: { value: "DESK-42" },
    });

    unmount();

    // Simulate reload by mounting a fresh instance with the same storageKey
    render(<PayoutStep onSave={vi.fn()} storageKey={key} />);

    expect(screen.getByDisplayValue("stellar_address")).toBeChecked();
    expect(screen.getByDisplayValue("USDC")).toBeChecked();
    expect(screen.getByLabelText(/stellar public key/i)).toHaveValue(
      VALID_STELLAR_KEY,
    );
    expect(screen.getByRole("textbox", { name: /memo/i })).toHaveValue("DESK-42");
  });

  it("clears persisted draft after a successful save", async () => {
    const key = "test-payout-clear";
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<PayoutStep onSave={onSave} storageKey={key} />);

    fireEvent.click(screen.getByDisplayValue("stellar_address"));
    fireEvent.change(screen.getByLabelText(/stellar public key/i), {
      target: { value: VALID_STELLAR_KEY },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: /agree to the payout terms/i }),
    );
    fireEvent.click(screen.getByRole("link", { name: /save & continue/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
    expect(window.sessionStorage.getItem(key)).toBeNull();
  });
});
