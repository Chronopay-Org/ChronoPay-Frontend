import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardLoading from './loading';

vi.mock('../components/dashboard-shell', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  )
}));

describe('DashboardLoading', () => {
  it('renders within the DashboardShell', () => {
    render(<DashboardLoading />);
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument();
  });

  it('provides the correct accessible attributes for the loading state', () => {
    render(<DashboardLoading />);
    const statusContainer = screen.getByRole('status');
    
    expect(statusContainer).toBeInTheDocument();
    expect(statusContainer).toHaveAttribute('aria-busy', 'true');
    expect(statusContainer).toHaveAttribute('aria-live', 'polite');
    expect(statusContainer).toHaveAttribute('aria-label', 'Loading dashboard overview');
  });

  it('renders the correct number of skeleton sections in the top grid', () => {
    render(<DashboardLoading />);
    const statusContainer = screen.getByRole('status');
    
    const sections = statusContainer.querySelectorAll('section');
    expect(sections).toHaveLength(2);

    sections.forEach(section => {
      expect(section).toHaveAttribute('aria-hidden', 'true');
      expect(section).toHaveClass('glass-panel');
    });
  });

  it('renders the correct number of bottom skeleton cards', () => {
    const { container } = render(<DashboardLoading />);
    
    const bottomCards = container.querySelectorAll('.mt-6 > div');
    expect(bottomCards).toHaveLength(3);
    
    bottomCards.forEach(card => {
      expect(card).toHaveAttribute('aria-hidden', 'true');
      expect(card).toHaveClass('skeleton');
    });
  });
});
