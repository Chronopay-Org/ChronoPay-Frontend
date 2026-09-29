import React from 'react';
import { render } from '@testing-library/react';
import RootLayout, { metadata } from '../layout';

import { vi } from 'vitest';

// Mock dependencies to avoid complex context setup errors in tests
vi.mock('@/hooks/use-toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="toast-provider">{children}</div>,
}));
vi.mock('@/app/components/ui/toast-container', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
}));
vi.mock('@/app/components/navigation/RoleContext', () => ({
  RoleProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="role-provider">{children}</div>,
}));
vi.mock('@/lib/i18n', () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="i18n-provider">{children}</div>,
}));

describe('RootLayout', () => {
  describe('metadata', () => {
    it('provides the correct default metadata', () => {
      expect(metadata).toBeDefined();
      expect(metadata.title).toBe('ChronoPay - Time Economy');
      expect(metadata.description).toBe('Tokenize and trade human time on the Stellar network.');
    });

    it('contains no empty-result paths for critical metadata', () => {
      // Validating against failure or empty-result path
      expect(metadata.title).not.toBe('');
      expect(metadata.title).not.toBeNull();
      expect(metadata.description).not.toBe('');
      expect(metadata.description).not.toBeNull();
    });
  });

  describe('component rendering', () => {
    it('exercises the default lang and dir branch evidence', () => {
      const { container } = render(
        <RootLayout>
          <div data-testid="child-content">Content</div>
        </RootLayout>
      );
      
      const htmlElement = container.querySelector('html');
      expect(htmlElement).not.toBeNull();
      // Assert the branch evidence: defaults to 'en' and 'ltr'
      expect(htmlElement).toHaveAttribute('lang', 'en');
      expect(htmlElement).toHaveAttribute('dir', 'ltr');
    });

    it('renders the children normally within providers', () => {
      const { getByTestId, getByText } = render(
        <RootLayout>
          <div data-testid="child-content">Content</div>
        </RootLayout>
      );
      
      expect(getByTestId('child-content')).toBeInTheDocument();
      expect(getByText('Content')).toBeInTheDocument();
      expect(getByTestId('toast-provider')).toBeInTheDocument();
      expect(getByTestId('i18n-provider')).toBeInTheDocument();
      expect(getByTestId('role-provider')).toBeInTheDocument();
    });

    it('handles missing or empty children gracefully (boundary behavior)', () => {
      const { container } = render(
        <RootLayout>
          {null}
        </RootLayout>
      );
      
      const htmlElement = container.querySelector('html');
      expect(htmlElement).toBeInTheDocument();
      expect(htmlElement).toHaveAttribute('lang', 'en');
    });
  });
});
