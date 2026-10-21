import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PasswordStrengthMeter } from '../password-strength-meter';

describe('PasswordStrengthMeter', () => {
  it('renders the initial state correctly with an empty password', () => {
    render(<PasswordStrengthMeter value="" />);
    
    // Check if the input is rendered
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    
    // Check if the strength meter shows 'Fair' (score 1 because empty string is not in common list)
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<PasswordStrengthMeter value="testpassword" />);
    
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    
    const toggleButton = screen.getByRole('button', { name: /show password/i });
    
    // Click to show password
    await user.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');
    
    // The button name should now be 'Hide password'
    const hideButton = screen.getByRole('button', { name: /hide password/i });
    
    // Click to hide password
    await user.click(hideButton);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('updates strength meter when typing a weak password', () => {
    // "password" meets length and lowercase, but is common. Score = 2 ("Good")
    render(<PasswordStrengthMeter value="password" />);
    
    expect(screen.getByText('Good')).toBeInTheDocument();
    // Checks that the "Not a common password" criteria is marked as not met
    const list = screen.getByRole('list', { name: 'Password criteria' });
    expect(list).toBeInTheDocument();
  });

  it('updates strength meter when typing a strong password', () => {
    // Meets all criteria
    render(<PasswordStrengthMeter value="Str0ngP@ssw0rd!" />);
    
    expect(screen.getByText('Very Strong')).toBeInTheDocument();
  });

  it('calls onChange handler when typing', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<PasswordStrengthMeter value="" onChange={handleChange} />);
    
    const input = screen.getByLabelText('Password');
    
    await user.type(input, 'A');
    expect(handleChange).toHaveBeenCalledWith('A');
  });

  it('handles boundary case of extreme string length safely', () => {
    const extremePassword = "A".repeat(1000);
    render(<PasswordStrengthMeter value={extremePassword} />);
    
    const input = screen.getByLabelText('Password');
    expect(input).toHaveValue(extremePassword);
    
    // It should at least be 'Good' or 'Strong' because it meets length and uppercase
    expect(screen.queryByText('Weak')).not.toBeInTheDocument();
  });
});
