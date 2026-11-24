import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Dispute } from "./dispute-types";
import { DisputeTrackingPanel } from "./dispute-tracking-panel";

const createDispute = (overrides: Partial<Dispute> = {}): Dispute => ({
  id: "dispute-123",
  slotId: "slot-456",
  category: "service_not_delivered",
  reason: "Service not delivered",
  description: "The provider did not complete the agreed work.",
  status: "under_review",
  evidence: [
    {
      id: "evidence-1",
      fileName: "proof.pdf",
      fileSize: 128000,
      fileType: "PDF",
      uploadStatus: "completed",
      scanStatus: "clean",
      uploadedAt: "2026-06-03T12:00:00.000Z",
    },
  ],
  createdAt: "2026-06-01T08:00:00.000Z",
  updatedAt: "2026-06-03T09:00:00.000Z",
  submittedAt: "2026-06-01T09:00:00.000Z",
  mediator: {
    id: "mediator-1",
    name: "Amina Yusuf",
    assignedAt: "2026-06-02T10:00:00.000Z",
    responseSla: "Responds within 24 hours",
    responseDue: "Due Tue, Jul 21 at 11:15 AM",
  },
  notes: [
    {
      id: "note-1",
      author: "Ari Buyer",
      authorRole: "buyer",
      content: "I need help resolving this issue.",
      createdAt: "2026-06-02T09:00:00.000Z",
    },
    {
      id: "note-2",
      author: "Amina Yusuf",
      authorRole: "mediator",
      content: "I am reviewing the evidence.",
      createdAt: "2026-06-02T11:00:00.000Z",
    },
  ],
  metadata: {
    priority: "high",
    escalationCount: 1,
    lastActivityAt: "2026-06-03T09:00:00.000Z",
  },
  ...overrides,
});

describe("DisputeTrackingPanel", () => {
  it("renders the dispute summary, mediator details, evidence, and active note form", () => {
    const onViewEvidence = vi.fn();
    render(
      <DisputeTrackingPanel
        dispute={createDispute()}
        onAddNote={vi.fn()}
        onViewEvidence={onViewEvidence}
      />,
    );

    expect(screen.getByRole("heading", { name: "Service not delivered" })).toBeInTheDocument();
    expect(screen.getByText(/high priority/i)).toBeInTheDocument();
    expect(screen.getByText("The provider did not complete the agreed work.")).toBeInTheDocument();
    expect(screen.getAllByText("Amina Yusuf").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Responds within 24 hours").length).toBeGreaterThan(0);
    expect(screen.getByText(/evidence files/i)).toBeInTheDocument();
    expect(screen.getByText("proof.pdf")).toBeInTheDocument();
    expect(screen.getByText("Safe")).toBeInTheDocument();
    expect(screen.getByText("Uploaded")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view proof\.pdf/i })).toBeInTheDocument();
    expect(screen.getByText("I need help resolving this issue.")).toBeInTheDocument();
    expect(screen.getByText("Add a note")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type your message or note here...")).toBeInTheDocument();
  });

  it("blocks empty or whitespace-only notes from being submitted", async () => {
    const user = userEvent.setup();
    const onAddNote = vi.fn();

    render(<DisputeTrackingPanel dispute={createDispute()} onAddNote={onAddNote} />);

    const textarea = screen.getByPlaceholderText("Type your message or note here...");
    const button = screen.getByRole("button", { name: /send/i });

    await user.type(textarea, "   ");

    expect(button).toBeDisabled();
    await user.click(button);
    expect(onAddNote).not.toHaveBeenCalled();
  });

  it("submits a valid note and clears the field after the async callback resolves", async () => {
    const user = userEvent.setup();
    let resolveNote: (() => void) | undefined;
    const onAddNote = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveNote = resolve;
        }),
    );

    render(<DisputeTrackingPanel dispute={createDispute()} onAddNote={onAddNote} />);

    const textarea = screen.getByPlaceholderText("Type your message or note here...");
    const button = screen.getByRole("button", { name: /send/i });

    await user.type(textarea, "Please review the final evidence.");
    await user.click(button);

    expect(onAddNote).toHaveBeenCalledWith("Please review the final evidence.");
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

    resolveNote?.();

    await waitFor(() => {
      expect(textarea).toHaveValue("");
      expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
    });
  });

  it("shows the empty state for note history and hides the note composer for closed disputes", () => {
    const dispute = createDispute({
      status: "resolved",
      notes: [],
      resolution: {
        type: "partial_refund",
        description: "A partial refund will be issued.",
        resolvedAt: "2026-06-04T08:00:00.000Z",
        resolvedBy: "Amina Yusuf",
      },
    });

    render(<DisputeTrackingPanel dispute={dispute} onAddNote={vi.fn()} />);

    expect(
      screen.getByText("No notes or communication yet. Add a note to start the discussion."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Add a note")).not.toBeInTheDocument();
    expect(screen.getByText(/resolution:/i)).toBeInTheDocument();
  });

  it("displays scan failure and threat detected states for evidence files", () => {
    const dispute = createDispute({
      evidence: [
        {
          id: "ev-clean",
          fileName: "clean.pdf",
          fileSize: 1024,
          fileType: "application/pdf",
          uploadStatus: "completed",
          scanStatus: "clean",
          uploadedAt: "2026-06-03T12:00:00.000Z",
        },
        {
          id: "ev-threat",
          fileName: "infected_attachment.pdf",
          fileSize: 2048,
          fileType: "application/pdf",
          uploadStatus: "completed",
          scanStatus: "threat_detected",
          uploadedAt: "2026-06-03T12:01:00.000Z",
        },
        {
          id: "ev-failed",
          fileName: "corrupt.png",
          fileSize: 4096,
          fileType: "image/png",
          uploadStatus: "failed",
          scanStatus: "failed",
          uploadedAt: "2026-06-03T12:02:00.000Z",
        },
      ],
    });

    render(<DisputeTrackingPanel dispute={dispute} />);

    expect(screen.getByText("clean.pdf")).toBeInTheDocument();
    expect(screen.getByText("Safe")).toBeInTheDocument();
    expect(screen.getByText("infected_attachment.pdf")).toBeInTheDocument();
    expect(screen.getByText("Threat Detected")).toBeInTheDocument();
    expect(screen.getByText("corrupt.png")).toBeInTheDocument();
    expect(screen.getByText("Scan Failed")).toBeInTheDocument();
    expect(screen.getByText("Upload Failed")).toBeInTheDocument();
  });

  it("updates timeline entries as dispute status transitions", () => {
    const { rerender } = render(
      <DisputeTrackingPanel
        dispute={createDispute({
          status: "submitted",
          mediator: undefined,
        })}
      />,
    );

    expect(screen.getByText("Dispute Filed")).toBeInTheDocument();
    expect(screen.getByText("Dispute Submitted")).toBeInTheDocument();

    rerender(
      <DisputeTrackingPanel
        dispute={createDispute({
          status: "evidence_review",
        })}
      />,
    );
    expect(screen.getByText("Mediator Assigned")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Evidence Review/i })).toHaveAttribute(
      "aria-current",
      "step",
    );

    rerender(
      <DisputeTrackingPanel
        dispute={createDispute({
          status: "escalated",
        })}
      />,
    );
    expect(screen.getByText("Dispute Escalated")).toBeInTheDocument();
  });
});
