"use client";

import type { RefObject } from "react";
import { FocusTrap } from "@/components/common/FocusTrap";
import {
  DisputeFilingForm,
  type DisputeFormData,
} from "@/app/components/dispute-filing-form";
import {
  DisputeTrackingPanel,
  type Dispute,
} from "@/app/components/dispute-tracking-panel";
import { X } from "lucide-react";
import type { DisputeView } from "./use-slot-booking";

export interface SlotDisputeSectionProps {
  isOpen: boolean;
  disputeModalRef?: RefObject<HTMLDivElement | null>;
  slotId: string;
  disputeView: DisputeView;
  existingDisputesCount: number;
  currentDispute: Dispute | null;
  isSubmittingDispute: boolean;
  onClose: () => void;
  onViewChange: (view: DisputeView) => void;
  onSubmitDispute: (formData: DisputeFormData) => Promise<void>;
  onAddDisputeNote: (content: string) => Promise<void>;
}

export function SlotDisputeSection({
  isOpen,
  disputeModalRef,
  slotId,
  disputeView,
  existingDisputesCount,
  currentDispute,
  isSubmittingDispute,
  onClose,
  onViewChange,
  onSubmitDispute,
  onAddDisputeNote,
}: SlotDisputeSectionProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all animate-fade-in"
      role="presentation"
    >
      <FocusTrap>
        <div
          ref={disputeModalRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dispute-modal-headline"
          className="w-full max-w-2xl rounded-3xl border border-white/12 bg-slate-900 p-6 sm:p-8 shadow-2xl relative focus:outline-none animate-scale-up max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 id="dispute-modal-headline" className="text-xl font-bold text-white">
              {disputeView === "filing" ? "File a Dispute" : "Dispute Tracking"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close dispute modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* View Toggle */}
          {existingDisputesCount > 0 && (
            <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-full">
              <button
                type="button"
                onClick={() => onViewChange("tracking")}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  disputeView === "tracking"
                    ? "bg-amber-400/20 text-amber-200"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Track Dispute
              </button>
              <button
                type="button"
                onClick={() => onViewChange("filing")}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  disputeView === "filing"
                    ? "bg-amber-400/20 text-amber-200"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                File New Dispute
              </button>
            </div>
          )}

          {/* Content */}
          {disputeView === "filing" ? (
            <DisputeFilingForm
              slotId={slotId}
              onSubmit={onSubmitDispute}
              isSubmitting={isSubmittingDispute}
              onCancel={onClose}
            />
          ) : (
            currentDispute && (
              <DisputeTrackingPanel
                dispute={currentDispute}
                onAddNote={onAddDisputeNote}
              />
            )
          )}
        </div>
      </FocusTrap>
    </div>
  );
}
