import React from 'react';
import { render } from '@testing-library/react';
import RootLayout, { metadata } from '../layout';

import { vi } from 'vitest';

const mockHeadersGet = vi.fn<(name: string) => string | null>(() => 'test-nonce-123');

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get: mockHeadersGet,
  })),
}));

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
    it('exercises the default lang and dir branch evidence and binds both inline scripts to the CSP nonce', async () => {
      mockHeadersGet.mockReturnValue('test-nonce-123');

      const ui = await RootLayout({
        children: <div data-testid="child-content">Content</div>,
      });
      const { container } = render(ui);
      
      const htmlElement = container.querySelector('html') || document.querySelector('html');
      expect(htmlElement).not.toBeNull();
      expect(htmlElement).toHaveAttribute('lang', 'en');
      expect(htmlElement).toHaveAttribute('dir', 'ltr');

      const scripts = Array.from(document.querySelectorAll('script'));
      const themeScript = scripts.find((s) => s.textContent?.includes('chronopay:theme'));
      const densityScript = scripts.find((s) => s.textContent?.includes('chronopay-density'));

      expect(themeScript).toBeDefined();
      expect(densityScript).toBeDefined();
      expect(themeScript).toHaveAttribute('nonce', 'test-nonce-123');
      expect(densityScript).toHaveAttribute('nonce', 'test-nonce-123');
    });

    it('renders the children normally within providers', async () => {
      const ui = await RootLayout({
        children: <div data-testid="child-content">Content</div>,
      });
      const { getByTestId, getByText } = render(ui);
      
      expect(getByTestId('child-content')).toBeInTheDocument();
      expect(getByText('Content')).toBeInTheDocument();
      expect(getByTestId('toast-provider')).toBeInTheDocument();
      expect(getByTestId('i18n-provider')).toBeInTheDocument();
      expect(getByTestId('role-provider')).toBeInTheDocument();
    });

    it('handles missing or empty children gracefully (boundary behavior)', async () => {
      mockHeadersGet.mockReturnValue(null);

      const ui = await RootLayout({
        children: null,
      });
      const { container } = render(ui);
      
      const htmlElement = container.querySelector('html') || document.querySelector('html');
      expect(htmlElement).not.toBeNull();
      expect(htmlElement).toHaveAttribute('lang', 'en');
    });
  });
});
