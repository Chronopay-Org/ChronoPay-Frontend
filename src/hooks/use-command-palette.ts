/**
 * useCommandPalette — state management for the command palette.
 *
 * Provides:
 *   - Open / close / toggle
 *   - Query state with derived filtered+ranked results
 *   - Keyboard shortcut (Cmd+K / Ctrl+K)
 *   - Global toggle to disable route-aware ranking
 *   - Command execution (navigates to the command href)
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { COMMANDS, rankCommands, type RankedCommand } from "@/lib/commands";

export interface UseCommandPaletteReturn {
  isOpen: boolean;
  query: string;
  activeIndex: number;
  isGlobal: boolean;
  results: RankedCommand[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (q: string) => void;
  setActiveIndex: (idx: number | ((prev: number) => number)) => void;
  toggleGlobal: () => void;
  executeCommand: (command: RankedCommand) => void;
}

export function useCommandPalette(): UseCommandPaletteReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isGlobal, setIsGlobal] = useState(false);
  const pathname = usePathname();
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Debounced pathname — avoids flash of re-ranked results during route changes
  const [rankPathname, setRankPathname] = useState(pathname);
  useEffect(() => {
    const timer = setTimeout(() => setRankPathname(pathname), 80);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Derived ranked results
  const results = rankCommands(COMMANDS, query, rankPathname, isGlobal);

  // ── Open / close ──────────────────────────────────────────────────────────

  const open = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setIsOpen(true);
    setQuery("");
    setActiveIndex(-1);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(-1);
    // Restore focus to the element that opened the palette
    requestAnimationFrame(() => {
      previousFocusRef.current?.focus();
    });
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        previousFocusRef.current = document.activeElement as HTMLElement;
        setQuery("");
      }
      return !prev;
    });
    setActiveIndex(-1);
  }, []);

  // ── Global mode toggle ────────────────────────────────────────────────────

  const toggleGlobal = useCallback(() => {
    setIsGlobal((prev) => !prev);
    setActiveIndex(-1);
  }, []);

  // ── Command execution ─────────────────────────────────────────────────────

  const executeCommand = useCallback(
    (command: RankedCommand) => {
      close();
      // Use the Next.js router for SPA navigation
      window.location.href = command.href;
    },
    [close],
  );

  // ── Global keyboard shortcut ──────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  // ── Focus trap: prevent Tab from escaping while open ─────────────────────

  useEffect(() => {
    if (!isOpen) return;

    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      // The palette's own input handles up/down/enter/escape;
      // we prevent Tab from leaving the dialog entirely.
      e.preventDefault();
    };

    document.addEventListener("keydown", handleTabTrap);
    return () => document.removeEventListener("keydown", handleTabTrap);
  }, [isOpen]);

  return {
    isOpen,
    query,
    activeIndex,
    isGlobal,
    results,
    open,
    close,
    toggle,
    setQuery,
    setActiveIndex,
    toggleGlobal,
    executeCommand,
  };
}