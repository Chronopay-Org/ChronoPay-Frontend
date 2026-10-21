"use client";

import { useId, useState, useMemo, useCallback, useRef } from "react";
import { clsx } from "clsx";
import { RRule, type Options as RRuleOptions, type Weekday } from "rrule";
import { PanelShell } from "./panel-shell";
import { formatDate } from "@/lib/formatters";

type Frequency = "daily" | "weekly" | "monthly";
type EndType = "never" | "count" | "date";

const WEEKDAY_LABELS: { value: Weekday; label: string; short: string }[] = [
  { value: RRule.MO, label: "Monday", short: "Mon" },
  { value: RRule.TU, label: "Tuesday", short: "Tue" },
  { value: RRule.WE, label: "Wednesday", short: "Wed" },
  { value: RRule.TH, label: "Thursday", short: "Thu" },
  { value: RRule.FR, label: "Friday", short: "Fri" },
  { value: RRule.SA, label: "Saturday", short: "Sat" },
  { value: RRule.SU, label: "Sunday", short: "Sun" },
];

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const END_OPTIONS: { value: EndType; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "count", label: "After" },
  { value: "date", label: "On date" },
];

function frequencyToRRuleFreq(f: Frequency): number {
  switch (f) {
    case "daily":
      return RRule.DAILY;
    case "weekly":
      return RRule.WEEKLY;
    case "monthly":
      return RRule.MONTHLY;
  }
}

function getIntervalLabel(f: Frequency): string {
  switch (f) {
    case "daily":
      return "days";
    case "weekly":
      return "weeks";
    case "monthly":
      return "months";
  }
}

function getSingleLabel(f: Frequency): string {
  switch (f) {
    case "daily":
      return "day";
    case "weekly":
      return "week";
    case "monthly":
      return "month";
  }
}

function useRadioRovingTabIndex(
  containerRef: React.RefObject<HTMLDivElement | null>,
  selectedIndex: number,
) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = containerRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]',
      );
      if (!items || items.length === 0) return;

      let currentIndex = Array.from(items).indexOf(
        document.activeElement as HTMLButtonElement,
      );
      if (currentIndex === -1) currentIndex = selectedIndex;

      let nextIndex = currentIndex;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % items.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + items.length) % items.length;
      }

      if (nextIndex !== currentIndex) {
        items[nextIndex]?.focus();
      }
    },
    [containerRef, selectedIndex],
  );

  return handleKeyDown;
}

export function RecurringAvailabilityEditor() {
  const liveId = useId();
  const summaryId = useId();
  const previewId = useId();
  const frequencyGroupId = useId();
  const weekdayGroupId = useId();
  const endGroupId = useId();
  const intervalId = useId();
  const endCountId = useId();
  const endDateId = useId();

  const frequencyRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [interval_, setInterval_] = useState(1);
  const [weekdayIndices, setWeekdayIndices] = useState<Set<number>>(
    () => new Set([1, 3, 5]),
  );
  const [endType, setEndType] = useState<EndType>("never");
  const [endCount, setEndCount] = useState(10);
  const [endDate, setEndDate] = useState("");
  const [liveMessage, setLiveMessage] = useState("");

  const freqIndex = FREQUENCIES.findIndex((f) => f.value === frequency);
  const endIndex = END_OPTIONS.findIndex((e) => e.value === endType);

  const announce = useCallback((msg: string) => {
    setLiveMessage(msg);
    setTimeout(() => setLiveMessage(""), 3000);
  }, []);

  const handleFrequencyChange = useCallback(
    (f: Frequency) => {
      setFrequency(f);
      announce(`Frequency changed to ${f}`);
    },
    [announce],
  );

  const handleEndTypeChange = useCallback(
    (e: EndType) => {
      setEndType(e);
      announce(`End condition changed to ${e}`);
    },
    [announce],
  );

  const toggleWeekday = useCallback(
    (dayIdx: number) => {
      setWeekdayIndices((prev) => {
        const next = new Set(prev);
        if (next.has(dayIdx)) {
          next.delete(dayIdx);
          announce(`${WEEKDAY_LABELS[dayIdx]?.label ?? ""} removed`);
        } else {
          next.add(dayIdx);
          announce(`${WEEKDAY_LABELS[dayIdx]?.label ?? ""} added`);
        }
        return next;
      });
    },
    [announce],
  );

  const frequencyKeyDown = useRadioRovingTabIndex(frequencyRef, freqIndex);
  const endKeyDown = useRadioRovingTabIndex(endRef, endIndex);

  const hasWeekdays = frequency === "weekly" || frequency === "monthly";

  const rrule = useMemo(() => {
    if (hasWeekdays && weekdayIndices.size === 0) return null;

    const byweekday = hasWeekdays
      ? Array.from(weekdayIndices).map((d) => WEEKDAY_LABELS[d]!.value)
      : undefined;

    const options: Partial<RRuleOptions> = {
      freq: frequencyToRRuleFreq(frequency),
      interval: interval_,
      dtstart: new Date(),
      ...(byweekday ? { byweekday } : {}),
    };

    if (endType === "count") {
      options.count = endCount;
    } else if (endType === "date" && endDate) {
      options.until = new Date(endDate + "T23:59:59");
    }

    return new RRule(options);
  }, [frequency, interval_, weekdayIndices, endType, endCount, endDate, hasWeekdays]);

  const preview = useMemo<Date[]>(() => {
    if (!rrule) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const windowEnd = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
    const all = rrule.between(today, windowEnd, true);

    const future = all.filter((d) => d.getTime() > today.getTime());
    return future.slice(0, 5);
  }, [rrule]);

  const summary = useMemo(() => {
    if (!rrule) {
      return hasWeekdays && weekdayIndices.size === 0
        ? "Select at least one day to see a preview."
        : "Configure the recurrence rule above.";
    }

    return rrule.toText();
  }, [rrule, hasWeekdays, weekdayIndices.size]);

  const weekdayCount = weekdayIndices.size;

  return (
    <PanelShell
      title="Recurring Availability"
      description="Set up recurring availability with a custom recurrence rule."
    >
      <div className="space-y-6">
        {/* Frequency - radio group */}
        <fieldset>
          <legend
            id={frequencyGroupId}
            className="mb-3 text-sm font-semibold text-slate-200"
          >
            Frequency
          </legend>
          <div
            ref={frequencyRef}
            role="radiogroup"
            aria-labelledby={frequencyGroupId}
            onKeyDown={frequencyKeyDown}
            className="flex flex-wrap gap-2"
          >
            {FREQUENCIES.map((f, i) => {
              const checked = frequency === f.value;
              return (
                <button
                  key={f.value}
                  role="radio"
                  aria-checked={checked}
                  tabIndex={i === freqIndex ? 0 : -1}
                  onClick={() => handleFrequencyChange(f.value)}
                  className={clsx(
                    "inline-flex min-h-11 items-center rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                    checked
                      ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-50"
                      : "border-white/12 bg-white/5 text-slate-200 hover:border-cyan-200/30 hover:bg-white/10",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Interval */}
        <div>
          <label
            htmlFor={intervalId}
            className="block text-sm font-semibold text-slate-200"
          >
            Every
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              id={intervalId}
              type="number"
              min={1}
              max={52}
              value={interval_}
              onChange={(e) =>
                setInterval_(Math.max(1, parseInt(e.target.value) || 1))
              }
              onBlur={(e) => {
                if (e.target.value === "" || parseInt(e.target.value) < 1) {
                  setInterval_(1);
                }
              }}
              className="w-20 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white
                focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950
                hover:border-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-describedby={`${intervalId}-hint`}
            />
            <span className="text-sm text-slate-300">
              {getIntervalLabel(frequency)}
            </span>
          </div>
          <p
            id={`${intervalId}-hint`}
            className="mt-1 text-xs text-slate-400"
          >
            1–52. Leave at 1 for every {getSingleLabel(frequency)}.
          </p>
        </div>

        {/* Weekday multi-select */}
        {hasWeekdays && (
          <fieldset>
            <legend
              id={weekdayGroupId}
              className="mb-3 text-sm font-semibold text-slate-200"
            >
              Days of the week
            </legend>
            <div
              role="group"
              aria-labelledby={weekdayGroupId}
              className="flex flex-wrap gap-2"
            >
              {WEEKDAY_LABELS.map((d, idx) => {
                const selected = weekdayIndices.has(idx);
                return (
                  <button
                    key={d.value.toString()}
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    onClick={() => toggleWeekday(idx)}
                    className={clsx(
                      "inline-flex min-h-10 items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                      selected
                        ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-50"
                        : "border-white/12 bg-white/5 text-slate-200 hover:border-cyan-200/30 hover:bg-white/10",
                    )}
                  >
                    {d.short}
                  </button>
                );
              })}
            </div>
            {weekdayCount === 0 && (
              <p role="alert" className="mt-2 text-xs text-amber-300">
                Select at least one day.
              </p>
            )}
          </fieldset>
        )}

        {/* End condition - radio group */}
        <fieldset>
          <legend
            id={endGroupId}
            className="mb-3 text-sm font-semibold text-slate-200"
          >
            End
          </legend>
          <div
            ref={endRef}
            role="radiogroup"
            aria-labelledby={endGroupId}
            onKeyDown={endKeyDown}
            className="flex flex-wrap items-center gap-3"
          >
            {END_OPTIONS.map((opt, i) => {
              const checked = endType === opt.value;
              return (
                <button
                  key={opt.value}
                  role="radio"
                  aria-checked={checked}
                  tabIndex={i === endIndex ? 0 : -1}
                  onClick={() => handleEndTypeChange(opt.value)}
                  className={clsx(
                    "inline-flex min-h-10 items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                    checked
                      ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-50"
                      : "border-white/12 bg-white/5 text-slate-200 hover:border-cyan-200/30 hover:bg-white/10",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}

            {endType === "count" && (
              <div className="flex items-center gap-2">
                <input
                  id={endCountId}
                  type="number"
                  min={1}
                  max={999}
                  value={endCount}
                  onChange={(e) =>
                    setEndCount(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-20 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white
                    focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950
                    hover:border-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="Number of occurrences"
                />
                <span className="text-sm text-slate-300">occurrences</span>
              </div>
            )}

            {endType === "date" && (
              <input
                id={endDateId}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white
                  focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950
                  hover:border-white/20"
                aria-label="End date"
              />
            )}
          </div>
        </fieldset>

        {/* Summary */}
        <div
          id={summaryId}
          aria-live="polite"
          aria-atomic="true"
          className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
        >
          <p className="text-sm font-medium text-slate-200">Summary</p>
          <p className="mt-1 text-sm text-slate-300">{summary}</p>
        </div>

        {/* Preview */}
        <div>
          <h3
            id={previewId}
            className="text-sm font-semibold text-slate-200"
          >
            Next occurrences
          </h3>
          {preview.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">
              No occurrences to preview.
            </p>
          ) : (
            <ul
              aria-labelledby={previewId}
              className="mt-3 space-y-2"
            >
              {preview.map((date, i) => (
                <li
                  key={date.toISOString()}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-2.5"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/10 text-xs font-semibold text-cyan-200">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-200">
                    {formatDate(date, "en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Screen-reader live region */}
        <div
          id={liveId}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {liveMessage}
        </div>
      </div>
    </PanelShell>
  );
}