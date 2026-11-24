import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  DisputeEvidenceUploader,
  type DisputeFile,
} from "../components/dashboard/dispute-evidence-uploader";

/**
 * Focused regression coverage for the `ScanStatus` failure path.
 *
 * `ScanStatus` is a five-value union rendered by `renderVirusScanPill`. Four of those
 * values are produced by the simulated scan, and one — `"failed"` — is produced only by
 * the two early-exit branches of `processFile` (`validateFile` rejection at
 * dispute-evidence-uploader.tsx:97 and the `isOffline` guard). Because those branches
 * short-circuit before `simulateProgressAndScan` runs, a regression in them is silent:
 * the file would keep a non-failure status and the UI would happily report success.
 *
 * These tests pin the observable failure contract (the payload passed to `onFilesChange`
 * plus the rendered pill/label/retry affordances) and the boundary between "rejected"
 * and "accepted by validation".
 */

const MAX_1MB = 1024 * 1024;

const SIZE_LIMIT_MESSAGE = "File size exceeds maximum allowed limit of 1MB.";
const UNSUPPORTED_TYPE_MESSAGE =
  "Unsupported file type. Accepted formats: PDF, PNG, JPG, CSV, DOCX.";
const OFFLINE_MESSAGE = "Network offline. Upload paused.";

function getFileInput(): HTMLInputElement {
  const dropzone = screen.getByRole("button", { name: /Upload evidence files/i });
  const input = dropzone.querySelector('input[type="file"]');
  if (!input) throw new Error("file input not found");
  return input as HTMLInputElement;
}

function selectFiles(files: File[]): void {
  fireEvent.change(getFileInput(), { target: { files } });
}

/** Builds a file with an exact byte length so size boundaries are unambiguous. */
function fileOfSize(name: string, bytes: number, type = "application/pdf"): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

/** Returns the payload of the most recent `onFilesChange` call. */
function latestPayload(onFilesChange: ReturnType<typeof vi.fn>): DisputeFile[] {
  expect(onFilesChange).toHaveBeenCalled();
  const { calls } = onFilesChange.mock;
  return calls[calls.length - 1][0] as DisputeFile[];
}

function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** Drives a queued file through the whole simulated upload + scan pipeline. */
function runScanToCompletion(): void {
  advance(200);
}

describe("DisputeEvidenceUploader scan-status failure handling", () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("failure contract exposed through onFilesChange", () => {
    it("reports an oversized file as uploadStatus=error and scanStatus=failed", () => {
      const onFilesChange = vi.fn();
      render(<DisputeEvidenceUploader maxFileSizeMB={1} onFilesChange={onFilesChange} />);

      selectFiles([fileOfSize("oversized.pdf", MAX_1MB + 1)]);

      const [rejected] = latestPayload(onFilesChange);
      expect(rejected).toMatchObject({
        name: "oversized.pdf",
        size: MAX_1MB + 1,
        type: "application/pdf",
        progress: 0,
        uploadStatus: "error",
        scanStatus: "failed",
        errorMessage: SIZE_LIMIT_MESSAGE,
      });
    });

    it("reports an unsupported type as scanStatus=failed and preserves the original MIME type", () => {
      const onFilesChange = vi.fn();
      render(<DisputeEvidenceUploader onFilesChange={onFilesChange} />);

      selectFiles([
        new File([new Uint8Array(8)], "payload.exe", { type: "application/x-msdownload" }),
      ]);

      const [rejected] = latestPayload(onFilesChange);
      expect(rejected).toMatchObject({
        name: "payload.exe",
        type: "application/x-msdownload",
        uploadStatus: "error",
        scanStatus: "failed",
        errorMessage: UNSUPPORTED_TYPE_MESSAGE,
      });
    });

    it("falls back to type=unknown when a rejected file carries no MIME type", () => {
      const onFilesChange = vi.fn();
      render(<DisputeEvidenceUploader onFilesChange={onFilesChange} />);

      selectFiles([new File([new Uint8Array(8)], "archive.bin")]);

      const [rejected] = latestPayload(onFilesChange);
      expect(rejected).toMatchObject({
        type: "unknown",
        uploadStatus: "error",
        scanStatus: "failed",
        errorMessage: UNSUPPORTED_TYPE_MESSAGE,
      });
    });

    it("does not start the upload pipeline for a rejected file (single deterministic callback)", () => {
      vi.useFakeTimers();
      const onFilesChange = vi.fn();
      render(<DisputeEvidenceUploader maxFileSizeMB={1} onFilesChange={onFilesChange} />);

      selectFiles([fileOfSize("oversized.pdf", MAX_1MB + 1)]);
      advance(1000);

      // A single notifyChange; no progress/scan ticks ever fire for a rejected file.
      expect(onFilesChange).toHaveBeenCalledTimes(1);
      const [rejected] = latestPayload(onFilesChange);
      expect(rejected).toMatchObject({ progress: 0, scanStatus: "failed" });
      expect(screen.queryByText("Scanning...")).not.toBeInTheDocument();
    });

    it("keeps the failure state while scanning a mixed batch (only the rejected file fails)", () => {
      vi.useFakeTimers();
      const onFilesChange = vi.fn();
      render(<DisputeEvidenceUploader maxFileSizeMB={1} onFilesChange={onFilesChange} />);

      selectFiles([
        fileOfSize("valid.pdf", 1024),
        fileOfSize("oversized.pdf", MAX_1MB + 1),
      ]);

      const batch = latestPayload(onFilesChange);
      expect(batch).toHaveLength(2);
      expect(batch[0]).toMatchObject({ name: "valid.pdf", uploadStatus: "uploading", scanStatus: "pending" });
      expect(batch[1]).toMatchObject({
        name: "oversized.pdf",
        uploadStatus: "error",
        scanStatus: "failed",
        errorMessage: SIZE_LIMIT_MESSAGE,
      });

      runScanToCompletion();
      expect(screen.getByText("Scan Passed")).toBeInTheDocument();
      expect(screen.getByText("Scan Failed")).toBeInTheDocument();
    });
  });

  describe("validateFile acceptance boundary (the `return null` exit at line 97)", () => {
    it("accepts a file whose size is exactly the configured limit", () => {
      vi.useFakeTimers();
      const onFilesChange = vi.fn();
      render(<DisputeEvidenceUploader maxFileSizeMB={1} onFilesChange={onFilesChange} />);

      selectFiles([fileOfSize("exactly-at-limit.pdf", MAX_1MB)]);

      const [accepted] = latestPayload(onFilesChange);
      expect(accepted).toMatchObject({ uploadStatus: "uploading", scanStatus: "pending", progress: 0 });
      expect(accepted.errorMessage).toBeUndefined();

      runScanToCompletion();
      expect(screen.getByText("Scan Passed")).toBeInTheDocument();
      expect(screen.queryByText("Scan Failed")).not.toBeInTheDocument();
    });

    it("rejects a file one byte past the configured limit", () => {
      vi.useFakeTimers();
      const onFilesChange = vi.fn();
      render(<DisputeEvidenceUploader maxFileSizeMB={1} onFilesChange={onFilesChange} />);

      selectFiles([fileOfSize("one-byte-over.pdf", MAX_1MB + 1)]);

      expect(latestPayload(onFilesChange)[0]).toMatchObject({
        uploadStatus: "error",
        scanStatus: "failed",
        errorMessage: SIZE_LIMIT_MESSAGE,
      });
      expect(screen.getByText("Scan Failed")).toBeInTheDocument();
    });

    it("rejects any non-empty file when maxFileSizeMB is 0", () => {
      const onFilesChange = vi.fn();
      render(<DisputeEvidenceUploader maxFileSizeMB={0} onFilesChange={onFilesChange} />);

      selectFiles([fileOfSize("tiny.pdf", 1)]);

      expect(latestPayload(onFilesChange)[0]).toMatchObject({
        size: 1,
        uploadStatus: "error",
        scanStatus: "failed",
        errorMessage: "File size exceeds maximum allowed limit of 0MB.",
      });
    });

    it("accepts a zero-byte file with an allowed extension", () => {
      vi.useFakeTimers();
      const onFilesChange = vi.fn();
      render(<DisputeEvidenceUploader maxFileSizeMB={1} onFilesChange={onFilesChange} />);

      selectFiles([fileOfSize("empty.pdf", 0)]);

      expect(latestPayload(onFilesChange)[0]).toMatchObject({
        size: 0,
        uploadStatus: "uploading",
        scanStatus: "pending",
      });
      expect(screen.getByText("Scan Pending")).toBeInTheDocument();
    });

    it("accepts an unknown MIME type when the extension is on the allowlist", () => {
      vi.useFakeTimers();
      const onFilesChange = vi.fn();
      render(<DisputeEvidenceUploader onFilesChange={onFilesChange} />);

      selectFiles([fileOfSize("scan.csv", 64, "")]);

      const [accepted] = latestPayload(onFilesChange);
      expect(accepted).toMatchObject({ uploadStatus: "uploading", scanStatus: "pending" });
      expect(accepted.errorMessage).toBeUndefined();
    });

    it("accepts an allowlisted MIME type even when the extension is not recognised", () => {
      vi.useFakeTimers();
      const onFilesChange = vi.fn();
      render(<DisputeEvidenceUploader onFilesChange={onFilesChange} />);

      selectFiles([fileOfSize("evidence.dat", 64, "application/pdf")]);

      expect(latestPayload(onFilesChange)[0]).toMatchObject({
        uploadStatus: "uploading",
        scanStatus: "pending",
      });
    });

    it("accepts an upper-case filename and upper-case MIME type", () => {
      vi.useFakeTimers();
      const onFilesChange = vi.fn();
      render(<DisputeEvidenceUploader onFilesChange={onFilesChange} />);

      selectFiles([fileOfSize("EVIDENCE.PDF", 64, "APPLICATION/PDF")]);

      expect(latestPayload(onFilesChange)[0]).toMatchObject({
        uploadStatus: "uploading",
        scanStatus: "pending",
      });
    });
  });

  describe("offline failure path", () => {
    it("marks the file as scanStatus=failed with the offline message", () => {
      const onFilesChange = vi.fn();
      render(<DisputeEvidenceUploader isOffline onFilesChange={onFilesChange} />);

      selectFiles([fileOfSize("offline_doc.pdf", 32)]);

      expect(latestPayload(onFilesChange)[0]).toMatchObject({
        uploadStatus: "error",
        scanStatus: "failed",
        progress: 0,
        errorMessage: OFFLINE_MESSAGE,
      });
      expect(screen.getByText("Scan Failed")).toBeInTheDocument();
      expect(screen.getByText(OFFLINE_MESSAGE)).toBeInTheDocument();
    });

    it("refuses to retry while offline and leaves the failure state untouched", () => {
      const onFilesChange = vi.fn();
      render(<DisputeEvidenceUploader isOffline onFilesChange={onFilesChange} />);

      selectFiles([fileOfSize("offline_doc.pdf", 32)]);
      const callsBeforeRetry = onFilesChange.mock.calls.length;

      fireEvent.click(screen.getByRole("button", { name: /Retry/i }));

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Cannot retry while offline. Check your network connection."
      );
      expect(onFilesChange).toHaveBeenCalledTimes(callsBeforeRetry);
      expect(screen.getByText("Scan Failed")).toBeInTheDocument();
      expect(screen.queryByText("Scanning...")).not.toBeInTheDocument();
    });

    it("recovers from the failure state once online: pending -> scanning -> clean", () => {
      vi.useFakeTimers();
      const onFilesChange = vi.fn();
      const { rerender } = render(
        <DisputeEvidenceUploader isOffline onFilesChange={onFilesChange} />
      );

      selectFiles([fileOfSize("offline_doc.pdf", 32)]);
      expect(screen.getByText("Scan Failed")).toBeInTheDocument();

      rerender(<DisputeEvidenceUploader isOffline={false} onFilesChange={onFilesChange} />);
      fireEvent.click(screen.getByRole("button", { name: /Retry/i }));

      const [retried] = latestPayload(onFilesChange);
      expect(retried).toMatchObject({
        progress: 0,
        uploadStatus: "uploading",
        scanStatus: "pending",
      });
      expect(retried.errorMessage).toBeUndefined();
      expect(screen.getByText("Scan Pending")).toBeInTheDocument();
      expect(screen.queryByText(OFFLINE_MESSAGE)).not.toBeInTheDocument();

      advance(100);
      expect(screen.getByText("Scanning...")).toBeInTheDocument();

      advance(100);
      expect(screen.getByText("Scan Passed")).toBeInTheDocument();
      expect(screen.queryByText("Scan Failed")).not.toBeInTheDocument();
    });
  });

  describe("ScanStatus pill contract", () => {
    it("renders Scan Pending before any timer ticks", () => {
      vi.useFakeTimers();
      render(<DisputeEvidenceUploader />);

      selectFiles([fileOfSize("doc.pdf", 32)]);

      expect(screen.getByText("Scan Pending")).toBeInTheDocument();
      expect(screen.queryByText("Scan Passed")).not.toBeInTheDocument();
    });

    it("renders Scanning... once upload completes, before the verdict arrives", () => {
      vi.useFakeTimers();
      render(<DisputeEvidenceUploader />);

      selectFiles([fileOfSize("doc.pdf", 32)]);
      advance(100);

      expect(screen.getByText("Scanning...")).toBeInTheDocument();
      expect(screen.queryByText("Scan Passed")).not.toBeInTheDocument();
      expect(screen.queryByText("Threat Detected")).not.toBeInTheDocument();
    });

    it("renders Scan Passed for a clean file", () => {
      vi.useFakeTimers();
      render(<DisputeEvidenceUploader />);

      selectFiles([fileOfSize("clean_evidence.pdf", 32)]);
      runScanToCompletion();

      expect(screen.getByText("Scan Passed")).toBeInTheDocument();
    });

    it("renders Threat Detected for a threat-flagged file and offers no Retry button", () => {
      vi.useFakeTimers();
      render(<DisputeEvidenceUploader />);

      selectFiles([fileOfSize("virus_report.pdf", 32)]);
      runScanToCompletion();

      expect(screen.getByText("Threat Detected")).toBeInTheDocument();
      expect(screen.getByText("Security threat detected in file.")).toBeInTheDocument();
      // Only uploadStatus === "error" files are retryable; a completed upload is not.
      expect(screen.queryByRole("button", { name: /Retry/i })).not.toBeInTheDocument();
    });

    it("renders Scan Failed and a Retry affordance for a rejected file", () => {
      render(<DisputeEvidenceUploader maxFileSizeMB={1} />);

      selectFiles([fileOfSize("oversized.pdf", MAX_1MB + 1)]);

      expect(screen.getByText("Scan Failed")).toBeInTheDocument();
      expect(screen.getByText(SIZE_LIMIT_MESSAGE)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
      expect(screen.queryByText("Scan Passed")).not.toBeInTheDocument();
    });

    it("never reports success while a file is in the failed state", () => {
      vi.useFakeTimers();
      render(<DisputeEvidenceUploader isOffline />);

      selectFiles([fileOfSize("offline_doc.pdf", 32)]);
      advance(1000);

      expect(screen.queryByText("Scan Passed")).not.toBeInTheDocument();
      expect(screen.queryByText("Threat Detected")).not.toBeInTheDocument();
      expect(screen.getByText("Scan Failed")).toBeInTheDocument();
    });
  });

  describe("retry from the failed state", () => {
    it("re-enters the scan pipeline when a validation-rejected file is retried", () => {
      // Characterisation test: `handleRetry` restarts the pipeline without re-running
      // `validateFile`, so a file rejected for size/type can still end up "clean".
      // This pins the current contract; see the follow-up noted in the PR description.
      vi.useFakeTimers();
      const onFilesChange = vi.fn();
      render(<DisputeEvidenceUploader maxFileSizeMB={1} onFilesChange={onFilesChange} />);

      selectFiles([fileOfSize("oversized.pdf", MAX_1MB + 1)]);
      expect(screen.getByText("Scan Failed")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Retry/i }));

      const [retried] = latestPayload(onFilesChange);
      expect(retried).toMatchObject({
        name: "oversized.pdf",
        size: MAX_1MB + 1,
        progress: 0,
        uploadStatus: "uploading",
        scanStatus: "pending",
      });
      expect(retried.errorMessage).toBeUndefined();

      runScanToCompletion();
      expect(screen.getByText("Scan Passed")).toBeInTheDocument();
      expect(screen.queryByText("Scan Failed")).not.toBeInTheDocument();
    });

    it("clears the failure banner when the rejected file is removed", () => {
      const onFilesChange = vi.fn();
      render(<DisputeEvidenceUploader maxFileSizeMB={1} onFilesChange={onFilesChange} />);

      selectFiles([fileOfSize("oversized.pdf", MAX_1MB + 1)]);
      expect(screen.getByText("Scan Failed")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Remove oversized\.pdf/i }));

      expect(latestPayload(onFilesChange)).toEqual([]);
      expect(screen.queryByText("Scan Failed")).not.toBeInTheDocument();
      expect(screen.queryByText("oversized.pdf")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Retry/i })).not.toBeInTheDocument();
    });

    it("clears the failure state after retrying the rejected file of a mixed batch", () => {
      vi.useFakeTimers();
      const onFilesChange = vi.fn();
      render(<DisputeEvidenceUploader maxFileSizeMB={1} onFilesChange={onFilesChange} />);

      selectFiles([
        fileOfSize("oversized.pdf", MAX_1MB + 1),
        fileOfSize("valid.pdf", 512),
      ]);

      // Exactly one retry affordance: the rejected file.
      expect(screen.getAllByRole("button", { name: /Retry/i })).toHaveLength(1);

      fireEvent.click(screen.getByRole("button", { name: /Retry/i }));

      const afterRetry = latestPayload(onFilesChange);
      expect(afterRetry).toHaveLength(2);
      expect(afterRetry[0]).toMatchObject({ name: "oversized.pdf", scanStatus: "pending" });
      expect(afterRetry[1]).toMatchObject({ name: "valid.pdf", scanStatus: "pending" });

      runScanToCompletion();

      // Retrying the only rejected file converges the batch to a clean verdict.
      expect(screen.queryByText("Scan Failed")).not.toBeInTheDocument();
      expect(screen.getAllByText("Scan Passed")).toHaveLength(2);
      expect(screen.queryByRole("button", { name: /Retry/i })).not.toBeInTheDocument();
    });
  });
});
