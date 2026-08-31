"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "auto";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "chronopay:theme";
const MODES: ThemeMode[] = ["auto", "light", "dark"];

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "auto";
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

/** Resolve a user mode to a concrete color scheme. */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === "auto" ? getSystemTheme() : mode;
}

/** Set the `data-theme` attribute on <html>. Safe to call before hydration. */
export function applyTheme(theme: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

/** Read a persisted theme preference, falling back to "auto". */
export function readPersistedTheme(): ThemeMode {
  if (typeof window === "undefined") return "auto";
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(raw) ? raw : "auto";
  } catch {
    // localStorage unavailable (private mode / SSR) — stay on auto.
    return "auto";
  }
}

/** Persist a theme preference, best-effort. */
function persistTheme(mode: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Non-fatal: persistence is best-effort.
  }
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(readPersistedTheme);

  // Keep <html> data-theme in sync with the current mode.
  useEffect(() => {
    applyTheme(resolveTheme(mode));
  }, [mode]);

  // In Auto mode, follow OS theme changes at runtime.
  useEffect(() => {
    if (mode !== "auto" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyTheme(resolveTheme(mode));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const changeTheme = useCallback((next: ThemeMode) => {
    setMode(next);
    persistTheme(next);
  }, []);

  const cycleTheme = useCallback(() => {
    const idx = MODES.indexOf(mode);
    changeTheme(MODES[(idx + 1) % MODES.length]);
  }, [mode, changeTheme]);

  return {
    mode,
    resolved: resolveTheme(mode),
    changeTheme,
    cycleTheme,
  };
}