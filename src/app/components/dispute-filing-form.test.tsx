import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DisputeFilingForm, type DisputeFilingFormProps } from "./dispute-filing-form";

function props(overrides: Partial<DisputeFilingFormProps> = {}): DisputeFilingFormProps {
  return { slotId: "slot-1", onSubmit: vi.fn().mockResolvedValue(undefined), isSubmitting: false, onCancel: vi.fn(), ...overrides };
}
function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText("Dispute Category"), { target: { value: "other" } });
  fireEvent.change(screen.getByLabelText("Brief Reason"), { target: { value: "Reason" } });
  fireEvent.change(screen.getByLabelText("Detailed Description"), { target: { value: "Description" } });
}
function uploadEvidence(file: File) {
  const uploader = screen.getByRole("button", { name: "Evidence (Optional)" });
  fireEvent.change(uploader.querySelector('input[type="file"]')!, { target: { files: [file] } });
}

describe("DisputeFilingForm", () => {
  it("exposes all controls through accessible labels, including evidence", () => {
    render(<DisputeFilingForm {...props()} />);
    expect(screen.getByLabelText("Dispute Category")).toBeInTheDocument();
    expect(screen.getByLabelText("Brief Reason")).toBeInTheDocument();
    expect(screen.getByLabelText("Detailed Description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Evidence (Optional)" })).toBeInTheDocument();
  });

  it("connects submitted field errors to their controls", () => {
    render(<DisputeFilingForm {...props()} />);
    fireEvent.submit(document.querySelector("form")!);
    for (const label of ["Dispute Category", "Brief Reason", "Detailed Description"]) {
      const control = screen.getByLabelText(label);
      expect(control).toHaveAttribute("aria-invalid", "true");
      const errorId = control.getAttribute("aria-describedby");
      expect(errorId).toBeTruthy();
      expect(document.getElementById(errorId!)).toHaveAttribute("role", "alert");
    }
  });

  it("preserves submission without evidence", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DisputeFilingForm {...props({ onSubmit })} />);
    fillRequiredFields();
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0].evidence).toEqual([]);
  });

  it("blocks direct form submission while evidence is uploading or scanning", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DisputeFilingForm {...props({ onSubmit })} />);
    fillRequiredFields();
    uploadEvidence(new File(["proof"], "proof.pdf", { type: "application/pdf" }));
    expect(screen.getByRole("button", { name: /submit dispute/i })).toBeDisabled();
    fireEvent.submit(document.querySelector("form")!);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/remove or resolve all evidence files/i)).toBeInTheDocument();
  });

  it("blocks submission for failed validation evidence", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DisputeFilingForm {...props({ onSubmit })} />);
    fillRequiredFields();
    uploadEvidence(new File(["bad"], "bad.exe", { type: "application/x-msdownload" }));
    fireEvent.submit(document.querySelector("form")!);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
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
