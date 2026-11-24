import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeSwitcher } from './theme-switcher';
import { useThemeSchedule } from '@/app/hooks/use-theme-schedule';
import userEvent from '@testing-library/user-event';

// Mock the hook to isolate the component
vi.mock('@/app/hooks/use-theme-schedule', () => ({
  useThemeSchedule: vi.fn(),
}));

describe('ThemeSwitcher', () => {
  const updateConfigMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useThemeSchedule).mockReturnValue({
      config: {
        type: 'none',
        lightTime: '06:00',
        darkTime: '18:00',
      },
      updateConfig: updateConfigMock,
    });
  });

  it('renders correctly with schedule disabled', () => {
    render(<ThemeSwitcher />);
    
    expect(screen.getByLabelText(/Schedule Theme/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Schedule Theme/i)).not.toBeChecked();
    
    // Inputs should not be visible
    expect(screen.queryByText(/Light Mode/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dark Mode/i)).not.toBeInTheDocument();
  });

  it('renders correctly with schedule enabled', () => {
    vi.mocked(useThemeSchedule).mockReturnValue({
      config: {
        type: 'custom',
        lightTime: '06:00',
        darkTime: '18:00',
      },
      updateConfig: updateConfigMock,
    });
    
    render(<ThemeSwitcher />);
    
    expect(screen.getByLabelText(/Schedule Theme/i)).toBeChecked();
    
    // Inputs should be visible
    expect(screen.getByText(/Light Mode/i)).toBeInTheDocument();
    expect(screen.getByText(/Dark Mode/i)).toBeInTheDocument();
    expect(screen.getByText(/Daylight Preview/i)).toBeInTheDocument();
  });

  it('toggles schedule on when checkbox is checked', async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);
    
    const checkbox = screen.getByLabelText(/Schedule Theme/i);
    await user.click(checkbox);
    
    expect(updateConfigMock).toHaveBeenCalledWith({ type: 'custom' });
  });

  it('toggles schedule off when checkbox is unchecked', async () => {
    vi.mocked(useThemeSchedule).mockReturnValue({
      config: {
        type: 'custom',
        lightTime: '06:00',
        darkTime: '18:00',
      },
      updateConfig: updateConfigMock,
    });
    const user = userEvent.setup();
    render(<ThemeSwitcher />);
    
    const checkbox = screen.getByLabelText(/Schedule Theme/i);
    await user.click(checkbox);
    
    expect(updateConfigMock).toHaveBeenCalledWith({ type: 'none' });
  });

  it('updates light time when input changes', () => {
    vi.mocked(useThemeSchedule).mockReturnValue({
      config: {
        type: 'custom',
        lightTime: '06:00',
        darkTime: '18:00',
      },
      updateConfig: updateConfigMock,
    });
    render(<ThemeSwitcher />);
    
    // Use container query to find inputs since labels don't use htmlFor
    const inputs = screen.getAllByRole('textbox', { hidden: true });
    // In React type="time" might be queried as textbox or we can just query by display value
    const lightTimeInput = screen.getByDisplayValue('06:00');
    fireEvent.change(lightTimeInput, { target: { value: '07:00' } });
    
    expect(updateConfigMock).toHaveBeenCalledWith({ lightTime: '07:00' });
  });

  it('updates dark time when input changes', () => {
    vi.mocked(useThemeSchedule).mockReturnValue({
      config: {
        type: 'custom',
        lightTime: '06:00',
        darkTime: '18:00',
      },
      updateConfig: updateConfigMock,
    });
    render(<ThemeSwitcher />);
    
    const darkTimeInput = screen.getByDisplayValue('18:00');
    fireEvent.change(darkTimeInput, { target: { value: '19:00' } });
    
    expect(updateConfigMock).toHaveBeenCalledWith({ darkTime: '19:00' });
  });

  it('handles invalid time input gracefully', () => {
    vi.mocked(useThemeSchedule).mockReturnValue({
      config: {
        type: 'custom',
        lightTime: '06:00',
        darkTime: '18:00',
      },
      updateConfig: updateConfigMock,
    });
    
    const { container } = render(<ThemeSwitcher />);
    
    const lightTimeInput = screen.getByDisplayValue('06:00');
    
    // Simulate invalid empty string input
    fireEvent.change(lightTimeInput, { target: { value: '' } });
    expect(updateConfigMock).toHaveBeenCalledWith({ lightTime: '' });

    // Simulate arbitrary invalid format
    fireEvent.change(lightTimeInput, { target: { value: 'invalid-time' } });
    expect(updateConfigMock).toHaveBeenCalledWith({ lightTime: 'invalid-time' });

    // Ensure rendering does not crash with invalid inputs (checking child preview strip behavior)
    vi.mocked(useThemeSchedule).mockReturnValue({
      config: {
        type: 'custom',
        lightTime: '',
        darkTime: 'invalid',
      },
      updateConfig: updateConfigMock,
    });
    
    // Re-render with the invalid state
    render(<ThemeSwitcher />, { container });
    // Preview strip should still be in the document
    expect(screen.getByText(/Daylight Preview/i)).toBeInTheDocument();
  });
});
