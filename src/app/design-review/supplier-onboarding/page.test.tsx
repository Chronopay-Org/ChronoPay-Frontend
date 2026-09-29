import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import SupplierOnboardingDesignReviewPage from "./page";

describe("SupplierOnboardingDesignReviewPage", () => {
  beforeEach(() => {
    // Clear session storage since the component uses useWizardProgress
    sessionStorage.clear();
  });

  it("renders the wizard showcase and initial content", () => {
    render(<SupplierOnboardingDesignReviewPage />);
    
    expect(screen.getByRole("heading", { name: "Supplier Onboarding Wizard" })).toBeInTheDocument();
    expect(screen.getByText("Business profile")).toBeInTheDocument();
  });

  it("shows an inline validation error when attempting to proceed with invalid input", async () => {
    const user = userEvent.setup();
    render(<SupplierOnboardingDesignReviewPage />);
    
    const nextButton = screen.getByRole("button", { name: "Next" });
    await user.click(nextButton);
    
    // Validation error should appear
    expect(screen.getByRole("alert")).toHaveTextContent("Add a business name and category to continue.");
  });

  it("allows advancing to the next step when providing valid input", async () => {
    const user = userEvent.setup();
    render(<SupplierOnboardingDesignReviewPage />);
    
    // Step 1: Business Profile
    const businessNameInput = screen.getByLabelText("Business name");
    await user.type(businessNameInput, "Test Business");
    
    const categorySelect = screen.getByLabelText("Category");
    await user.selectOptions(categorySelect, "Photography");
    
    const nextButton = screen.getByRole("button", { name: "Next" });
    await user.click(nextButton);
    
    // Step 2: Verification
    // Use role and name to be more specific, since text might be found in other places
    expect(screen.getByRole("heading", { name: /Identity verification/i, level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("completes the primary state transitions through the wizard", async () => {
    const user = userEvent.setup();
    render(<SupplierOnboardingDesignReviewPage />);
    
    // Step 1: Business Profile
    await user.type(screen.getByLabelText("Business name"), "Test Business");
    await user.selectOptions(screen.getByLabelText("Category"), "Photography");
    await user.click(screen.getByRole("button", { name: "Next" }));
    
    // Step 2: Verification
    await user.click(screen.getByRole("checkbox", { name: /I confirm the uploaded documents/i }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    
    // Step 3: Payout Details
    await user.type(screen.getByLabelText("Wallet address or bank account"), "1234567890");
    await user.click(screen.getByRole("button", { name: "Next" }));
    
    // Step 4: Storefront Branding (Optional)
    const skipToggle = screen.getByRole("switch", { name: "Skip this step for now" });
    expect(skipToggle).toBeInTheDocument();
    await user.click(skipToggle);
    
    // After skipping, we can proceed
    await user.click(screen.getByRole("button", { name: "Next" }));
    
    // Step 5: Review
    expect(screen.getByRole("heading", { name: /Review & submit/i, level: 3 })).toBeInTheDocument();
    
    // Assert summary is correct
    expect(screen.getByText("Test Business")).toBeInTheDocument();
    expect(screen.getByText("Photography")).toBeInTheDocument();
    expect(screen.getByText("1234567890")).toBeInTheDocument();
    expect(screen.getByText("Skipped for now")).toBeInTheDocument();
    
    // Click Finish
    await user.click(screen.getByRole("button", { name: "Finish" }));
  });
});
