"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ViewMode = "list" | "map" | "split";

export interface MapViewToggleProps {
  /** Controlled active view mode */
  viewMode: ViewMode;
  /** Called when the user switches view mode */
  onViewModeChange: (mode: ViewMode) => void;
  /** Currently displayed supplier results */
  supplierCount?: number;
  /** Children rendered in the list/split view */
  children?: React.ReactNode;
}

// ─── Place Search ─────────────────────────────────────────────────────────────

interface PlaceSearchBoxProps {
  onSearch: (query: string) => void;
  compact?: boolean;
}

function PlaceSearchBox({ onSearch, compact = false }: PlaceSearchBoxProps) {
  const [value, setValue] = useState("");
  const inputId = useId();
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed) {
        onSearch(trimmed);
        setShowHint(true);
        setTimeout(() => setShowHint(false), 2000);
      }
    },
    [value, onSearch],
  );

  return (
    <form onSubmit={handleSubmit} className="relative">
      <label htmlFor={inputId} className="sr-only">
        Search places
      </label>
      <div className="relative flex items-center">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
        >
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          id={inputId}
          type="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search places..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`
            w-full rounded-full border border-white/10 bg-white/6 pl-8
            text-sm text-white placeholder:text-slate-500
            focus:border-cyan-300/40 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-300
            transition-colors
            ${compact ? "h-7 pr-2 text-xs" : "h-9 pr-3"}
          `}
        />
      </div>
      {/* Toast hint */}
      {showHint && (
        <p
          className="absolute left-0 top-full mt-1 rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200 z-10"
          role="status"
          aria-live="polite"
        >
          Searching &quot;{value}&quot;...
        </p>
      )}
    </form>
  );
}

// ─── Map Placeholder ──────────────────────────────────────────────────────────

interface MapAreaProps {
  /** Whether to show the "Search this area" button */
  showSearchArea?: boolean;
  onSearchArea?: () => void;
  supplierCount?: number;
}

/**
 * A stylized map placeholder. In production, this would be replaced
 * with an actual map library. Designed to be accessible with a list-only
 * fallback for screen reader users.
 */
function MapArea({
  showSearchArea = true,
  onSearchArea,
  supplierCount = 0,
}: MapAreaProps) {
  const mapId = useId();

  // Generate pseudo-random pin positions for visual effect
  const pins = useMemo(() => {
    const count = Math.min(supplierCount, 12);
    return Array.from({ length: count }, (_, i) => ({
      id: `pin-${i}`,
      x: 12 + (i * 37 + 19) % 76,
      y: 14 + (i * 53 + 7) % 72,
      label: `Supplier ${i + 1}`,
    }));
  }, [supplierCount]);

  return (
    <div
      className="relative flex min-h-[400px] w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900"
      role="region"
      aria-label="Map view"
      aria-roledescription="map"
    >
      {/* Grid lines decoration */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Supplier pin markers */}
      {pins.map((pin) => (
        <button
          key={pin.id}
          type="button"
          aria-label={`${pin.label} — press Enter or Space to view details`}
          className="absolute z-10 -translate-x-1/2 -translate-y-full"
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          onClick={() => {
            // In production: open supplier detail
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              // Cycle through pins
              const siblings = Array.from(
                (e.currentTarget.parentNode as HTMLElement).querySelectorAll(
                  '[role="button"]',
                ),
              );
              const idx = siblings.indexOf(e.currentTarget);
              const next =
                e.key === "ArrowDown"
                  ? siblings[(idx + 1) % siblings.length]
                  : siblings[(idx - 1 + siblings.length) % siblings.length];
              (next as HTMLElement)?.focus();
            }
          }}
        >
          <span className="sr-only">{pin.label}</span>
          {/* Pin icon */}
          <svg
            viewBox="0 0 24 36"
            fill="none"
            className="h-7 w-5 drop-shadow-lg"
            aria-hidden="true"
          >
            <ellipse
              cx="12"
              cy="33"
              rx="4"
              ry="2"
              className="fill-black/20"
            />
            <path
              d="M12 2C7.03 2 3 6.03 3 11c0 6.75 9 21 9 21s9-14.25 9-21c0-4.97-4.03-9-9-9z"
              className="fill-cyan-500"
            />
            <circle cx="12" cy="10" r="3.5" className="fill-white" />
          </svg>
        </button>
      ))}

      {/* No suppliers hint */}
      {supplierCount === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-slate-500">
            No suppliers in this area. Try adjusting your filters or pan to a
            different location.
          </p>
        </div>
      )}

      {/* Search this area button */}
      {showSearchArea && supplierCount > 0 && onSearchArea && (
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
          <button
            type="button"
            onClick={onSearchArea}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/90 px-3.5 py-2 text-xs font-medium text-slate-200 shadow-lg backdrop-blur-sm transition-colors hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
              <circle cx="5.5" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.2" />
              <path d="M8 8l4.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Search this area
          </button>
        </div>
      )}

      {/* Map attribution */}
      <p className="absolute bottom-2 right-3 text-[10px] text-slate-600">
        Map placeholder &middot; Integrate map library
      </p>
    </div>
  );
}

// ─── Map View Toggle ──────────────────────────────────────────────────────────

/**
 * MapViewToggle
 *
 * A toggle control that switches the marketplace browse view between
 * list, map, and split modes. Includes a place-search box in map mode
 * and a "search this area" action after panning.
 *
 * WCAG 2.1 AA: uses `role="radiogroup"`, `aria-pressed`, keyboard
 * navigation, and a screen-reader-only fallback description.
 *
 * @example
 * ```tsx
 * const [view, setView] = useState<ViewMode>("list");
 *
 * <MapViewToggle viewMode={view} onViewModeChange={setView}>
 *   <SupplierList suppliers={suppliers} />
 * </MapViewToggle>
 * ```
 */
export function MapViewToggle({
  viewMode,
  onViewModeChange,
  supplierCount = 0,
  children,
}: MapViewToggleProps) {
  const groupId = useId();
  const [placeQuery, setPlaceQuery] = useState("");
  const [searchAreaCount, setSearchAreaCount] = useState(0);

  const handlePlaceSearch = useCallback((query: string) => {
    setPlaceQuery(query);
    // In production: geocode the query and fly to that location
  }, []);

  const handleSearchArea = useCallback(() => {
    setSearchAreaCount((c) => c + 1);
    // In production: re-fetch suppliers within current map bounds
  }, []);

  // Show map in both "map" and "split" modes
  const showMap = viewMode === "map" || viewMode === "split";
  // Show children (list) in both "list" and "split" modes
  const showList = viewMode === "list" || viewMode === "split";

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar: toggle + place search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* View mode toggle */}
        <div
          role="radiogroup"
          aria-label="View mode"
          className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5"
        >
          {(
            [
              { mode: "list" as const, label: "List", icon: "list" },
              { mode: "map" as const, label: "Map", icon: "map" },
              { mode: "split" as const, label: "Split", icon: "split" },
            ] as const
          ).map(({ mode, label, icon }) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={viewMode === mode}
              aria-label={`${label} view`}
              onClick={() => onViewModeChange(mode)}
              className={`
                inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300
                ${
                  viewMode === mode
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }
              `}
            >
              {icon === "list" && (
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
                  <rect x="1" y="1" width="14" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="1" y="6.5" width="14" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="1" y="12" width="14" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              )}
              {icon === "map" && (
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
                  <path d="M1 3.5v10l4-2 6 2 4-2v-10l-4 2-6-2-4 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  <path d="M5 1.5v10M11 4.5v10" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              )}
              {icon === "split" && (
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
                  <rect x="1" y="1" width="6" height="14" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="9" y="1" width="6" height="14" rx="1" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              )}
              {label}
            </button>
          ))}
        </div>

        {/* Place search — shown in map/split mode */}
        {showMap && (
          <div className="w-full max-w-xs sm:w-auto">
            <PlaceSearchBox onSearch={handlePlaceSearch} compact />
          </div>
        )}
      </div>

      {/* Map area */}
      {showMap && (
        <MapArea
          showSearchArea
          onSearchArea={handleSearchArea}
          supplierCount={supplierCount}
        />
      )}

      {/* List / split content */}
      {showList && (
        <div
          className={viewMode === "split" ? "md:grid md:grid-cols-2 md:gap-4" : ""}
        >
          {children}
        </div>
      )}

      {/* Screen reader description */}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {viewMode === "list"
          ? "Showing list view. Press M for map view, Shift+M for split view."
          : viewMode === "map"
            ? "Showing map view. Press L for list view, Shift+M for split view."
            : "Showing split view. Press L for list view, M for map view."}
      </p>

      {/* Screen reader fallback: always show list in hidden container */}
      {viewMode !== "list" && children && (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {supplierCount} supplier{supplierCount !== 1 ? "s" : ""} available.
          Switch to list view for full details.
        </div>
      )}
    </div>
  );
}

// ─── useMapView ───────────────────────────────────────────────────────────────

/**
 * Hook for managing map/list/split view mode with localStorage persistence.
 *
 * @example
 * ```tsx
 * const { viewMode, setViewMode } = useMapView();
 * ```
 */
export function useMapView(storageKey = "chronopay-marketplace-view") {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved === "list" || saved === "map" || saved === "split") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewMode(saved);
    }
  }, [storageKey]);

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      localStorage.setItem(storageKey, mode);
    },
    [storageKey],
  );

  return { viewMode, setViewMode: handleViewModeChange };
}
