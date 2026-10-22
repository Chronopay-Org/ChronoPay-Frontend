import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { KycLivenessCapture } from './kyc-liveness-capture';

describe('KycLivenessCapture', () => {
  let onCaptureComplete: jest.Mock;
  let stopMock: jest.Mock;
  let getUserMediaMock: jest.Mock;

  beforeEach(() => {
    onCaptureComplete = jest.fn();
    stopMock = jest.fn();
    getUserMediaMock = jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: stopMock }],
    });
    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: getUserMediaMock,
      },
      configurable: true,
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders initial state', () => {
    render(<KycLivenessCapture onCaptureComplete={onCaptureComplete} />);
    expect(screen.getByText('Liveness Verification')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Verification/i })).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole('button', { name: /Start Verification/i }));
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Please blink your eyes naturally.')).toBeInTheDocument();
    
    // Complete first prompt
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Turn your head slowly to the left.')).toBeInTheDocument();
    
    // Complete second
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Give us a big smile!')).toBeInTheDocument();
    
    // Complete final
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    
    expect(screen.getByText('Verification Complete')).toBeInTheDocument();
    expect(onCaptureComplete).toHaveBeenCalledWith(true);
  });

  it('fails capture if time runs out in standard mode', async () => {
    render(<KycLivenessCapture onCaptureComplete={onCaptureComplete} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Start Verification/i }));
    
    await waitFor(() => {
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    // Fast forward 11 seconds
    act(() => {
      jest.advanceTimesByTime(11000);
    });
    
    expect(screen.getByText('Verification Failed')).toBeInTheDocument();
    expect(onCaptureComplete).toHaveBeenCalledWith(false);
  });

  it('stops the camera stream on timeout', async () => {
    render(<KycLivenessCapture onCaptureComplete={onCaptureComplete} />);
    fireEvent.click(screen.getByRole('button', { name: /Start Verification/i }));

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    act(() => {
      jest.advanceTimesByTime(11000);
    });

    expect(stopMock).toHaveBeenCalled();
  });

  it('calls onCaptureComplete(false) only once on timeout', async () => {
    render(<KycLivenessCapture onCaptureComplete={onCaptureComplete} />);
    fireEvent.click(screen.getByRole('button', { name: /Start Verification/i }));

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    act(() => {
      jest.advanceTimesByTime(11000);
    });

    expect(onCaptureComplete).toHaveBeenCalledTimes(1);
    expect(onCaptureComplete).toHaveBeenCalledWith(false);
  });

  it('opens exactly one stream after timeout and retry', async () => {
    render(<KycLivenessCapture onCaptureComplete={onCaptureComplete} />);
    fireEvent.click(screen.getByRole('button', { name: /Start Verification/i }));

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
    });

    act(() => {
      jest.advanceTimesByTime(11000);
    });

    // Retry and start again.
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));
    fireEvent.click(screen.getByRole('button', { name: /Start Verification/i }));

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
    });

    // The first stream's track was stopped on timeout, so only the second stream is active.
    expect(stopMock).toHaveBeenCalled();
  });

  it('stops the camera stream on unmount', async () => {
    const { unmount } = render(<KycLivenessCapture onCaptureComplete={onCaptureComplete} />);
    fireEvent.click(screen.getByRole('button', { name: /Start Verification/i }));

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    unmount();

    expect(stopMock).toHaveBeenCalled();
  });
});
