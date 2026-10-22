import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useThemeSchedule, ScheduleType, isDarkAt } from './use-theme-schedule';
import { applyTheme } from '@/hooks/use-theme';

vi.mock('@/hooks/use-theme', () => ({
  applyTheme: vi.fn(),
}));

describe('useThemeSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exports ScheduleType appropriately', () => {
    const none: ScheduleType = 'none';
    const sun: ScheduleType = 'sun';
    const custom: ScheduleType = 'custom';
    expect(none).toBe('none');
    expect(sun).toBe('sun');
    expect(custom).toBe('custom');
  });

  it('initializes with default config', () => {
    const { result } = renderHook(() => useThemeSchedule());

    expect(result.current.config).toEqual({
      type: 'none',
      lightTime: '06:00',
      darkTime: '18:00',
    });
  });

  it('loads config from localStorage if available', () => {
    localStorage.setItem(
      'theme-schedule',
      JSON.stringify({
        type: 'custom',
        lightTime: '07:00',
        darkTime: '19:00',
      })
    );

    const { result } = renderHook(() => useThemeSchedule());

    expect(result.current.config).toEqual({
      type: 'custom',
      lightTime: '07:00',
      darkTime: '19:00',
    });
  });

  it('handles invalid inputs gracefully in updateConfig', () => {
    const { result } = renderHook(() => useThemeSchedule());

    // Testing partial updates (e.g. invalid missing fields)
    act(() => {
      // @ts-expect-error testing invalid type
      result.current.updateConfig({ type: 'invalid' });
    });

    expect(result.current.config.type).toBe('invalid');
    expect(result.current.config.lightTime).toBe('06:00');
    expect(result.current.config.darkTime).toBe('18:00');
  });

  it('does not apply theme if type is "none"', () => {
    const { result } = renderHook(() => useThemeSchedule());

    act(() => {
      vi.advanceTimesByTime(60000);
    });

    expect(applyTheme).not.toHaveBeenCalled();
  });

  it('applies light theme during light hours', () => {
    const date = new Date('2024-01-01T12:00:00');
    vi.setSystemTime(date);

    const { result } = renderHook(() => useThemeSchedule());

    act(() => {
      result.current.updateConfig({ type: 'custom', lightTime: '06:00', darkTime: '18:00' });
    });

    expect(applyTheme).toHaveBeenCalledWith('light');
  });

  it('applies dark theme during dark hours', () => {
    const date = new Date('2024-01-01T20:00:00');
    vi.setSystemTime(date);

    const { result } = renderHook(() => useThemeSchedule());

    act(() => {
      result.current.updateConfig({ type: 'custom', lightTime: '06:00', darkTime: '18:00' });
    });

    expect(applyTheme).toHaveBeenCalledWith('dark');
  });

  describe('isDarkAt', () => {
    it('handles same-day windows at boundary minutes', () => {
      expect(isDarkAt(new Date(2024, 0, 1, 5, 59), '06:00', '18:00')).toBe(true);
      expect(isDarkAt(new Date(2024, 0, 1, 6, 0), '06:00', '18:00')).toBe(false);
      expect(isDarkAt(new Date(2024, 0, 1, 6, 1), '06:00', '18:00')).toBe(false);
      expect(isDarkAt(new Date(2024, 0, 1, 17, 59), '06:00', '18:00')).toBe(false);
      expect(isDarkAt(new Date(2024, 0, 1, 18, 0), '06:00', '18:00')).toBe(true);
      expect(isDarkAt(new Date(2024, 0, 1, 18, 1), '06:00', '18:00')).toBe(true);
    });

    it('handles inverted (overnight) windows at boundary minutes', () => {
      expect(isDarkAt(new Date(2024, 0, 1, 7, 59), '20:00', '08:00')).toBe(true);
      expect(isDarkAt(new Date(2024, 0, 1, 8, 0), '20:00', '08:00')).toBe(false);
      expect(isDarkAt(new Date(2024, 0, 1, 8, 1), '20:00', '08:00')).toBe(false);
      expect(isDarkAt(new Date(2024, 0, 1, 12, 0), '20:00', '08:00')).toBe(false);
      expect(isDarkAt(new Date(2024, 0, 1, 19, 59), '20:00', '08:00')).toBe(false);
      expect(isDarkAt(new Date(2024, 0, 1, 20, 0), '20:00', '08:00')).toBe(true);
      expect(isDarkAt(new Date(2024, 0, 1, 20, 1), '20:00', '08:00')).toBe(true);
    });

    it('treats equal light and dark times as a no-op', () => {
      expect(isDarkAt(new Date(2024, 0, 1, 0, 0), '12:00', '12:00')).toBe(false);
      expect(isDarkAt(new Date(2024, 0, 1, 12, 0), '12:00', '12:00')).toBe(false);
      expect(isDarkAt(new Date(2024, 0, 1, 23, 59), '12:00', '12:00')).toBe(false);
    });
  });

  it('falls back to defaults on corrupt storage', () => {
    localStorage.setItem('theme-schedule', '{');

    const { result } = renderHook(() => useThemeSchedule());

    expect(result.current.config).toEqual({
      type: 'none',
      lightTime: '06:00',
      darkTime: '18:00',
    });
  });

  it('falls back to defaults on partial or invalid storage', () => {
    localStorage.setItem('theme-schedule', JSON.stringify({ type: 'custom' }));

    const { result } = renderHook(() => useThemeSchedule());

    expect(result.current.config).toEqual({
      type: 'none',
      lightTime: '06:00',
      darkTime: '18:00',
    });
  });

  it('falls back to defaults on invalid time format in storage', () => {
    localStorage.setItem(
      'theme-schedule',
      JSON.stringify({ type: 'custom', lightTime: '7:00', darkTime: '19:00' })
    );

    const { result } = renderHook(() => useThemeSchedule());

    expect(result.current.config).toEqual({
      type: 'none',
      lightTime: '06:00',
      darkTime: '18:00',
    });
  });

  it('applies correct theme for inverted window', () => {
    const date = new Date('2024-01-01T12:00:00');
    vi.setSystemTime(date);

    const { result } = renderHook(() => useThemeSchedule());

    act(() => {
      result.current.updateConfig({ type: 'custom', lightTime: '20:00', darkTime: '08:00' });
    });

    expect(applyTheme).toHaveBeenCalledWith('light');
  });

  it('checks schedule periodically and updates theme on state transition', () => {
    // Start slightly before 18:00
    const date = new Date('2024-01-01T17:59:00');
    vi.setSystemTime(date);

    const { result } = renderHook(() => useThemeSchedule());

    act(() => {
      result.current.updateConfig({ type: 'custom', lightTime: '06:00', darkTime: '18:00' });
    });

    // Currently 17:59, so it should be light
    expect(applyTheme).toHaveBeenCalledWith('light');
    vi.clearAllMocks();

    // Advance 1 minute to 18:00
    act(() => {
      vi.advanceTimesByTime(60000);
    });

    // Now it should be dark
    expect(applyTheme).toHaveBeenCalledWith('dark');
  });
});
