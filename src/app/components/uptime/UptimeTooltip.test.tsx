import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UptimeTooltip } from './UptimeTooltip';
import { Incident } from './uptime.types';

// Mock requestAnimationFrame and cancelAnimationFrame
const originalRAF = global.requestAnimationFrame;
const originalCAF = global.cancelAnimationFrame;

describe('UptimeTooltip', () => {
  let triggerElement: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers();
    global.requestAnimationFrame = (callback) => {
      callback(0);
      return 1;
    };
    global.cancelAnimationFrame = vi.fn();

    triggerElement = document.createElement('div');
    // Mock getBoundingClientRect
    triggerElement.getBoundingClientRect = vi.fn(() => ({
      top: 200,
      left: 200,
      right: 250,
      bottom: 250,
      width: 50,
      height: 50,
      x: 200,
      y: 200,
      toJSON: () => {}
    }));
    document.body.appendChild(triggerElement);
  });

  afterEach(() => {
    vi.useRealTimers();
    global.requestAnimationFrame = originalRAF;
    global.cancelAnimationFrame = originalCAF;
    document.body.innerHTML = '';
  });

  const mockIncidents: Incident[] = [
    {
      id: '1',
      title: 'Database Outage',
      summary: 'The main database went down due to high load.',
      severity: 'critical',
      startedAt: '2023-10-01T10:00:00Z'
    },
    {
      id: '2',
      title: 'API Latency',
      summary: 'High latency observed in payment API. ' + 'a'.repeat(150),
      severity: 'major',
      startedAt: '2023-10-01T12:00:00Z'
    },
    {
      id: '3',
      title: 'Minor Glitch',
      summary: 'Minor UI glitch on dashboard.',
      severity: 'minor',
      startedAt: '2023-10-01T14:00:00Z'
    }
  ];

  it('renders correctly with no incidents', () => {
    const onDismiss = vi.fn();
    render(
      <UptimeTooltip
        tooltipId="test-tooltip"
        triggerElement={triggerElement}
        date="2023-10-01"
        uptimePercent={100}
        incidents={[]}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('No incidents')).toBeInTheDocument();
    // Check formatted date
    expect(screen.getByText(/Oct 1, 2023/i)).toBeInTheDocument();
  });

  it('renders correctly with incidents and truncates long summaries', () => {
    render(
      <UptimeTooltip
        tooltipId="test-tooltip"
        triggerElement={triggerElement}
        date="2023-10-01"
        uptimePercent={98.5}
        incidents={mockIncidents}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText('3 Incidents')).toBeInTheDocument();
    expect(screen.getByText('Database Outage')).toBeInTheDocument();
    expect(screen.getByText('API Latency')).toBeInTheDocument();
    
    // Check truncation
    const truncatedText = 'High latency observed in payment API. ' + 'a'.repeat(62) + '...';
    expect(screen.getByText(truncatedText)).toBeInTheDocument();
    
    // Check severities are rendered
    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.getByText('major')).toBeInTheDocument();
    expect(screen.getByText('minor')).toBeInTheDocument();
  });

  it('handles invalid date input gracefully', () => {
    render(
      <UptimeTooltip
        tooltipId="test-tooltip"
        triggerElement={triggerElement}
        date="invalid-date"
        uptimePercent={0}
        incidents={[]}
        onDismiss={vi.fn()}
      />
    );
    
    expect(screen.getByText('Invalid Date')).toBeInTheDocument();
  });

  it('calls onDismiss when Escape key is pressed', () => {
    const onDismiss = vi.fn();
    render(
      <UptimeTooltip
        tooltipId="test-tooltip"
        triggerElement={triggerElement}
        date="2023-10-01"
        uptimePercent={100}
        incidents={[]}
        onDismiss={onDismiss}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onDismiss).toHaveBeenCalledTimes(1); // not called again
  });

  it('calculates position correctly when space is available above', () => {
    render(
      <UptimeTooltip
        tooltipId="test-tooltip"
        triggerElement={triggerElement}
        date="2023-10-01"
        uptimePercent={100}
        incidents={[]}
        onDismiss={vi.fn()}
      />
    );
    
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('animate-slideUp');
    // top = triggerRect.top(200) - 160 - 8 = 32
    expect(tooltip).toHaveStyle('top: 32px');
  });

  it('calculates position correctly when space is NOT available above', () => {
    triggerElement.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      left: 200,
      right: 250,
      bottom: 150,
      width: 50,
      height: 50,
      x: 200,
      y: 100,
      toJSON: () => {}
    }));

    render(
      <UptimeTooltip
        tooltipId="test-tooltip"
        triggerElement={triggerElement}
        date="2023-10-01"
        uptimePercent={100}
        incidents={[]}
        onDismiss={vi.fn()}
      />
    );
    
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('animate-slideDown');
    // bottom pos = triggerRect.bottom(150) + margin(8) = 158
    expect(tooltip).toHaveStyle('top: 158px');
  });

  it('renders nothing initially if triggerElement is null', () => {
    render(
      <UptimeTooltip
        tooltipId="test-tooltip"
        triggerElement={null}
        date="2023-10-01"
        uptimePercent={100}
        incidents={[]}
        onDismiss={vi.fn()}
      />
    );

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('animate-slideDown');
    expect(tooltip).toHaveStyle('top: 0px');
  });
});
