"use client";

/**
 * BulkActionsToolbar
 *
 * Floating toolbar that appears when one or more rows are selected.
 * Provides: Set Role, Suspend, and Message actions.
 *
 * Accessibility
 * ─────────────
 * • role="toolbar" with aria-label and aria-controls pointing at the grid.
 * • All action buttons have visible focus rings (focus-ring-cyan).
 * • Live region announces selection count changes.
 * • Dismiss button returns focus to the grid via the provided callback.
 * • Animations respect prefers-reduced-motion.
 */

import { useEffect, useRef, useState } from "react";
import type { BulkAction, UserRole } from "./admin-user-types";

const USER_ROLES: UserRole[] = ["admin", "supplier", "buyer", "moderator", "support"];

interface BulkActionsToolbarProps {
  /** IDs of the currently selected rows. */
  selectedIds: Set<string>;
  /** ID attribute of the associated grid element (for aria-controls). */
  gridId: string;
  onAction: (action: BulkAction, payload?: { role?: UserRole; text?: string }) => void;
  /** Called when the user dismisses the toolbar (deselects all). */
  onDismiss: () => void;
}

export function BulkActionsToolbar({
  selectedIds,
  gridId,
  onAction,
  onDismiss,
}: BulkActionsToolbarProps) {
  const count = selectedIds.size;
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const roleButtonRef = useRef<HTMLButtonElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const messageTriggerRef = useRef<HTMLButtonElement>(null);

  // Close role menu on outside click
  useEffect(() => {
    if (!roleMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!roleMenuRef.current?.contains(e.target as Node)) {
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [roleMenuOpen]);

  // Close message panel on outside click
  useEffect(() => {
    if (!messageOpen) return;
    const handler = (e: MouseEvent) => {
      if (!messageRef.current?.contains(e.target as Node)) {
        setMessageOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [messageOpen]);

  if (count === 0) return null;

  const handleRoleSelect = (role: UserRole) => {
    onAction("setRole", { role });
    setRoleMenuOpen(false);
    roleButtonRef.current?.focus();
  };

  const handleSuspend = () => {
    onAction("suspend");
  };

  const handleMessage = () => {
    if (!messageText.trim()) return;
    onAction("message", { text: messageText.trim() });
    setMessageText("");
    setMessageOpen(false);
    messageTriggerRef.current?.focus();
  };

  return (
    <>
      {/* Live region for screen-reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="bulk-live-region"
      >
        {count === 1 ? "1 user selected" : `${count} users selected`}
      </div>

      {/* Floating toolbar */}
      <div
        role="toolbar"
        aria-label={`Bulk actions — ${count} user${count === 1 ? "" : "s"} selected`}
        aria-controls={gridId}
        data-testid="bulk-toolbar"
        className={[
          "fixed bottom-6 left-1/2 z-50",
          "-translate-x-1/2",
          "flex items-center gap-2 rounded-2xl",
          "border border-white/12 bg-slate-900/95 px-4 py-3 shadow-2xl backdrop-blur-xl",
          "motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-200",
        ].join(" ")}
      >
        {/* Selection count badge */}
        <span className="mr-1 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
          {count} selected
        </span>

        {/* Set Role */}
        <div className="relative" ref={roleMenuRef}>
          <button
            ref={roleButtonRef}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={roleMenuOpen}
            onClick={() => {
              setRoleMenuOpen((v) => !v);
              setMessageOpen(false);
            }}
            className={[
              "inline-flex items-center gap-1.5 rounded-full border border-white/12",
              "bg-white/6 px-3 py-1.5 text-xs font-medium text-slate-100",
              "transition-colors hover:bg-white/10 hover:border-cyan-200/30",
              "focus-ring-cyan",
            ].join(" ")}
          >
            Set Role
            <svg
              aria-hidden="true"
              className={`h-3 w-3 transition-transform ${roleMenuOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {roleMenuOpen && (
            <ul
              role="listbox"
              aria-label="Select role"
              className={[
                "absolute bottom-full mb-2 left-0 z-50",
                "w-40 rounded-xl border border-white/10",
                "bg-slate-900/95 py-1 shadow-xl backdrop-blur-xl",
              ].join(" ")}
            >
              {USER_ROLES.map((role) => (
                <li
                  key={role}
                  role="option"
                  aria-selected={false}
                  tabIndex={0}
                  data-testid={`role-option-${role}`}
                  onClick={() => handleRoleSelect(role)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRoleSelect(role);
                    }
                    if (e.key === "Escape") {
                      setRoleMenuOpen(false);
                      roleButtonRef.current?.focus();
                    }
                  }}
                  className={[
                    "mx-1 cursor-pointer rounded-lg px-3 py-2 text-sm capitalize",
                    "text-slate-300 hover:bg-white/8 hover:text-white",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300",
                  ].join(" ")}
                >
                  {role}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Suspend */}
        <button
          type="button"
          data-testid="bulk-suspend"
          onClick={handleSuspend}
          className={[
            "inline-flex items-center gap-1.5 rounded-full border border-amber-400/25",
            "bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-100",
            "transition-colors hover:bg-amber-400/20",
            "focus-ring-cyan",
          ].join(" ")}
        >
          Suspend
        </button>

        {/* Message */}
        <div className="relative" ref={messageRef}>
          <button
            ref={messageTriggerRef}
            type="button"
            data-testid="bulk-message-toggle"
            onClick={() => {
              setMessageOpen((v) => !v);
              setRoleMenuOpen(false);
            }}
            className={[
              "inline-flex items-center gap-1.5 rounded-full border border-white/12",
              "bg-white/6 px-3 py-1.5 text-xs font-medium text-slate-100",
              "transition-colors hover:bg-white/10 hover:border-cyan-200/30",
              "focus-ring-cyan",
            ].join(" ")}
          >
            Message
          </button>

          {messageOpen && (
            <div
              role="dialog"
              aria-label="Send message to selected users"
              className={[
                "absolute bottom-full mb-2 right-0 z-50",
                "w-72 rounded-2xl border border-white/10",
                "bg-slate-900/95 p-4 shadow-xl backdrop-blur-xl",
              ].join(" ")}
            >
              <label
                htmlFor="bulk-message-text"
                className="block text-xs font-semibold text-slate-300 mb-2"
              >
                Message to {count} user{count === 1 ? "" : "s"}
              </label>
              <textarea
                id="bulk-message-text"
                rows={3}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setMessageOpen(false);
                    messageTriggerRef.current?.focus();
                  }
                }}
                placeholder="Type your message…"
                className={[
                  "w-full rounded-xl border border-white/10 bg-white/5",
                  "px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500",
                  "resize-none focus-ring-cyan outline-none",
                ].join(" ")}
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMessageOpen(false);
                    messageTriggerRef.current?.focus();
                  }}
                  className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 focus-ring-cyan"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-testid="bulk-message-send"
                  disabled={!messageText.trim()}
                  onClick={handleMessage}
                  className={[
                    "rounded-full px-3 py-1.5 text-xs font-semibold",
                    "bg-cyan-300 text-slate-950 hover:bg-cyan-200",
                    "disabled:opacity-40 disabled:pointer-events-none",
                    "focus-ring-cyan",
                  ].join(" ")}
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dismiss */}
        <button
          type="button"
          aria-label="Deselect all users"
          data-testid="bulk-dismiss"
          onClick={onDismiss}
          className={[
            "ml-1 rounded-full border border-white/10 p-1.5",
            "text-slate-400 hover:text-slate-200 hover:bg-white/8",
            "transition-colors focus-ring-cyan",
          ].join(" ")}
        >
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </>
  );
}
