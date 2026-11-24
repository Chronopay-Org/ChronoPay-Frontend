"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  useThemeSchedule,
  readStoredScheduleConfig,
  resolveScheduledTheme,
  type ScheduleConfig,
} from "@/app/hooks/use-theme-schedule";

export type ThemeMode = "light" | "dark" | "auto" | "scheduled";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "chronopay:theme";
export const LEGACY_THEME_STORAGE_KEY = "chronopay-theme";
const MODES: ThemeMode[] = ["auto", "light", "dark", "scheduled"];

function isThemeMode(value: unknown): value is ThemeMode {
  return (
    value === "light" ||
    value === "dark" ||
    value === "auto" ||
    value === "scheduled"
  );
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

/** Resolve a user mode to a concrete color scheme. */
export function resolveTheme(
  mode: ThemeMode,
  scheduleConfig?: ScheduleConfig
): ResolvedTheme {
  if (mode === "auto") return getSystemTheme();
  if (mode === "scheduled") {
    const config = scheduleConfig ?? readStoredScheduleConfig();
    return resolveScheduledTheme(config);
  }
  return mode;
}

/** Set the `data-theme` attribute on <html>. Safe to call before hydration. */
export function applyTheme(theme: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

/** Read a persisted theme preference, falling back to "auto", migrating legacy key if present. */
export function readPersistedTheme(): ThemeMode {
  if (typeof window === "undefined") return "auto";
  try {
    const legacy = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    if (legacy && isThemeMode(legacy)) {
      if (!window.localStorage.getItem(THEME_STORAGE_KEY)) {
        window.localStorage.setItem(THEME_STORAGE_KEY, legacy);
      }
      window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
    }
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

// Global subscribers for synchronizing multiple useTheme hook instances
const listeners = new Set<() => void>();

function notifyThemeListeners() {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === LEGACY_THEME_STORAGE_KEY) {
      callback();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export const getServerSnapshot = (): ThemeMode => "auto";

export function useTheme() {
  // Read theme via useSyncExternalStore to avoid SSR/client hydration mismatch.
  // Server snapshot returns "auto", client snapshot reads localStorage.
  const mode = useSyncExternalStore(
    subscribe,
    readPersistedTheme,
    getServerSnapshot
  );

  const { config: scheduleConfig, updateConfig: updateScheduleConfig } =
    useThemeSchedule();

  // Keep <html> data-theme in sync with the current mode and schedule.
  useEffect(() => {
    applyTheme(resolveTheme(mode, scheduleConfig));
  }, [mode, scheduleConfig]);

  // In Auto mode, follow OS theme changes at runtime.
  useEffect(() => {
    if (mode !== "auto" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyTheme(resolveTheme(mode));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const changeTheme = useCallback(
    (next: ThemeMode) => {
      if (next === "scheduled" && scheduleConfig.type === "none") {
        updateScheduleConfig({ type: "custom" });
      } else if (next !== "scheduled" && scheduleConfig.type !== "none") {
        updateScheduleConfig({ type: "none" });
      }
      persistTheme(next);
      applyTheme(resolveTheme(next, scheduleConfig));
      notifyThemeListeners();
    },
    [scheduleConfig, updateScheduleConfig]
  );

  const cycleTheme = useCallback(() => {
    const idx = MODES.indexOf(mode);
    changeTheme(MODES[(idx + 1) % MODES.length]);
  }, [mode, changeTheme]);

  return {
    mode,
    resolved: resolveTheme(mode, scheduleConfig),
    changeTheme,
    cycleTheme,
    scheduleConfig,
    updateScheduleConfig,
  };
}