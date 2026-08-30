"use client";

import React, { useState, useEffect } from "react";
import { Globe, Clock } from "lucide-react";
import {
  TimezoneMode,
  getViewerTimezone,
  getTimezoneOffsetMinutes,
  formatUTCOffset,
  getOffsetDeltaText,
  getStoredTimezoneMode,
  setStoredTimezoneMode,
} from "@/utils/timezone";
import { BidiIsolate } from "@/utils/bidi";

export interface TimezoneRibbonProps {
  supplierId: string;
  supplierTimeZone: string;
  supplierName?: string;
  onTimezoneChange?: (mode: TimezoneMode, activeTimeZone: string) => void;
  className?: string;
  /** UI locale for bidi-aware rendering of time strings. */
  locale?: string;
}

export function TimezoneRibbon({
  supplierId,
  supplierTimeZone,
  supplierName = "Supplier",
  onTimezoneChange,
  className = "",
  locale = "en",
}: TimezoneRibbonProps) {
  const [viewerTimeZone, setViewerTimeZone] = useState<string>("UTC");
  const [mode, setMode] = useState<TimezoneMode>("viewer");
  const [announcement, setAnnouncement] = useState<string>("");

  // Init viewer timezone + stored mode. Syncing from browser APIs is a
  // legitimate initialisation pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const detectedViewerTz = getViewerTimezone();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setViewerTimeZone(detectedViewerTz);

    const savedMode = getStoredTimezoneMode(supplierId);
    if (savedMode) {
      setMode(savedMode);
      const activeTz = savedMode === "viewer" ? detectedViewerTz : supplierTimeZone;
      onTimezoneChange?.(savedMode, activeTz);
    } else {
      onTimezoneChange?.("viewer", detectedViewerTz);
    }
  }, [supplierId, supplierTimeZone, onTimezoneChange]);

  const handleModeSwitch = (newMode: TimezoneMode) => {
    if (newMode === mode) return;

    setMode(newMode);
    setStoredTimezoneMode(supplierId, newMode);

    const activeTz = newMode === "viewer" ? viewerTimeZone : supplierTimeZone;
    const tzLabel = newMode === "viewer" 
      ? "My time (" + viewerTimeZone + ")" 
      : supplierName + " time (" + supplierTimeZone + ")";
    
    setAnnouncement("Switched calendar view to " + tzLabel);
    onTimezoneChange?.(newMode, activeTz);
  };

  const viewerOffset = formatUTCOffset(getTimezoneOffsetMinutes(viewerTimeZone));
  const supplierOffset = formatUTCOffset(getTimezoneOffsetMinutes(supplierTimeZone));
  const deltaText = getOffsetDeltaText(viewerTimeZone, supplierTimeZone);

  const activeTimeZone = mode === "viewer" ? viewerTimeZone : supplierTimeZone;
  const activeOffset = mode === "viewer" ? viewerOffset : supplierOffset;

  return (
    <div
      role="region"
      aria-label="Timezone display settings"
      className={"w-full bg-slate-900/90 border border-slate-800 rounded-lg p-3 sm:px-4 sm:py-3 transition-colors md:flex md:items-center md:justify-between gap-3 space-y-3 md:space-y-0 " + className}
    >
      {/* Screen Reader Live Announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Left Info Section */}
      <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300">
        <Globe className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium text-slate-200">Active Viewport:</span>
          <span className="inline-flex items-center gap-1 font-mono text-cyan-300 bg-slate-800/80 px-2 py-0.5 rounded text-xs">
            <BidiIsolate locale={locale}>{activeTimeZone}</BidiIsolate>
            {' ('}
            <BidiIsolate locale={locale}>{activeOffset}</BidiIsolate>
            {')'}
          </span>
          <span className="text-slate-500 hidden sm:inline" aria-hidden="true">•</span>
          <span className="helper-text helper-text--muted text-xs inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" aria-hidden="true" />
            Supplier delta: <strong className="text-slate-300 font-normal">{deltaText}</strong>
          </span>
        </div>
      </div>

      {/* Right Controls: Radiogroup for Timezone Mode Switch */}
      <div
        role="radiogroup"
        aria-label="Select calendar timezone display mode"
        className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-md border border-slate-800/80 self-start md:self-auto"
      >
        <button
          type="button"
          role="radio"
          aria-checked={mode === "viewer"}
          onClick={() => handleModeSwitch("viewer")}
          className={"px-3 py-1.5 text-xs font-medium rounded transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 " + (
            mode === "viewer"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          )}
        >
          My time <span className="text-[10px] opacity-70">(<BidiIsolate locale={locale}>{viewerOffset}</BidiIsolate>)</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={mode === "supplier"}
          onClick={() => handleModeSwitch("supplier")}
          className={"px-3 py-1.5 text-xs font-medium rounded transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 " + (
            mode === "supplier"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          )}
        >
          {supplierName} time <span className="text-[10px] opacity-70">(<BidiIsolate locale={locale}>{supplierOffset}</BidiIsolate>)</span>
        </button>
      </div>
    </div>
  );
}
