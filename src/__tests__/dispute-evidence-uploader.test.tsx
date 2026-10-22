import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DisputeEvidenceUploader } from "../components/dashboard/dispute-evidence-uploader";

function upload(file: File) {
  const dropzone = screen.getByRole("button", { name: /upload evidence files/i });
  fireEvent.change(dropzone.querySelector('input[type="file"]')!, { target: { files: [file] } });
}

describe("DisputeEvidenceUploader", () => {
  it("rejects an oversized file as a validation error without Retry or a clean state", () => {
    render(<DisputeEvidenceUploader maxFileSizeMB={1} />);
    upload(new File([new ArrayBuffer(2 * 1024 * 1024)], "large.pdf", { type: "application/pdf" }));
    expect(screen.getByText(/exceeds maximum allowed limit of 1MB/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Scan Passed")).not.toBeInTheDocument();
  });

  it("rejects an executable before upload or scanning", () => {
    render(<DisputeEvidenceUploader />);
    upload(new File(["payload"], "malicious.exe", { type: "application/x-msdownload" }));
    expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText("Scan Passed")).not.toBeInTheDocument();
  });

  it("does not expose Retry for a validation failure", () => {
    render(<DisputeEvidenceUploader />);
    upload(new File(["payload"], "bad.exe", { type: "application/x-msdownload" }));
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });

  it("revalidates a recoverable error before retrying", () => {
    const { rerender } = render(<DisputeEvidenceUploader isOffline />);
    upload(new File(["payload"], "receipt.pdf", { type: "application/pdf" }));
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    rerender(<DisputeEvidenceUploader isOffline allowedTypes={["image/png"]} />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.getByText(/unsupported file type.*PNG/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("allows a recoverable offline error to retry when validation still succeeds", () => {
    vi.useFakeTimers();
    const { rerender } = render(<DisputeEvidenceUploader isOffline />);
    upload(new File(["payload"], "receipt.pdf", { type: "application/pdf" }));
    rerender(<DisputeEvidenceUploader isOffline={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByText("Scanning...")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("uses custom allowed types for extension validation", () => {
    render(<DisputeEvidenceUploader allowedTypes={["application/pdf"]} />);
    upload(new File(["png"], "image.png", { type: "image/png" }));
    expect(screen.getByText(/unsupported file type.*PDF/i)).toBeInTheDocument();
    upload(new File(["csv"], "data.csv", { type: "text/csv" }));
    upload(new File(["word"], "letter.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
    expect(screen.getAllByText(/unsupported file type.*PDF/i)).toHaveLength(3);
  });

  it("accepts a configured PDF and completes the existing scan flow", () => {
    vi.useFakeTimers();
    render(<DisputeEvidenceUploader allowedTypes={["application/pdf"]} />);
    upload(new File(["pdf"], "receipt.pdf", { type: "application/pdf" }));
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByText("Scan Passed")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
