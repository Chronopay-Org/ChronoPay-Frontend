"use client";

/**
 * useToast -- lightweight toast context for ChronoPay async feedback.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast({ variant: "success", title: "Wallet connected" });
 *   toast({ variant: "error",   title: "Mint failed", description: "Insufficient balance." });
 *
 * Variants map to WCAG live-region roles:
 *   success | info  --> role="status"  aria-live="polite"
 *   warning | error --> role="alert"   aria-live="assertive"
 *
 * Grouping:
 *   Toasts with the same `category` string are merged into a single grouped
 *   entry. The group stores all individual messages and exposes a `count`.
 *   The visible stack is capped at TOAST_STACK_LIMIT entries (groups count
 *   as one entry regardless of how many messages they contain).
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

export type ToastVariant = "success" | "info" | "warning" | "error";

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
  | { type: "DISMISS_ALL" };

function reducer(state: ToastItem[], action: Action): ToastItem[] {
  switch (action.type) {
    case "ADD": {
      const { toast, message } = action;

      // ── Grouped toast: merge into existing group entry ──────────────────
      if (toast.category) {
        const groupId = `group:${toast.category}`;
        const existingIdx = state.findIndex((t) => t.id === groupId);

        if (existingIdx !== -1) {
          // Update the existing group in-place (bubble to top)
          const updated = state.filter((_, i) => i !== existingIdx);
          const existing = state[existingIdx];
          const merged: ToastItem = {
            ...existing,
            // Keep the most recent message as the primary title
            title: toast.title,
            description: toast.description,
            count: existing.count + 1,
            messages: [...existing.messages, message],
          };
          // Enforce stack limit (remove oldest non-group entry if needed)
          const capped =
            updated.length >= TOAST_STACK_LIMIT
              ? updated.slice(1)
              : updated;
          return [...capped, merged];
        }

        // New group entry
        const newGroup: ToastItem = {
          ...toast,
          id: groupId,
          count: 1,
          messages: [message],
        };
        const capped =
          state.length >= TOAST_STACK_LIMIT ? state.slice(1) : state;
        return [...capped, newGroup];
      }

      // ── Ungrouped toast: append, cap stack ──────────────────────────────
      const capped =
        state.length >= TOAST_STACK_LIMIT ? state.slice(1) : state;
      return [...capped, { ...toast, count: 1, messages: [message] }];
    }

    case "REMOVE":
      return state.filter((t) => t.id !== action.id);

    case "DISMISS_ALL":
      return [];

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toasts: ToastItem[];
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);
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
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
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
