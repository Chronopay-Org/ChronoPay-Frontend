/**
 * SampleBadge tests
 *
 * Coverage targets (95%+):
 *  - Default Sample label + Beaker icon
 *  - aria-label includes tooltip copy
 *  - Custom tooltip override
 *  - Tooltip trigger present for keyboard/touch help
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SampleBadge } from "./sample-badge";
import { SAMPLE_TOOLTIP } from "./dashboard-data";

describe("SampleBadge", () => {
  it("renders the Sample label", () => {
    render(<SampleBadge />);
    expect(screen.getByText("Sample")).toBeInTheDocument();
  });

  it("exposes an accessible label with the default tooltip", () => {
    render(<SampleBadge />);
    expect(
      screen.getByLabelText(`Sample: ${SAMPLE_TOOLTIP}`),
    ).toBeInTheDocument();
  });

  it("accepts a custom tooltip in the accessible name", () => {
    render(<SampleBadge tooltip="Demo row only" />);
    expect(screen.getByLabelText("Sample: Demo row only")).toBeInTheDocument();
  });

  it("includes the shared tooltip trigger for details", () => {
    render(<SampleBadge />);
    expect(
      screen.getByRole("button", { name: "Help information" }),
    ).toBeInTheDocument();
  });

  it("marks the badge with data-sample-badge for styling hooks", () => {
    const { container } = render(<SampleBadge className="extra" />);
    const badge = container.querySelector("[data-sample-badge]");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("extra");
  });
});
