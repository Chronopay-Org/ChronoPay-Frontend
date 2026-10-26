import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import PricingPage, { metadata as pricingMetadata } from "../app/pricing/page";

describe("Pricing Page", () => {
  it("renders main sections and FAQ", () => {
    render(<PricingPage />);
    expect(screen.getByText(/Frequently Asked Questions/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Choose a plan/i })).toBeInTheDocument();
  });

  it("exports metadata with the correct title", () => {
    expect(pricingMetadata).toHaveProperty("title", "Pricing");
  });
});
