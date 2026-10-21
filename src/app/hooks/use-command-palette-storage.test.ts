import { renderHook, act } from '@testing-library/react';
import { useCommandPaletteStorage } from './use-command-palette-storage';

describe('useCommandPaletteStorage', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should initialize with empty pinned and recent lists', () => {
    const { result } = renderHook(() => useCommandPaletteStorage());
    expect(result.current.pinned).toEqual([]);
    expect(result.current.recent).toEqual([]);
  });

  it('should load pinned and recent lists from localStorage', () => {
    localStorage.setItem('cp-pinned', JSON.stringify(['action-1']));
    localStorage.setItem('cp-recent', JSON.stringify(['action-2']));

    const { result } = renderHook(() => useCommandPaletteStorage());
    expect(result.current.pinned).toEqual(['action-1']);
    expect(result.current.recent).toEqual(['action-2']);
  });

  it('should toggle pin correctly', () => {
    const { result } = renderHook(() => useCommandPaletteStorage());
    
    act(() => {
      result.current.togglePin('action-1');
    });
    expect(result.current.pinned).toEqual(['action-1']);
    expect(localStorage.getItem('cp-pinned')).toBe(JSON.stringify(['action-1']));

    act(() => {
      result.current.togglePin('action-1');
    });
    expect(result.current.pinned).toEqual([]);
    expect(localStorage.getItem('cp-pinned')).toBe(JSON.stringify([]));
  });

  it('should track usage and keep only the last 5 items', () => {
    const { result } = renderHook(() => useCommandPaletteStorage());

    act(() => {
      result.current.trackUsage('action-1');
      result.current.trackUsage('action-2');
      result.current.trackUsage('action-3');
      result.current.trackUsage('action-4');
      result.current.trackUsage('action-5');
      result.current.trackUsage('action-6');
    });

    expect(result.current.recent).toEqual(['action-6', 'action-5', 'action-4', 'action-3', 'action-2']);
    expect(localStorage.getItem('cp-recent')).toBe(JSON.stringify(['action-6', 'action-5', 'action-4', 'action-3', 'action-2']));
  });

  it('should track usage and move used item to the top', () => {
    const { result } = renderHook(() => useCommandPaletteStorage());

    act(() => {
      result.current.trackUsage('action-1');
      result.current.trackUsage('action-2');
      result.current.trackUsage('action-1');
    });

    expect(result.current.recent).toEqual(['action-1', 'action-2']);
    expect(localStorage.getItem('cp-recent')).toBe(JSON.stringify(['action-1', 'action-2']));
  });
  
  it('should handle invalid JSON in localStorage gracefully', () => {
    localStorage.setItem('cp-pinned', '{invalid-json');
    localStorage.setItem('cp-recent', '[invalid-json');

    const { result } = renderHook(() => useCommandPaletteStorage());
    
    // Should default to empty arrays
    expect(result.current.pinned).toEqual([]);
    expect(result.current.recent).toEqual([]);
    
    // Should log errors
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to parse cp-pinned from localStorage', expect.any(Error));
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to parse cp-recent from localStorage', expect.any(Error));
  });
});
