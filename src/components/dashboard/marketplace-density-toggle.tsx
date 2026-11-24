"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Rows3 } from "lucide-react";
import clsx from "clsx";
import { MarketplaceDensity, parseDensityParam } from "./marketplace-grid";

export const DENSITY_OPTIONS: {
  value: MarketplaceDensity;
  label: string;
  icon: typeof LayoutGrid;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    value: "comfortable",
    label: "Comfortable",
    icon: LayoutGrid,
    activeClass: "bg-white/10 text-white shadow-sm",
    idleClass: "text-slate-400 hover:text-white hover:bg-white/5",
  },
  {
    value: "compact",
    label: "Compact",
    icon: Rows3,
    activeClass: "bg-white/10 text-white shadow-sm",
    idleClass: "text-slate-400 hover:text-white hover:bg-white/5",
  },
];

interface MarketplaceDensityToggleProps {
  /** Injectable value for tests / controlled usage. */
  value?: MarketplaceDensity | null;
  /** Injectable change handler for tests / controlled usage. */
  onDensityChange?: (density: MarketplaceDensity) => void;
}

/**
 * Density toggle for the marketplace browse grid. Bound to the `density` URL
 * search param (`comfortable` | `compact`) so the choice is shareable.
 */
export function MarketplaceDensityToggle({
  value,
  onDensityChange,
}: MarketplaceDensityToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeDensity = parseDensityParam(
    value === undefined ? searchParams.get("density") : value
  );

  const handleDensityChange = useCallback(
    (next: MarketplaceDensity) => {
      if (onDensityChange) {
        onDensityChange(next);
        return;
      }

      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("density", next);
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [onDensityChange, searchParams, pathname, router]
  );

  return (
    <div
      role="group"
      aria-label="Density"
      className="flex items-center rounded-lg border border-white/10 bg-white/5 p-1"
    >
      {DENSITY_OPTIONS.map((option) => {
        const active = activeDensity === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={`${option.label} density`}
            aria-pressed={active}
            title={`${option.label} density`}
            onClick={() => handleDensityChange(option.value)}
            className={clsx(
              "p-1.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
              active ? option.activeClass : option.idleClass
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}