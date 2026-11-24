import React from 'react';
import { render } from '@testing-library/react';
import RootLayout, { metadata, viewport } from '../layout';
import { DEMO_URL } from '@/lib/site-links';
import RootLayout, { metadata } from '../layout';
import Home from '../page';

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
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/app/components/ui/toast-container', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
}));
vi.mock('@/app/components/navigation/RoleContext', () => ({
  RoleProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="role-provider">{children}</div>,
}));
const mockUseMessages = vi.fn((key: string) =>
  key === 'common.skipToContent' ? 'Localized skip link' : key,
);

vi.mock('@/lib/i18n', () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="i18n-provider">{children}</div>,
  useMessages: () => mockUseMessages,
}));

describe('RootLayout', () => {
  describe('metadata', () => {
    it('provides the correct default metadata', () => {
      expect(metadata).toBeDefined();
      expect(metadata.title).toBe('ChronoPay - Time Economy');
      expect(metadata.description).toBe('Tokenize and trade human time on the Stellar network.');
      expect(metadata.metadataBase).toBeInstanceOf(URL);
      expect(metadata.metadataBase?.href).toBe(new URL(DEMO_URL).href);
      expect(metadata.openGraph).toEqual({
        title: 'ChronoPay - Time Economy',
        description: 'Tokenize and trade human time on the Stellar network.',
        type: 'website',
      });
      expect(metadata.twitter).toEqual({
        card: 'summary_large_image',
        title: 'ChronoPay - Time Economy',
        description: 'Tokenize and trade human time on the Stellar network.',
      });
    });

    it('provides a viewport export with themeColor', () => {
      expect(viewport).toBeDefined();
      expect(viewport.themeColor).toBe('#07111f');
    });

    it('contains no empty-result paths for critical metadata', () => {
      // Validating against failure or empty-result path
      expect(metadata.title).not.toBe('');
      expect(metadata.title).not.toBeNull();
      expect(metadata.description).not.toBe('');
      expect(metadata.description).not.toBeNull();
      expect(metadata.metadataBase).not.toBeNull();
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.twitter).toBeDefined();
      expect(viewport.themeColor).not.toBe('');
      expect(viewport.themeColor).not.toBeNull();
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
    it('renders the home page with one global header and navigation landmark', () => {
      const { container } = render(
        <RootLayout>
          <Home />
        </RootLayout>
      );

      expect(container.querySelectorAll('header')).toHaveLength(1);
      expect(container.querySelectorAll('nav')).toHaveLength(1);
      expect(container.querySelectorAll('main#main-content')).toHaveLength(1);
      expect(container.querySelectorAll('h1')).toHaveLength(1);
    });

    it('handles missing or empty children gracefully (boundary behavior)', () => {
      const { container } = render(
        <RootLayout>
          {null}
        </RootLayout>
      );
      
      const htmlElement = container.querySelector('html') || document.querySelector('html');
      expect(htmlElement).not.toBeNull();
      expect(htmlElement).toHaveAttribute('lang', 'en');
    });
  });
});
