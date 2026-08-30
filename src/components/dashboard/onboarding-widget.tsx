"use client";

import { useId, useState } from "react";
import { useRole } from "@/app/components/navigation/RoleContext";
import type { UserRole } from "@/app/components/navigation/role-nav";
import { PanelShell } from "./panel-shell";

type Task = {
  id: string;
  label: string;
  completed: boolean;
  href: string;
};

const ROLE_TASKS: Record<UserRole, Task[]> = {
  buyer: [
    { id: "wallet", label: "Connect wallet", completed: true, href: "#wallet" },
    { id: "marketplace", label: "Review open supplier slots", completed: false, href: "#available-time-slots" },
    { id: "booking", label: "Book your first protected session", completed: false, href: "#quick-actions" },
  ],
  supplier: [
    { id: "wallet", label: "Connect payout wallet", completed: true, href: "#wallet" },
    { id: "availability", label: "Publish your weekly availability", completed: false, href: "#available-time-slots" },
    { id: "offer", label: "Prepare your first supplier offer", completed: false, href: "#quick-actions" },
  ],
  admin: [
    { id: "audit", label: "Review system health", completed: true, href: "#quick-actions" },
    { id: "settings", label: "Confirm risk controls", completed: false, href: "#quick-actions" },
    { id: "queue", label: "Triage active escalations", completed: false, href: "#available-time-slots" },
  ],
};

const ROLE_COPY: Record<UserRole, { eyebrow: string; title: string; description: string }> = {
  buyer: {
    eyebrow: "Getting Started",
    title: "Buyer setup guide",
    description: "Start with the essentials for booking time safely and keeping your first dispute trail clean.",
  },
  supplier: {
    eyebrow: "Supplier Launch",
    title: "Supplier setup guide",
    description: "Shape your public availability and payout readiness before you accept your first buyer.",
  },
  admin: {
    eyebrow: "Operations",
    title: "Admin setup guide",
    description: "Use this checklist to verify controls before you begin monitoring platform activity.",
  },
};

export function OnboardingWidget() {
  const { role } = useRole();
  const [tasksByRole, setTasksByRole] = useState<Record<UserRole, Task[]>>(ROLE_TASKS);
  const [dismissed, setDismissed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const widgetId = useId();
  const progressId = `${widgetId}-progress`;

  if (dismissed) return null;

  const copy = ROLE_COPY[role];
  const tasks = tasksByRole[role];
  const completedCount = tasks.filter((task) => task.completed).length;
  const totalCount = tasks.length;
  const progress = (completedCount / totalCount) * 100;
  const isComplete = completedCount === totalCount;

  return (
    <PanelShell title={copy.title} id="onboarding-widget" eyebrow={copy.eyebrow}>
      <p className="mb-6 max-w-2xl text-sm leading-6 text-slate-300">
        {copy.description}
      </p>

      <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
        <div
          className="relative flex h-24 w-24 shrink-0 items-center justify-center"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-labelledby={progressId}
        >
          <span id={progressId} className="sr-only">
            {completedCount} of {totalCount} tasks completed for the {role} role
          </span>
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              className="text-white/10"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            <circle
              className="text-cyan-400 transition-all duration-500 ease-in-out"
              strokeWidth="8"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * progress) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="w-full flex-1 space-y-3">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
            >
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="peer h-5 w-5 cursor-pointer rounded border-white/20 bg-white/5 text-cyan-400 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-slate-950"
                  checked={task.completed}
                  onChange={(event) => {
                    setTasksByRole((current) => {
                      const next = [...current[role]];
                      next[index] = { ...next[index], completed: event.target.checked };
                      return { ...current, [role]: next };
                    });
                  }}
                  aria-label={`Mark ${task.label} as complete`}
                />
                <span
                  className={`text-sm font-medium transition-colors ${
                    task.completed
                      ? "text-slate-400 line-through"
                      : "text-slate-200 peer-hover:text-white"
                  }`}
                >
                  {task.label}
                </span>
              </label>
              <a
                href={task.href}
                className="rounded px-2 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-400 transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                aria-label={`Jump to ${task.label}`}
              >
                Jump
              </a>
            </div>
          ))}
        </div>
      </div>

      {isComplete ? (
        <div className="mt-6 flex justify-end border-t border-white/10 pt-4">
          {!showConfirm ? (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Dismiss widget
            </button>
          ) : (
            <div
              className="flex items-center gap-3"
              role="alertdialog"
              aria-labelledby={`${widgetId}-confirm`}
            >
              <span id={`${widgetId}-confirm`} className="text-sm font-medium text-slate-300">
                Are you sure?
              </span>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Confirm dismiss
              </button>
            </div>
          )}
        </div>
      ) : null}
    </PanelShell>
  );
}
