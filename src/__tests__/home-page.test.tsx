import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import Home from "../app/page";

describe("Home Page", () => {
  it("renders the main headings and introduction", () => {
    render(<Home />);
    
    // Check main headings
    expect(screen.getByRole("heading", { name: /ChronoPay/i })).toBeInTheDocument();
    expect(screen.getByText(/Time Economy/i)).toBeInTheDocument();
    
    // Check introduction text
    expect(screen.getByText(/Tokenize your future time slots as tradable digital assets on the Stellar network/i)).toBeInTheDocument();
  });

  it("renders navigation links with correct attributes", () => {
    render(<Home />);
    
    // Check Dashboard link
    const dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute("href", "/dashboard");

    // Check Pricing link
    const pricingLink = screen.getByRole("link", { name: /Pricing/i });
    expect(pricingLink).toBeInTheDocument();
    expect(pricingLink).toHaveAttribute("href", "/pricing");

    // Check Stellar link
    const stellarLink = screen.getByRole("link", { name: /Stellar/i });
    expect(stellarLink).toBeInTheDocument();
    expect(stellarLink).toHaveAttribute("href", "https://stellar.org");
    expect(stellarLink).toHaveAttribute("target", "_blank");
    expect(stellarLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("maintains semantic HTML structure", () => {
    const { container } = render(<Home />);
    
    // Check main content container
    const mainElement = container.querySelector("main#main-content");
    expect(mainElement).toBeInTheDocument();
  });
});
