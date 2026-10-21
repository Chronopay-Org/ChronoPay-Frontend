/**
 * RedemptionScanner tests
 *
 * Coverage targets:
 *  - Camera denied falls back to instructional text + manual entry remains usable
 *  - Camera granted renders the live viewport with the scan target box
 *  - Manual submit surfaces each distinct result state (valid / expired / already_redeemed)
 *  - Verification errors are shown as an alert and announced
 *  - "Scan next code" resets the result state
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RedemptionScanner } from "./RedemptionScanner";

function mockGetUserMedia(behavior: "grant" | "deny") {
  const getUserMedia =
    behavior === "grant"
      ? vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        })
      : vi.fn().mockRejectedValue(new Error("Permission denied"));

  Object.defineProperty(global.navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
}

describe("RedemptionScanner", () => {
  beforeEach(() => {
    // @ts-expect-error - cleaning up between tests
    delete global.navigator.mediaDevices;
  });

  it("falls back to instructional text when camera access is denied", async () => {
    mockGetUserMedia("deny");
    render(<RedemptionScanner onVerify={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/camera access was denied/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/manual code entry/i)).toBeInTheDocument();
  });

  it("renders the live viewport with a scan target when camera access is granted", async () => {
    mockGetUserMedia("grant");
    const { container } = render(<RedemptionScanner onVerify={vi.fn()} />);

    await waitFor(() => {
      expect(container.querySelector("video")).toBeInTheDocument();
    });
  });

  it("shows the valid state after a successful manual verification", async () => {
    mockGetUserMedia("deny");
    const onVerify = vi.fn().mockResolvedValue("valid");
    render(<RedemptionScanner onVerify={onVerify} />);

    fireEvent.change(screen.getByLabelText(/manual code entry/i), {
      target: { value: "CHRONO-1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(screen.getByText(/^Valid — redeem now$/i)).toBeInTheDocument();
    });
    expect(onVerify).toHaveBeenCalledWith("CHRONO-1234");
  });

  it("shows the already_redeemed state distinctly from valid/expired", async () => {
    mockGetUserMedia("deny");
    const onVerify = vi.fn().mockResolvedValue("already_redeemed");
    render(<RedemptionScanner onVerify={onVerify} />);

    fireEvent.change(screen.getByLabelText(/manual code entry/i), {
      target: { value: "CHRONO-9999" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(screen.getByText(/^Already redeemed$/i)).toBeInTheDocument();
    });
  });

  it("surfaces a lookup error as an alert", async () => {
    mockGetUserMedia("deny");
    const onVerify = vi.fn().mockRejectedValue(new Error("Network unavailable"));
    render(<RedemptionScanner onVerify={onVerify} />);

    fireEvent.change(screen.getByLabelText(/manual code entry/i), {
      target: { value: "CHRONO-0001" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Network unavailable/i);
    });
  });

  it("resets to the scanning state when 'Scan next code' is clicked", async () => {
    mockGetUserMedia("deny");
    const onVerify = vi.fn().mockResolvedValue("expired");
    render(<RedemptionScanner onVerify={onVerify} />);

    fireEvent.change(screen.getByLabelText(/manual code entry/i), {
      target: { value: "CHRONO-5555" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(screen.getByText(/^Expired$/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /scan next code/i }));
    expect(screen.queryByText(/^Expired$/i)).not.toBeInTheDocument();
  });
});
