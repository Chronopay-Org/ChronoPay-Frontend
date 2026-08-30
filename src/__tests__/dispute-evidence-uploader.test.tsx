import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DisputeEvidenceUploader } from "../components/dashboard/dispute-evidence-uploader";

describe("DisputeEvidenceUploader", () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("renders upload dropzone correctly with accessible label and description", () => {
    render(<DisputeEvidenceUploader />);

    const dropzone = screen.getByRole("button", { name: /Upload evidence files/i });
    expect(dropzone).toBeInTheDocument();
    expect(dropzone).toHaveAttribute("tabindex", "0");
    expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF, PNG, JPG, CSV, DOCX/i)).toBeInTheDocument();
  });

  it("handles valid file selection via file input", async () => {
    const onFilesChange = vi.fn();
    render(<DisputeEvidenceUploader onFilesChange={onFilesChange} />);

    const file = new File(["test document content"], "receipt.pdf", { type: "application/pdf" });
    const dropzone = screen.getByRole("button", { name: /Upload evidence files/i });
    const fileInput = dropzone.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(fileInput, file);

    expect(screen.getByText("receipt.pdf")).toBeInTheDocument();
    expect(onFilesChange).toHaveBeenCalled();
  });

  it("handles file drop event", async () => {
    const onFilesChange = vi.fn();
    render(<DisputeEvidenceUploader onFilesChange={onFilesChange} />);

    const dropzone = screen.getByRole("button", { name: /Upload evidence files/i });
    const file = new File(["invoice content"], "invoice.png", { type: "image/png" });

    fireEvent.dragOver(dropzone);
    expect(dropzone).toHaveClass("border-cyan-400");

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    });

    expect(screen.getByText("invoice.png")).toBeInTheDocument();
  });

  it("rejects files exceeding max size", async () => {
    render(<DisputeEvidenceUploader maxFileSizeMB={1} />);

    const largeFile = new File([new ArrayBuffer(2 * 1024 * 1024)], "large-file.pdf", {
      type: "application/pdf",
    });

    const dropzone = screen.getByRole("button", { name: /Upload evidence files/i });
    const fileInput = dropzone.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(fileInput, largeFile);

    expect(screen.getByText("File size exceeds maximum allowed limit of 1MB.")).toBeInTheDocument();
  });

  it("rejects unsupported file formats", async () => {
    render(<DisputeEvidenceUploader />);

    const invalidFile = new File(["executable"], "malicious.exe", {
      type: "application/x-msdownload",
    });

    const dropzone = screen.getByRole("button", { name: /Upload evidence files/i });
    const fileInput = dropzone.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(screen.getByText("malicious.exe")).toBeInTheDocument();
    expect(screen.getByText(/Unsupported file type/i)).toBeInTheDocument();
  });

  it("prevent uploading when total maxFiles limit is exceeded", async () => {
    render(<DisputeEvidenceUploader maxFiles={1} />);

    const file1 = new File(["doc1"], "doc1.pdf", { type: "application/pdf" });
    const file2 = new File(["doc2"], "doc2.pdf", { type: "application/pdf" });

    const dropzone = screen.getByRole("button", { name: /Upload evidence files/i });
    const fileInput = dropzone.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(fileInput, [file1, file2]);

    expect(screen.getByRole("alert")).toHaveTextContent("Maximum limit of 1 files exceeded.");
  });

  it("detects infected/virus files and updates virus scan status pill", async () => {
    vi.useFakeTimers();
    render(<DisputeEvidenceUploader />);

    const virusFile = new File(["virus payload"], "virus_test.pdf", { type: "application/pdf" });

    const dropzone = screen.getByRole("button", { name: /Upload evidence files/i });
    const fileInput = dropzone.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [virusFile] } });

    expect(screen.getByText("virus_test.pdf")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText("Threat Detected")).toBeInTheDocument();
    expect(screen.getByText("Security threat detected in file.")).toBeInTheDocument();
  });

  it("shows scan passed pill when file is clean", async () => {
    vi.useFakeTimers();
    render(<DisputeEvidenceUploader />);

    const cleanFile = new File(["clean doc"], "clean_evidence.pdf", { type: "application/pdf" });

    const dropzone = screen.getByRole("button", { name: /Upload evidence files/i });
    const fileInput = dropzone.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [cleanFile] } });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText("Scan Passed")).toBeInTheDocument();
  });

  it("handles offline status and retry interaction", async () => {
    const { rerender } = render(<DisputeEvidenceUploader isOffline={true} />);

    const file = new File(["offline upload"], "offline_doc.pdf", { type: "application/pdf" });

    const dropzone = screen.getByRole("button", { name: /Upload evidence files/i });
    const fileInput = dropzone.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText("Network offline. Upload paused.")).toBeInTheDocument();

    // Clicking retry while still offline
    const retryBtn = screen.getByRole("button", { name: /Retry/i });
    fireEvent.click(retryBtn);
    expect(screen.getByRole("alert")).toHaveTextContent("Cannot retry while offline.");

    // Turn online and retry
    rerender(<DisputeEvidenceUploader isOffline={false} />);
    vi.useFakeTimers();
    fireEvent.click(retryBtn);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText("Scanning...")).toBeInTheDocument();
  });

  it("allows removing attached file", async () => {
    render(<DisputeEvidenceUploader />);

    const file = new File(["doc content"], "to_remove.pdf", { type: "application/pdf" });

    const dropzone = screen.getByRole("button", { name: /Upload evidence files/i });
    const fileInput = dropzone.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(fileInput, file);

    expect(screen.getByText("to_remove.pdf")).toBeInTheDocument();

    const removeBtn = screen.getByRole("button", { name: /Remove to_remove.pdf/i });
    await userEvent.click(removeBtn);

    expect(screen.queryByText("to_remove.pdf")).not.toBeInTheDocument();
  });

  it("supports keyboard enter / space interaction on dragdrop zone", async () => {
    render(<DisputeEvidenceUploader />);

    const dropzone = screen.getByRole("button", { name: /Upload evidence files/i });
    const fileInput = dropzone.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    fireEvent.keyDown(dropzone, { key: "Enter" });
    expect(clickSpy).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(dropzone, { key: " " });
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });
});
