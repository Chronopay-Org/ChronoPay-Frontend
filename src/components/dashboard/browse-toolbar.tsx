"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, List } from "lucide-react";

export function useViewMode(storageKey = "supplier-view-mode") {
  const [viewMode, setViewMode] = useState<"grid" | "compact-list">(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "grid" || saved === "compact-list") {
        return saved;
      }
    } catch {
      // localStorage may be unavailable
    }
    return "grid";
  });

  const toggleViewMode = (mode: "grid" | "compact-list") => {
    setViewMode(mode);
    localStorage.setItem(storageKey, mode);
  };

  return { viewMode, toggleViewMode };
}

interface BrowseToolbarProps {
  viewMode: "grid" | "compact-list";
  onViewModeChange: (mode: "grid" | "compact-list") => void;
}

/**
 * BrowseToolbar provides controls for the marketplace browsing experience,
 * including a toggle for the compact-list view variant optimized for accessibility.
 */
export function BrowseToolbar({ viewMode, onViewModeChange }: BrowseToolbarProps) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
      <h2 className="text-lg font-medium text-slate-200 mr-auto">Browse Suppliers</h2>
      
      <div 
        role="group" 
        aria-label="View mode" 
        className="flex items-center rounded-lg border border-white/10 bg-white/5 p-1"
      >
        <button
          type="button"
          aria-label="Grid view"
          aria-pressed={viewMode === "grid"}
          onClick={() => onViewModeChange("grid")}
          className={`p-1.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
            viewMode === "grid" 
              ? "bg-white/10 text-white shadow-sm" 
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <LayoutGrid className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Compact list view"
          aria-pressed={viewMode === "compact-list"}
          onClick={() => onViewModeChange("compact-list")}
          className={`p-1.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
            viewMode === "compact-list" 
              ? "bg-white/10 text-white shadow-sm" 
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <List className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
