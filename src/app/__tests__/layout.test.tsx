import React from 'react';
import { render } from '@testing-library/react';
import RootLayout, { metadata, viewport, themeInitScript } from '../layout';
import { DEMO_URL } from '@/lib/site-links';
import RootLayout, { metadata } from '../layout';
import Home from '../page';
import RootLayout, { metadata, densityInitScript } from '../layout';

import { vi, beforeEach, afterEach } from 'vitest';

const mockHeadersGet = vi.fn<(name: string) => string | null>(() => 'test-nonce-123');
const mockCookiesGet = vi.fn<(name: string) => { name: string; value: string } | undefined>(() => undefined);

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get: mockHeadersGet,
  })),
  cookies: vi.fn(async () => ({
    get: mockCookiesGet,
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
  I18nProvider: ({
    children,
    locale,
  }: {
    children: React.ReactNode;
    locale?: string;
  }) => (
    <div data-testid="i18n-provider" data-locale={locale ?? 'en'}>
      {children}
    </div>
  ),
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

  describe('density init script', () => {
    const runDensityScript = (stored: string | null) => {
      document.documentElement.removeAttribute('data-density');
      const getItem = vi.fn(() => stored);
      vi.stubGlobal('localStorage', { getItem });
      // eslint-disable-next-line no-new-func
      new Function(densityInitScript)();
      return document.documentElement.dataset.density;
    };

    afterEach(() => {
      vi.unstubAllGlobals();
      document.documentElement.removeAttribute('data-density');
    });

    it('does not contain the dead empty try block', () => {
      expect(densityInitScript).not.toContain('try{}catch');
    });

    it.each(['comfortable', 'compact', 'balanced'])('applies valid density "%s"', (value) => {
      expect(runDensityScript(value)).toBe(value);
    });

    it.each(['', 'cozy', 'COMFORTABLE', 'null'])('ignores invalid stored value "%s"', (value) => {
      expect(runDensityScript(value)).toBeUndefined();
    });

    it('ignores when nothing is stored', () => {
      expect(runDensityScript(null)).toBeUndefined();
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
      mockCookiesGet.mockReturnValue(undefined);

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
      expect(htmlElement).toHaveAttribute('dir', 'ltr');
    });

    it('sets lang="ar" and dir="rtl" when the locale cookie is "ar"', async () => {
      mockHeadersGet.mockReturnValue('test-nonce-123');
      mockCookiesGet.mockReturnValue({ name: 'locale', value: 'ar' });

      const ui = await RootLayout({
        children: <div data-testid="child-content">Content</div>,
      });
      const { container, getByTestId } = render(ui);

      const htmlElement = container.querySelector('html') || document.querySelector('html');
      expect(htmlElement).toHaveAttribute('lang', 'ar');
      expect(htmlElement).toHaveAttribute('dir', 'rtl');
      expect(getByTestId('i18n-provider')).toHaveAttribute('data-locale', 'ar');
    });

    it('falls back to lang="en" and dir="ltr" when the locale cookie is unsupported', async () => {
      mockHeadersGet.mockReturnValue('test-nonce-123');
      mockCookiesGet.mockReturnValue({ name: 'locale', value: 'xx' });

      const ui = await RootLayout({
        children: <div data-testid="child-content">Content</div>,
      });
      const { container, getByTestId } = render(ui);

      const htmlElement = container.querySelector('html') || document.querySelector('html');
      expect(htmlElement).toHaveAttribute('lang', 'en');
      expect(htmlElement).toHaveAttribute('dir', 'ltr');
      expect(getByTestId('i18n-provider')).toHaveAttribute('data-locale', 'en');
    });
  });

  describe('themeInitScript', () => {
    beforeEach(() => {
      window.localStorage.clear();
      document.documentElement.removeAttribute('data-theme');
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('migrates legacy chronopay-theme key to chronopay:theme and applies theme before hydration', () => {
      window.localStorage.setItem('chronopay-theme', 'light');

      new Function(themeInitScript)();

      expect(window.localStorage.getItem('chronopay:theme')).toBe('light');
      expect(window.localStorage.getItem('chronopay-theme')).toBeNull();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('resolves scheduled mode using theme-schedule boundaries without flash on reload', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 0, 1, 21, 0, 0));

      window.localStorage.setItem('chronopay:theme', 'scheduled');
      window.localStorage.setItem(
        'theme-schedule',
        JSON.stringify({ type: 'custom', lightTime: '06:00', darkTime: '18:00' })
      );

      new Function(themeInitScript)();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      vi.setSystemTime(new Date(2024, 0, 1, 10, 0, 0));
      new Function(themeInitScript)();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });
});
