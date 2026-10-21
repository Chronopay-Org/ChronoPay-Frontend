"use client";

import { useState } from "react";
import { Clock, MessageSquare, CheckCircle, AlertCircle, XCircle, Send } from "lucide-react";

export interface DisputeNote {
  id: string;
  author: string;
  authorRole: "system" | "buyer" | "seller" | "mediator";
  content: string;
  createdAt: string;
}

export interface DisputeMetadata {
  priority: "low" | "medium" | "high";
  escalationCount: number;
  lastActivityAt: string;
}

export interface Dispute {
  id: string;
  slotId: string;
  category: string;
  reason: string;
  description: string;
  status: "submitted" | "under_review" | "investigating" | "resolved" | "rejected";
  evidence: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadStatus: "pending" | "completed" | "failed";
    scanStatus: "pending" | "clean" | "infected";
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  submittedAt: string;
  notes: DisputeNote[];
  metadata: DisputeMetadata;
}

export interface DisputeTrackingPanelProps {
  dispute: Dispute;
  onAddNote: (content: string) => Promise<void>;
}

const STATUS_CONFIG = {
  submitted: {
    label: "Submitted",
    icon: Clock,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/30",
  },
  under_review: {
    label: "Under Review",
    icon: AlertCircle,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/30",
  },
  investigating: {
    label: "Investigating",
    icon: AlertCircle,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/30",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle,
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/30",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/30",
  },
};

const ROLE_COLORS = {
  system: "text-slate-400",
  buyer: "text-cyan-400",
  seller: "text-purple-400",
  mediator: "text-amber-400",
};

export function DisputeTrackingPanel({ dispute, onAddNote }: DisputeTrackingPanelProps) {
  const [noteContent, setNoteContent] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const statusConfig = STATUS_CONFIG[dispute.status];
  const StatusIcon = statusConfig.icon;

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    
    setIsSubmittingNote(true);
    await onAddNote(noteContent.trim());
    setNoteContent("");
    setIsSubmittingNote(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-5">
      {/* Status Header */}
      <div className={`flex items-center gap-3 p-4 rounded-lg border ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
        <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
        <div>
          <p className={`text-sm font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </p>
          <p className="text-xs text-slate-400">
            Last updated: {formatDate(dispute.updatedAt)}
          </p>
        </div>
      </div>

      {/* Dispute Details */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300">Dispute Details</h3>
        <div className="bg-white/5 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-xs text-slate-500 mb-1">Category</p>
            <p className="text-sm text-white capitalize">
              {dispute.category.replace(/_/g, " ")}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Reason</p>
            <p className="text-sm text-white">{dispute.reason}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Description</p>
            <p className="text-sm text-slate-300">{dispute.description}</p>
          </div>
        </div>
      </div>

      {/* Evidence */}
      {dispute.evidence.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-300">Evidence</h3>
          <div className="space-y-2">
            {dispute.evidence.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-white/10 flex items-center justify-center">
                    <span className="text-xs text-slate-400">
                      {file.fileName.split(".").pop()?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-300">{file.fileName}</p>
                    <p className="text-xs text-slate-500">
                      {(file.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.scanStatus === "clean" && (
                    <span className="text-xs text-green-400">✓ Clean</span>
                  )}
                  {file.uploadStatus === "completed" && (
                    <span className="text-xs text-slate-400">Uploaded</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes Timeline */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300">Activity Timeline</h3>
        <div className="space-y-3 max-h-[200px] overflow-y-auto">
          {dispute.notes.map((note) => (
            <div
              key={note.id}
              className="flex gap-3 bg-white/5 rounded-lg p-3"
            >
              <div className="shrink-0">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">
                    {note.author}
                  </span>
                  <span
                    className={`text-xs ${ROLE_COLORS[note.authorRole]} capitalize`}
                  >
                    ({note.authorRole})
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDate(note.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{note.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Note */}
      <form onSubmit={handleSubmitNote} className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">
          Add a Note
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            disabled={isSubmittingNote}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!noteContent.trim() || isSubmittingNote}
            className="rounded-lg px-4 py-2.5 bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmittingNote ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
