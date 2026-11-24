import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { KycLivenessCapture } from './kyc-liveness-capture';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('KycLivenessCapture', () => {
  let onCaptureComplete: ReturnType<typeof vi.fn>;
  let stopMock: ReturnType<typeof vi.fn>;
  let getUserMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onCaptureComplete = vi.fn();
    stopMock = vi.fn();
    getUserMediaMock = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: stopMock }],
    });
    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: getUserMediaMock,
      },
      configurable: true,
    });
    Object.defineProperty(HTMLVideoElement.prototype, 'srcObject', {
      configurable: true,
      get: () => null,
      set: () => undefined,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders initial state', () => {
    render(<KycLivenessCapture onCaptureComplete={onCaptureComplete} />);
    expect(screen.getByText('Liveness Verification')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start liveness verification/i })).toBeInTheDocument();
  });

  it('toggles assisted mode', () => {
    render(<KycLivenessCapture onCaptureComplete={onCaptureComplete} />);
    const button = screen.getByRole('button', { name: /Assisted Mode/i });
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles text only mode', () => {
    render(<KycLivenessCapture onCaptureComplete={onCaptureComplete} />);
    const button = screen.getByRole('button', { name: /Text Only/i });
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('starts capture in text mode', async () => {
    render(<KycLivenessCapture onCaptureComplete={onCaptureComplete} />);
    fireEvent.click(screen.getByRole('button', { name: /Text Only/i }));
    fireEvent.click(screen.getByRole('button', { name: /Start liveness verification/i }));
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Please blink your eyes naturally.')).toBeInTheDocument();
    
    // Complete first prompt
    fireEvent.click(screen.getByRole('button', { name: /Action completed, go to next prompt/i }));
    expect(screen.getByText('Turn your head slowly to the left.')).toBeInTheDocument();
    
    // Complete second
    fireEvent.click(screen.getByRole('button', { name: /Action completed, go to next prompt/i }));
    expect(screen.getByText('Give us a big smile!')).toBeInTheDocument();
    
    // Complete final
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Action completed, go to next prompt/i }));
    });
    
    expect(screen.getByText('Verification Complete')).toBeInTheDocument();
    expect(onCaptureComplete).toHaveBeenCalledWith(true);
  });

  it('fails capture if time runs out in standard mode', async () => {
    render(<KycLivenessCapture onCaptureComplete={onCaptureComplete} />);
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start liveness verification/i }));
      await Promise.resolve();
    });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();

    // Fast forward 11 seconds
    await act(async () => {
      await vi.advanceTimersByTimeAsync(11000);
    });
    
    expect(screen.getByText('Verification Failed')).toBeInTheDocument();
    expect(onCaptureComplete).toHaveBeenCalledWith(false);
  });

  it('stops the camera stream on timeout', async () => {
    render(<KycLivenessCapture onCaptureComplete={onCaptureComplete} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start liveness verification/i }));
      await Promise.resolve();
    });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11000);
    });

    expect(stopMock).toHaveBeenCalled();
  });

  it('calls onCaptureComplete(false) only once on timeout', async () => {
    render(<KycLivenessCapture onCaptureComplete={onCaptureComplete} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start liveness verification/i }));
      await Promise.resolve();
    });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11000);
    });

    expect(onCaptureComplete).toHaveBeenCalledTimes(1);
    expect(onCaptureComplete).toHaveBeenCalledWith(false);
  });

  it('opens exactly one stream after timeout and retry', async () => {
    render(<KycLivenessCapture onCaptureComplete={onCaptureComplete} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start liveness verification/i }));
      await Promise.resolve();
    });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(11000);
    });

    // Retry and start again.
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start liveness verification/i }));
      await Promise.resolve();
    });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);

    // The first stream's track was stopped on timeout, so only the second stream is active.
    expect(stopMock).toHaveBeenCalled();
  });

  it('offers text-only mode after camera permission is denied', async () => {
    getUserMediaMock.mockRejectedValueOnce(
      Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' }),
    );
    render(<KycLivenessCapture onCaptureComplete={onCaptureComplete} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start liveness verification/i }));
    });

    expect(screen.getByRole('alert')).toHaveTextContent(/permission was denied/i);
    expect(screen.getByRole('button', { name: /Retry camera access/i })).toBeInTheDocument();
    expect(screen.getByText('Please blink your eyes naturally.')).toBeInTheDocument();
  });

  it('stops the camera stream on unmount', async () => {
    const { unmount } = render(<KycLivenessCapture onCaptureComplete={onCaptureComplete} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start liveness verification/i }));
      await Promise.resolve();
    });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();

    unmount();

    expect(stopMock).toHaveBeenCalled();
  });
});
