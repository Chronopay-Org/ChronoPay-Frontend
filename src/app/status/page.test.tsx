import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StatusPage from "./page";

describe("StatusPage", () => {
  it("renders the header and main headings", () => {
    render(<StatusPage />);
    
    // Header
    expect(screen.getByText(/ChronoPay/i, { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText("System status")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to app/i })).toBeInTheDocument();

    // Main Content
    expect(screen.getByRole("heading", { name: /ChronoPay system health/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Operational")).toBeInTheDocument();
  });

  it("renders the 90-day summary statistics", () => {
    render(<StatusPage />);
    expect(screen.getByText("Marketplace")).toBeInTheDocument();
    expect(screen.getByText("99.6%")).toBeInTheDocument();
    
    expect(screen.getByText("Escrow")).toBeInTheDocument();
    expect(screen.getByText("99.3%")).toBeInTheDocument();
    
    expect(screen.getByText("Stellar network")).toBeInTheDocument();
    expect(screen.getByText("99.5%")).toBeInTheDocument();
  });

  it("renders the platform health matrix section", () => {
    render(<StatusPage />);
    expect(screen.getByRole("heading", { name: /Platform health matrix/i, level: 2 })).toBeInTheDocument();
  });

  it("renders the 90-day uptime section", () => {
    render(<StatusPage />);
    expect(screen.getByRole("heading", { name: /90-day uptime/i, level: 2 })).toBeInTheDocument();
  });

  it("renders the incidents section with correct items", () => {
    render(<StatusPage />);
    expect(screen.getByRole("heading", { name: /Incidents/i, level: 2 })).toBeInTheDocument();
    
    expect(screen.getByText("Marketplace API timeout")).toBeInTheDocument();
    expect(screen.getByText("A brief spike in latency affected listing refreshes during peak traffic.")).toBeInTheDocument();

    expect(screen.getByText("Escrow approval delay")).toBeInTheDocument();
    expect(screen.getByText("Stellar Horizon timeout")).toBeInTheDocument();
  });
});
