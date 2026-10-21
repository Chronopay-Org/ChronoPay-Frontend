import { renderHook, act } from '@testing-library/react';
import { useWallet, __test_resetWalletState, __test_setWalletState } from './useWallet';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useWallet', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Ensure state and subscribers are completely reset before each test
    __test_resetWalletState();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should initialize with disconnected status', () => {
    const { result } = renderHook(() => useWallet());
    expect(result.current.status).toBe('disconnected');
    expect(result.current.address).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('should transition to loading and then connected on valid connect call', () => {
    const { result } = renderHook(() => useWallet());
    
    act(() => {
      result.current.connect();
    });

    expect(result.current.status).toBe('loading');

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(result.current.status).toBe('connected');
    expect(result.current.address).toBe('0x12a4F9b3c7D8e9A1fB2C');
  });

  it('should prevent multiple concurrent connections (boundary behavior)', () => {
    const { result } = renderHook(() => useWallet());
    
    act(() => {
      result.current.connect();
    });

    expect(result.current.status).toBe('loading');

    // Calling connect again while loading should return early and not throw
    act(() => {
      result.current.connect();
    });

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(result.current.status).toBe('connected');
  });

  it('should handle disconnect properly', () => {
    const { result } = renderHook(() => useWallet());
    
    act(() => {
      result.current.connect();
      vi.advanceTimersByTime(700);
    });
    
    expect(result.current.status).toBe('connected');

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.status).toBe('disconnected');
    expect(result.current.address).toBeUndefined();
  });

  it('should propagate external error state deterministically', () => {
    const { result } = renderHook(() => useWallet());
    
    act(() => {
      __test_setWalletState({
        status: 'error',
        error: 'Network timeout',
      });
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Network timeout');
  });

  it('should correctly synchronize state across multiple consumer instances', () => {
    const { result: hook1 } = renderHook(() => useWallet());
    const { result: hook2 } = renderHook(() => useWallet());

    act(() => {
      hook1.current.connect();
    });

    // Both should be in loading state
    expect(hook1.current.status).toBe('loading');
    expect(hook2.current.status).toBe('loading');

    act(() => {
      vi.advanceTimersByTime(700);
    });

    // Both should be in connected state
    expect(hook1.current.status).toBe('connected');
    expect(hook1.current.address).toBe('0x12a4F9b3c7D8e9A1fB2C');
    expect(hook2.current.status).toBe('connected');
    expect(hook2.current.address).toBe('0x12a4F9b3c7D8e9A1fB2C');
  });
});
