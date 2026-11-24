import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import {
  DisputeTrackingPanel,
  type Dispute,
  type DisputeNote,
} from "@/components/dashboard/dispute-tracking-panel";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeNote(override: Partial<DisputeNote> = {}): DisputeNote {
  return {
    id: "note-1",
    author: "Amina Yusuf",
    authorRole: "mediator",
    content: "We are reviewing the evidence.",
    createdAt: "2026-06-30T09:15:00Z",
    ...override,
  };
}

function makeDispute(override: Partial<Dispute> = {}): Dispute {
  return {
    id: "dispute-1",
    slotId: "slot-1",
    category: "not_as_described",
    reason: "Item did not match the listing",
    description: "The delivered service was shorter than advertised.",
    status: "submitted",
    evidence: [],
    createdAt: "2026-06-29T09:00:00Z",
    updatedAt: "2026-06-30T09:00:00Z",
    submittedAt: "2026-06-29T09:05:00Z",
    notes: [],
    metadata: {
      priority: "medium",
      escalationCount: 0,
      lastActivityAt: "2026-06-30T09:00:00Z",
    },
    ...override,
  };
}

function renderPanel(dispute: Dispute, onAddNote = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)) {
  return {
    onAddNote,
    ...render(<DisputeTrackingPanel dispute={dispute} onAddNote={onAddNote} />),
  };
}

// ─── Status header ───────────────────────────────────────────────────────────

describe("DisputeTrackingPanel — status header", () => {
  const cases: Array<[Dispute["status"], string]> = [
    ["submitted", "Submitted"],
    ["under_review", "Under Review"],
    ["investigating", "Investigating"],
    ["resolved", "Resolved"],
    ["rejected", "Rejected"],
  ];

  it.each(cases)("renders the label for status %s", (status, label) => {
    renderPanel(makeDispute({ status }));
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  });

  it("renders the last-updated line wired to dispute.updatedAt", () => {
    renderPanel(makeDispute({ updatedAt: "2026-06-30T09:00:00Z" }));
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    const expected = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date("2026-06-30T09:00:00Z"));
    expect(screen.getByText(new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeInTheDocument();
  });

  it("renders the dispute details with underscores normalised to spaces", () => {
    renderPanel(makeDispute({ category: "not_as_described" }));
    const category = screen.getByText("not as described");
    expect(category).toBeInTheDocument();
    // The raw underscored form must not leak to the UI.
    expect(screen.queryByText("not_as_described")).not.toBeInTheDocument();
  });

  it("renders reason and description verbatim", () => {
    renderPanel(
      makeDispute({
        reason: "Service ended early",
        description: "The booking was cut short by 20 minutes.",
      }),
    );
    expect(screen.getByText("Service ended early")).toBeInTheDocument();
    expect(screen.getByText("The booking was cut short by 20 minutes.")).toBeInTheDocument();
  });
});

// ─── Evidence list ───────────────────────────────────────────────────────────

describe("DisputeTrackingPanel — evidence", () => {
  it("does not render the Evidence section when there is no evidence", () => {
    renderPanel(makeDispute({ evidence: [] }));
    expect(screen.queryByText(/Evidence Files/i)).not.toBeInTheDocument();
  });

  it("renders uploaded and clean-scan evidence", () => {
    renderPanel(
      makeDispute({
        evidence: [
          {
            id: "ev-1",
            fileName: "receipt.pdf",
            fileSize: 2048,
            fileType: "application/pdf",
            uploadStatus: "completed",
            scanStatus: "clean",
            uploadedAt: "2026-06-30T09:00:00Z",
          },
        ],
      }),
    );
    expect(screen.getByText(/Evidence Files \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText("receipt.pdf")).toBeInTheDocument();
    expect(screen.getByText("Safe")).toBeInTheDocument();
    expect(screen.getByText("Uploaded")).toBeInTheDocument();
    expect(screen.getByText(/2\.0 KB/)).toBeInTheDocument();
  });

  it("does not show the clean or uploaded badges for pending/failed evidence", () => {
    renderPanel(
      makeDispute({
        evidence: [
          {
            id: "ev-2",
            fileName: "draft.png",
            fileSize: 1024,
            fileType: "image/png",
            uploadStatus: "pending",
            scanStatus: "pending",
            uploadedAt: "2026-06-30T09:00:00Z",
          },
        ],
      }),
    );
    expect(screen.getByText("draft.png")).toBeInTheDocument();
    expect(screen.queryByText("Safe")).not.toBeInTheDocument();
    expect(screen.queryByText("Uploaded")).not.toBeInTheDocument();
    expect(screen.getByText("Scan Pending")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders scan failure and threat detected statuses for evidence", () => {
    renderPanel(
      makeDispute({
        evidence: [
          {
            id: "ev-3",
            fileName: "virus.pdf",
            fileSize: 1024,
            fileType: "application/pdf",
            uploadStatus: "completed",
            scanStatus: "threat_detected",
            uploadedAt: "2026-06-30T09:00:00Z",
          },
          {
            id: "ev-4",
            fileName: "broken.png",
            fileSize: 1024,
            fileType: "image/png",
            uploadStatus: "failed",
            scanStatus: "failed",
            uploadedAt: "2026-06-30T09:00:00Z",
          },
        ],
      }),
    );
    expect(screen.getByText("virus.pdf")).toBeInTheDocument();
    expect(screen.getByText("Threat Detected")).toBeInTheDocument();
    expect(screen.getByText("broken.png")).toBeInTheDocument();
    expect(screen.getByText("Scan Failed")).toBeInTheDocument();
    expect(screen.getByText("Upload Failed")).toBeInTheDocument();
  });
});

// ─── Notes & status timeline ─────────────────────────────────────────────────

describe("DisputeTrackingPanel — timeline & notes", () => {
  it("always renders the Communication & Notes and Status timeline sections, even with no notes", () => {
    renderPanel(makeDispute({ notes: [] }));
    expect(screen.getByText("Communication & Notes")).toBeInTheDocument();
    expect(screen.getByLabelText("Status timeline")).toBeInTheDocument();
  });

  it("renders every note with author, role and content", () => {
    renderPanel(
      makeDispute({
        notes: [
          makeNote({ id: "n1", author: "Buyer One", authorRole: "buyer", content: "Please review." }),
          makeNote({ id: "n2", author: "Seller One", authorRole: "seller", content: "Evidence attached." }),
        ],
      }),
    );
    expect(screen.getByText("Buyer One")).toBeInTheDocument();
    expect(screen.getByText("buyer")).toBeInTheDocument();
    expect(screen.getByText("Please review.")).toBeInTheDocument();
    expect(screen.getByText("Seller One")).toBeInTheDocument();
    expect(screen.getByText("seller")).toBeInTheDocument();
    expect(screen.getByText("Evidence attached.")).toBeInTheDocument();
  });

  it("updates timeline milestones and active steps as dispute status changes", () => {
    const { rerender } = renderPanel(makeDispute({ status: "submitted" }));
    expect(screen.getByText("Dispute Filed")).toBeInTheDocument();
    expect(screen.getByText("Dispute Submitted")).toBeInTheDocument();

    rerender(
      <DisputeTrackingPanel
        dispute={makeDispute({
          status: "investigating",
        })}
        onAddNote={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: /Investigating/i })).toHaveAttribute(
      "aria-current",
      "step",
    );

    rerender(
      <DisputeTrackingPanel
        dispute={makeDispute({
          status: "resolved",
          resolution: {
            type: "full_refund",
            description: "Refund approved by mediator.",
            resolvedAt: "2026-07-01T10:00:00Z",
            resolvedBy: "Amina Yusuf",
          },
        })}
        onAddNote={vi.fn()}
      />,
    );
    expect(screen.getByText("Dispute Resolved")).toBeInTheDocument();
    expect(screen.getByText(/Resolution: Full Refund/i)).toBeInTheDocument();
  });
});

// ─── Add note form ───────────────────────────────────────────────────────────

describe("DisputeTrackingPanel — add note", () => {
  it("disables the submit button until non-whitespace content is entered", async () => {
    renderPanel(makeDispute());
    const input = screen.getByPlaceholderText("Type your message or note here...");
    const button = screen.getByRole("button", { name: /send/i });

    expect(button).toBeDisabled();

    await userEvent.type(input, "   ");
    expect(button).toBeDisabled();

    await userEvent.type(input, "hello");
    expect(button).toBeEnabled();
  });

  it("submits the trimmed note, clears the input and re-disables the button", async () => {
    const { onAddNote } = renderPanel(makeDispute());
    const input = screen.getByPlaceholderText("Type your message or note here...");
    const button = screen.getByRole("button", { name: /send/i });

    await userEvent.type(input, "  needs follow up  ");
    await userEvent.click(button);

    expect(onAddNote).toHaveBeenCalledTimes(1);
    expect(onAddNote).toHaveBeenCalledWith("needs follow up");
    await waitFor(() => expect(input).toHaveValue(""));
    expect(button).toBeDisabled();
  });

  it("ignores a whitespace-only submission", async () => {
    const { onAddNote } = renderPanel(makeDispute());
    const button = screen.getByRole("button", { name: /send/i });

    fireEvent.click(button);
    await Promise.resolve();

    expect(onAddNote).not.toHaveBeenCalled();
  });

  it("disables the input and button while the note is in flight", async () => {
    let resolveNote: (() => void) | undefined;
    const onAddNote = vi.fn<() => Promise<void>>(
      () => new Promise<void>((resolve) => {
        resolveNote = resolve;
      }),
    );
    renderPanel(makeDispute(), onAddNote);
    const input = screen.getByPlaceholderText("Type your message or note here...");
    const button = screen.getByRole("button", { name: /send/i });

    await userEvent.type(input, "checking");
    fireEvent.click(button);

    expect(onAddNote).toHaveBeenCalledWith("checking");
    await waitFor(() => expect(input).toBeDisabled());
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

    await act(async () => {
      resolveNote?.();
    });

    await waitFor(() => expect(input).toBeEnabled());
    expect(input).toHaveValue("");
  });

  it("caps the note input at 500 characters", () => {
    renderPanel(makeDispute());
    const input = screen.getByPlaceholderText("Type your message or note here...");
    expect(input).toHaveAttribute("maxlength", "500");
  });
});
