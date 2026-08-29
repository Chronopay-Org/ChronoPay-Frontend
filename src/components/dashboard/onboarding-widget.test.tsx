import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoleProvider } from "@/app/components/navigation/RoleContext";
import { OnboardingWidget } from "./onboarding-widget";

function renderWidget(initialRole: "buyer" | "supplier" | "admin" = "buyer") {
  return render(
    <RoleProvider initialRole={initialRole}>
      <OnboardingWidget />
    </RoleProvider>,
  );
}

describe("OnboardingWidget", () => {
  it("renders role-specific buyer onboarding copy by default", () => {
    renderWidget();

    expect(screen.getByText("Buyer setup guide")).toBeInTheDocument();
    expect(screen.getByText("Review open supplier slots")).toBeInTheDocument();
    expect(screen.getByText("Book your first protected session")).toBeInTheDocument();
  });

  it("renders supplier onboarding tasks when the role changes", () => {
    renderWidget("supplier");

    expect(screen.getByText("Supplier setup guide")).toBeInTheDocument();
    expect(screen.getByText("Publish your weekly availability")).toBeInTheDocument();
    expect(screen.getByText("Prepare your first supplier offer")).toBeInTheDocument();
  });

  it("updates progress when tasks are checked", () => {
    renderWidget();

    expect(screen.getByText("33%")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Mark Review open supplier slots as complete"));
    expect(screen.getByText("67%")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Mark Book your first protected session as complete"));
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("shows dismiss controls once all tasks are complete", () => {
    renderWidget();

    fireEvent.click(screen.getByLabelText("Mark Review open supplier slots as complete"));
    fireEvent.click(screen.getByLabelText("Mark Book your first protected session as complete"));

    fireEvent.click(screen.getByRole("button", { name: /dismiss widget/i }));
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirm dismiss/i }));
    expect(screen.queryByText("Buyer setup guide")).not.toBeInTheDocument();
  });
});
