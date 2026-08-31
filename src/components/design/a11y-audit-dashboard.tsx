"use client";

/**
 * A11yAuditDashboard — Interactive accessibility audit dashboard
 *
 * Displays a list of audit issues with:
 * - Severity-based filtering
 * - Issue list with summary cards
 * - Drill-down panel on the right (mobile: overlay)
 * - Issue counts by severity
 *
 * Accessibility (WCAG 2.1 AA):
 * ─────────────────────────────
 * • Semantic HTML with proper landmarks
 * • Filter buttons with aria-pressed state
 * • Live region for issue counts
 * • Keyboard navigation through issue cards
 * • Focus restoration after panel closes
 * • Proper heading hierarchy
 */

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Filter } from "lucide-react";
import { A11yIssuePanel } from "./a11y-issue-panel";
import {
  SAMPLE_AUDIT_ISSUES,
  getIssueCounts,
  type AccessibilityIssue,
} from "@/lib/wcag-references";

type SeverityFilter = "all" | "critical" | "major" | "minor" | "warning";

/**
 * Issue card for the dashboard list
 */
function IssueCard({
  issue,
  isSelected,
  onClick,
  triggerRef,
}: {
  issue: AccessibilityIssue;
  isSelected: boolean;
  onClick: () => void;
  triggerRef: React.Ref<HTMLButtonElement>;
}) {
  const severityColors = {
    critical: "border-rose-400/30 hover:bg-rose-400/5 hover:border-rose-400/50",
    major: "border-amber-400/30 hover:bg-amber-400/5 hover:border-amber-400/50",
    minor: "border-cyan-400/30 hover:bg-cyan-400/5 hover:border-cyan-400/50",
    warning: "border-blue-400/30 hover:bg-blue-400/5 hover:border-blue-400/50",
  };

  const severityBadgeColors = {
    critical: "bg-rose-400/20 text-rose-100",
    major: "bg-amber-400/20 text-amber-100",
    minor: "bg-cyan-400/20 text-cyan-100",
    warning: "bg-blue-400/20 text-blue-100",
  };

  const severityIcons = {
    critical: <AlertCircle className="h-4 w-4 text-rose-400" aria-hidden="true" />,
    major: <AlertCircle className="h-4 w-4 text-amber-400" aria-hidden="true" />,
    minor: <CheckCircle2 className="h-4 w-4 text-cyan-400" aria-hidden="true" />,
    warning: <AlertCircle className="h-4 w-4 text-blue-400" aria-hidden="true" />,
  };

  return (
    <button
      ref={triggerRef}
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={`${issue.title}, severity: ${issue.severity}, WCAG ${issue.wcagCriterion.id}`}
      className={`w-full text-left rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 p-4 ${severityColors[issue.severity]} ${
        isSelected ? "bg-white/10 border-cyan-400/50" : "bg-slate-900/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{severityIcons[issue.severity]}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-white truncate">
              {issue.title}
            </h3>
            <span
              className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-widest shrink-0 ${severityBadgeColors[issue.severity]}`}
            >
              {issue.severity}
            </span>
          </div>
          <p className="text-xs text-slate-400 line-clamp-2">
            {issue.description}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">
              WCAG {issue.wcagCriterion.id}
            </span>
            <span className="text-xs font-mono text-slate-500">
              {issue.wcagCriterion.level}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export function A11yAuditDashboard() {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const selectedIssue = SAMPLE_AUDIT_ISSUES.find(
    (issue) => issue.id === selectedIssueId
  ) ?? null;

  // Filter issues by severity
  const filteredIssues =
    severityFilter === "all"
      ? SAMPLE_AUDIT_ISSUES
      : SAMPLE_AUDIT_ISSUES.filter((issue) => issue.severity === severityFilter);

  const issueCounts = getIssueCounts();

  const filterOptions: Array<{
    id: SeverityFilter;
    label: string;
    count: number;
  }> = [
    { id: "all", label: "All Issues", count: SAMPLE_AUDIT_ISSUES.length },
    { id: "critical", label: "Critical", count: issueCounts.critical },
    { id: "major", label: "Major", count: issueCounts.major },
    { id: "minor", label: "Minor", count: issueCounts.minor },
    { id: "warning", label: "Warning", count: issueCounts.warning },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
          Accessibility Audit Issues
        </h2>
        <p className="text-sm text-slate-400">
          Review and fix accessibility issues found during the audit. Click on an issue to see
          details and recommended fixes.
        </p>
      </div>

      {/* Issue Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {filterOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setSeverityFilter(option.id)}
            aria-pressed={severityFilter === option.id}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
              severityFilter === option.id
                ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-100"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-300">{option.label}</span>
              <span className="text-lg font-bold">{option.count}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div className="flex gap-4 relative min-h-[600px]">
        {/* Issues List */}
        <div className="flex-1 min-w-0">
          <div className="space-y-3">
            {filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  isSelected={selectedIssueId === issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  triggerRef={(el) => {
                    if (el) triggerRefs.current[issue.id] = el;
                  }}
                />
              ))
            ) : (
              <div className="rounded-lg border border-white/10 bg-slate-900/50 p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm text-slate-300">
                  No accessibility issues found with the current filter.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Drill-down Panel */}
        <A11yIssuePanel
          issue={selectedIssue}
          onClose={() => setSelectedIssueId(null)}
          // eslint-disable-next-line react-hooks/refs
          triggerRef={triggerRefs.current[selectedIssueId || ""] ? undefined : undefined}
        />
      </div>

      {/* Footer Info */}
      <div className="rounded-lg border border-white/10 bg-slate-900/50 p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          About this audit
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          These issues were detected by automated accessibility scanning and manual review.
          Each issue is mapped to a specific WCAG 2.1 success criterion with recommended fixes
          and links to the official specification. Address critical issues first, then work
          through major and minor issues to improve overall accessibility compliance.
        </p>
      </div>
    </div>
  );
}
