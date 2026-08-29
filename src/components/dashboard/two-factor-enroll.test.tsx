import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TwoFactorEnroll from './two-factor-enroll';

describe('TwoFactorEnroll', () => {
  it('renders intro step initially', () => {
    render(<TwoFactorEnroll />);
    expect(screen.getByText('Set Up Two-Factor Authentication')).toBeInTheDocument();
    expect(screen.getByText('Begin Setup')).toBeInTheDocument();
  });

  it('navigates through the happy path', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<TwoFactorEnroll onComplete={onComplete} />);

    // Intro -> QR
    await user.click(screen.getByText('Begin Setup'));
    expect(screen.getByText('SCAN QR CODE WITH AUTHENTICATOR APP')).toBeInTheDocument();

    // QR -> Verify
    await user.click(screen.getByText('I Have Scanned It'));
    expect(screen.getByText('Enter the 6-digit code from your authenticator app')).toBeInTheDocument();

    // Verify -> Recovery
    const input = screen.getByPlaceholderText('000000');
    await user.type(input, '123456');
    const verifyButton = screen.getByText('Verify Code');
    expect(verifyButton).not.toBeDisabled();
    await user.click(verifyButton);

    expect(screen.getByText('Save Your Recovery Key')).toBeInTheDocument();

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();

    // Recovery -> Success
    await user.click(screen.getByText('Download Recovery Key'));
    expect(screen.getByText('2FA Enabled Successfully')).toBeInTheDocument();

    // Success -> Complete
    await user.click(screen.getByText('Return to Settings'));
    expect(onComplete).toHaveBeenCalled();
  });

  it('disables verify button if code is incomplete', async () => {
    const user = userEvent.setup();
    render(<TwoFactorEnroll />);

    // Intro -> QR -> Verify
    await user.click(screen.getByText('Begin Setup'));
    await user.click(screen.getByText('I Have Scanned It'));

    const input = screen.getByPlaceholderText('000000');
    await user.type(input, '123');
    
    const verifyButton = screen.getByText('Verify Code');
    expect(verifyButton).toBeDisabled();
  });

  it('filters non-numeric characters in verification code input', async () => {
    const user = userEvent.setup();
    render(<TwoFactorEnroll />);

    // Intro -> QR -> Verify
    await user.click(screen.getByText('Begin Setup'));
    await user.click(screen.getByText('I Have Scanned It'));

    const input = screen.getByPlaceholderText('000000') as HTMLInputElement;
    await user.type(input, '1a2b3c4d5e6');
    
    expect(input.value).toBe('123456');
  });
});
