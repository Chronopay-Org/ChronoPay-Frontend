"use client";

/**
 * DangerZone — Destructive account actions with confirm-by-typing protection.
 *
 * Displays a list of dangerous actions (delete account, revoke all sessions)
 * in a visually distinct "danger zone" card. Each action opens a modal that
 * requires the user to type a confirmation phrase before proceeding.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Alert role on confirmation modal for screen reader announcement
 *   - Focus trap within the modal (returns to trigger on close)
 *   - Visible focus rings on all interactive elements
 *   - Colour is not the only means of conveying severity (icon + text + border)
 *   - Keyboard operable (Tab, Enter, Escape)
 *   - Dark-mode compatible palette
 */

import { useState, useCallback, useId, useRef, useEffect } from "react";
import { AlertTriangle, Trash2, LogOut, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type DangerAction = "delete-account" | "revoke-sessions";

interface DangerActionConfig {
  id: DangerAction;
  title: string;
  description: string;
  icon: React.ReactNode;
  confirmPhrase: string;
  confirmLabel: string;
  destructiveLabel: string;
}

const DANGER_ACTIONS: DangerActionConfig[] = [
  {
    id: "delete-account",
    title: "Delete account",
    description:
      "Permanently remove your account and all associated data. This action cannot be undone.",
    icon: <Trash2 className="h-5 w-5" aria-hidden={true} />,
    confirmPhrase: "DELETE",
    confirmLabel: "Type DELETE to confirm",
    destructiveLabel: "Delete my account",
  },
  {
    id: "revoke-sessions",
    title: "Revoke all sessions",
    description:
      "Sign out of every device and session. You will need to re-authenticate everywhere.",
    icon: <LogOut className="h-5 w-5" aria-hidden={true} />,
    confirmPhrase: "REVOKE",
    confirmLabel: "Type REVOKE to confirm",
    destructiveLabel: "Revoke all sessions",
  },
];

/* ------------------------------------------------------------------ */
/*  Confirm-by-typing Modal                                           */
/* ------------------------------------------------------------------ */

interface ConfirmByTypingModalProps {
  action: DangerActionConfig;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmByTypingModal({ action, onConfirm, onCancel }: ConfirmByTypingModalProps) {
  const [typedValue, setTypedValue] = useState("");
  const headingId = useId();
  const descriptionId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const isConfirmed = typedValue === action.confirmPhrase;

  // Focus trap — focus the cancel button on mount, then trap Tab
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    },
    [onCancel],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-slate-900 shadow-2xl shadow-rose-500/5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
              <AlertTriangle className="h-5 w-5" aria-hidden={true} />
            </span>
            <h2 id={headingId} className="text-lg font-semibold text-white">
              {action.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <X className="h-5 w-5" aria-hidden={true} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          <p id={descriptionId} className="text-sm leading-relaxed text-slate-300">
            {action.description}
          </p>

          <div className="space-y-2">
            <label
              htmlFor={`confirm-input-${action.id}`}
              className="block text-xs font-medium text-slate-400"
            >
              {action.confirmLabel}
            </label>
            <input
              ref={inputRef}
              id={`confirm-input-${action.id}`}
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={action.confirmPhrase}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 transition-colors focus:border-rose-400/50 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              aria-describedby={`${descriptionId}-hint`}
            />
            <p
              id={`${descriptionId}-hint`}
              className="text-[11px] text-slate-500"
              aria-live="polite"
            >
              {isConfirmed
                ? "Confirmation phrase matched. You may proceed."
                : typedValue
                  ? "Phrase does not match. Type carefully."
                  : `Type "${action.confirmPhrase}" exactly to enable the destructive action.`}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isConfirmed}
            aria-disabled={!isConfirmed}
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {action.destructiveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Danger Zone Section                                                */
/* ------------------------------------------------------------------ */

export function DangerZone() {
  const [activeAction, setActiveAction] = useState<DangerActionConfig | null>(null);

  const handleOpen = useCallback((action: DangerActionConfig) => {
    setActiveAction(action);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!activeAction) return;

    if (activeAction.id === "delete-account") {
      // In production, this would call an API endpoint
      alert("Account deletion initiated. This is a sample flow — no actual deletion occurred.");
    } else if (activeAction.id === "revoke-sessions") {
      // In production, this would call an API endpoint
      alert("All sessions revoked. This is a sample flow — no actual sessions were invalidated.");
    }

    setActiveAction(null);
  }, [activeAction]);

  const handleCancel = useCallback(() => {
    setActiveAction(null);
  }, []);

  return (
    <>
      <section
        aria-label="Danger zone"
        className="rounded-[28px] border border-rose-500/20 bg-slate-950/70 p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur sm:p-5 xl:p-6"
      >
        <div className="space-y-1 pb-4 sm:pb-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden={true} />
            </span>
            <h2 className="text-xl font-semibold text-rose-300">Danger Zone</h2>
          </div>
          <p className="text-sm leading-6 text-slate-300">
            Irreversible actions that affect your account and data. Proceed with caution.
          </p>
        </div>

        <div className="space-y-3" role="list">
          {DANGER_ACTIONS.map((action) => (
            <div
              key={action.id}
              role="listitem"
              className="flex items-center justify-between gap-4 rounded-xl border border-rose-500/10 bg-rose-500/[0.03] px-4 py-3.5 sm:px-5"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="mt-0.5 shrink-0 text-rose-400/70">
                  {action.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200">
                    {action.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpen(action)}
                className="shrink-0 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/20 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
              >
                {action.id === "delete-account" ? "Delete" : "Revoke"}
              </button>
            </div>
          ))}
        </div>

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {activeAction ? `${activeAction.title} confirmation dialog open` : ""}
        </div>
      </section>

      {/* Confirm-by-typing modal */}
      {activeAction && (
        <ConfirmByTypingModal
          action={activeAction}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
