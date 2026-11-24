import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { PayoutStepShowcase } from "./payout-step-showcase";

function getStateCard(label: string): HTMLElement {
  const heading = screen.getByRole("heading", { name: label });
  const card = heading.closest("div.space-y-3");
  if (!card) {
    throw new Error(`Could not find state card for "${label}"`);
  }
  return card as HTMLElement;
}

describe("PayoutStepShowcase", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders all showcase state cards and accessibility notes", () => {
    render(<PayoutStepShowcase />);

    expect(
      screen.getByRole("heading", { name: "Idle — default form" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Pending — saving in progress" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Success — payouts configured" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Error — connection failure" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "No wallet — no payout preview" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Accessibility notes")).toBeInTheDocument();
  });

  it("toggles the pending state when clicking 'Simulate save (3s delay)'", async () => {
    const user = userEvent.setup();
    render(<PayoutStepShowcase />);

    const pendingCard = getStateCard("Pending — saving in progress");

    const simulateBtn = within(pendingCard).getByRole("button", {
      name: /Simulate save \(3s delay\)/i,
    });
    expect(simulateBtn).toBeInTheDocument();
    expect(
      within(pendingCard).getByRole("link", { name: /Save & continue/i }),
    ).toBeInTheDocument();

    // Consent alert is shown while idle and unchecked
    expect(within(pendingCard).getByRole("alert")).toHaveTextContent(
      "You must agree to the payout terms before saving.",
    );

    await user.click(simulateBtn);

    // Toggle button hides and PayoutStep renders in pending status ("Saving…" with aria-busy)
    expect(
      within(pendingCard).queryByRole("button", {
        name: /Simulate save \(3s delay\)/i,
      }),
    ).not.toBeInTheDocument();

    const savingLink = within(pendingCard).getByRole("link", {
      name: /Saving…/i,
    });
    expect(savingLink).toHaveAttribute("aria-disabled", "true");
    expect(savingLink).toHaveAttribute("aria-busy", "true");
  });

  it("renders the success state region, toggles showSuccess via save, and resets to idle", async () => {
    const user = userEvent.setup();
    render(<PayoutStepShowcase />);

    const successCard = getStateCard("Success — payouts configured");

    // Verify initial success message region and reset button
    expect(
      within(successCard).getByRole("heading", { name: "Payouts configured" }),
    ).toBeInTheDocument();
    expect(
      within(successCard).getByText("Payouts active"),
    ).toBeInTheDocument();
    expect(
      within(successCard).getByText(
        /Your payout account is ready to receive funds\./i,
      ),
    ).toBeInTheDocument();

    const resetBtn = within(successCard).getByRole("button", {
      name: /Reset to idle/i,
    });
    await user.click(resetBtn);
    expect(
      within(successCard).getByRole("heading", { name: "Payouts configured" }),
    ).toBeInTheDocument();

    // Trigger interactive transition to success via the Idle card
    const idleCard = getStateCard("Idle — default form");
    const consentCheckbox = within(idleCard).getByRole("checkbox", {
      name: /I agree to the payout terms/i,
    });

    // Unchecked initially shows role="alert"
    expect(within(idleCard).getByRole("alert")).toHaveTextContent(
      "You must agree to the payout terms before saving.",
    );

    await user.click(consentCheckbox);
    expect(within(idleCard).queryByRole("alert")).not.toBeInTheDocument();

    await user.click(
      within(idleCard).getByRole("link", { name: /Save & continue/i }),
    );

    // Idle card transitions to the success message region
    expect(
      within(idleCard).getByRole("heading", { name: "Payouts configured" }),
    ).toBeInTheDocument();
    expect(within(idleCard).getByText("Payouts active")).toBeInTheDocument();

    // Can reset back to the idle form via "Edit settings"
    await user.click(
      within(idleCard).getByRole("link", { name: /Edit settings/i }),
    );
    expect(
      within(idleCard).getByRole("link", { name: /Save & continue/i }),
    ).toBeInTheDocument();
  });

  it("renders the error state message region, supports role='alert' validation, and can be reset", async () => {
    const user = userEvent.setup();
    render(<PayoutStepShowcase />);

    const errorCard = getStateCard("Error — connection failure");

    // Verify error message region
    expect(
      within(errorCard).getByRole("heading", {
        name: "Could not save payout settings",
      }),
    ).toBeInTheDocument();
    expect(
      within(errorCard).getByText("Connection issue"),
    ).toBeInTheDocument();
    expect(
      within(errorCard).getByText(
        "Connection timed out. Please check your wallet and try again.",
      ),
    ).toBeInTheDocument();

    // Click Reset to idle button in Error card
    const resetBtn = within(errorCard).getByRole("button", {
      name: /Reset to idle/i,
    });
    await user.click(resetBtn);
    expect(
      within(errorCard).getByText(
        "Connection timed out. Please check your wallet and try again.",
      ),
    ).toBeInTheDocument();

    // Also verify the No wallet card renders its alert and can toggle consent
    const noWalletCard = getStateCard("No wallet — no payout preview");
    const alert = within(noWalletCard).getByRole("alert");
    expect(alert).toHaveTextContent(
      "You must agree to the payout terms before saving.",
    );

    const checkbox = within(noWalletCard).getByRole("checkbox", {
      name: /I agree to the payout terms/i,
    });
    await user.click(checkbox);
    expect(within(noWalletCard).queryByRole("alert")).not.toBeInTheDocument();

    // Reset checkbox back to unchecked and confirm role="alert" reappears
    await user.click(checkbox);
    expect(within(noWalletCard).getByRole("alert")).toHaveTextContent(
      "You must agree to the payout terms before saving.",
    );
  });
});
