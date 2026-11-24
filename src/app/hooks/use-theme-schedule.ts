import { useState, useEffect, useCallback } from 'react';
import { applyTheme } from '@/hooks/use-theme';

export type ScheduleType = 'none' | 'sun' | 'custom';

export interface ScheduleConfig {
  type: ScheduleType;
  lightTime: string;
  darkTime: string;
}

export const THEME_SCHEDULE_STORAGE_KEY = 'theme-schedule';

const DEFAULT_CONFIG: ScheduleConfig = {
  type: 'none',
  lightTime: '06:00',
  darkTime: '18:00',
};

const SUN_LIGHT_TIME = '06:00';
const SUN_DARK_TIME = '18:00';

const TIME_REGEX_RE = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
const VALID_TYPES = new Set<ScheduleType>(['none', 'sun', 'custom']);

function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_REGEX_RE.test(value);
}

export function parseStoredConfig(raw: string | null): ScheduleConfig {
  if (!raw) return { ...DEFAULT_CONFIG };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_CONFIG };
    const { type, lightTime, darkTime } = parsed as Record<string, unknown>;
    if (typeof type !== 'string' || !VALID_TYPES.has(type as ScheduleType)) {
      return { ...DEFAULT_CONFIG };
    }
    if (!isValidTime(lightTime) || !isValidTime(darkTime)) {
      return { ...DEFAULT_CONFIG };
    }
    return { type: type as ScheduleType, lightTime, darkTime };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function readStoredScheduleConfig(): ScheduleConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_CONFIG };
  try {
    return parseStoredConfig(window.localStorage.getItem(THEME_SCHEDULE_STORAGE_KEY));
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function resolveScheduledTheme(
  config: ScheduleConfig,
  now: Date = new Date()
): 'light' | 'dark' {
  const lightTime = config.type === 'sun' ? SUN_LIGHT_TIME : config.lightTime;
  const darkTime = config.type === 'sun' ? SUN_DARK_TIME : config.darkTime;
  return isDarkAt(now, lightTime, darkTime) ? 'dark' : 'light';
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function isDarkAt(now: Date, lightTime: string, darkTime: string): boolean {
  const current = now.getHours() * 60 + now.getMinutes();
  const light = toMinutes(lightTime);
  const dark = toMinutes(darkTime);

  if (light === dark) return false;

  // Same-day window: light begins before dark (e.g. 06:00 -> 18:00).
  if (light < dark) {
    return current >= dark || current < light;
  }

  // Overnight window: light begins later in the day (e.g. 20:00 -> 08:00).
  return current >= dark && current < light;
}

const scheduleListeners = new Set<(next: ScheduleConfig) => void>();

function notifyScheduleListeners(next: ScheduleConfig) {
  scheduleListeners.forEach((listener) => listener(next));
}

export function useThemeSchedule() {
  const [config, setConfig] = useState<ScheduleConfig>(() => readStoredScheduleConfig());

  useEffect(() => {
    const handleUpdate = (next: ScheduleConfig) => {
      setConfig(next);
    };
    scheduleListeners.add(handleUpdate);
    return () => {
      scheduleListeners.delete(handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (config.type === 'none') return;

    const checkSchedule = () => {
      applyTheme(resolveScheduledTheme(config, new Date()));
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [config]);

  const updateConfig = useCallback((newConfig: Partial<ScheduleConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...newConfig };
      try {
        localStorage.setItem(THEME_SCHEDULE_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable (e.g. Safari private mode, quota); ignore.
      }
      notifyScheduleListeners(next);
      return next;
    });
  }, []);

  return { config, updateConfig };
}
