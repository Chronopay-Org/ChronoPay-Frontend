export type DisputeStatus = "draft" | "submitted" | "under_review" | "mediator_assigned" | "evidence_review" | "negotiation" | "resolved" | "rejected" | "escalated";

export type DisputeCategory = 
  | "service_not_delivered"
  | "quality_mismatch"
  | "payment_issue"
  | "cancellation_dispute"
  | "communication_issue"
  | "other";

export type DisputeResolution = "full_refund" | "partial_refund" | "service_redelivery" | "no_action" | "compromise";

export interface DisputeEvidence {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadStatus: "pending" | "uploading" | "completed" | "failed";
  scanStatus: "pending" | "scanning" | "clean" | "threat_detected" | "failed";
  uploadedAt: string;
  url?: string;
}

export interface MediatorNote {
  id: string;
  author: string;
  authorRole: "mediator" | "system" | "buyer" | "seller";
  content: string;
  createdAt: string;
  isInternal?: boolean;
}

export interface Dispute {
  id: string;
  slotId: string;
  category: DisputeCategory;
  reason: string;
  description: string;
  status: DisputeStatus;
  evidence: DisputeEvidence[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  mediator?: {
    id: string;
    name: string;
    assignedAt: string;
    responseSla: string;
    responseDue: string;
  };
  notes: MediatorNote[];
  resolution?: {
    type: DisputeResolution;
    description: string;
    resolvedAt: string;
    resolvedBy: string;
  };
  metadata?: {
    priority: "low" | "medium" | "high" | "urgent";
    escalationCount: number;
    lastActivityAt: string;
  };
}

export interface DisputeFormData {
  category: DisputeCategory;
  reason: string;
  description: string;
  evidence: File[];
}

export const DISPUTE_CATEGORIES: Record<DisputeCategory, { label: string; description: string }> = {
  service_not_delivered: {
    label: "Service Not Delivered",
    description: "The service provider did not deliver the agreed-upon service"
  },
  quality_mismatch: {
    label: "Quality Mismatch",
    description: "The delivered service does not match the described quality or expectations"
  },
  payment_issue: {
    label: "Payment Issue",
    description: "Disagreement over payment amounts, timing, or escrow release"
  },
  cancellation_dispute: {
    label: "Cancellation Dispute",
    description: "Disagreement about cancellation terms or refund eligibility"
  },
  communication_issue: {
    label: "Communication Issue",
    description: "Problems with responsiveness, availability, or professional conduct"
  },
  other: {
    label: "Other",
    description: "Any other issue not covered by the above categories"
  }
};

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  mediator_assigned: "Mediator Assigned",
  evidence_review: "Evidence Review",
  negotiation: "Negotiation",
  resolved: "Resolved",
  rejected: "Rejected",
  escalated: "Escalated"
};

export const DISPUTE_RESOLUTION_LABELS: Record<DisputeResolution, string> = {
  full_refund: "Full Refund",
  partial_refund: "Partial Refund",
  service_redelivery: "Service Redelivery",
  no_action: "No Action",
  compromise: "Compromise"
};
