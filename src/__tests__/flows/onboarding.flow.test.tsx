import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test-utils/render";
import {
  SupplierOnboardingWizard,
  type SupplierOnboardingStep,
} from "@/components/dashboard/supplier-onboarding-wizard";
import { ServicesStep } from "@/components/dashboard/services-step";
import {
  PayoutStep,
  type PayoutConsent,
  type PayoutCurrency,
  type PayoutPreview,
} from "@/components/dashboard/payout-step";
import type { ServiceItem } from "@/components/dashboard/types";

const STORAGE_KEY = "test:supplier-onboarding-flow";

const DEMO_PREVIEW: PayoutPreview = {
  walletAddress:
    "GBS43E6X4Q3K7Z5N2F6T8H9J0K1L2M3N4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7",
  walletLabel: "Freighter Wallet",
  network: "Stellar",
};

interface OnboardingFlowHarnessProps {
  initialItems?: ServiceItem[];
  onServicesSaved?: (items: ServiceItem[]) => void;
  onPayoutSaved?: (currency: PayoutCurrency, consent: PayoutConsent) => void;
  onComplete?: () => void;
}

function OnboardingFlowHarness({
  initialItems = [],
  onServicesSaved,
  onPayoutSaved,
  onComplete,
}: OnboardingFlowHarnessProps) {
  const [savedServices, setSavedServices] = useState<ServiceItem[]>(initialItems);
  const [servicesSaved, setServicesSaved] = useState(initialItems.length > 0);
  const [payoutSaved, setPayoutSaved] = useState(false);

  const handleSaveServices = async (items: ServiceItem[]) => {
    setSavedServices(items);
    setServicesSaved(items.length > 0);
    onServicesSaved?.(items);
  };

  const handleSavePayout = async (
    currency: PayoutCurrency,
    consent: PayoutConsent,
  ) => {
    setPayoutSaved(true);
    onPayoutSaved?.(currency, consent);
  };

  const steps: SupplierOnboardingStep[] = [
    {
      id: "services",
      title: "Services & pricing",
      description: "Define the time-based services buyers can book.",
      isComplete: servicesSaved && savedServices.length > 0,
      errorMessage: "Save at least one valid service before continuing.",
      content: (
        <ServicesStep
          initialItems={savedServices}
          draftStatus={servicesSaved ? "saved" : "offline"}
          onSave={handleSaveServices}
        />
      ),
    },
    {
      id: "payout",
      title: "Payout account",
      description: "Choose your preferred payout currency and confirm consent.",
      isComplete: payoutSaved,
      errorMessage: "Complete and save your payout settings to finish.",
      content: (
        <PayoutStep
          preview={DEMO_PREVIEW}
          onSave={handleSavePayout}
          draftStatus={payoutSaved ? "saved" : "offline"}
        />
      ),
    },
  ];

  return (
    <SupplierOnboardingWizard
      steps={steps}
      storageKey={STORAGE_KEY}
      onComplete={onComplete}
    />
  );
}

describe("Supplier onboarding flow (services -> payout)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("blocks advancing until services are saved, persists progress, and completes payout", async () => {
    const user = userEvent.setup();
    const onServicesSaved = vi.fn();
    const onPayoutSaved = vi.fn();
    const onComplete = vi.fn();

    renderWithProviders(
      <OnboardingFlowHarness
        onServicesSaved={onServicesSaved}
        onPayoutSaved={onPayoutSaved}
        onComplete={onComplete}
      />,
      { initialRole: "supplier" },
    );

    // Step 1 starts empty and blocks advancing
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Save at least one valid service before continuing.",
    );

    // Add a service and fill out valid fields
    await user.click(screen.getByTestId("services-step-empty-add"));

    const titleInput = screen.getByLabelText(/service title/i);
    const priceInput = screen.getByTestId("services-step-price");
    const durationInput = screen.getByTestId("services-step-duration");

    await user.clear(titleInput);
    await user.type(titleInput, "Architecture review");
    await user.clear(priceInput);
    await user.type(priceInput, "150");
    await user.clear(durationInput);
    await user.type(durationInput, "60");

    // Save services draft
    await user.click(screen.getByTestId("services-step-save"));

    await waitFor(() => {
      expect(onServicesSaved).toHaveBeenCalledTimes(1);
    });
    expect(onServicesSaved.mock.calls[0][0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Architecture review",
          basePriceXLM: 150,
          durationMinutes: 60,
        }),
      ]),
    );

    // Advance to Step 2 (Payout)
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Payout account", level: 3 }),
    ).toBeInTheDocument();

    // Verify wizard progress persisted in sessionStorage
    const persisted = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(persisted).toMatchObject({
      currentIndex: 1,
      furthestIndex: 1,
    });

    // Configure payout currency and accept consent
    await user.click(screen.getByRole("radio", { name: /USDC/i }));
    await user.click(
      screen.getByRole("checkbox", { name: /I agree to the payout terms/i }),
    );
    await user.click(screen.getByRole("link", { name: /Save & continue/i }));

    await waitFor(() => {
      expect(onPayoutSaved).toHaveBeenCalledWith(
        "USDC",
        expect.objectContaining({
          accepted: true,
          acceptedAt: expect.any(Date),
        }),
      );
    });

    // Finish onboarding wizard
    await user.click(screen.getByRole("button", { name: "Finish" }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("restores persisted progress from sessionStorage across remounts and supports navigating back", async () => {
    const user = userEvent.setup();
    const seedItems: ServiceItem[] = [
      {
        id: "svc-1",
        title: "Product strategy call",
        description: "60-minute roadmap session.",
        basePriceXLM: 120,
        durationMinutes: 60,
      },
    ];

    const firstRender = renderWithProviders(
      <OnboardingFlowHarness initialItems={seedItems} />,
      { initialRole: "supplier" },
    );

    // Advance to Step 2
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();

    // Unmount and remount to verify sessionStorage persistence
    firstRender.unmount();

    renderWithProviders(<OnboardingFlowHarness initialItems={seedItems} />, {
      initialRole: "supplier",
    });

    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Payout account/i }),
    ).toHaveAttribute("aria-current", "step");

    // Navigate back to Step 1 and verify furthestIndex stays at 1
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();

    const persisted = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(persisted).toMatchObject({
      currentIndex: 0,
      furthestIndex: 1,
    });
  });
});
