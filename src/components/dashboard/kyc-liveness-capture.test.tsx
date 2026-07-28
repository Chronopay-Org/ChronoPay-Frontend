import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { KycLivenessCapture } from './kyc-liveness-capture';

describe('KycLivenessCapture', () => {
  let onCaptureComplete: jest.Mock;

  beforeEach(() => {
    onCaptureComplete = jest.fn();
    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{ stop: jest.fn() }]
        })
      },
      configurable: true
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
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
      jest.advanceTimersByTime(11000);
    });
    
    expect(screen.getByText('Verification Failed')).toBeInTheDocument();
    expect(onCaptureComplete).toHaveBeenCalledWith(false);
  });
});
