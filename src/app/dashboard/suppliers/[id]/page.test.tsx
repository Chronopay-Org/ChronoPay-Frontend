import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Page from './page';

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
  AvailabilityStrip: ({ days }: { days: any }) => <div data-testid="availability-strip" data-days={days.length}></div>,
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

describe('Supplier Page', () => {
  beforeEach(() => {
    // Reset window hash before each test
    window.location.hash = '';
  });

  it('renders successfully with valid params', () => {
    render(<Page params={{ id: '123' }} />);
    
    // Check main supplier info
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.getByText('Stellar Ecosystem Consultant')).toBeInTheDocument();
    
    // Check mocked components
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument();
    expect(screen.getByTestId('availability-strip')).toBeInTheDocument();
    expect(screen.getByTestId('reviews-panel')).toBeInTheDocument();
    expect(screen.getByTestId('supplier-policies')).toBeInTheDocument();
    
    // Check ButtonLink uses correct id
    const link = screen.getByTestId('button-link');
    expect(link).toHaveAttribute('href', '/dashboard/slots?supplier=123');
  });

  it('renders correctly with empty or invalid id', () => {
    // As per the component implementation, an empty or invalid id is just passed to the ButtonLink
    render(<Page params={{ id: '' }} />);
    const link = screen.getByTestId('button-link');
    expect(link).toHaveAttribute('href', '/dashboard/slots?supplier=');
  });

  it('has overview tab active by default', () => {
    render(<Page params={{ id: '123' }} />);
    
    const overviewTab = screen.getByRole('link', { name: /overview/i });
    const availabilityTab = screen.getByRole('link', { name: /availability/i });
    
    expect(overviewTab).toHaveAttribute('aria-current', 'page');
    expect(availabilityTab).not.toHaveAttribute('aria-current');
  });

  it('changes active tab when clicking a tab', () => {
    render(<Page params={{ id: '123' }} />);
    
    const availabilityTab = screen.getByRole('link', { name: /availability/i });
    fireEvent.click(availabilityTab);
    
    expect(availabilityTab).toHaveAttribute('aria-current', 'page');
    
    const overviewTab = screen.getByRole('link', { name: /overview/i });
    expect(overviewTab).not.toHaveAttribute('aria-current');
  });

  it('changes active tab on window hashchange event', () => {
    render(<Page params={{ id: '123' }} />);
    
    window.location.hash = '#policies';
    fireEvent(window, new Event('hashchange'));
    
    const policiesTab = screen.getByRole('link', { name: /policies/i });
    expect(policiesTab).toHaveAttribute('aria-current', 'page');
  });
  
  it('ignores invalid hash values on hashchange', () => {
    render(<Page params={{ id: '123' }} />);
    
    const overviewTab = screen.getByRole('link', { name: /overview/i });
    expect(overviewTab).toHaveAttribute('aria-current', 'page');
    
    window.location.hash = '#invalid-hash';
    fireEvent(window, new Event('hashchange'));
    
    // Should still be overview
    expect(overviewTab).toHaveAttribute('aria-current', 'page');
  });
});
