import { render, screen } from '@testing-library/react';
import { UptimeCell } from './UptimeCell';
import { UptimeCellProps } from './uptime.types';
import userEvent from '@testing-library/user-event';
import React from 'react';

const mockIncidents = [
  { id: '1', title: 'Issue 1', summary: 'test issue', severity: 'minor' as const, startedAt: '2026-07-28T01:00:00Z' }
];

describe('UptimeCell', () => {
  const defaultProps: UptimeCellProps = {
    date: '2026-07-28',
    uptimePercent: 99.9,
    incidents: [],
  };

  it('renders successfully with default props', () => {
    render(<UptimeCell {...defaultProps} />);
    const cell = screen.getByRole('img', { name: /July 28, 2026: 99.9% uptime, no incidents/i });
    expect(cell).toBeInTheDocument();
    
    // Also check the visible formatted date string below
    expect(screen.getByText('Jul 28')).toBeInTheDocument();
  });

  it('handles rendering with 1 incident', () => {
    render(<UptimeCell {...defaultProps} incidents={mockIncidents} />);
    const cell = screen.getByRole('img', { name: /1 incident/i });
    expect(cell).toBeInTheDocument();
  });

  it('handles rendering with multiple incidents', () => {
    const multiIncidents = [
      ...mockIncidents,
      { id: '2', title: 'Issue 2', summary: 'test 2', severity: 'major' as const, startedAt: '2026-07-28T02:00:00Z' }
    ];
    render(<UptimeCell {...defaultProps} incidents={multiIncidents} />);
    const cell = screen.getByRole('img', { name: /2 incidents/i });
    expect(cell).toBeInTheDocument();
  });

  describe('interactions and state transitions', () => {
    it('shows tooltip on mouse enter and hides on mouse leave', async () => {
      const user = userEvent.setup();
      render(<UptimeCell {...defaultProps} />);
      const cell = screen.getByRole('img');
      
      await user.hover(cell);
      expect(cell.getAttribute('aria-describedby')).toBeTruthy();
      
      await user.unhover(cell);
      expect(cell.getAttribute('aria-describedby')).toBeFalsy();
    });

    it('shows tooltip on focus and hides on blur', async () => {
      render(<UptimeCell {...defaultProps} />);
      const cell = screen.getByRole('img');
      
      cell.focus();
      expect(cell.getAttribute('aria-describedby')).toBeTruthy();
      
      cell.blur();
      expect(cell.getAttribute('aria-describedby')).toBeFalsy();
    });

    it('hides tooltip on Escape key press', async () => {
      const user = userEvent.setup();
      render(<UptimeCell {...defaultProps} />);
      const cell = screen.getByRole('img');
      
      cell.focus();
      expect(cell.getAttribute('aria-describedby')).toBeTruthy();
      
      await user.keyboard('{Escape}');
      expect(cell.getAttribute('aria-describedby')).toBeFalsy();
    });
  });

  describe('invalid inputs and boundary behavior', () => {
    it('handles null uptimePercent gracefully', () => {
      // @ts-expect-error testing null boundary
      render(<UptimeCell {...defaultProps} uptimePercent={null} />);
      const cell = screen.getByRole('img', { name: /null% uptime/i });
      expect(cell).toBeInTheDocument();
    });

    it('handles invalid date input deterministically', () => {
      render(<UptimeCell {...defaultProps} date="invalid-date" />);
      const cell = screen.getByRole('img');
      expect(cell).toHaveAttribute('aria-label', expect.stringContaining('Invalid Date'));
      expect(screen.getAllByText('Invalid Date').length).toBeGreaterThan(0);
    });
  });
});
