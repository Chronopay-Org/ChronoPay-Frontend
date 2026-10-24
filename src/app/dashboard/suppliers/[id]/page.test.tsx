import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notFound } from 'next/navigation';
import Page from './page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

// Mock components to simplify testing
vi.mock('../../../components/dashboard-shell', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-shell">{children}</div>,
}));

vi.mock('@/components/dashboard/panel-shell', () => ({
  PanelShell: ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div data-testid="panel-shell" data-title={title}>{children}</div>
  ),
}));

vi.mock('@/components/dashboard/availability-strip', () => ({
  AvailabilityStrip: ({ days }: { days: readonly unknown[] }) => <div data-testid="availability-strip" data-days={days.length}></div>,
}));

vi.mock('@/components/dashboard/reviews-panel', () => ({
  ReviewsPanel: () => <div data-testid="reviews-panel"></div>,
}));

vi.mock('@/components/dashboard/supplier-policies', () => ({
  SupplierPolicies: () => <div data-testid="supplier-policies"></div>,
}));

vi.mock('@/app/components/ui/button-link', () => ({
  ButtonLink: ({ href, children }: { href: string, children: React.ReactNode }) => (
    <a href={href} data-testid="button-link">{children}</a>
  ),
}));

// params is a Promise in Next 16 — always hand the page a resolved one.
const paramsFor = (id: string): Promise<{ id: string }> => Promise.resolve({ id });

// The page unwraps params with use(), so the first render suspends; flush it.
const renderPage = async (id: string) => {
  await act(async () => {
    render(<Page params={paramsFor(id)} />);
  });
};

describe('Supplier Page', () => {
  beforeEach(() => {
    // Reset window hash and navigation mocks before each test
    window.location.hash = '';
    vi.clearAllMocks();
  });

  it('renders the supplier matching the route id from a resolved params Promise', async () => {
    await renderPage('sarah-jenkins');

    // Heading + identity come from the fixture, not a hard-coded profile
    const heading = await screen.findByRole('heading', { level: 1, name: /sarah jenkins/i });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText('Lead Product Architect')).toBeInTheDocument();
    expect(screen.getByText('SJ')).toBeInTheDocument();
    expect(screen.getByText('Remote · GMT-5')).toBeInTheDocument();

    // Stats rendered from the fixture map
    expect(screen.getByText('Tokenized Hours')).toBeInTheDocument();
    expect(screen.getByText('142h')).toBeInTheDocument();
    expect(screen.getByText('4.9/5')).toBeInTheDocument();

    // Check mocked components
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument();
    expect(screen.getByTestId('availability-strip')).toBeInTheDocument();
    expect(screen.getByTestId('reviews-panel')).toBeInTheDocument();
    expect(screen.getByTestId('supplier-policies')).toBeInTheDocument();

    // Calendar link carries the resolved supplier id
    const link = screen.getByTestId('button-link');
    expect(link).toHaveAttribute('href', '/dashboard/slots?supplier=sarah-jenkins');
    expect(link).toHaveTextContent(/view full calendar/i);
  });

  it('renders a different supplier for a different id', async () => {
    await renderPage('marcus-vance');

    await screen.findByRole('heading', { level: 1, name: /marcus vance/i });
    expect(screen.getByText('Principal UX Designer')).toBeInTheDocument();
    expect(screen.getByTestId('button-link')).toHaveAttribute(
      'href',
      '/dashboard/slots?supplier=marcus-vance',
    );
  });

  it('calls notFound for an unknown id and renders no profile', async () => {
    await renderPage('does-not-exist');

    await waitFor(() => expect(notFound).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId('dashboard-shell')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('calls notFound for an empty id', async () => {
    await renderPage('');

    await waitFor(() => expect(notFound).toHaveBeenCalledTimes(1));
  });

  it('has overview tab active by default', async () => {
    await renderPage('sarah-jenkins');

    const overviewTab = await screen.findByRole('link', { name: /overview/i });
    const availabilityTab = screen.getByRole('link', { name: /availability/i });

    expect(overviewTab).toHaveAttribute('aria-current', 'page');
    expect(availabilityTab).not.toHaveAttribute('aria-current');
  });

  it('changes active tab when clicking a tab', async () => {
    await renderPage('sarah-jenkins');

    const availabilityTab = await screen.findByRole('link', { name: /availability/i });
    fireEvent.click(availabilityTab);

    expect(availabilityTab).toHaveAttribute('aria-current', 'page');

    const overviewTab = screen.getByRole('link', { name: /overview/i });
    expect(overviewTab).not.toHaveAttribute('aria-current');
  });

  it('changes active tab on window hashchange event', async () => {
    await renderPage('sarah-jenkins');

    await screen.findByRole('link', { name: /overview/i });
    window.location.hash = '#policies';
    fireEvent(window, new Event('hashchange'));

    const policiesTab = screen.getByRole('link', { name: /policies/i });
    expect(policiesTab).toHaveAttribute('aria-current', 'page');
  });

  it('ignores invalid hash values on hashchange', async () => {
    await renderPage('sarah-jenkins');

    const overviewTab = await screen.findByRole('link', { name: /overview/i });
    expect(overviewTab).toHaveAttribute('aria-current', 'page');

    window.location.hash = '#invalid-hash';
    fireEvent(window, new Event('hashchange'));

    // Should still be overview
    expect(overviewTab).toHaveAttribute('aria-current', 'page');
  });
});
