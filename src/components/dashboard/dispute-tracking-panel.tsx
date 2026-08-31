"use client";

import { useState } from "react";
import { 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Tag,
  ExternalLink
} from "lucide-react";
import { StatusTimeline } from "./status-timeline";
import { TimelineNode, TimelineItem } from "./timeline-types";
import { 
  Dispute, 
  DisputeStatus, 
  DISPUTE_STATUS_LABELS,
  DISPUTE_RESOLUTION_LABELS 
} from "./dispute-types";

interface DisputeTrackingPanelProps {
  dispute: Dispute;
  onAddNote?: (content: string) => Promise<void>;
  onViewEvidence?: (evidenceId: string) => void;
}

export function DisputeTrackingPanel({
  dispute,
  onAddNote,
  onViewEvidence
}: DisputeTrackingPanelProps) {
  const [newNote, setNewNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const timelineNodes: TimelineNode[] = convertDisputeToTimeline(dispute);

  const handleAddNote = async () => {
    if (!newNote.trim() || !onAddNote) return;
    
    setIsSubmittingNote(true);
    try {
      await onAddNote(newNote.trim());
      setNewNote("");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const getStatusColor = (status: DisputeStatus) => {
    switch (status) {
      case "resolved":
        return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "rejected":
        return "text-rose-400 bg-rose-400/10 border-rose-400/20";
      case "escalated":
        return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "mediator_assigned":
      case "under_review":
        return "text-cyan-400 bg-cyan-400/10 border-cyan-400/20";
      default:
        return "text-slate-300 bg-slate-400/10 border-slate-400/20";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-rose-400 bg-rose-400/10 border-rose-400/20";
      case "high":
        return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "medium":
        return "text-cyan-400 bg-cyan-400/10 border-cyan-400/20";
      default:
        return "text-slate-300 bg-slate-400/10 border-slate-400/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Dispute Header */}
      <div className="glass-panel rounded-2xl border border-white/10 bg-slate-950/20 p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getStatusColor(dispute.status)}`}>
                {DISPUTE_STATUS_LABELS[dispute.status]}
              </span>
              {dispute.metadata?.priority && (
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getPriorityColor(dispute.metadata.priority)}`}>
                  {dispute.metadata.priority} priority
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white">{dispute.reason}</h2>
          </div>
          <div className="text-right text-sm text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 justify-end">
              <Calendar className="h-3.5 w-3.5" />
              <span>Filed {new Date(dispute.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <Tag className="h-3.5 w-3.5" />
              <span>ID: {dispute.id.slice(0, 8)}...</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="text-sm text-slate-300 leading-relaxed">{dispute.description}</p>
        </div>

        {/* Resolution Info */}
        {dispute.resolution && (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-emerald-300">
                    Resolution: {DISPUTE_RESOLUTION_LABELS[dispute.resolution.type]}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{dispute.resolution.description}</p>
                <p className="text-xs text-slate-400">
                  Resolved by {dispute.resolution.resolvedBy} on {new Date(dispute.resolution.resolvedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="glass-panel rounded-2xl border border-white/10 bg-slate-950/20 p-6">
        <StatusTimeline items={timelineNodes} />
      </div>

      {/* Mediator Information */}
      {dispute.mediator && (
        <div className="glass-panel rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-400">
              <User className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{dispute.mediator.name}</h3>
                <p className="text-sm text-slate-400">Assigned Mediator</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Response SLA</p>
                  <p className="text-sm font-medium text-white mt-1">{dispute.mediator.responseSla}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Due By</p>
                  <p className="text-sm font-medium text-white mt-1">{dispute.mediator.responseDue}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Files */}
      {dispute.evidence.length > 0 && (
        <div className="glass-panel rounded-2xl border border-white/10 bg-slate-950/20 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Evidence Files ({dispute.evidence.length})
          </h3>
          <div className="space-y-2">
            {dispute.evidence.map((evidence) => (
              <div
                key={evidence.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/40 p-3 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-800 text-slate-300">
                    <FileText className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{evidence.fileName}</p>
                    <p className="text-xs text-slate-400">
                      {(evidence.fileSize / 1024).toFixed(1)} KB • {evidence.fileType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    evidence.scanStatus === "clean" 
                      ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                      : "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                  }`}>
                    {evidence.scanStatus === "clean" ? "Safe" : "Scanning"}
                  </span>
                  {onViewEvidence && (
                    <button
                      onClick={() => onViewEvidence(evidence.id)}
                      className="rounded p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label={`View ${evidence.fileName}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes/Communication */}
      <div className="glass-panel rounded-2xl border border-white/10 bg-slate-950/20 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Communication & Notes
        </h3>
        
        <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
          {dispute.notes.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No notes or communication yet. Add a note to start the discussion.
            </p>
          ) : (
            dispute.notes.map((note) => (
              <div
                key={note.id}
                className={`rounded-lg p-4 ${
                  note.authorRole === "mediator"
                    ? "bg-cyan-400/5 border border-cyan-400/20"
                    : note.authorRole === "system"
                    ? "bg-slate-800/50 border border-slate-700"
                    : "bg-slate-950/40 border border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{note.author}</span>
                    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      note.authorRole === "mediator"
                        ? "bg-cyan-400/10 text-cyan-400"
                        : note.authorRole === "system"
                        ? "bg-slate-700 text-slate-400"
                        : "bg-slate-700 text-slate-400"
                    }`}>
                      {note.authorRole}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{note.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Note Form */}
        {onAddNote && dispute.status !== "resolved" && dispute.status !== "rejected" && (
          <div className="border-t border-white/10 pt-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Add a note
            </label>
            <div className="flex gap-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type your message or note here..."
                rows={3}
                className="flex-1 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                disabled={isSubmittingNote}
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || isSubmittingNote}
                className="self-end rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingNote ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function convertDisputeToTimeline(dispute: Dispute): TimelineNode[] {
  const items: TimelineItem[] = [
    {
      id: "dispute-created",
      title: "Dispute Filed",
      status: "completed",
      timestamp: new Date(dispute.createdAt).toLocaleString(),
      details: `Category: ${dispute.category}`,
      isMilestone: true
    }
  ];

  if (dispute.submittedAt) {
    items.push({
      id: "dispute-submitted",
      title: "Dispute Submitted",
      status: "completed",
      timestamp: new Date(dispute.submittedAt).toLocaleString(),
      details: "Dispute officially submitted for review",
      isMilestone: true
    });
  }

  if (dispute.status === "under_review") {
    items.push({
      id: "under-review",
      title: "Under Review",
      status: "pending",
      timestamp: "In progress",
      details: "Dispute is being reviewed by the platform",
      isCurrent: true
    });
  }

  if (dispute.mediator) {
    items.push({
      id: "mediator-assigned",
      title: "Mediator Assigned",
      status: "completed",
      timestamp: new Date(dispute.mediator.assignedAt).toLocaleString(),
      variant: "mediator_assigned",
      mediator: {
        name: dispute.mediator.name,
        responseSlaLabel: dispute.mediator.responseSla,
        responseDueLabel: dispute.mediator.responseDue,
        slaProgress: 65
      },
      isMilestone: true
    });
  }

  if (dispute.status === "evidence_review") {
    items.push({
      id: "evidence-review",
      title: "Evidence Review",
      status: "pending",
      timestamp: "In progress",
      details: "Mediator is reviewing submitted evidence",
      isCurrent: true
    });
  }

  if (dispute.status === "negotiation") {
    items.push({
      id: "negotiation",
      title: "Negotiation Phase",
      status: "pending",
      timestamp: "In progress",
      details: "Parties are negotiating a resolution",
      isCurrent: true
    });
  }

  if (dispute.resolution) {
    items.push({
      id: "dispute-resolved",
      title: "Dispute Resolved",
      status: "completed",
      timestamp: new Date(dispute.resolution.resolvedAt).toLocaleString(),
      details: `${DISPUTE_RESOLUTION_LABELS[dispute.resolution.type]}: ${dispute.resolution.description}`,
      isMilestone: true
    });
  }

  if (dispute.status === "rejected") {
    items.push({
      id: "dispute-rejected",
      title: "Dispute Rejected",
      status: "failed",
      timestamp: new Date(dispute.updatedAt).toLocaleString(),
      details: "Dispute was rejected after review",
      isMilestone: true
    });
  }

  if (dispute.status === "escalated") {
    items.push({
      id: "dispute-escalated",
      title: "Dispute Escalated",
      status: "warning",
      timestamp: new Date(dispute.updatedAt).toLocaleString(),
      details: "Dispute has been escalated for higher-level review",
      isMilestone: true
    });
  }

  return items;
}
