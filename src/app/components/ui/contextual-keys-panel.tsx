"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Keyboard } from "lucide-react";
import { clsx } from "clsx";

// Types
export interface Shortcut {
  keys: string[];
  description: string;
}

// Mock metadata - in a real app, this might come from a context or a more robust route config
const ROUTE_SHORTCUTS: Record<string, Shortcut[]> = {
  "/dashboard/orders": [
    { keys: ["f"], description: "Filter orders" },
    { keys: ["n"], description: "New order" },
  ],
  "/dashboard/settings": [
    { keys: ["s"], description: "Save changes" },
  ],
};

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-slate-300">{shortcut.description}</span>
      <div className="flex gap-1">
        {shortcut.keys.map((k, i) => (
          <kbd
            key={i}
            className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-mono font-medium rounded-md bg-slate-800 border border-slate-700 text-slate-200 shadow-sm"
          >
            {k.toUpperCase()}
          </kbd>
        ))}
      </div>
    </div>
  );
}

export function ContextualKeysPanel() {
  const pathname = usePathname();
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Basic prefix matching for demo purposes
    const matchedPath = Object.keys(ROUTE_SHORTCUTS).find(path => pathname?.startsWith(path));
    if (matchedPath) {
      setShortcuts(ROUTE_SHORTCUTS[matchedPath]);
      setIsOpen(true);
    } else {
      setShortcuts([]);
      setIsOpen(false);
    }
  }, [pathname]);

  if (shortcuts.length === 0) return null;

  return (
    <div 
      className={clsx(
        "mb-4 overflow-hidden rounded-xl border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-md",
        "transition-all duration-300 ease-in-out"
      )}
      role="region"
      aria-label="Keys on this page"
    >
      <div className="flex items-center gap-2 px-4 py-3 bg-cyan-950/40 border-b border-cyan-500/20">
        <Keyboard className="w-4 h-4 text-cyan-400" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-cyan-50 tracking-wide">
          Keys on this page
        </h3>
        <span 
          role="status" 
          aria-live="polite" 
          className="sr-only"
        >
          {isOpen ? `Contextual keys panel available with ${shortcuts.length} shortcuts.` : ""}
        </span>
      </div>
      
      <div className="px-4 py-2">
        {shortcuts.map((s, idx) => (
          <ShortcutRow key={idx} shortcut={s} />
        ))}
      </div>
    </div>
  );
}
