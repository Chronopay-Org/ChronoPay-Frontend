"use client";

import { motion } from "framer-motion";
import { CheckCheck, Archive } from "lucide-react";
import clsx from "clsx";

export function BulkActionBar({
  selectedCount,
  onMarkAsRead,
  onArchive,
}: {
  selectedCount: number;
  onMarkAsRead: () => void;
  onArchive: () => void;
}) {
  return (
    <motion.div
      initial={{ y: 64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={clsx(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t border-white/10",
        "bg-slate-950/90 backdrop-blur-xl",
        "pb-[env(safe-area-inset-bottom,0px)]",
        "md:bottom-auto md:sticky md:top-auto md:mt-4",
      )}
      role="toolbar"
      aria-label="Bulk actions"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <span className="text-sm font-medium text-slate-300">
          {selectedCount} selected
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onMarkAsRead}
            aria-label={`Mark ${selectedCount} notification${selectedCount === 1 ? "" : "s"} as read`}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              "border border-white/12 bg-white/6 text-slate-100",
              "hover:border-cyan-200/30 hover:bg-white/10 hover:text-cyan-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950",
            )}
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            Mark as Read
          </button>
          <button
            type="button"
            onClick={onArchive}
            aria-label={`Archive ${selectedCount} notification${selectedCount === 1 ? "" : "s"}`}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              "border border-white/12 bg-white/6 text-slate-100",
              "hover:border-amber-200/30 hover:bg-amber-950/30 hover:text-amber-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950",
            )}
          >
            <Archive className="h-4 w-4" aria-hidden="true" />
            Archive
          </button>
        </div>
      </div>
    </motion.div>
  );
}
