"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDownWideNarrow } from "lucide-react";
import clsx from "clsx";
import { MarketplaceSort, parseSortParam } from "./marketplace-grid";

const SORT_OPTIONS: { value: MarketplaceSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price", label: "Price" },
  { value: "soonest", label: "Soonest" },
];

interface MarketplaceSortControlProps {
  /** Injectable value for tests / controlled usage. */
  value?: MarketplaceSort | null;
  /** Injectable change handler for tests / controlled usage. */
  onSortChange?: (sort: MarketplaceSort) => void;
}

/**
 * Sort control for the marketplace browse grid. Bound to the `sort` URL
 * search param so the selection is shareable and bookmarkable. On a served
 * page it mirrors `FilterSidebar`/`SearchTypeahead` by writing the param via
 * `router.replace` inside a transition.
 */
export function MarketplaceSortControl({
  value,
  onSortChange,
}: MarketplaceSortControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeSort = parseSortParam(value === undefined ? searchParams.get("sort") : value);

  const handleSortChange = useCallback(
    (next: MarketplaceSort) => {
      if (onSortChange) {
        onSortChange(next);
        return;
      }

      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", next);
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [onSortChange, searchParams, pathname, router]
  );

  return (
    <div className="flex items-center gap-2">
      <span className="sr-only">Sort marketplace items</span>
      <ArrowDownWideNarrow
        className="h-4 w-4 shrink-0 text-zinc-400"
        aria-hidden="true"
      />
      <select
        aria-label="Sort marketplace items by"
        value={activeSort}
        onChange={(event) => handleSortChange(event.target.value as MarketplaceSort)}
        className={clsx(
          "rounded-lg border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        )}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}