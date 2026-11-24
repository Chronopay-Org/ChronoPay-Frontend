import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  DisputeFilingForm,
  type DisputeFilingFormProps,
} from "@/components/dashboard/dispute-filing-form";

const VALID_REASON = "Service was much shorter than expected";
const VALID_DESCRIPTION =
  "The delivered session was terminated after twenty minutes instead of the booked duration and the provider failed to reconnect.";

function props(overrides: Partial<DisputeFilingFormProps> = {}): DisputeFilingFormProps {
  return {
    slotId: "slot-1",
    onSubmit: vi.fn().mockResolvedValue(undefined),
    isSubmitting: false,
    onCancel: vi.fn(),
    ...overrides,
  };
}

function fillRequiredFields() {
  fireEvent.click(screen.getByRole("button", { name: /Other/i }));
  fireEvent.change(screen.getByLabelText(/Reason for Dispute/i), {
    target: { value: VALID_REASON },
  });
  fireEvent.change(screen.getByLabelText(/Detailed Description/i), {
    target: { value: VALID_DESCRIPTION },
  });
}

function uploadEvidence(file: File) {
  const uploader = screen.getByRole("button", { name: /Upload evidence files/i });
  fireEvent.change(uploader.querySelector('input[type="file"]')!, {
    target: { files: [file] },
  });
}

describe("DisputeFilingForm (integrated with DisputeEvidenceUploader)", () => {
  it("exposes all controls through accessible labels, including evidence", () => {
    render(<DisputeFilingForm {...props()} />);
    expect(screen.getByRole("button", { name: /Service Not Delivered/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Reason for Dispute/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Detailed Description/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Upload evidence files/i })).toBeInTheDocument();
  });

  it("connects submitted field errors to their controls", () => {
    render(<DisputeFilingForm {...props()} />);
    fireEvent.submit(document.querySelector("form")!);
    for (const label of [/Reason for Dispute/i, /Detailed Description/i]) {
      const control = screen.getByLabelText(label);
      expect(control).toHaveAttribute("aria-invalid", "true");
      const errorId = control.getAttribute("aria-describedby")?.split(" ")[0];
      expect(errorId).toBeTruthy();
      expect(document.getElementById(errorId!)).toHaveAttribute("role", "alert");
    }
    expect(screen.getByText("Please select a dispute category")).toHaveAttribute("role", "alert");
    expect(screen.getByText("At least one evidence file is required")).toHaveAttribute(
      "role",
      "alert",
    );
  });

  it("requires at least one evidence file before submitting", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DisputeFilingForm {...props({ onSubmit })} />);
    fillRequiredFields();
    expect(screen.getByRole("button", { name: /submit dispute/i })).toBeDisabled();
    fireEvent.submit(document.querySelector("form")!);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/at least one evidence file is required/i)).toBeInTheDocument();
  });

  it("blocks direct form submission while evidence is uploading or scanning", () => {
    vi.useFakeTimers();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DisputeFilingForm {...props({ onSubmit })} />);
    fillRequiredFields();
    uploadEvidence(new File(["proof"], "proof.pdf", { type: "application/pdf" }));
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByText("Scanning...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit dispute/i })).toBeDisabled();
    fireEvent.submit(document.querySelector("form")!);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText(/please wait for all files to finish uploading and scanning/i),
    ).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("blocks submission for failed validation or threat-detected evidence", () => {
    vi.useFakeTimers();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DisputeFilingForm {...props({ onSubmit })} />);
    fillRequiredFields();
    uploadEvidence(new File(["bad"], "bad.exe", { type: "application/x-msdownload" }));
    fireEvent.submit(document.querySelector("form")!);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
    expect(
      screen.getByText(/please resolve failed or threat-detected files before submitting/i),
    ).toBeInTheDocument();

    uploadEvidence(new File(["virus"], "infected_file.pdf", { type: "application/pdf" }));
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByText("Threat Detected")).toBeInTheDocument();
    fireEvent.submit(document.querySelector("form")!);
    expect(onSubmit).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("submits accepted, clean evidence only after upload and scan complete", async () => {
    vi.useFakeTimers();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DisputeFilingForm {...props({ onSubmit })} />);
    fillRequiredFields();
    uploadEvidence(new File(["proof"], "proof.png", { type: "image/png" }));
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByText("Scan Passed")).toBeInTheDocument();
    fireEvent.submit(document.querySelector("form")!);
    await act(async () => {});
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0][0].evidence[0].name).toBe("proof.png");
    vi.useRealTimers();
  });
});
