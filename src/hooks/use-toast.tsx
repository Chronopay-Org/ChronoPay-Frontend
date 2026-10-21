"use client";

/**
 * useToast -- lightweight toast context for ChronoPay async feedback.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast({ variant: "success", title: "Wallet connected" });
 *   toast({ variant: "error",   title: "Mint failed", description: "Insufficient balance." });
 *   toast({
 *     variant: "error",
 *     title: "Upload failed",
 *     actions: [{ label: "Retry", onClick: () => retryUpload() }],
 *   });
 *
 * Variants map to WCAG live-region roles:
 *   success | info  --> role="status"  aria-live="polite"
 *   warning | error | critical --> role="alert"   aria-live="assertive"
 *
 * Action affordances:
 *   Each toast may include an `actions` array of { label, onClick } objects
 *   rendered as buttons in the toast footer. Actions are keyboard-accessible
 *   and visually distinct from the dismiss control.
 *
 * Grouping:
 *   Toasts with the same `category` string are merged into a single grouped
 *   entry. The group stores all individual messages and exposes a `count`.
 *   The visible stack is capped at TOAST_STACK_LIMIT entries (groups count
 *   as one entry regardless of how many messages they contain).
 *
 * Queue behavior:
 *   When the stack is full, new toasts are held in a FIFO queue and released
 *   automatically as existing toasts are dismissed. This prevents toast loss
 *   during bursts of activity.
 */

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useReducer,
  useRef,
} from "react";
import type { ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "info" | "warning" | "error" | "critical";

/** An action button exposed by a toast (e.g. Retry, View details). */
export interface ToastAction {
  /** Button label — also used as the accessible name. */
  label: string;
  /** Callback invoked when the action button is clicked. */
  onClick: () => void;
}

/** A single toast message as passed by the caller. */
export interface ToastInput {
  variant: ToastVariant;
  title: string;
  description?: string;
  /** Auto-dismiss delay in ms. Pass 0 to disable. Default: 5000 */
  duration?: number;
  /**
   * Optional grouping key. Toasts sharing the same category are collapsed into
   * one stacked card with a count badge.  Toasts without a category are never
   * grouped.
   */
  category?: string;
  /** Optional reversible action exposed by the toast's Undo control. */
  onUndo?: () => void;
  /**
   * Optional array of action buttons. Actions are rendered as a row of buttons
   * below the toast content, giving users clear affordances for follow-up
   * operations (e.g. Retry, View details, Navigate).
   */
  actions?: ToastAction[];
}

/** An individual message stored inside a group (or standalone entry). */
export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  /** Wall-clock time the message was added (for "X ago" display). */
  timestamp: number;
}

/**
 * A single entry in the visible toast stack.
 * When `count > 1` the entry represents a group; when `count === 1` it is a
 * standalone toast.
 */
export interface ToastItem {
  /** Stable identifier — same as the first message id for ungrouped toasts,
   *  or `group:{category}` for grouped ones. */
  id: string;
  variant: ToastVariant;
  /** Displayed title / group label */
  title: string;
  description?: string;
  duration?: number;
  /** Grouping category (undefined = never grouped) */
  category?: string;
  /** Number of messages collapsed into this entry (1 = not grouped) */
  count: number;
  /** All individual messages — useful for the expanded panel. */
  messages: ToastMessage[];
  /** Optional callback for the visible Undo action. */
  onUndo?: () => void;
  /** Optional action buttons for follow-up operations. */
  actions?: ToastAction[];
}

/** What callers pass to `toast()` — no `id` needed. */
export type { ToastInput as ToastInputPublic };

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum number of toast entries (groups or individual) visible at once. */
export const TOAST_STACK_LIMIT = 5;

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "ADD"; toast: ToastItem; message: ToastMessage }
  | { type: "REMOVE"; id: string }
  | { type: "DISMISS_ALL" }
  | { type: "DEQUEUE" };

function reducer(
  state: { visible: ToastItem[]; queued: ToastItem[] },
  action: Action,
): { visible: ToastItem[]; queued: ToastItem[] } {
  switch (action.type) {
    case "ADD": {
      const { toast, message } = action;

      // ── Grouped toast: merge into existing group entry ──────────────────
      if (toast.category) {
        const groupId = `group:${toast.category}`;
        const existingIdx = state.visible.findIndex((t) => t.id === groupId);

        if (existingIdx !== -1) {
          // Update the existing group in-place (bubble to top)
          const updated = state.visible.filter((_, i) => i !== existingIdx);
          const existing = state.visible[existingIdx];
          const merged: ToastItem = {
            ...existing,
            // Keep the most recent message as the primary title
            title: toast.title,
            description: toast.description,
            count: existing.count + 1,
            messages: [...existing.messages, message],
          };
          // Enforce stack limit (remove oldest non-group entry if needed)
          if (updated.length >= TOAST_STACK_LIMIT) {
            return { visible: [...updated.slice(1), merged], queued: state.queued };
          }
          return { visible: [...updated, merged], queued: state.queued };
        }

        // New group entry — check if there's room
        const newGroup: ToastItem = {
          ...toast,
          id: groupId,
          count: 1,
          messages: [message],
        };
        if (state.visible.length >= TOAST_STACK_LIMIT) {
          // Queue the new toast; oldest visible stays visible
          return { visible: state.visible, queued: [...state.queued, newGroup] };
        }
        return {
          visible: [...state.visible, newGroup],
          queued: state.queued,
        };
      }

      // ── Ungrouped toast: append if room, otherwise queue ────────────────
      if (state.visible.length >= TOAST_STACK_LIMIT) {
        return { visible: state.visible, queued: [...state.queued, toast] };
      }
      return {
        visible: [...state.visible, toast],
        queued: state.queued,
      };
    }

    case "REMOVE": {
      const newVisible = state.visible.filter((t) => t.id !== action.id);
      // Release the next queued toast if there's room
      if (newVisible.length < TOAST_STACK_LIMIT && state.queued.length > 0) {
        const [next, ...rest] = state.queued;
        return { visible: [...newVisible, next], queued: rest };
      }
      return { visible: newVisible, queued: state.queued };
    }

    case "DISMISS_ALL":
      return { visible: [], queued: [] };

    case "DEQUEUE": {
      // Attempt to move queued toasts into visible slots
      const available = TOAST_STACK_LIMIT - state.visible.length;
      if (available <= 0 || state.queued.length === 0) return state;
      const released = state.queued.slice(0, available);
      const remaining = state.queued.slice(available);
      return {
        visible: [...state.visible, ...released],
        queued: remaining,
      };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toasts: ToastItem[];
  queued: ToastItem[];
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { visible: [], queued: [] });
  const prefix = useId();
  const counterRef = useRef(0);

  const toast = useCallback(
    (input: ToastInput): string => {
      const msgId = `${prefix}-${++counterRef.current}`;
      const message: ToastMessage = {
        id: msgId,
        title: input.title,
        description: input.description,
        timestamp: Date.now(),
      };
      const item: ToastItem = {
        id: msgId,
        variant: input.variant,
        title: input.title,
        description: input.description,
        duration: input.duration,
        category: input.category,
        count: 1,
        messages: [message],
        onUndo: input.onUndo,
        actions: input.actions,
      };
      dispatch({ type: "ADD", toast: item, message });
      return msgId;
    },
    [prefix],
  );

  const dismiss = useCallback((id: string) => {
    dispatch({ type: "REMOVE", id });
  }, []);

  const dismissAll = useCallback(() => {
    dispatch({ type: "DISMISS_ALL" });
  }, []);

  return (
    <ToastContext.Provider
      value={{ toasts: state.visible, queued: state.queued, toast, dismiss, dismissAll }}
    >
      {children}
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}
