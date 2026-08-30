import { renderHook, act } from '@testing-library/react';
import { useOnboardingTour } from './use-onboarding-tour';

describe('useOnboardingTour', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should show tour initially when not completed', () => {
    const { result } = renderHook(() => useOnboardingTour());
    expect(result.current.tourOpen).toBe(true);
  });

  it('should hide tour after completion', () => {
    const { result } = renderHook(() => useOnboardingTour());
    
    expect(result.current.tourOpen).toBe(true);
    
    act(() => {
      result.current.completeTour();
    });
    
    expect(result.current.tourOpen).toBe(false);
  });

  it('should persist completion to localStorage', () => {
    const { result } = renderHook(() => useOnboardingTour());
    
    act(() => {
      result.current.completeTour();
    });
    
    expect(localStorage.getItem('onboarding-tour-completed')).toBe('true');
  });

  it('should restore completed state from localStorage', () => {
    localStorage.setItem('onboarding-tour-completed', 'true');
    const { result } = renderHook(() => useOnboardingTour());
    
    expect(result.current.tourOpen).toBe(false);
  });

  it('should reset tour to open state', () => {
    localStorage.setItem('onboarding-tour-completed', 'true');
    const { result } = renderHook(() => useOnboardingTour());
    
    expect(result.current.tourOpen).toBe(false);
    
    act(() => {
      result.current.resetTour();
    });
    
    expect(result.current.tourOpen).toBe(true);
    expect(localStorage.getItem('onboarding-tour-completed')).toBeNull();
  });

  it('should support custom storage key', () => {
    const { result } = renderHook(() => useOnboardingTour('custom-key'));
    
    act(() => {
      result.current.completeTour();
    });
    
    expect(localStorage.getItem('custom-key')).toBe('true');
    expect(localStorage.getItem('onboarding-tour-completed')).toBeNull();
  });
});
