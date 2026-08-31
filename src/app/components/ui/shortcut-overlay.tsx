"use client";

/**
 * ShortcutOverlay
 *
 * A modal reference listing every keyboard binding in the dashboard, grouped
 * by surface (Global, Navigation, Search, …). It is opened with `?` (Shift+/)
 * from the DashboardShell and closed with Escape, the close button, or a
 * click on the backdrop.
 *
 * Accessibility (WCAG 2.1 AA):
 *  - `role="dialog"` + `aria-modal="true"` + `aria-labelledby` per the
 *    project's overlay checklist (docs/overlay-checklist.md)
 *  - Wrapped in <FocusTrap> so Tab/Shift+Tab stay inside while open and
 *    focus returns to the previously focused element on close
 *  - Escape closes; backdrop click closes; close button has a visible
 *    cyan focus ring
 *  - Bindings render as <kbd> elements with text labels (never icons alone),
 *    so each binding has an accessible name
 *  - Content scrolls vertically on short viewports; no horizontal overflow
 *  - Dark-mode safe: uses the same slate/cyan token palette as the shell
 */

import { X } from "lucide-react";
import { FocusTrap } from "@/components/common/FocusTrap";
import { SHORTCUT_GROUPS } from "@/lib/shortcuts";

interface ShortcutOverlayProps {
  /** Whether the overlay is currently open. */
  open: boolean;
  /** Called when the user dismisses the overlay (Escape / close / backdrop). */
  onClose: () => void;
}

export function ShortcutOverlay({ open, onClose }: ShortcutOverlayProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        // Backdrop click — close when the click lands on the backdrop itself
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <FocusTrap>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcut-overlay-title"
          className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 shadow-2xl"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              onClose();
            }
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2
              id="shortcut-overlay-title"
              className="text-base font-semibold text-white"
            >
              Keyboard shortcuts
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close keyboard shortcuts"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-ring-cyan"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Groups */}
          <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
            {SHORTCUT_GROUPS.length === 0 ? (
              <p className="helper-text helper-text--muted">
                No shortcuts are defined yet.
              </p>
            ) : (
              SHORTCUT_GROUPS.map((group) => (
                <section key={group.id} className="mb-5 last:mb-0">
                  <h3
                    id={`shortcut-group-${group.id}`}
                    className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
                  >
                    {group.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {group.bindings.map((binding, index) => (
                      <li
                        key={`${group.id}-${index}`}
                        className="flex items-center justify-between gap-4 py-1 text-sm"
                      >
                        <span className="min-w-0 text-slate-300">
                          {binding.label}
                        </span>
                        <span className="flex shrink-0 items-center gap-1">
                          {binding.keys.map((key, keyIndex) => (
                            <kbd
                              key={`${group.id}-${index}-${keyIndex}`}
                              className="inline-flex min-w-[1.75rem] items-center justify-center rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-xs text-slate-100"
                            >
                              {key}
                            </kbd>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
