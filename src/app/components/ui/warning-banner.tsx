"use client";

/**
 * WarningBanner — Reusable instability/warning notice component
 *
 * Accessibility:
 *  - role="alert" with aria-live="assertive" for immediate announcement
 *  - Clear color contrast (amber/warning tone)
 *  - Icon and text convey the same information (icon is aria-hidden)
 *  - Optional dismiss button with aria-label
 *
 * Usage:
 * ```tsx
 * <WarningBanner
 *   title="Experimental Features"
 *   description="These features are unstable and may change."
 *   onDismiss={() => setDismissed(true)}
 * />
 * ```
 */

import { AlertTriangle, X } from "lucide-react";
import { ReactNode } from "react";

interface WarningBannerProps {
  /** Title of the warning */
  title: string;
  /** Description/body text */
  description: ReactNode;
  /** Optional callback when dismiss button is clicked */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function WarningBanner({
  title,
  description,
  onDismiss,
  className = "",
}: WarningBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/8 p-4 sm:p-5 ${className}`}
    >
      {/* Icon */}
      <AlertTriangle
        aria-hidden="true"
        className="h-5 w-5 shrink-0 text-amber-300 sm:mt-0.5"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-100">{title}</p>
        <p className="mt-1 text-xs text-amber-50/80 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Dismiss button */}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss warning"
          className="shrink-0 rounded-md p-1 text-amber-200 hover:bg-amber-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-colors"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
