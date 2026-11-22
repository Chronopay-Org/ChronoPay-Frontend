import React, { type ReactElement, type ReactNode } from "react";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import { ToastProvider } from "@/hooks/use-toast";
import { ToastContainer } from "@/app/components/ui/toast-container";
import { RoleProvider } from "@/app/components/navigation/RoleContext";
import { I18nProvider } from "@/lib/i18n";
import type { UserRole } from "@/app/components/navigation/routes";

export interface AppProvidersProps {
  children: ReactNode;
  initialRole?: UserRole;
  withToastContainer?: boolean;
}

/**
 * Shared provider wrapper matching the application's root layout providers
 * (ToastProvider, I18nProvider, RoleProvider) for multi-component tests.
 */
export function AppProviders({
  children,
  initialRole = "buyer",
  withToastContainer = true,
}: AppProvidersProps) {
  return (
    <ToastProvider>
      <I18nProvider>
        <RoleProvider initialRole={initialRole}>
          {children}
          {withToastContainer ? <ToastContainer /> : null}
        </RoleProvider>
      </I18nProvider>
    </ToastProvider>
  );
}

export interface RenderWithProvidersOptions
  extends Omit<RenderOptions, "wrapper"> {
  initialRole?: UserRole;
  withToastContainer?: boolean;
}

/**
 * Renders a React element wrapped in ChronoPay's shared application providers.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderResult {
  const {
    initialRole = "buyer",
    withToastContainer = true,
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AppProviders
        initialRole={initialRole}
        withToastContainer={withToastContainer}
      >
        {children}
      </AppProviders>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from "@testing-library/react";
