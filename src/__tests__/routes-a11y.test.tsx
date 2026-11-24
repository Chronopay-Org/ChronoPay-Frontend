import React, { Suspense } from "react";
import { render, act, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ToastProvider } from "@/hooks/use-toast";
import { I18nProvider } from "@/lib/i18n";
import { RoleProvider } from "@/app/components/navigation/RoleContext";
import { expectNoA11yViolations } from "@/test/axe";

// Mock next/navigation for client components using router/searchParams/pathname/redirect
const mockRedirect = vi.fn();
const mockNotFound = vi.fn();
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  redirect: (...args: unknown[]) => mockRedirect(...args),
  notFound: (...args: unknown[]) => mockNotFound(...args),
}));

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

// Pages
import HomePage from "@/app/page";
import AdminUsersPage from "@/app/admin/users/page";
import DashboardPage from "@/app/dashboard/page";
import PayoutOnboardingPage from "@/app/dashboard/onboarding/payout/page";
import ServicesOnboardingPage from "@/app/dashboard/onboarding/services/page";
import SettingsPage from "@/app/dashboard/settings/page";
import SlotsIndexPage from "@/app/dashboard/slots/page";
import SlotDetailPage from "@/app/dashboard/slots/[id]/page";
import SharedReceiptPage from "@/app/dashboard/slots/[id]/receipt/page";
import SupplierDetailPage from "@/app/dashboard/suppliers/[id]/page";
import DesignReviewPage from "@/app/design-review/page";
import FocusTrapTesterPage from "@/app/design-review/focus-trap/page";
import FormattersDocsPage from "@/app/design-review/formatters/page";
import PayoutStepDesignReviewPage from "@/app/design-review/payout-step/page";
import SupplierOnboardingDesignReviewPage from "@/app/design-review/supplier-onboarding/page";
import DesignSystemComponentsPage from "@/app/design-system/components/page";
import DesignSystemTokensPage from "@/app/design-system/tokens/page";
import DesignTokensPage from "@/app/design-tokens/page";
import MarketplacePage from "@/app/marketplace/page";
import ListingDetailPage from "@/app/marketplace/[id]/page";
import PricingPage from "@/app/pricing/page";
import StatusPage from "@/app/status/page";

function TestProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <I18nProvider>
        <RoleProvider initialRole="buyer">{children}</RoleProvider>
      </I18nProvider>
    </ToastProvider>
  );
}

async function renderRouteWithProviders(ui: React.ReactElement) {
  let container!: HTMLElement;
  await act(async () => {
    const rendered = render(
      <TestProviders>
        <Suspense fallback={<div>Loading route...</div>}>{ui}</Suspense>
      </TestProviders>,
    );
    container = rendered.container;
  });
  return container;
}

describe("Route Matrix Accessibility (jest-axe)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    // Mark role onboarding as already seen so modal dialog doesn't obscure page content during route audit
    localStorage.setItem("chronopay:role-onboarded", "true");
    localStorage.setItem("chronopay_onboarding_tour_completed", "true");
    localStorage.setItem("chronopay_walkthrough_dismissed", "true");
    localStorage.setItem("chronopay-marketplace-visited", "true");
  });

  it("src/app/page.tsx (/) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<HomePage />);
    await expectNoA11yViolations(container);
  });

  it("src/app/admin/users/page.tsx (/admin/users) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<AdminUsersPage />);
    await expectNoA11yViolations(container);
  });

  it("src/app/dashboard/page.tsx (/dashboard) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<DashboardPage />);
    await expectNoA11yViolations(container);
  }, 15000);

  it("src/app/dashboard/onboarding/payout/page.tsx (/dashboard/onboarding/payout) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<PayoutOnboardingPage />);
    await expectNoA11yViolations(container);
  });

  it("src/app/dashboard/onboarding/services/page.tsx (/dashboard/onboarding/services) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<ServicesOnboardingPage />);
    await expectNoA11yViolations(container);
  });

  it("src/app/dashboard/settings/page.tsx (/dashboard/settings) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<SettingsPage />);
    // Wait for dynamic SettingsPanel to load if applicable
    await screen.findByRole("heading", { name: /settings/i, level: 1 }, { timeout: 5000 });
    await expectNoA11yViolations(container);
  }, 15000);

  it("src/app/dashboard/slots/page.tsx (/dashboard/slots) redirects and has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<SlotsIndexPage />);
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    await expectNoA11yViolations(container);
  });

  it("src/app/dashboard/slots/[id]/page.tsx (/dashboard/slots/[id]) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(
      <SlotDetailPage params={Promise.resolve({ id: "slot-1" })} />,
    );
    await expectNoA11yViolations(container);
  });

  it("src/app/dashboard/slots/[id]/receipt/page.tsx (/dashboard/slots/[id]/receipt) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(
      <SharedReceiptPage
        params={Promise.resolve({ id: "slot-1" })}
        searchParams={Promise.resolve({
          asset: "Product strategy call (1.5h)",
          tx: "GA7Q...K2XD",
          buyer: "A.R.",
          seller: "S.J.",
          total: "50.00 XLM",
          settled: "2026-04-01 11:30 UTC",
        })}
      />,
    );
    await expectNoA11yViolations(container);
  });

  it("src/app/dashboard/suppliers/[id]/page.tsx (/dashboard/suppliers/[id]) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(
      <SupplierDetailPage params={{ id: "supplier-1" }} />,
    );
    await expectNoA11yViolations(container);
  });

  it("src/app/design-review/page.tsx (/design-review) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<DesignReviewPage />);
    await expectNoA11yViolations(container);
  }, 15000);

  it("src/app/design-review/focus-trap/page.tsx (/design-review/focus-trap) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<FocusTrapTesterPage />);
    await expectNoA11yViolations(container);
  });

  it("src/app/design-review/formatters/page.tsx (/design-review/formatters) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<FormattersDocsPage />);
    await expectNoA11yViolations(container);
  });

  it("src/app/design-review/payout-step/page.tsx (/design-review/payout-step) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<PayoutStepDesignReviewPage />);
    await expectNoA11yViolations(container);
  });

  it("src/app/design-review/supplier-onboarding/page.tsx (/design-review/supplier-onboarding) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<SupplierOnboardingDesignReviewPage />);
    await expectNoA11yViolations(container);
  });

  it("src/app/design-system/components/page.tsx (/design-system/components) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<DesignSystemComponentsPage />);
    await expectNoA11yViolations(container);
  });

  it("src/app/design-system/tokens/page.tsx (/design-system/tokens) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<DesignSystemTokensPage />);
    await expectNoA11yViolations(container);
  });

  it("src/app/design-tokens/page.tsx (/design-tokens) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<DesignTokensPage />);
    await expectNoA11yViolations(container);
  });

  it("src/app/marketplace/page.tsx (/marketplace) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<MarketplacePage />);
    await expectNoA11yViolations(container);
  });

  it("src/app/marketplace/[id]/page.tsx (/marketplace/[id]) has no accessibility violations", async () => {
    const element = await ListingDetailPage({
      params: Promise.resolve({ id: "demo-1" }),
    });
    const container = await renderRouteWithProviders(element);
    await expectNoA11yViolations(container);
  });

  it("src/app/pricing/page.tsx (/pricing) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<PricingPage />);
    await expectNoA11yViolations(container);
  });

  it("src/app/status/page.tsx (/status) has no accessibility violations", async () => {
    const container = await renderRouteWithProviders(<StatusPage />);
    await expectNoA11yViolations(container);
  }, 15000);
});
