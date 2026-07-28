"use client";

import React, { useState, useRef, useCallback, useId } from "react";
import { PanelShell } from "./panel-shell";
import { StatusChip } from "./status-chip";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Save,
  ChevronRight,
  Sparkles,
  Info,
  X,
  FileCheck,
} from "lucide-react";
import clsx from "clsx";
import type { Slot } from "./types";

export interface TimeBlock {
  id: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "17:00"
  label?: string;
}

export interface DayTemplateSchedule {
  dayName: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  dayIndex: number; // 0 = Mon, 6 = Sun
  active: boolean;
  blocks: TimeBlock[];
}

export interface AvailabilityTemplate {
  id: string;
  name: string;
  description: string;
  category: "weekdays" | "weekends" | "fullweek" | "custom";
  badge?: string;
  schedule: DayTemplateSchedule[];
  isCustom?: boolean;
}

export const DEFAULT_AVAILABILITY_TEMPLATES: AvailabilityTemplate[] = [
  {
    id: "tpl-weekdays",
    name: "Standard Weekdays",
    description: "Monday to Friday, 09:00 - 17:00 UTC. Ideal for standard business hours.",
    category: "weekdays",
    badge: "Most Popular",
    schedule: [
      { dayName: "Mon", dayIndex: 0, active: true, blocks: [{ id: "w1", startTime: "09:00", endTime: "17:00" }] },
      { dayName: "Tue", dayIndex: 1, active: true, blocks: [{ id: "w2", startTime: "09:00", endTime: "17:00" }] },
      { dayName: "Wed", dayIndex: 2, active: true, blocks: [{ id: "w3", startTime: "09:00", endTime: "17:00" }] },
      { dayName: "Thu", dayIndex: 3, active: true, blocks: [{ id: "w4", startTime: "09:00", endTime: "17:00" }] },
      { dayName: "Fri", dayIndex: 4, active: true, blocks: [{ id: "w5", startTime: "09:00", endTime: "17:00" }] },
      { dayName: "Sat", dayIndex: 5, active: false, blocks: [] },
      { dayName: "Sun", dayIndex: 6, active: false, blocks: [] },
    ],
  },
  {
    id: "tpl-weekends",
    name: "Weekend Special",
    description: "Saturday and Sunday, 10:00 - 16:00 UTC. Perfect for part-time availability.",
    category: "weekends",
    badge: "Part-Time",
    schedule: [
      { dayName: "Mon", dayIndex: 0, active: false, blocks: [] },
      { dayName: "Tue", dayIndex: 1, active: false, blocks: [] },
      { dayName: "Wed", dayIndex: 2, active: false, blocks: [] },
      { dayName: "Thu", dayIndex: 3, active: false, blocks: [] },
      { dayName: "Fri", dayIndex: 4, active: false, blocks: [] },
      { dayName: "Sat", dayIndex: 5, active: true, blocks: [{ id: "we1", startTime: "10:00", endTime: "16:00" }] },
      { dayName: "Sun", dayIndex: 6, active: true, blocks: [{ id: "we2", startTime: "10:00", endTime: "16:00" }] },
    ],
  },
  {
    id: "tpl-fullweek",
    name: "7-Day High Availability",
    description: "Monday to Sunday, 09:00 - 18:00 UTC. Maximum coverage for global clients.",
    category: "fullweek",
    badge: "Max Coverage",
    schedule: [
      { dayName: "Mon", dayIndex: 0, active: true, blocks: [{ id: "f1", startTime: "09:00", endTime: "18:00" }] },
      { dayName: "Tue", dayIndex: 1, active: true, blocks: [{ id: "f2", startTime: "09:00", endTime: "18:00" }] },
      { dayName: "Wed", dayIndex: 2, active: true, blocks: [{ id: "f3", startTime: "09:00", endTime: "18:00" }] },
      { dayName: "Thu", dayIndex: 3, active: true, blocks: [{ id: "f4", startTime: "09:00", endTime: "18:00" }] },
      { dayName: "Fri", dayIndex: 4, active: true, blocks: [{ id: "f5", startTime: "09:00", endTime: "18:00" }] },
      { dayName: "Sat", dayIndex: 5, active: true, blocks: [{ id: "f6", startTime: "09:00", endTime: "18:00" }] },
      { dayName: "Sun", dayIndex: 6, active: true, blocks: [{ id: "f7", startTime: "09:00", endTime: "18:00" }] },
    ],
  },
  {
    id: "tpl-earlybird",
    name: "Early Morning Focus",
    description: "Monday to Friday, 07:00 - 12:00 UTC. Early morning consult blocks.",
    category: "custom",
    badge: "Morning",
    schedule: [
      { dayName: "Mon", dayIndex: 0, active: true, blocks: [{ id: "eb1", startTime: "07:00", endTime: "12:00" }] },
      { dayName: "Tue", dayIndex: 1, active: true, blocks: [{ id: "eb2", startTime: "07:00", endTime: "12:00" }] },
      { dayName: "Wed", dayIndex: 2, active: true, blocks: [{ id: "eb3", startTime: "07:00", endTime: "12:00" }] },
      { dayName: "Thu", dayIndex: 3, active: true, blocks: [{ id: "eb4", startTime: "07:00", endTime: "12:00" }] },
      { dayName: "Fri", dayIndex: 4, active: true, blocks: [{ id: "eb5", startTime: "07:00", endTime: "12:00" }] },
      { dayName: "Sat", dayIndex: 5, active: false, blocks: [] },
      { dayName: "Sun", dayIndex: 6, active: false, blocks: [] },
    ],
  },
];

export type ApplyScope = "current_week" | "next_week" | "current_month";

export interface TemplateApplicationDiff {
  slotsToAdd: number;
  slotsToModify: number;
  existingBookedSlots: Slot[];
  hasConflicts: boolean;
}

export interface AvailabilityTemplatePickerProps {
  templates?: AvailabilityTemplate[];
  existingSlots?: Slot[];
  onApplyTemplate?: (template: AvailabilityTemplate, scope: ApplyScope) => void;
  onSaveCurrentAsTemplate?: (template: AvailabilityTemplate) => void;
  onUndoLastApply?: () => void;
  bare?: boolean;
  className?: string;
  title?: string;
  description?: string;
}

export const AvailabilityTemplatePicker: React.FC<AvailabilityTemplatePickerProps> = ({
  templates = DEFAULT_AVAILABILITY_TEMPLATES,
  existingSlots = [],
  onApplyTemplate,
  onSaveCurrentAsTemplate,
  onUndoLastApply,
  bare = false,
  className = "",
  title = "Availability Template Picker",
  description = "Apply preset or saved availability templates to your calendar in a single step.",
}) => {
  const [templateList, setTemplateList] = useState<AvailabilityTemplate[]>(templates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templateList[0]?.id || "");
  const [selectedScope, setSelectedScope] = useState<ApplyScope>("current_week");
  const [liveMessage, setLiveMessage] = useState<string>("");

  // Modals state
  const [showDiffModal, setShowDiffModal] = useState<boolean>(false);
  const [showOverwriteModal, setShowOverwriteModal] = useState<boolean>(false);
  const [showSaveCustomModal, setShowSaveCustomModal] = useState<boolean>(false);

  // Undo state
  const [lastAppliedTemplate, setLastAppliedTemplate] = useState<{
    template: AvailabilityTemplate;
    scope: ApplyScope;
    timestamp: Date;
  } | null>(null);

  // Custom template form state
  const [customName, setCustomName] = useState<string>("");
  const [customDescription, setCustomDescription] = useState<string>("");
  const [customDays, setCustomDays] = useState<boolean[]>([true, true, true, true, true, false, false]);

  const headingId = useId();
  const modalHeadingId = useId();
  const overwriteHeadingId = useId();
  const saveHeadingId = useId();

  const announce = useCallback((msg: string) => {
    setLiveMessage(msg);
    const timer = setTimeout(() => setLiveMessage(""), 3000);
    return () => clearTimeout(timer);
  }, []);

  const selectedTemplate = templateList.find((t) => t.id === selectedTemplateId) || templateList[0];

  // Calculate diff preview metrics
  const calculateDiff = useCallback((): TemplateApplicationDiff => {
    if (!selectedTemplate) {
      return { slotsToAdd: 0, slotsToModify: 0, existingBookedSlots: [], hasConflicts: false };
    }

    const activeDaysCount = selectedTemplate.schedule.filter((s) => s.active).length;
    const estimatedNewSlots = activeDaysCount * (selectedScope === "current_month" ? 8 : 2);

    const booked = existingSlots.filter(
      (s) => s.status?.toLowerCase() === "booked" || s.status === "Busy"
    );

    const existingAvailable = existingSlots.filter(
      (s) => s.status?.toLowerCase() !== "booked" && s.status !== "Busy"
    );

    return {
      slotsToAdd: Math.max(1, estimatedNewSlots - existingAvailable.length),
      slotsToModify: existingAvailable.length,
      existingBookedSlots: booked,
      hasConflicts: booked.length > 0,
    };
  }, [selectedTemplate, selectedScope, existingSlots]);

  const diff = calculateDiff();

  // Keyboard navigation for roving tabIndex radio group
  const handleKeyDownRadiogroup = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextIndex = (index + 1) % templateList.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextIndex = (index - 1 + templateList.length) % templateList.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = templateList.length - 1;
    }

    if (nextIndex !== index) {
      const nextTemplate = templateList[nextIndex];
      setSelectedTemplateId(nextTemplate.id);
      announce(`Selected template: ${nextTemplate.name}`);
    }
  };

  const handleApplyClick = () => {
    if (!selectedTemplate) return;

    // Check if overwrite confirmation is needed
    if (existingSlots.length > 0) {
      setShowDiffModal(true);
    } else {
      executeApply();
    }
  };

  const executeApply = () => {
    if (!selectedTemplate) return;
    setLastAppliedTemplate({
      template: selectedTemplate,
      scope: selectedScope,
      timestamp: new Date(),
    });

    onApplyTemplate?.(selectedTemplate, selectedScope);
    announce(`Template "${selectedTemplate.name}" applied to ${selectedScope.replace("_", " ")}.`);
    setShowDiffModal(false);
    setShowOverwriteModal(false);
  };

  const handleUndo = () => {
    if (!lastAppliedTemplate) return;
    onUndoLastApply?.();
    announce(`Undid application of template "${lastAppliedTemplate.template.name}".`);
    setLastAppliedTemplate(null);
  };

  const handleSaveCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const dayNames: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[] = [
      "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
    ];

    const newTemplate: AvailabilityTemplate = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      description: customDescription.trim() || "Custom supplier availability template.",
      category: "custom",
      badge: "Custom",
      isCustom: true,
      schedule: dayNames.map((name, idx) => ({
        dayName: name,
        dayIndex: idx,
        active: customDays[idx],
        blocks: customDays[idx] ? [{ id: `c-${idx}`, startTime: "09:00", endTime: "17:00" }] : [],
      })),
    };

    setTemplateList((prev) => [...prev, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
    onSaveCurrentAsTemplate?.(newTemplate);
    announce(`Custom template "${newTemplate.name}" saved and selected.`);
    
    // Reset form
    setCustomName("");
    setCustomDescription("");
    setShowSaveCustomModal(false);
  };

  const content = (
    <div className="space-y-6">
      {/* Live announcement region */}
      <div className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </div>

      {/* Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id={headingId} className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" aria-hidden="true" />
            {title}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        </div>

        <button
          type="button"
          onClick={() => setShowSaveCustomModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Save Current as Template
        </button>
      </div>

      {/* Undo Banner if template recently applied */}
      {lastAppliedTemplate && (
        <div
          className="flex items-center justify-between rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-100"
          role="region"
          aria-label="Last action summary"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium">
              Applied <strong>{lastAppliedTemplate.template.name}</strong> to{" "}
              {lastAppliedTemplate.scope.replace("_", " ")}.
            </p>
          </div>
          <button
            type="button"
            onClick={handleUndo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-400/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Undo
          </button>
        </div>
      )}

      {/* Target Scope Selection */}
      <div className="space-y-2">
        <label id="scope-selector-label" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Apply Scope / Horizon
        </label>
        <div
          className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-1.5"
          role="radiogroup"
          aria-labelledby="scope-selector-label"
        >
          {(
            [
              { id: "current_week", label: "Current Week" },
              { id: "next_week", label: "Next Week" },
              { id: "current_month", label: "Selected Month" },
            ] as const
          ).map((scope) => {
            const isSelected = selectedScope === scope.id;
            return (
              <button
                key={scope.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  setSelectedScope(scope.id);
                  announce(`Scope changed to ${scope.label}`);
                }}
                className={clsx(
                  "rounded-lg px-3 py-2 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-100 border border-cyan-400/40 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                )}
              >
                {scope.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Template Cards Radiogroup */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label id="template-list-label" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Select Availability Template
          </label>
          <span className="text-xs text-slate-400">
            {templateList.length} template{templateList.length !== 1 ? "s" : ""} available
          </span>
        </div>

        <div
          role="radiogroup"
          aria-labelledby="template-list-label"
          className="grid gap-4 sm:grid-cols-2"
        >
          {templateList.map((tpl, index) => {
            const isSelected = selectedTemplateId === tpl.id;
            const cardId = `template-card-${tpl.id}`;

            return (
              <div
                key={tpl.id}
                id={cardId}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => {
                  setSelectedTemplateId(tpl.id);
                  announce(`Selected template: ${tpl.name}`);
                }}
                onKeyDown={(e) => handleKeyDownRadiogroup(e, index)}
                className={clsx(
                  "relative cursor-pointer rounded-2xl border p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                  isSelected
                    ? "border-cyan-400/60 bg-cyan-950/20 ring-1 ring-cyan-400/50 shadow-lg shadow-cyan-950/40"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                )}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      {tpl.name}
                      {tpl.isCustom && (
                        <StatusChip tone="warning">Custom</StatusChip>
                      )}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">{tpl.description}</p>
                  </div>
                  {tpl.badge && !tpl.isCustom && (
                    <StatusChip tone="positive">{tpl.badge}</StatusChip>
                  )}
                </div>

                {/* Mini Timeline Preview */}
                <div className="mt-4 pt-3 border-t border-white/8 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Weekly Coverage</span>
                    <span>
                      {tpl.schedule.filter((s) => s.active).length} days / week
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1" aria-label={`Weekly timeline preview for ${tpl.name}`}>
                    {tpl.schedule.map((day) => (
                      <div key={day.dayName} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-mono text-slate-400">{day.dayName}</span>
                        <div
                          className={clsx(
                            "w-full h-8 rounded-md transition-colors flex flex-col justify-end p-0.5",
                            day.active
                              ? "bg-cyan-500/25 border border-cyan-400/40"
                              : "bg-white/4 border border-white/6 opacity-40"
                          )}
                          title={`${day.dayName}: ${
                            day.active
                              ? day.blocks.map((b) => `${b.startTime}-${b.endTime}`).join(", ")
                              : "Off"
                          }`}
                        >
                          {day.active && (
                            <div className="w-full bg-cyan-400 rounded-[2px] h-4" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Apply CTA Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <Info className="h-4 w-4 text-cyan-400 shrink-0" aria-hidden="true" />
          <span>Applying will automatically update unbooked availability slots.</span>
        </div>

        <button
          type="button"
          onClick={handleApplyClick}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          <FileCheck className="h-4 w-4" aria-hidden="true" />
          Apply {selectedTemplate?.name}
        </button>
      </div>

      {/* MODAL 1: Diff Preview & Conflict Check */}
      {showDiffModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalHeadingId}
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 id={modalHeadingId} className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-cyan-400" aria-hidden="true" />
                  Template Application Preview
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Review changes for <strong>{selectedTemplate?.name}</strong> ({selectedScope.replace("_", " ")})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDiffModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Diff breakdown metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                <span className="text-xs text-emerald-300 font-medium">Slots to Add</span>
                <p className="text-xl font-bold text-emerald-100 mt-1">+{diff.slotsToAdd}</p>
              </div>
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3">
                <span className="text-xs text-cyan-300 font-medium">Slots to Overwrite</span>
                <p className="text-xl font-bold text-cyan-100 mt-1">{diff.slotsToModify}</p>
              </div>
            </div>

            {/* Booked Slots Conflict Alert */}
            {diff.hasConflicts ? (
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 space-y-2 text-amber-100">
                <div className="flex items-center gap-2 font-semibold text-amber-300 text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {diff.existingBookedSlots.length} Booked Slot Conflict(s) Detected
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Existing booked buyer appointments will be <strong>preserved and locked</strong>.
                  Only empty, unbooked slots will be replaced.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
                No booked slot conflicts detected. All open slots can be cleanly overwritten.
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDiffModal(false)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (diff.slotsToModify > 0) {
                    setShowDiffModal(false);
                    setShowOverwriteModal(true);
                  } else {
                    executeApply();
                  }
                }}
                className="rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Proceed to Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Overwrite Confirmation Modal */}
      {showOverwriteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={overwriteHeadingId}
        >
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 id={overwriteHeadingId} className="text-base font-bold text-white">
                  Confirm Overwriting Existing Slots?
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  You are about to overwrite {diff.slotsToModify} unbooked slot(s) for{" "}
                  <strong>{selectedScope.replace("_", " ")}</strong>. Booked sessions remain unaffected.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowOverwriteModal(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={executeApply}
                className="rounded-xl bg-amber-400 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-300"
              >
                Confirm Overwrite & Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Save Current Schedule as Custom Template */}
      {showSaveCustomModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={saveHeadingId}
        >
          <form
            onSubmit={handleSaveCustomSubmit}
            className="w-full max-w-lg rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 id={saveHeadingId} className="text-lg font-bold text-white flex items-center gap-2">
                  <Save className="h-5 w-5 text-cyan-400" aria-hidden="true" />
                  Save Custom Availability Template
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Save your recurring weekly schedule as a reusable template.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveCustomModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10"
                aria-label="Close save dialog"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="custom-name-input" className="block text-xs font-semibold text-slate-200 mb-1">
                  Template Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="custom-name-input"
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Summer Afternoon Consults"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label htmlFor="custom-desc-input" className="block text-xs font-semibold text-slate-200 mb-1">
                  Description
                </label>
                <textarea
                  id="custom-desc-input"
                  rows={2}
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Brief note on when to use this schedule..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-2">
                  Active Days
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const next = [...customDays];
                        next[idx] = !next[idx];
                        setCustomDays(next);
                      }}
                      className={clsx(
                        "rounded-lg p-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                        customDays[idx]
                          ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/40"
                          : "bg-white/5 text-slate-500 border border-white/5"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveCustomModal(false)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!customName.trim()}
                className="rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-40 disabled:pointer-events-none"
              >
                Save Template
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  if (bare) {
    return <div className={className}>{content}</div>;
  }

  return (
    <PanelShell className={className}>
      {content}
    </PanelShell>
  );
};
