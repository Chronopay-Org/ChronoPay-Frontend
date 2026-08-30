"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

export interface ChipFilter {
  groupId: string;
  groupLabel: string;
  optionId: string;
  optionLabel: string;
}

interface ActiveFiltersChipsProps {
  filters: ChipFilter[];
  onFiltersChange?: (activeFilters: ChipFilter[]) => void;
}

export function ActiveFiltersChips({
  filters,
  onFiltersChange,
}: ActiveFiltersChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const handleRemoveFilter = useCallback(
    (groupId: string, optionId: string) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        const currentValues = params.getAll(groupId);
        const updatedValues = currentValues.filter((v) => v !== optionId);

        params.delete(groupId);
        updatedValues.forEach((value) => {
          params.append(groupId, value);
        });

        router.replace(
          params.toString()
            ? `${pathname}?${params.toString()}`
            : pathname
        );
      });

      // Notify parent component
      const updatedFilters = filters.filter(
        (f) => !(f.groupId === groupId && f.optionId === optionId)
      );
      onFiltersChange?.(updatedFilters);
    },
    [searchParams, pathname, router, filters, onFiltersChange]
  );

  const handleClearAll = useCallback(() => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());

      // Remove all filter parameters
      filters.forEach((filter) => {
        params.delete(filter.groupId);
      });

      router.replace(
        params.toString()
          ? `${pathname}?${params.toString()}`
          : pathname
      );
    });

    onFiltersChange?.([]);
  }, [searchParams, pathname, router, filters, onFiltersChange]);

  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-400">
          Active filters ({filters.length})
        </span>
        <button
          type="button"
          onClick={handleClearAll}
          className={clsx(
            "text-xs text-cyan-400 hover:text-cyan-300 transition-colors",
            "focus-visible:ring-2 focus-visible:ring-cyan-400 rounded px-2 py-1"
          )}
          aria-label="Clear all filters"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <div
            key={`${filter.groupId}-${filter.optionId}`}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5",
              "bg-cyan-500/15 border border-cyan-500/30 text-sm text-cyan-300"
            )}
          >
            <span>
              <span className="font-medium">{filter.groupLabel}:</span>{" "}
              {filter.optionLabel}
            </span>
            <button
              type="button"
              onClick={() =>
                handleRemoveFilter(filter.groupId, filter.optionId)
              }
              className={clsx(
                "ml-1 inline-flex items-center justify-center rounded-full p-0.5",
                "hover:bg-cyan-500/20 transition-colors",
                "focus-visible:ring-2 focus-visible:ring-cyan-400",
                "h-4 w-4"
              )}
              aria-label={`Remove ${filter.groupLabel}: ${filter.optionLabel} filter`}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
