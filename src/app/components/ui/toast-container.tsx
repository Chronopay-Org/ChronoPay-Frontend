"use client";

/**
 * ToastContainer — fixed viewport region that renders stacked toasts.
 *
 * Placement: bottom-right on md+, bottom-center on mobile.
 * Stacking: newest on top, max 5 visible (enforced by reducer).
 * The outer <div> is the ARIA live-region anchor; individual toasts
 * carry their own role="status" / role="alert" for granular announcements.
 */

import { AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Toast } from "./toast";

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    /*
     * aria-label gives AT users a landmark they can navigate to.
     * The region itself is not a live region — each Toast carries its own
     * role="status" or role="alert" so announcements are scoped correctly.
     */
    <div
      aria-label="Notifications"
      aria-live="off"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col-reverse gap-2 sm:bottom-6 sm:right-6"
    >
      <AnimatePresence initial={false} mode="sync">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
