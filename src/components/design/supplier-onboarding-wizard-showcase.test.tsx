import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SupplierOnboardingWizardShowcase } from "./supplier-onboarding-wizard-showcase";

describe("SupplierOnboardingWizardShowcase", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("gates the business profile step until both a non-empty business name and category are provided", async () => {
    const user = userEvent.setup();
    render(<SupplierOnboardingWizardShowcase />);

    expect(
      screen.getByRole("heading", { name: /Business profile/i, level: 3 }),
    ).toBeInTheDocument();

    // Attempt to advance with both empty
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Add a business name and category to continue.",
    );
    expect(
      screen.getByRole("heading", { name: /Business profile/i, level: 3 }),
    ).toBeInTheDocument();

    // Whitespace-only business name with valid category should still gate advancement
    await user.type(screen.getByLabelText("Business name"), "   ");
    await user.selectOptions(screen.getByLabelText("Category"), "Photography");
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Add a business name and category to continue.",
    );

    // Valid business name without category should gate advancement
    await user.clear(screen.getByLabelText("Business name"));
    await user.type(screen.getByLabelText("Business name"), "Lagos Frame Studio");
    await user.selectOptions(screen.getByLabelText("Category"), "");
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Add a business name and category to continue.",
    );

    // Selecting a valid category unlocks advancement to step 2
    await user.selectOptions(screen.getByLabelText("Category"), "Catering");
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(
      screen.getByRole("heading", { name: /Identity verification/i, level: 3 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("gates the identity verification step until documents are confirmed", async () => {
    const user = userEvent.setup();
    render(<SupplierOnboardingWizardShowcase />);

    // Complete step 1
    await user.type(screen.getByLabelText("Business name"), "Lagos Frame Studio");
    await user.selectOptions(screen.getByLabelText("Category"), "Photography");
    await user.click(screen.getByRole("button", { name: "Next" }));

    // Step 2: attempt to advance without checking confirmation
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Confirm your uploaded documents before continuing.",
    );
    expect(
      screen.getByRole("heading", { name: /Identity verification/i, level: 3 }),
    ).toBeInTheDocument();

    // Check confirmation and uncheck it to verify dynamic gating
    const checkbox = screen.getByRole("checkbox", {
      name: /I confirm the uploaded documents are accurate and current/i,
    });
    await user.click(checkbox);
    await user.click(checkbox);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Confirm your uploaded documents before continuing.",
    );

    // Check confirmation and advance to step 3
    await user.click(checkbox);
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(
      screen.getByRole("heading", { name: /Payout details/i, level: 3 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("gates the payout details and storefront branding steps until filled or skipped", async () => {
    const user = userEvent.setup();
    render(<SupplierOnboardingWizardShowcase />);

    // Step 1
    await user.type(screen.getByLabelText("Business name"), "Lagos Frame Studio");
    await user.selectOptions(screen.getByLabelText("Category"), "Venues");
    await user.click(screen.getByRole("button", { name: "Next" }));

    // Step 2
    await user.click(
      screen.getByRole("checkbox", {
        name: /I confirm the uploaded documents are accurate and current/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Next" }));

    // Step 3: Payout details — empty or whitespace-only should block advancement
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Add a payout account to continue.",
    );

    await user.type(
      screen.getByLabelText("Wallet address or bank account"),
      "   ",
    );
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Add a payout account to continue.",
    );

    await user.clear(screen.getByLabelText("Wallet address or bank account"));
    await user.type(
      screen.getByLabelText("Wallet address or bank account"),
      "GBS43E6X4Q3K7Z5N2F6T8H9J0K1L2M3N4P5Q6R7S8T9U0V1W2X3Y4Z5",
    );
    await user.click(screen.getByRole("button", { name: "Next" }));

    // Step 4: Storefront branding (optional, requires tagline or skip toggle)
    expect(
      screen.getByRole("heading", { name: /Storefront branding/i, level: 3 }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Complete the required fields to continue, or use the toggle above if this section is optional.",
    );

    // Skipping optional step allows advancing and shows "Skipped for now" in review
    await user.click(
      screen.getByRole("switch", { name: "Skip this step for now" }),
    );
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(
      screen.getByRole("heading", { name: /Review & submit/i, level: 3 }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Skipped for now").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText("Skipped for now", { selector: "dd" }),
    ).toBeInTheDocument();
  });

  it("displays all entered field values on the final review step and completes", async () => {
    const user = userEvent.setup();
    render(<SupplierOnboardingWizardShowcase />);

    // Step 1: Business profile
    await user.type(screen.getByLabelText("Business name"), "Lagos Frame Studio");
    await user.selectOptions(screen.getByLabelText("Category"), "Entertainment");
    await user.click(screen.getByRole("button", { name: "Next" }));

    // Step 2: Identity verification
    await user.click(
      screen.getByRole("checkbox", {
        name: /I confirm the uploaded documents are accurate and current/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Next" }));

    // Step 3: Payout details
    const walletAddress =
      "GBS43E6X4Q3K7Z5N2F6T8H9J0K1L2M3N4P5Q6R7S8T9U0V1W2X3Y4Z5";
    await user.type(
      screen.getByLabelText("Wallet address or bank account"),
      walletAddress,
    );
    await user.click(screen.getByRole("button", { name: "Next" }));

    // Step 4: Storefront branding — enter a tagline instead of skipping
    const taglineText = "Timeless photography for modern moments";
    await user.type(screen.getByLabelText("Tagline"), taglineText);
    await user.click(screen.getByRole("button", { name: "Next" }));

    // Step 5: Review & submit
    expect(
      screen.getByRole("heading", { name: /Review & submit/i, level: 3 }),
    ).toBeInTheDocument();

    expect(screen.getByText("Lagos Frame Studio")).toBeInTheDocument();
    expect(screen.getByText("Entertainment")).toBeInTheDocument();
    expect(screen.getByText(walletAddress)).toBeInTheDocument();
    expect(screen.getByText(taglineText)).toBeInTheDocument();

    // Finish button invokes onComplete without errors
    const finishButton = screen.getByRole("button", { name: "Finish" });
    await user.click(finishButton);
    expect(finishButton).toBeInTheDocument();
  });
});
