import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { NotificationPreferencesPanel } from "./notification-preferences-panel";

describe("NotificationPreferencesPanel", () => {
  it("renders notification categories and quiet hours controls", () => {
    render(<NotificationPreferencesPanel />);

    expect(screen.getByText("Notification preferences")).toBeInTheDocument();
    expect(screen.getAllByText("Disputes").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Start time")).toBeInTheDocument();
    expect(screen.getByLabelText("End time")).toBeInTheDocument();
  });

  it("toggles a channel preference and announces save state", () => {
    render(<NotificationPreferencesPanel />);

    const smsSwitch = screen.getAllByRole("switch", {
      name: /bookings notifications via sms/i,
    })[0];

    expect(smsSwitch).toHaveAttribute("aria-checked", "false");
    fireEvent.click(smsSwitch);
    expect(smsSwitch).toHaveAttribute("aria-checked", "true");

    fireEvent.click(screen.getByRole("button", { name: /save preferences/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/notification preferences saved/i);
  });

  it("disables quiet-hours inputs when quiet hours are off", () => {
    render(<NotificationPreferencesPanel />);

    const quietHoursSwitch = screen.getByRole("switch", {
      name: /enable quiet hours/i,
    });
    fireEvent.click(quietHoursSwitch);

    expect(screen.getByLabelText("Start time")).toBeDisabled();
    expect(screen.getByLabelText("End time")).toBeDisabled();
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(<NotificationPreferencesPanel />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
