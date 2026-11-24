import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FormattersDocsPage from './page';
import { formatCurrency, formatDate, formatNumber } from '@/lib/formatters';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('FormattersDocsPage', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the en-US formatter examples and back link without console errors', () => {
    const now = new Date('2024-06-15T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<FormattersDocsPage />);

    expect(screen.getByText(formatNumber(1234567.89, 'en-US'))).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(1234567.89, 'USD', 'en-US'))).toBeInTheDocument();
    expect(
      screen.getByText(formatDate(now, 'en-US', { dateStyle: 'full' })),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Back to Review' })).toHaveAttribute(
      'href',
      '/design-review',
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
