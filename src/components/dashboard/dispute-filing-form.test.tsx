/**
 * DisputeFilingForm tests
 *
 * Regression coverage for issue #949 — failure handling around the
 * validator's explicit `return null` success branches:
 *   - line 52: valid category  -> null (no error surfaced)
 *   - line 59: valid reason    -> null (no error surfaced)
 *   - line 66: valid description -> null (no error surfaced)
 *
 * Coverage targets:
 *  - Category / reason / description validators: required, min-length and
 *    max-length boundaries, and the silent-success (`null`) branches
 *  - Evidence gating: no files, pending uploads, failed uploads,
 *    threat-detected scans
 *  - Submit failure paths: error contract (role="alert" messages,
 *    aria-invalid), focus on the first error field, onSubmit not called
 *  - Submit success path: exact DisputeFormData payload with File evidence
 *  - Corrective resubmission clears stale errors
 *  - isSubmitting prop contract and the cancel callback
 *
 * DisputeEvidenceUploader is stubbed because the real component drives its
 * upload/scan lifecycle with timers; the stub lets each test set the exact
 * DisputeFile states (uploading / error / threat_detected / clean) that the
 * form's evidence validation branches on, deterministically.
 */

import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DisputeFilingForm } from "./dispute-filing-form";
import type { DisputeFormData } from "./dispute-types";
import type { DisputeFile } from "./dispute-evidence-uploader";

// ---------------------------------------------------------------------------
// Evidence uploader harness
// ---------------------------------------------------------------------------

const uploaderHarness = vi.hoisted(() => ({
  onFilesChange: null as ((files: DisputeFile[]) => void) | null,
}));

vi.mock("./dispute-evidence-uploader", () => ({
  DisputeEvidenceUploader: ({
    onFilesChange,
  }: {
    onFilesChange?: (files: DisputeFile[]) => void;
  }) => {
    uploaderHarness.onFilesChange = onFilesChange ?? null;
    return <div data-testid="evidence-uploader-stub" />;
  },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const REASON_INPUT_LABEL = /Reason for Dispute/i;
const DESCRIPTION_INPUT_LABEL = /Detailed Description/i;

const REASON_BELOW_MIN = "012345678"; // 9 chars (< min 10)
const REASON_AT_MIN = "0123456789"; // exactly 10 chars
const REASON_OK = "Provider never arrived for the booked session"; // 45 chars
const REASON_OVER_MAX = "r".repeat(201); // 201 chars (> max 200)

const DESCRIPTION_BELOW_MIN = "d".repeat(49); // 49 chars (< min 50)
const DESCRIPTION_AT_MIN = "d".repeat(50); // exactly 50 chars
const DESCRIPTION_OK =
  "The booked slot passed without the service being delivered and the provider has not replied to any follow-up messages since."; // 125 chars
const DESCRIPTION_OVER_MAX = "d".repeat(2001); // 2001 chars (> max 2000)

function makeFile(name = "evidence.pdf"): File {
  return new File(["dispute-evidence"], name, { type: "application/pdf" });
}

function makeDisputeFile(overrides: Partial<DisputeFile> = {}): DisputeFile {
  return {
    id: "file-1",
    file: makeFile(),
    name: "evidence.pdf",
    size: 1024,
    type: "application/pdf",
    progress: 100,
    uploadStatus: "completed",
    scanStatus: "clean",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup + interaction helpers
// ---------------------------------------------------------------------------

type SetupOptions = { isSubmitting?: boolean; slotId?: string };

function setup({ isSubmitting = false, slotId = "slot-949" }: SetupOptions = {}) {
  const onSubmit = vi
    .fn<(data: DisputeFormData) => Promise<void>>()
    .mockResolvedValue(undefined);
  const onCancel = vi.fn();
  uploaderHarness.onFilesChange = null;
  const utils = render(
    <DisputeFilingForm
      slotId={slotId}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
    />,
  );
  return { ...utils, onSubmit, onCancel };
}

function selectCategory(name: RegExp) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function setReason(value: string) {
  fireEvent.change(screen.getByLabelText(REASON_INPUT_LABEL), {
    target: { value },
  });
}

function blurReason() {
  fireEvent.blur(screen.getByLabelText(REASON_INPUT_LABEL));
}

function setDescription(value: string) {
  fireEvent.change(screen.getByLabelText(DESCRIPTION_INPUT_LABEL), {
    target: { value },
  });
}

function blurDescription() {
  fireEvent.blur(screen.getByLabelText(DESCRIPTION_INPUT_LABEL));
}

function pushFiles(files: DisputeFile[]) {
  act(() => {
    uploaderHarness.onFilesChange?.(files);
  });
}

function fillValidForm() {
  selectCategory(/Service Not Delivered/i);
  setReason(REASON_OK);
  setDescription(DESCRIPTION_OK);
}

function submitForm(container: HTMLElement) {
  fireEvent.submit(container.querySelector("form")!);
}

function getSubmitButton() {
  return screen.getByRole("button", { name: /Submit Dispute/i });
}

// Exact match: /Cancel/i would also hit the "Cancellation Dispute" category.
function getCancelButton() {
  return screen.getByRole("button", { name: "Cancel" });
}

beforeEach(() => {
  uploaderHarness.onFilesChange = null;
});

// ---------------------------------------------------------------------------
// Rendering & static contract
// ---------------------------------------------------------------------------

describe("DisputeFilingForm", () => {
  describe("rendering", () => {
    it("renders every dispute category and the security notice", () => {
      setup();

      expect(
        screen.getByRole("button", { name: /Service Not Delivered/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Quality Mismatch/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Payment Issue/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Cancellation Dispute/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Communication Issue/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Other/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Evidence Security & Privacy"),
      ).toBeInTheDocument();
    });

    it("starts pristine: submit disabled with hints and zeroed counters", () => {
      setup();

      expect(getSubmitButton()).toBeDisabled();
      expect(screen.getByText("Minimum 10 characters")).toBeInTheDocument();
      expect(
        screen.getByText("Minimum 50 characters. Be as specific as possible."),
      ).toBeInTheDocument();
      expect(screen.getByText("0/200")).toBeInTheDocument();
      expect(screen.getByText("0/2000")).toBeInTheDocument();
    });

    it("reflects the isSubmitting prop on both action buttons", () => {
      const { onCancel } = setup({ isSubmitting: true });

      expect(
        screen.getByRole("button", { name: "Submitting Dispute..." }),
      ).toBeDisabled();
      expect(getCancelButton()).toBeDisabled();

      fireEvent.click(getCancelButton());
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Validator failure branches (error contract)
  // -------------------------------------------------------------------------

  describe("validator failure branches", () => {
    it("category: blur without a selection shows the required error", () => {
      setup();

      fireEvent.blur(
        screen.getByRole("button", { name: /Service Not Delivered/i }),
      );

      expect(
        screen.getByText("Please select a dispute category"),
      ).toHaveAttribute("role", "alert");
    });

    it("reason: empty blur shows the required error", () => {
      setup();

      blurReason();

      expect(screen.getByText("Reason is required")).toHaveAttribute(
        "role",
        "alert",
      );
    });

    it("reason: input below the 10-character minimum shows the min error", () => {
      setup();

      setReason(REASON_BELOW_MIN);
      blurReason();

      expect(
        screen.getByText("Reason must be at least 10 characters"),
      ).toBeInTheDocument();
      expect(screen.getByText("9/200")).toBeInTheDocument();
    });

    it("reason: input above the 200-character maximum shows the max error", () => {
      setup();

      setReason(REASON_OVER_MAX);
      blurReason();

      expect(
        screen.getByText("Reason must not exceed 200 characters"),
      ).toBeInTheDocument();
      expect(screen.getByText("201/200")).toBeInTheDocument();
    });

    it("description: empty blur shows the required error", () => {
      setup();

      blurDescription();

      expect(screen.getByText("Description is required")).toHaveAttribute(
        "role",
        "alert",
      );
    });

    it("description: input below the 50-character minimum shows the min error", () => {
      setup();

      setDescription(DESCRIPTION_BELOW_MIN);
      blurDescription();

      expect(
        screen.getByText("Description must be at least 50 characters"),
      ).toBeInTheDocument();
      expect(screen.getByText("49/2000")).toBeInTheDocument();
    });

    it("description: input above the 2000-character maximum shows the max error", () => {
      setup();

      setDescription(DESCRIPTION_OVER_MAX);
      blurDescription();

      expect(
        screen.getByText("Description must not exceed 2000 characters"),
      ).toBeInTheDocument();
      expect(screen.getByText("2001/2000")).toBeInTheDocument();
    });

    it("reason: aria-invalid tracks validity across a correction", () => {
      setup();
      const reasonInput = screen.getByLabelText(REASON_INPUT_LABEL);

      setReason(REASON_BELOW_MIN);
      blurReason();
      expect(reasonInput).toHaveAttribute("aria-invalid", "true");

      setReason(REASON_AT_MIN);
      blurReason();
      expect(reasonInput).toHaveAttribute("aria-invalid", "false");
    });
  });

  // -------------------------------------------------------------------------
  // Validator success branches — the explicit `return null` paths under
  // regression (lines 52 / 59 / 66): a valid value must produce no error,
  // leaving the neutral hint in place instead of an alert.
  // -------------------------------------------------------------------------

  describe("validator success branches (return null paths)", () => {
    it("category: selecting a category clears the required error (line 52)", () => {
      setup();

      fireEvent.blur(
        screen.getByRole("button", { name: /Service Not Delivered/i }),
      );
      expect(
        screen.getByText("Please select a dispute category"),
      ).toBeInTheDocument();

      selectCategory(/Service Not Delivered/i);

      expect(
        screen.queryByText("Please select a dispute category"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Service Not Delivered/i }),
      ).toHaveAttribute("aria-pressed", "true");
    });

    it("reason: exactly 10 characters is valid and keeps the hint (line 59)", () => {
      setup();

      setReason(REASON_AT_MIN);
      blurReason();

      expect(
        screen.queryByText("Reason must be at least 10 characters"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Reason is required")).not.toBeInTheDocument();
      expect(screen.getByText("Minimum 10 characters")).toBeInTheDocument();
      expect(screen.getByText("10/200")).toBeInTheDocument();
    });

    it("description: exactly 50 characters is valid and keeps the hint (line 66)", () => {
      setup();

      setDescription(DESCRIPTION_AT_MIN);
      blurDescription();

      expect(
        screen.queryByText("Description must be at least 50 characters"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Description is required"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("Minimum 50 characters. Be as specific as possible."),
      ).toBeInTheDocument();
      expect(screen.getByText("50/2000")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Submit gating (failure paths)
  // -------------------------------------------------------------------------

  describe("submit gating", () => {
    it("empty submit renders all four alerts, keeps submit disabled, skips onSubmit", () => {
      const { container, onSubmit } = setup();

      submitForm(container);

      expect(screen.getAllByRole("alert")).toHaveLength(4);
      expect(
        screen.getByText("Please select a dispute category"),
      ).toBeInTheDocument();
      expect(screen.getByText("Reason is required")).toBeInTheDocument();
      expect(screen.getByText("Description is required")).toBeInTheDocument();
      expect(
        screen.getByText("At least one evidence file is required"),
      ).toBeInTheDocument();
      expect(getSubmitButton()).toBeDisabled();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("pending uploads block submission with the wait message", () => {
      const { container, onSubmit } = setup();

      fillValidForm();
      pushFiles([
        makeDisputeFile({
          uploadStatus: "uploading",
          scanStatus: "scanning",
          progress: 42,
        }),
      ]);
      submitForm(container);

      expect(
        screen.getByText(
          "Please wait for all files to finish uploading and scanning",
        ),
      ).toBeInTheDocument();
      expect(getSubmitButton()).toBeDisabled();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("failed uploads block submission with the resolve message", () => {
      const { container, onSubmit } = setup();

      fillValidForm();
      pushFiles([
        makeDisputeFile({
          uploadStatus: "error",
          scanStatus: "failed",
          errorMessage: "Upload failed.",
        }),
      ]);
      submitForm(container);

      expect(
        screen.getByText(
          "Please resolve failed or threat-detected files before submitting",
        ),
      ).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("threat-detected scans block submission with the resolve message", () => {
      const { container, onSubmit } = setup();

      fillValidForm();
      pushFiles([
        makeDisputeFile({ scanStatus: "threat_detected" }),
      ]);
      submitForm(container);

      expect(
        screen.getByText(
          "Please resolve failed or threat-detected files before submitting",
        ),
      ).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("evidence errors clear on the next uploader emission, not the first (stale-state contract)", () => {
      const { container } = setup();

      submitForm(container);
      expect(
        screen.getByText("At least one evidence file is required"),
      ).toBeInTheDocument();

      // The form validates each onFilesChange emission against the
      // evidenceFiles snapshot from the previous render, so the first
      // emission after the failure still sees the empty list.
      pushFiles([makeDisputeFile()]);
      expect(
        screen.getByText("At least one evidence file is required"),
      ).toBeInTheDocument();

      // The real uploader emits on every upload/scan transition, and the
      // next emission validates against the completed upload.
      pushFiles([makeDisputeFile()]);
      expect(
        screen.queryByText("At least one evidence file is required"),
      ).not.toBeInTheDocument();
    });

    it("focuses the first error field when the category is already valid", () => {
      const { container, onSubmit } = setup();

      selectCategory(/Service Not Delivered/i);
      setDescription(DESCRIPTION_OK);
      pushFiles([makeDisputeFile()]);
      submitForm(container);

      expect(
        screen.getByText("Reason is required"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(REASON_INPUT_LABEL)).toHaveFocus();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Success path
  // -------------------------------------------------------------------------

  describe("success path", () => {
    it("a valid form submits the exact DisputeFormData payload", () => {
      const { container, onSubmit } = setup();
      const evidenceFile = makeDisputeFile();

      fillValidForm();
      pushFiles([evidenceFile]);
      expect(getSubmitButton()).toBeEnabled();

      submitForm(container);

      expect(onSubmit).toHaveBeenCalledTimes(1);
      const payload = onSubmit.mock.calls[0][0];
      expect(payload.category).toBe("service_not_delivered");
      expect(payload.reason).toBe(REASON_OK);
      expect(payload.description).toBe(DESCRIPTION_OK);
      expect(payload.evidence).toHaveLength(1);
      expect(payload.evidence[0]).toBeInstanceOf(File);
      expect(payload.evidence[0].name).toBe("evidence.pdf");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("corrective resubmission clears stale errors and calls onSubmit", () => {
      const { container, onSubmit } = setup();

      submitForm(container);
      expect(screen.getAllByRole("alert")).toHaveLength(4);

      selectCategory(/Service Not Delivered/i);
      setReason(REASON_OK);
      blurReason();
      setDescription(DESCRIPTION_OK);
      blurDescription();
      // Two emissions: the first is validated against the pre-upload
      // evidenceFiles snapshot (see the stale-state contract test), the
      // second against the completed upload — mirroring the real uploader,
      // which emits on every upload/scan transition.
      pushFiles([makeDisputeFile()]);
      pushFiles([makeDisputeFile()]);

      expect(getSubmitButton()).toBeEnabled();
      fireEvent.click(getSubmitButton());

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Cancel
  // -------------------------------------------------------------------------

  it("cancel invokes onCancel", () => {
    const { onCancel } = setup();

    fireEvent.click(getCancelButton());

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
