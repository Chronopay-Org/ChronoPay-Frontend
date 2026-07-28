"use client";

import { useEffect, useId, useRef, useState } from "react";
import { clsx } from "clsx";
import { ROLE_META, type UserRole } from "./role-nav";
import { useRole } from "./RoleContext";

const ROLE_ORDER: UserRole[] = ["buyer", "supplier", "admin"];
const ROLE_SUMMARIES: Record<UserRole, string[]> = {
  buyer: [
    "Browse verified suppliers and book dispute-safe sessions.",
    "Recommended for most first-time ChronoPay users.",
  ],
  supplier: [
    "Publish time slots, manage availability, and respond to disputes fast.",
    "Best for professionals selling consultations or services.",
  ],
  admin: [
    "Review platform health, intervene in escalations, and manage controls.",
    "Use when you operate ChronoPay internally.",
  ],
};

export function RoleOnboardingDialog() {
  const { role, setRole, hasExplicitRoleSelection, isHydrating } = useRole();
  const [selectedRole, setSelectedRole] = useState<UserRole>(role);
  const [announcement, setAnnouncement] = useState("");
  const firstCardRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (isHydrating || hasExplicitRoleSelection) return;
    requestAnimationFrame(() => {
      firstCardRef.current?.focus();
    });
  }, [hasExplicitRoleSelection, isHydrating]);

  if (isHydrating || hasExplicitRoleSelection) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="w-full max-w-5xl rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.2),transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-6 shadow-[0_32px_120px_-40px_rgba(15,23,42,0.95)] sm:p-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
            First launch setup
          </p>
          <h2 id={titleId} className="mt-3 text-3xl font-semibold text-white">
            Choose the role that matches how you’ll start in ChronoPay
          </h2>
          <p id={descriptionId} className="mt-3 text-sm leading-6 text-slate-300">
            Your selection tunes navigation and the default dashboard. You can
            switch roles later from the header without losing your place.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {ROLE_ORDER.map((option, index) => {
            const meta = ROLE_META[option];
            const isSelected = selectedRole === option;

            return (
              <button
                key={option}
                ref={index === 0 ? firstCardRef : undefined}
                type="button"
                onClick={() => {
                  setSelectedRole(option);
                  setAnnouncement(`${meta.label} selected`);
                }}
                className={clsx(
                  "min-h-[240px] rounded-[28px] border p-5 text-left transition duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                  isSelected
                    ? "border-cyan-300/60 bg-cyan-300/10 shadow-[0_20px_70px_-45px_rgba(34,211,238,0.75)]"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
                )}
                aria-pressed={isSelected}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl" aria-hidden="true">
                      {meta.icon}
                    </p>
                    <h3 className="mt-4 text-xl font-semibold text-white">
                      {meta.label}
                    </h3>
                  </div>
                  {option === "buyer" ? (
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                      Recommended
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {meta.description}
                </p>

                <ul className="mt-5 space-y-2 text-sm text-slate-200">
                  {ROLE_SUMMARIES[option].map((line) => (
                    <li key={line} className="flex gap-2">
                      <span aria-hidden="true" className="text-cyan-300">
                        •
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            Starting role: <span className="font-medium text-slate-100">{ROLE_META[selectedRole].label}</span>
          </p>
          <button
            type="button"
            onClick={() => setRole(selectedRole)}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Continue as {ROLE_META[selectedRole].label}
          </button>
        </div>

        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>
      </div>
    </div>
  );
}
