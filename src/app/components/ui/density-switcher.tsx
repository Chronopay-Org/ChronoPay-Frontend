"use client";

import { useEffect, useState } from "react";

type DensityOption = "comfortable" | "balanced" | "compact";

const STORAGE_KEY = "chronopay-density";

const OPTIONS: {
  value: DensityOption;
  label: string;
  description: string;
}[] = [
  {
    value: "comfortable",
    label: "Comfortable",
    description: "Open spacing with generous card padding for easier scanning.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "A neutral layout with readable spacing and clear hierarchy.",
  },
  {
    value: "compact",
    label: "Compact",
    description:
      "Tighter spacing that surfaces more content without losing clarity.",
  },
];

function applyDensity(density: DensityOption) {
  document.documentElement.dataset.density = density;
}

function isValidDensity(value: string | null): value is DensityOption {
  return OPTIONS.some((option) => option.value === value);
}

export function DensitySwitcher() {
  const [selectedDensity, setSelectedDensity] =
    useState<DensityOption>(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (isValidDensity(stored)) {
          applyDensity(stored);
          return stored;
        }
      } catch {
        // localStorage may be unavailable
      }
      applyDensity("balanced");
      return "balanced";
    });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync density to localStorage on changes — synchronizing React state with
  // an external storage system is a valid effect pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!mounted) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, selectedDensity);
    } catch {
      // localStorage may be unavailable in private browsing.
    }

    applyDensity(selectedDensity);
  }, [selectedDensity, mounted]);

  if (!mounted) {
    return (
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {OPTIONS.map((option) => (
          <div
            key={option.value}
            className="h-32 rounded-3xl border border-slate-700 bg-slate-950/70"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const active = selectedDensity === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              aria-label={`${option.label} density`}
              onClick={() => setSelectedDensity(option.value)}
              className={
                `rounded-3xl border p-5 text-left transition duration-200 focus-ring-white ` +
                (active
                  ? "border-cyan-400 bg-cyan-500/10 text-white"
                  : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-white/20 hover:bg-slate-900")
              }
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {option.description}
                  </p>
                </div>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-xs font-semibold text-slate-300">
                  {option.value === "comfortable"
                    ? "A"
                    : option.value === "balanced"
                      ? "B"
                      : "C"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-slate-400">
        Your density choice is stored with your ChronoPay profile and reapplied
        on every visit. This gives you a consistent dashboard layout across
        sessions.
      </p>
    </div>
  );
}
