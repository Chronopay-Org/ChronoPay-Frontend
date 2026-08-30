"use client";

import {
  useId,
  useState,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import clsx from "clsx";
import { PanelShell } from "./panel-shell";

/** Maximum characters allowed in the optional free-text field. */
export const CANCELLATION_REASON_MAX_CHARS = 240;

export type CancellationReasonId =
  | "schedule_conflict"
  | "no_longer_needed"
  | "found_alternative"
  | "price_concern"
  | "seller_issue"
  | "prefer_not_to_say"
  | "other";

export type CancellationReasonOption = {
  id: CancellationReasonId;
  label: string;
};

export const DEFAULT_CANCELLATION_REASONS: readonly CancellationReasonOption[] = [
  { id: "schedule_conflict", label: "Schedule conflict" },
  { id: "no_longer_needed", label: "No longer needed" },
  { id: "found_alternative", label: "Found another option" },
  { id: "price_concern", label: "Price or rate concern" },
  { id: "seller_issue", label: "Seller or communication issue" },
  { id: "prefer_not_to_say", label: "Prefer not to say" },
  { id: "other", label: "Other" },
] as const;

export type CancellationReasonSubmission = {
  reasonId: CancellationReasonId;
  reasonLabel: string;
  details: string;
};

export type CancellationReasonPickerProps = {
  /** Called when the user submits a selected reason. */
  onSubmit?: (payload: CancellationReasonSubmission) => void;
  /** Override the default reason chip list. */
  reasons?: readonly CancellationReasonOption[];
  /** Panel title. */
  title?: string;
  /** Panel eyebrow label. */
  eyebrow?: string;
  /** Supporting description under the title. */
  description?: string;
  /** Submit button label. */
  submitLabel?: string;
  /** Optional className on the outer PanelShell section. */
  className?: string;
  /** Hide the PanelShell chrome when embedding in an existing dialog. */
  bare?: boolean;
};

/**
 * CancellationReasonPicker — compact reason chips + optional free-text
 * for rebooking / cancellation flows.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - radiogroup with arrow-key navigation between chips
 *   - visible focus rings (cyan)
 *   - character limit announced; submission announced via aria-live
 *   - free-text capped at 240 characters
 */
export function CancellationReasonPicker({
  onSubmit,
  reasons = DEFAULT_CANCELLATION_REASONS,
  title = "Why are you cancelling?",
  eyebrow = "Feedback",
  description = "Pick a reason before you cancel or rebook. Details are optional and help improve ChronoPay.",
  submitLabel = "Submit reason",
  className = "",
  bare = false,
}: CancellationReasonPickerProps) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;
  const groupId = `${baseId}-reasons`;
  const groupLabelId = `${baseId}-reasons-label`;
  const detailsId = `${baseId}-details`;
  const detailsHintId = `${baseId}-details-hint`;
  const statusId = `${baseId}-status`;

  const [selectedId, setSelectedId] = useState<CancellationReasonId | null>(
    null,
  );
  const [details, setDetails] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selected = reasons.find((r) => r.id === selectedId) ?? null;
  const remaining = CANCELLATION_REASON_MAX_CHARS - details.length;
  const canSubmit = selectedId !== null;

  const announce = useCallback((message: string) => {
    // Clear first so identical consecutive messages still fire for AT.
    setAnnouncement("");
    window.setTimeout(() => setAnnouncement(message), 0);
  }, []);

  const selectReason = useCallback(
    (id: CancellationReasonId) => {
      setSelectedId(id);
      setSubmitted(false);
      const label = reasons.find((r) => r.id === id)?.label ?? id;
      announce(`Selected reason: ${label}`);
    },
    [announce, reasons],
  );

  const handleChipKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) {
      return;
    }
    event.preventDefault();

    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % reasons.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + reasons.length) % reasons.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = reasons.length - 1;
    }

    const next = reasons[nextIndex];
    selectReason(next.id);
    const nextButton = document.getElementById(`${groupId}-${next.id}`);
    nextButton?.focus();
  };

  const handleDetailsChange = (value: string) => {
    const clipped = value.slice(0, CANCELLATION_REASON_MAX_CHARS);
    setDetails(clipped);
    setSubmitted(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;

    const payload: CancellationReasonSubmission = {
      reasonId: selected.id,
      reasonLabel: selected.label,
      details: details.trim(),
    };

    onSubmit?.(payload);
    setSubmitted(true);

    const detailNote =
      payload.details.length > 0
        ? ` with ${payload.details.length} characters of extra detail`
        : "";
    announce(
      `Reason submitted: ${payload.reasonLabel}${detailNote}. Thank you for your feedback.`,
    );
  };

  const body = (
    <form
      className={clsx("space-y-5", className)}
      onSubmit={handleSubmit}
      noValidate
    >
      {!bare ? null : (
        <div className="space-y-1">
          <h2 id={titleId} className="text-lg font-semibold text-white">
            {title}
          </h2>
          <p id={descriptionId} className="text-sm leading-6 text-slate-300">
            {description}
          </p>
        </div>
      )}

      <p id={groupLabelId} className="text-sm font-medium text-slate-200">
        Cancellation reason
      </p>
      <div
        role="radiogroup"
        id={groupId}
        aria-labelledby={groupLabelId}
        aria-describedby={bare ? descriptionId : undefined}
        aria-required="true"
        className="flex flex-wrap gap-2"
      >
        {reasons.map((reason, index) => {
          const checked = selectedId === reason.id;
          return (
            <button
              key={reason.id}
              id={`${groupId}-${reason.id}`}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={
                selectedId === null
                  ? index === 0
                    ? 0
                    : -1
                  : checked
                    ? 0
                    : -1
              }
              onClick={() => selectReason(reason.id)}
              onKeyDown={(event) => handleChipKeyDown(event, index)}
              className={clsx(
                "inline-flex min-h-11 items-center rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                checked
                  ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-50"
                  : "border-white/12 bg-white/5 text-slate-200 hover:border-cyan-200/30 hover:bg-white/10",
              )}
            >
              {reason.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <label
          htmlFor={detailsId}
          className="block text-sm font-medium text-slate-200"
        >
          Additional details{" "}
          <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id={detailsId}
          name="cancellation-details"
          rows={3}
          maxLength={CANCELLATION_REASON_MAX_CHARS}
          value={details}
          onChange={(event) => handleDetailsChange(event.target.value)}
          aria-describedby={detailsHintId}
          placeholder="Share anything that would help us improve (optional)"
          className={clsx(
            "w-full resize-y rounded-2xl border border-white/12 bg-slate-950/60 px-3.5 py-3 text-sm leading-6 text-slate-100",
            "placeholder:text-slate-500",
            "focus:outline-none focus-visible:border-cyan-300/40 focus-visible:ring-2 focus-visible:ring-cyan-300",
          )}
        />
        <div
          id={detailsHintId}
          className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400"
        >
          <p className="helper-text helper-text--muted">
            Optional. Maximum {CANCELLATION_REASON_MAX_CHARS} characters.
          </p>
          <p
            className={clsx(
              "font-mono tabular-nums",
              remaining <= 20 ? "text-amber-200" : "text-slate-400",
            )}
            aria-live="polite"
          >
            {details.length}/{CANCELLATION_REASON_MAX_CHARS}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400" aria-live="polite">
          {selected
            ? `Selected: ${selected.label}`
            : "Select a reason to continue."}
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className={clsx(
            "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
            canSubmit
              ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              : "cursor-not-allowed bg-white/10 text-slate-500",
          )}
        >
          {submitted ? "Reason submitted" : submitLabel}
        </button>
      </div>

      <div
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </form>
  );

  if (bare) {
    return body;
  }

  return (
    <PanelShell
      eyebrow={eyebrow}
      title={title}
      description={description}
      id={`${baseId}-panel`}
    >
      {body}
    </PanelShell>
  );
}
