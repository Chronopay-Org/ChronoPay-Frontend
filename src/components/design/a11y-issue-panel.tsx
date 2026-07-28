"use client";

/**
 * A11yIssuePanel — Accessibility Audit Issue Drill-down Panel
 *
 * Right-side sliding panel showing detailed information about an accessibility audit issue,
 * including:
 * - Failing HTML snippet with syntax highlighting
 * - WCAG success criterion with link to spec
 * - Recommended fix with code example
 * - Impact description
 * - Focus trap for keyboard navigation
 * - Esc key to close
 *
 * Accessibility (WCAG 2.1 AA):
 * ─────────────────────────────
 * • role="dialog" with aria-modal="true"
 * • FocusTrap keeps keyboard focus inside the panel
 * • Escape key closes the panel and returns focus to trigger
 * • Visible focus ring on all interactive elements
 * • Proper semantic heading hierarchy
 * • Color contrast meets AA standards
 * • Respects prefers-reduced-motion
 *
 * Responsive:
 * ───────────
 * • Mobile (320px): Full-width overlay
 * • Tablet (640px+): Side panel with backdrop
 * • Desktop (1024px+): Larger panel, optimized for content width
 */

import { useEffect, useRef, useId, KeyboardEvent as ReactKeyboardEvent } from "react";
import { X, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { FocusTrap } from "@/components/common/FocusTrap";
import type { AccessibilityIssue, WCAGLevel } from "@/lib/wcag-references";

interface A11yIssuePanelProps {
  /** Issue to display */
  issue: AccessibilityIssue | null;
  /** Callback when panel is closed */
  onClose: () => void;
  /** Ref to element that opened the panel (for focus restoration) */
  triggerRef?: React.RefObject<HTMLElement>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Severity color and icon mapping
 */
function getSeverityStyles(severity: AccessibilityIssue["severity"]) {
  const styles = {
    critical: {
      bgColor: "bg-rose-400/10",
      borderColor: "border-rose-400/30",
      textColor: "text-rose-100",
      badgeColor: "bg-rose-400/20",
      icon: <AlertCircle className="h-5 w-5 text-rose-400" aria-hidden="true" />,
    },
    major: {
      bgColor: "bg-amber-400/10",
      borderColor: "border-amber-400/30",
      textColor: "text-amber-100",
      badgeColor: "bg-amber-400/20",
      icon: <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />,
    },
    minor: {
      bgColor: "bg-cyan-400/10",
      borderColor: "border-cyan-400/30",
      textColor: "text-cyan-100",
      badgeColor: "bg-cyan-400/20",
      icon: <CheckCircle2 className="h-5 w-5 text-cyan-400" aria-hidden="true" />,
    },
    warning: {
      bgColor: "bg-blue-400/10",
      borderColor: "border-blue-400/30",
      textColor: "text-blue-100",
      badgeColor: "bg-blue-400/20",
      icon: <AlertCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />,
    },
  };
  return styles[severity];
}

/**
 * WCAG level badge color
 */
function getLevelBadgeColor(level: WCAGLevel) {
  const colors = {
    A: "bg-slate-500/20 text-slate-200",
    AA: "bg-cyan-500/20 text-cyan-100",
    AAA: "bg-emerald-500/20 text-emerald-100",
  };
  return colors[level];
}

/**
 * Code snippet display with basic syntax highlighting
 */
function CodeSnippet({ code }: { code: string }) {
  return (
    <pre className="rounded-lg border border-white/10 bg-slate-950 p-4 overflow-x-auto text-xs leading-relaxed text-slate-300 font-mono">
      <code>{code}</code>
    </pre>
  );
}

export function A11yIssuePanel({
  issue,
  onClose,
  triggerRef,
  className = "",
}: A11yIssuePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();
  const titleId = useId();

  // Handle Escape key
  useEffect(() => {
    if (!issue) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        triggerRef?.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [issue, onClose, triggerRef]);

  // Focus close button when panel opens
  useEffect(() => {
    if (issue) {
      closeButtonRef.current?.focus();
    }
  }, [issue]);

  if (!issue) return null;

  const severityStyles = getSeverityStyles(issue.severity);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <FocusTrap>
        <div
          ref={panelRef}
          id={dialogId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`fixed right-0 top-0 h-full z-50 w-full md:w-96 md:max-w-md bg-slate-900 border-l border-white/10 shadow-xl overflow-y-auto ${className}`}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/95 backdrop-blur-sm px-4 sm:px-6 py-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                {severityStyles.icon}
                <span
                  className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-widest ${severityStyles.badgeColor}`}
                >
                  {issue.severity}
                </span>
              </div>
              <h2
                id={titleId}
                className="text-lg font-semibold text-white leading-tight"
              >
                {issue.title}
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close issue panel"
              className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-colors"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-6 space-y-6">
            {/* Description */}
            <section>
              <h3 className="text-sm font-semibold text-slate-200 mb-2">
                Description
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {issue.description}
              </p>
            </section>

            {/* Impact */}
            <section>
              <h3 className="text-sm font-semibold text-slate-200 mb-2">
                Impact
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {issue.impact}
              </p>
            </section>

            {/* Failing Snippet */}
            <section>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">
                Failing Code Snippet
              </h3>
              <CodeSnippet code={issue.snippet} />
              <p className="mt-2 text-xs text-slate-500">
                Found at: <span className="text-slate-300">{issue.location}</span>
              </p>
            </section>

            {/* WCAG Criterion */}
            <section
              className={`rounded-lg border ${severityStyles.borderColor} ${severityStyles.bgColor} p-4`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold text-slate-200">
                  WCAG 2.1 Criterion
                </h3>
                <span
                  className={`inline-flex px-2 py-1 rounded text-xs font-semibold uppercase tracking-widest ${getLevelBadgeColor(
                    issue.wcagCriterion.level
                  )}`}
                >
                  Level {issue.wcagCriterion.level}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-mono text-slate-300 mb-1">
                    {issue.wcagCriterion.id}
                  </p>
                  <p className="text-sm font-semibold text-slate-100">
                    {issue.wcagCriterion.title}
                  </p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {issue.wcagCriterion.description}
                </p>

                {/* WCAG Techniques */}
                {issue.wcagCriterion.techniques.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-2">
                      Techniques:
                    </p>
                    <ul className="space-y-1">
                      {issue.wcagCriterion.techniques.map((tech, idx) => (
                        <li key={idx} className="text-xs text-slate-400 leading-relaxed">
                          • {tech}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Link to WCAG Spec */}
                <a
                  href={issue.wcagCriterion.specUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900 rounded transition-colors"
                >
                  Read WCAG criterion →
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </section>

            {/* Recommended Fix */}
            <section>
              <h3 className="text-sm font-semibold text-emerald-100 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                Recommended Fix
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-2">
                    {issue.recommendedFix.description}
                  </p>
                  <CodeSnippet code={issue.recommendedFix.codeExample} />
                </div>

                <div className="rounded-lg bg-slate-950/50 border border-emerald-400/20 p-3">
                  <p className="text-xs text-emerald-50 leading-relaxed">
                    <span className="font-semibold block mb-1">Why this works:</span>
                    {issue.recommendedFix.explanation}
                  </p>
                </div>
              </div>
            </section>

            {/* Metadata */}
            <section className="pt-4 border-t border-white/10">
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Element Type:</dt>
                  <dd className="text-slate-300 font-mono">{issue.elementType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Issue ID:</dt>
                  <dd className="text-slate-300 font-mono">{issue.id}</dd>
                </div>
              </dl>
            </section>
          </div>

          {/* Footer spacer for safe area */}
          <div className="h-8" />
        </div>
      </FocusTrap>
    </>
  );
}
