"use client";

/**
 * useToast — lightweight toast context for ChronoPay async feedback.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast({ variant: "success", title: "Wallet connected" });
 *   toast({ variant: "error",   title: "Mint failed", description: "Insufficient balance." });
 *
 * Variants map to WCAG live-region roles:
 *   success | info  → role="status"  aria-live="polite"
 *   warning | error → role="alert"   aria-live="assertive"
 */

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "info" | "warning" | "error";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  /** Auto-dismiss delay in ms. Pass 0 to disable. Default: 5000 */
  duration?: number;
}

export type ToastInput = Omit<ToastItem, "id">;

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "ADD"; toast: ToastItem }
  | { type: "REMOVE"; id: string };

function reducer(state: ToastItem[], action: Action): ToastItem[] {
  switch (action.type) {
    case "ADD":
      // Cap stack at 5 to prevent overflow
      return [...state.slice(-4), action.toast];
    case "REMOVE":
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toasts: ToastItem[];
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);
  // useId gives a stable prefix; useRef persists the counter across renders
  const prefix = useId();
  const counterRef = useRef(0);

  const toast = useCallback(
    (input: ToastInput): string => {
      const id = `${prefix}-${++counterRef.current}`;
      dispatch({ type: "ADD", toast: { ...input, id } });
      return id;
    },
    [prefix],
  );

  const dismiss = useCallback((id: string) => {
    dispatch({ type: "REMOVE", id });
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
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
