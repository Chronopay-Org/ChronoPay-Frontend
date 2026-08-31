import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatusPage from "@/app/status/page";

describe("StatusPage", () => {
  it("renders the public status overview and key sections", () => {
    render(<StatusPage />);

    expect(
      screen.getByRole("heading", { name: /ChronoPay system health/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Platform health matrix/i)).toBeInTheDocument();
    expect(screen.getByText(/90-day uptime/i)).toBeInTheDocument();
    expect(screen.getByText(/Incidents/i)).toBeInTheDocument();
  });

  it("includes an accessible operational badge and status summary", () => {
    render(<StatusPage />);

    const badge = screen.getByRole("status");
    expect(badge).toHaveTextContent(/Operational/i);
    expect(screen.getByText(/Marketplace services, escrow workflows, and the Stellar network/i)).toBeInTheDocument();
  });
});
