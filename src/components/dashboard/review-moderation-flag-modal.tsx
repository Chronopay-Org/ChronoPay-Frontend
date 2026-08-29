"use client";

import { useEffect, useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { AlertTriangle, X, CheckCircle2 } from "lucide-react";
import { FocusTrap } from "@/components/common/FocusTrap";
import { LiveRegion } from "@/components/common/LiveRegion";
import { useToast } from "@/hooks/use-toast";

export type ReviewModerationReason =
  | "spam"
  | "harassment"
  | "inappropriate"
  | "misleading"
  | "other";

export type ReviewModerationFlagModalProps = {
  isOpen: boolean;
  onClose: () => void;
  reviewId?: string;
  isAlreadyFlagged?: boolean;
  isOffline?: boolean;
  initialReason?: ReviewModerationReason;
};

const reasonOptions: Array<{ value: ReviewModerationReason; label: string; description: string }> = [
  {
    value: "spam",
    label: "Spam or scam",
    description: "Promotional content or suspicious links.",
  },
  {
    value: "harassment",
    label: "Harassment or abuse",
    description: "Threats, insults, or targeted abuse.",
  },
  {
    value: "inappropriate",
    label: "Inappropriate content",
    description: "Sexual, violent, or otherwise unsafe content.",
  },
  {
    value: "misleading",
    label: "Misleading review",
    description: "False information or deceptive claims.",
  },
  {
    value: "other",
    label: "Something else",
    description: "A different issue that needs review.",
  },
];

export function ReviewModerationFlagModal({
  isOpen,
  onClose,
  reviewId = "unknown-review",
  isAlreadyFlagged = false,
  isOffline = false,
  initialReason,
}: ReviewModerationFlagModalProps) {
  const titleId = useId();
  const contextId = useId();
  const [selectedReason, setSelectedReason] = useState<ReviewModerationReason | null>(
    initialReason ?? null,
  );
  const [context, setContext] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedReason(initialReason ?? null);
    setContext("");
    setSubmitted(false);
    setValidationMessage(null);
  }, [isOpen, initialReason]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const helperText = useMemo(() => {
    if (isAlreadyFlagged) {
      return "This review is already being reviewed by our moderation team.";
    }
    if (isOffline) {
      return "You’re offline, so the report will be queued and reviewed when you’re back online.";
    }
    return "Thanks for helping us keep reviews trustworthy. Moderators will review the report within 24 hours.";
  }, [isAlreadyFlagged, isOffline]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isAlreadyFlagged) {
      setSubmitted(true);
      setValidationMessage(null);
      onClose();
      toast({
        variant: "info",
        title: "Review already flagged",
        description: "This review is already in moderation and no duplicate report was sent.",
      });
      return;
    }

    if (!selectedReason) {
      setValidationMessage("Choose a reason before submitting the report.");
      toast({
        variant: "warning",
        title: "Select a reason",
        description: "Choose a reason before submitting the report.",
      });
      return;
    }

    setSubmitted(true);
    setValidationMessage(null);
    onClose();
    toast({
      variant: "success",
      title: "Report submitted",
      description: `We’ve recorded your report for ${reviewId}. Moderators will review it shortly.`,
    });
  };

  const handleContextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setContext(event.target.value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="presentation">
      <FocusTrap>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={contextId}
          className="relative w-full max-w-lg overflow-y-auto rounded-3xl border border-white/12 bg-slate-900 p-6 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                Moderation
              </div>
              <h2 id={titleId} className="mt-3 text-lg font-semibold text-white">
                Flag this review
              </h2>
              <p id={contextId} className="mt-2 text-sm leading-6 text-slate-400">
                Select the issue that best matches this review. You can add optional context to help moderators.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close moderation dialog"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-white">Why are you reporting this review?</legend>
              <div className="grid gap-2">
                {reasonOptions.map((reason) => {
                  const checked = selectedReason === reason.value;
                  return (
                    <label
                      key={reason.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition-colors ${checked ? "border-cyan-300/40 bg-cyan-300/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}
                    >
                      <input
                        type="radio"
                        name="review-moderation-reason"
                        value={reason.value}
                        checked={checked}
                        onChange={() => setSelectedReason(reason.value)}
                        className="mt-1 h-4 w-4 shrink-0 accent-cyan-400"
                      />
                      <span>
                        <span className="block text-sm font-medium text-white">{reason.label}</span>
                        <span className="mt-1 block text-sm leading-5 text-slate-400">{reason.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor="review-moderation-context" className="text-sm font-semibold text-white">
                Additional context <span className="text-slate-400">(optional)</span>
              </label>
              <textarea
                id="review-moderation-context"
                rows={4}
                value={context}
                onChange={handleContextChange}
                placeholder="Include any relevant details that may help our moderation team."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm leading-6 text-slate-400">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
                <span>{helperText}</span>
              </div>
            </div>

            {validationMessage ? (
              <p role="alert" className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                {validationMessage}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-200/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Submit report
              </button>
            </div>
          </form>

          <LiveRegion>
            {submitted ? "Report submitted. Moderators will review the review shortly." : "Review moderation dialog opened."}
          </LiveRegion>
        </div>
      </FocusTrap>
    </div>
  );
}
