import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useThemeSchedule, ScheduleType } from './use-theme-schedule';
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
      vi.advanceTimersByTime(60000);
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
      vi.advanceTimersByTime(60000);
    });

    // Now it should be dark
    expect(applyTheme).toHaveBeenCalledWith('dark');
  });
});
