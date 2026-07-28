"use client";

/**
 * DeveloperSettings — Advanced/Developer options for ChronoPay
 *
 * Features:
 *  - Experimental feature toggles with localStorage persistence
 *  - Debug info display (Version, Build ID, User ID) with copy-to-clipboard
 *  - Export logs button for troubleshooting
 *  - Instability warning banner (dismissible)
 *
 * Accessibility (WCAG 2.1 AA):
 *  - All toggles have proper aria-labels and aria-pressed states
 *  - Copy buttons have aria-live status announcements
 *  - Focus management with visible focus rings
 *  - Proper heading hierarchy and semantic structure
 *  - Responsive layout for mobile/tablet/desktop
 *  - Dark mode compatible with semantic token system
 *
 * Storage:
 *  - localStorage key: "chronopay-experiments"
 *  - Persists across sessions
 */

import { useState, useEffect, useCallback, useId } from "react";
import { CheckCircle2, Copy, Download } from "lucide-react";
import { WarningBanner } from "@/app/components/ui/warning-banner";

interface ExperimentalFeature {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const EXPERIMENTAL_FEATURES: Omit<ExperimentalFeature, "enabled">[] = [
  {
    id: "timeline-compression",
    label: "Timeline Compression",
    description: "Compress multi-month timelines into a single view for quicker scanning.",
  },
  {
    id: "batch-operations",
    label: "Batch Operations",
    description: "Enable experimental bulk actions for invoices and reports.",
  },
  {
    id: "ai-insights",
    label: "AI Insights",
    description: "Show ML-powered spending patterns and anomaly detection.",
  },
  {
    id: "custom-themes",
    label: "Custom Themes",
    description: "Create and save custom color themes beyond light/dark modes.",
  },
];

const STORAGE_KEY = "chronopay-experiments";
const BANNER_DISMISS_KEY = "chronopay-dev-banner-dismissed";

interface DebugInfo {
  version: string;
  buildId: string;
  userId: string;
  timestamp: string;
}

function getDebugInfo(): DebugInfo {
  return {
    version: "0.1.0",
    buildId: process.env.NEXT_PUBLIC_BUILD_ID || "dev-build",
    userId: "user-" + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
  };
}

function formatDebugInfo(info: DebugInfo): string {
  return `Version: ${info.version}\nBuild ID: ${info.buildId}\nUser ID: ${info.userId}\nTimestamp: ${info.timestamp}`;
}

interface CopyableItemProps {
  label: string;
  value: string;
  copyLabel?: string;
}

function CopyableItem({ label, value, copyLabel = "Copy" }: CopyableItemProps) {
  const [isCopied, setIsCopied] = useState(false);
  const statusId = useId();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  }, [value]);

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/6 bg-white/4 px-3 py-2.5 sm:flex-row">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="mt-1 font-mono text-xs text-slate-100 break-all">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`${copyLabel} ${label}`}
        aria-describedby={statusId}
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
          isCopied
            ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
            : "border border-white/10 bg-white/6 text-slate-200 hover:border-white/20"
        }`}
      >
        {isCopied ? (
          <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
        ) : (
          <Copy aria-hidden="true" className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">{isCopied ? "Copied" : copyLabel}</span>
      </button>
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isCopied ? `${label} copied to clipboard` : ""}
      </div>
    </div>
  );
}

interface ExperimentToggleProps {
  feature: ExperimentalFeature;
  onChange: (id: string, enabled: boolean) => void;
}

function ExperimentToggle({ feature, onChange }: ExperimentToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-white/6 bg-white/4 p-4 sm:p-5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{feature.label}</p>
        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
          {feature.description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={feature.enabled}
        aria-label={`Toggle ${feature.label}`}
        onClick={() => onChange(feature.id, !feature.enabled)}
        className={`shrink-0 inline-flex h-6 w-11 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
          feature.enabled
            ? "border-cyan-300/50 bg-cyan-300/20"
            : "border-white/10 bg-white/6"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white/90 transition-transform ${
            feature.enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

export function DeveloperSettings() {
  const [features, setFeatures] = useState<ExperimentalFeature[]>([]);
  const [mounted, setMounted] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const debugInfo = getDebugInfo();

  // Load experimental features from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedBanner = localStorage.getItem(BANNER_DISMISS_KEY);

      if (stored) {
        const savedStates = JSON.parse(stored) as Record<string, boolean>;
        setFeatures(
          EXPERIMENTAL_FEATURES.map((f) => ({
            ...f,
            enabled: savedStates[f.id] ?? false,
          }))
        );
      } else {
        setFeatures(EXPERIMENTAL_FEATURES.map((f) => ({ ...f, enabled: false })));
      }

      setBannerDismissed(storedBanner === "true");
    } catch {
      // Fallback if localStorage fails
      setFeatures(EXPERIMENTAL_FEATURES.map((f) => ({ ...f, enabled: false })));
    }
    setMounted(true);
  }, []);

  // Persist feature toggles to localStorage
  const handleToggle = useCallback((id: string, enabled: boolean) => {
    setFeatures((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, enabled } : f));
      try {
        const state = Object.fromEntries(next.map((f) => [f.id, f.enabled]));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        console.error("Failed to save experimental feature state");
      }
      return next;
    });
  }, []);

  const handleDismissBanner = useCallback(() => {
    setBannerDismissed(true);
    try {
      localStorage.setItem(BANNER_DISMISS_KEY, "true");
    } catch {
      console.error("Failed to save banner dismissal state");
    }
  }, []);

  const handleExportLogs = useCallback(async () => {
    setIsExporting(true);
    try {
      // Simulate log collection (in production, would gather actual logs)
      await new Promise((resolve) => setTimeout(resolve, 500));

      const logData = {
        debug: debugInfo,
        experiments: Object.fromEntries(
          features.map((f) => [f.id, f.enabled])
        ),
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      };

      const blob = new Blob(
        [JSON.stringify(logData, null, 2)],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chronopay-debug-${debugInfo.buildId}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export logs:", error);
    } finally {
      setIsExporting(false);
    }
  }, [debugInfo, features]);

  if (!mounted) {
    return (
      <div className="space-y-5">
        <div className="h-20 rounded-lg border border-white/6 bg-white/4 animate-pulse" />
        <div className="h-20 rounded-lg border border-white/6 bg-white/4 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      {!bannerDismissed && (
        <WarningBanner
          title="Experimental Features"
          description="These settings control unstable, work-in-progress features. They may change, break, or be removed at any time. Use at your own risk."
          onDismiss={handleDismissBanner}
        />
      )}

      {/* Experimental Features Section */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Experimental Features</h3>
          <p className="mt-1 text-sm text-slate-400">
            Enable or disable experimental features. Your preferences are saved locally.
          </p>
        </div>
        <div className="space-y-3">
          {features.map((feature) => (
            <ExperimentToggle
              key={feature.id}
              feature={feature}
              onChange={handleToggle}
            />
          ))}
        </div>
      </div>

      {/* Debug Info Section */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Debug Information</h3>
          <p className="mt-1 text-sm text-slate-400">
            Share this information when reporting issues or contacting support.
          </p>
        </div>
        <div className="space-y-3">
          <CopyableItem
            label="Version"
            value={debugInfo.version}
            copyLabel="Copy"
          />
          <CopyableItem
            label="Build ID"
            value={debugInfo.buildId}
            copyLabel="Copy"
          />
          <CopyableItem
            label="User ID"
            value={debugInfo.userId}
            copyLabel="Copy"
          />
          <CopyableItem
            label="Full Debug Info"
            value={formatDebugInfo(debugInfo)}
            copyLabel="Copy All"
          />
        </div>
      </div>

      {/* Export Logs Section */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Export Logs</h3>
          <p className="mt-1 text-sm text-slate-400">
            Download your debug information and active experiments as a JSON file.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportLogs}
          disabled={isExporting}
          aria-busy={isExporting}
          className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
            isExporting
              ? "border border-white/12 bg-white/6 text-slate-200 opacity-60 cursor-not-allowed"
              : "border border-white/12 bg-white/6 text-slate-100 hover:border-cyan-200/30 hover:bg-white/10"
          }`}
        >
          <Download
            aria-hidden="true"
            className={`h-4 w-4 ${isExporting ? "animate-pulse" : ""}`}
          />
          <span>{isExporting ? "Exporting..." : "Export Logs"}</span>
        </button>
      </div>
    </div>
  );
}
