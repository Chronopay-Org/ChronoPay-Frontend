"use client";

import { useCallback, useId, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  title: string;
  options: FilterOption[];
}

interface FilterSidebarProps {
  filters: FilterGroup[];
  onFiltersChange?: (activeFilters: Record<string, string[]>) => void;
}

export function FilterSidebar({
  filters,
  onFiltersChange,
}: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    filters.reduce((acc, group) => ({ ...acc, [group.id]: true }), {})
  );

  const getActiveFilters = useCallback(() => {
    const active: Record<string, string[]> = {};
    filters.forEach((group) => {
      const groupValues = searchParams.getAll(group.id);
      if (groupValues.length > 0) {
        active[group.id] = groupValues;
      }
    });
    return active;
  }, [filters, searchParams]);

  const handleFilterToggle = useCallback(
    (groupId: string, optionId: string) => {
      const currentValues = searchParams.getAll(groupId);
      const updatedValues = currentValues.includes(optionId)
        ? currentValues.filter((v) => v !== optionId)
        : [...currentValues, optionId];

      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());

        // Remove all previous values for this group
        params.delete(groupId);

        // Add new values
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
      const activeFilters = getActiveFilters();
      activeFilters[groupId] = updatedValues;
      onFiltersChange?.(activeFilters);
    },
    [
      searchParams,
      pathname,
      router,
      filters,
      onFiltersChange,
      getActiveFilters,
    ]
  );

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  const activeFilters = getActiveFilters();

  return (
    <div className="w-full space-y-4 sm:min-w-64">
      {filters.map((group) => {
        const isExpanded = expandedGroups[group.id];
        const activeCount = activeFilters[group.id]?.length || 0;

        return (
          <div
            key={group.id}
            className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4"
          >
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className={clsx(
                "flex w-full items-center justify-between text-left transition-colors",
                "hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-cyan-400 rounded px-2 py-1 -mx-2 -my-1"
              )}
              aria-expanded={isExpanded}
              aria-controls={`filter-group-${group.id}`}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-zinc-100">{group.title}</h3>
                {activeCount > 0 && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-300">
                    {activeCount}
                  </span>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-zinc-400" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-5 w-5 text-zinc-400" aria-hidden="true" />
              )}
            </button>

            {isExpanded && (
              <div
                id={`filter-group-${group.id}`}
                className="mt-3 space-y-2 border-t border-zinc-700/50 pt-3"
                role="group"
                aria-label={`${group.title} filter options`}
              >
                {group.options.map((option) => {
                  const isActive =
                    activeFilters[group.id]?.includes(option.id) || false;
                  const optionId = useId();

                  return (
                    <label
                      key={option.id}
                      className={clsx(
                        "flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 transition-colors",
                        "hover:bg-zinc-800/50",
                        isActive && "bg-cyan-500/10"
                      )}
                    >
                      <input
                        type="checkbox"
                        id={optionId}
                        checked={isActive}
                        onChange={() => handleFilterToggle(group.id, option.id)}
                        className={clsx(
                          "h-4 w-4 rounded border-2 transition-colors",
                          isActive
                            ? "border-cyan-400 bg-cyan-400"
                            : "border-zinc-600 bg-transparent",
                          "cursor-pointer appearance-none",
                          "focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1"
                        )}
                        aria-label={`${option.label}${option.count ? ` (${option.count})` : ""}`}
                      />
                      <span className="flex-1 select-none text-sm text-zinc-300">
                        {option.label}
                      </span>
                      {option.count !== undefined && (
                        <span className="text-xs text-zinc-500">
                          ({option.count})
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
